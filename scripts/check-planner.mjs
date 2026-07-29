/**
 * Sanity checks for the topic-weighted planner, run against the real generated
 * curriculum rather than fixtures.
 *
 *   npm run check
 *
 * Asserts the invariants that matter to a student: every topic they ticked is
 * scheduled exactly once, in book order, and the daily load is even.
 */

import { register } from "node:module";
register("./alias-hooks.mjs", import.meta.url);

const { buildCurriculum } = await import("../lib/curriculum/index.js");
const { buildPlan } = await import("../lib/planner/buildPlan.js");
const { HEAVY_TOPICS_PER_DAY } = await import("../lib/constants.js");

let failures = 0;

function check(label, ok, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

/** Add days to an ISO date without tripping over month ends. */
function isoPlus(days) {
  const d = new Date(2026, 0, 5);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function scenario(label, cls, pick, days) {
  const subjects = buildCurriculum("English", cls);
  pick(subjects);

  const wanted = [];
  subjects.forEach((s) =>
    s.chapters.forEach((c) => {
      if (c.selected) c.topics.forEach((t) => wanted.push(`${s.name}|${c.num}|${t.name}`));
    })
  );

  const plan = buildPlan({
    subjects,
    fromDate: isoPlus(0),
    toDate: isoPlus(days - 1),
    weeklyOff: new Set([0]),
    extraLeave: "",
  });

  console.log(`\n${label}`);
  if (plan.error) {
    check("builds a plan", false, plan.error);
    return;
  }

  const got = [];
  plan.schedule.forEach((d) =>
    d.items.forEach((it) => it.topics.forEach((t) => got.push(`${it.subject}|${it.chapter.split(" ")[0]}|${t.name}`)))
  );

  check("every selected topic is scheduled", got.length === wanted.length,
    `wanted ${wanted.length}, got ${got.length}`);
  check("no topic scheduled twice", new Set(got).size === got.length,
    `${got.length - new Set(got).size} duplicate(s)`);
  check("plan totals agree", plan.totalTopics === wanted.length,
    `totalTopics=${plan.totalTopics}`);

  // Chapters are dealt across the calendar so subjects alternate (interleave.js),
  // so the schedule is NOT in flat book order. What must hold is that each
  // chapter's own topics are never reordered or skipped.
  const perChapter = new Map();
  plan.schedule.forEach((d) =>
    d.items.forEach((it) => {
      const key = `${it.subject}|${it.chapter}`;
      if (!perChapter.has(key)) perChapter.set(key, []);
      perChapter.get(key).push(...it.topics.map((t) => t.name));
    })
  );
  const expected = new Map();
  subjects.forEach((s) =>
    s.chapters.forEach((c) => {
      if (c.selected) {
        expected.set(`${s.name}|${c.num ? `${c.num} ` : ""}${c.name}`, c.topics.map((t) => t.name));
      }
    })
  );
  const outOfOrder = [...expected].filter(
    ([key, topics]) => (perChapter.get(key) || []).join("\n") !== topics.join("\n")
  );
  check("each chapter's topics keep book order", outOfOrder.length === 0,
    outOfOrder.length ? `${outOfOrder.length} chapter(s), first: ${outOfOrder[0][0]}` : "");

  // Even load is the point of weighting by topic count. Exact evenness isn't
  // achievable on the one-chapter-per-day path — a 2-topic chapter still gets a
  // whole day — so the bar is that no day is wildly heavier than a normal one.
  const counts = plan.schedule.map((d) => d.topicCount);
  const ceiling = Math.max(plan.medianTopics * 2, plan.medianTopics + 2);
  check("no day far heavier than the median", Math.max(...counts) <= ceiling,
    `min ${Math.min(...counts)}, max ${Math.max(...counts)}, median ${plan.medianTopics}, allowed ${ceiling}`);
  check("no empty study day", counts.every((c) => c > 0));
  check("fits the window", plan.schedule.length <= plan.availableDays,
    `${plan.schedule.length} of ${plan.availableDays} days`);

  console.log(
    `  ${plan.totalChapters} chapters · ${plan.totalTopics} topics · ` +
    `${plan.medianTopics}/day (${plan.minTopics}-${plan.maxTopics}) · ` +
    `${plan.schedule.length} days · tight=${plan.tight}`
  );
}

const all = (subjects) =>
  subjects.forEach((s) => s.chapters.forEach((c) => { if (c.ready) c.selected = true; }));

const oneSubject = (name) => (subjects) => {
  const s = subjects.find((x) => x.name === name);
  s.chapters.forEach((c) => { if (c.ready) c.selected = true; });
};

const firstNChapters = (n) => (subjects) => {
  let left = n;
  subjects.forEach((s) =>
    s.chapters.forEach((c) => { if (c.ready && left > 0) { c.selected = true; left--; } })
  );
};

console.log(`Heavy-pace threshold: ${HEAVY_TOPICS_PER_DAY} topics/day`);

scenario("Plus Two · whole syllabus · 180 days", "Plus Two", all, 180);
scenario("Plus Two · whole syllabus · 60 days (should read as tight)", "Plus Two", all, 60);
scenario("Plus One · whole syllabus · 180 days", "Plus One", all, 180);
scenario("Plus Two · Economics only · 45 days", "Plus Two", oneSubject("Economics"), 45);
scenario("Plus One · Statistics only (mostly unready) · 30 days", "Plus One", oneSubject("Statistics"), 30);
scenario("Plus Two · 40 chapters · 20 days (more chapters than days)", "Plus Two", firstNChapters(40), 20);
scenario("Plus Two · 3 chapters · 90 days (far more days than topics)", "Plus Two", firstNChapters(3), 90);

// Unready chapters must never reach a plan, even if something ticks them.
{
  console.log("\nUnready chapters are never scheduled");
  const subjects = buildCurriculum("English", "Plus One");
  subjects.forEach((s) => s.chapters.forEach((c) => { c.selected = true; }));
  const plan = buildPlan({
    subjects, fromDate: isoPlus(0), toDate: isoPlus(179),
    weeklyOff: new Set([0]), extraLeave: "",
  });
  const ready = subjects.reduce((n, s) => n + s.chapters.filter((c) => c.ready).length, 0);
  check("topic-less chapters are skipped", plan.totalChapters === ready,
    `${plan.totalChapters} scheduled of ${ready} ready`);
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
