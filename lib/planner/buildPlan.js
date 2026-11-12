import { HEAVY_TOPICS_PER_DAY } from "@/lib/constants";
import { studyDatesIn, calendarDaysIn } from "./dates";
import { allocateDays } from "./allocateDays";
import { sliceTopics } from "./sliceTopics";
import { interleave } from "./interleave";

/** Flatten the ticked chapters, keeping the subject's name and colour on each. */
function chosenChapters(subjects) {
  const out = [];
  subjects.forEach((s) =>
    s.chapters.forEach((c) => {
      if (c.selected && c.topics?.length) {
        out.push({
          subject: s.name,
          color: s.color,
          chapter: c.num ? `${c.num} ${c.name}` : c.name,
          topics: c.topics,
          topicCount: c.topics.length,
        });
      }
    })
  );
  return out;
}

/** Chapter indices grouped by subject, subjects in first-seen order. */
function groupBySubject(chosen) {
  const groups = new Map();
  chosen.forEach((c, i) => {
    if (!groups.has(c.subject)) groups.set(c.subject, []);
    groups.get(c.subject).push(i);
  });
  return [...groups.values()];
}

/**
 * Order day-blocks so subjects take turns. Days are dealt to subjects first, in
 * proportion to each subject's share (equal shares alternate P C P C), then each
 * subject's days go to its own chapters as before. Interleaving chapters across
 * all subjects at once let a subject's neighbouring chapters bunch up into long
 * same-subject runs.
 *
 * @param {number[]} weights  per chapter (days, or chapter count)
 * @returns {number[]} chapter index per slot
 */
function mixSubjects(chosen, weights) {
  const groups = groupBySubject(chosen);
  const queues = groups.map((idx) => interleave(idx.map((i) => weights[i])).map((k) => idx[k]));
  const subjectOrder = interleave(groups.map((idx) => idx.reduce((a, i) => a + weights[i], 0)));
  const taken = groups.map(() => 0);
  return subjectOrder.map((g) => queues[g][taken[g]++]);
}

/**
 * One chapter per day: days are shared out by topic count, then each chapter's
 * topics are split across its own days and the blocks are dealt across the
 * calendar. This is the normal path, and needs at least as many days as chapters.
 */
function planOneChapterPerDay(chosen, days) {
  const perChapter = allocateDays(chosen, days);
  const slices = chosen.map((c, i) => sliceTopics(c.topics, perChapter[i]));
  const order = mixSubjects(chosen, perChapter);

  const taken = chosen.map(() => 0);
  return order.map((ci) => {
    const c = chosen[ci];
    const topics = slices[ci][taken[ci]++] || [];
    return [{ ...c, topics }];
  });
}

/**
 * More chapters than days, so a day has to hold more than one chapter. Fill days
 * against an even topic budget, in chapter order. Keeps the load per day level,
 * which is the point of counting topics in the first place.
 */
function planSharedDays(chosen, days) {
  const totalTopics = chosen.reduce((a, c) => a + c.topicCount, 0);
  const budget = totalTopics / days;

  const schedule = [];
  let items = [];
  let spent = 0;
  let dayIndex = 0;

  const flat = [];
  chosen.forEach((c, ci) => c.topics.forEach((t) => flat.push({ ci, t })));

  flat.forEach(({ ci, t }, k) => {
    const c = chosen[ci];
    const last = items[items.length - 1];
    if (last && last._ci === ci) last.topics.push(t);
    else items.push({ ...c, _ci: ci, topics: [t] });

    spent += 1;
    const isLast = k === flat.length - 1;
    const dayFull = dayIndex < days - 1 && spent >= budget * (dayIndex + 1);

    if (dayFull || isLast) {
      schedule.push(items.map(({ _ci, ...rest }) => rest));
      items = [];
      dayIndex++;
    }
  });

  return schedule;
}

/**
 * Turn the ticked chapters plus a study window into a day-by-day topic schedule.
 * Returns `{ error }` when there's nothing sensible to build.
 */
export function buildPlan({ subjects, fromDate, toDate, weeklyOff, extraLeave }) {
  const calendarDays = calendarDaysIn(fromDate, toDate);
  if (calendarDays === 0) return { error: "Your finish date is before the start date." };

  const studyDates = studyDatesIn(fromDate, toDate, weeklyOff);
  const weeklyOffDays = calendarDays - studyDates.length;
  const leave = Number(extraLeave || 0);
  const availableDays = studyDates.length - leave;

  const chosen = chosenChapters(subjects);
  if (chosen.length === 0) return { error: "Pick at least one chapter to build a plan." };
  if (availableDays < 1) return { error: "No study days left — widen your dates or reduce off-days." };

  const totalTopics = chosen.reduce((a, c) => a + c.topicCount, 0);

  const blocks =
    chosen.length <= availableDays
      ? planOneChapterPerDay(chosen, availableDays)
      : planSharedDays(mixSubjects(chosen, chosen.map(() => 1)).map((i) => chosen[i]), availableDays);

  // Drop any empty tail days and pin each block to a real date.
  const schedule = blocks
    .filter((items) => items.some((it) => it.topics.length))
    .slice(0, studyDates.length)
    .map((items, i) => ({
      date: studyDates[i],
      items,
      topicCount: items.reduce((a, it) => a + it.topics.length, 0),
    }));

  if (schedule.length === 0) return { error: "Pick at least one chapter to build a plan." };

  const counts = schedule.map((d) => d.topicCount);
  const minTopics = Math.min(...counts);
  const maxTopics = Math.max(...counts);

  // Headline figure. The mean is skewed by chapters that pack many short topics
  // into one day while the rest hold 2, so the median describes a normal day;
  // the min/max are still exposed for the fine print.
  const sorted = [...counts].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianTopics =
    sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

  const bySubject = {};
  chosen.forEach((c) => {
    bySubject[c.subject] ??= { subject: c.subject, color: c.color, topics: 0, chapters: 0 };
    bySubject[c.subject].topics += c.topicCount;
    bySubject[c.subject].chapters += 1;
  });
  Object.values(bySubject).forEach((s) => {
    s.days = schedule.filter((d) => d.items.some((it) => it.subject === s.subject)).length;
  });

  return {
    totalTopics,
    totalChapters: chosen.length,
    calendarDays,
    weeklyOffDays,
    availableDays,
    minTopics,
    maxTopics,
    medianTopics,
    schedule,
    finish: schedule[schedule.length - 1].date,
    daysToSpare: studyDates.length - schedule.length,
    tight: medianTopics > HEAVY_TOPICS_PER_DAY,
    shared: chosen.length > availableDays,
    bySubject: Object.values(bySubject).sort((a, b) => b.topics - a.topics),
  };
}
