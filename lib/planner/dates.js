import { parseISO } from "@/lib/format";

/** Every date in [fromDate, toDate] that isn't a weekly off day. */
export function studyDatesIn(fromDate, toDate, weeklyOff) {
  const from = parseISO(fromDate);
  const to = parseISO(toDate);
  if (to < from) return [];
  const out = [];
  const cur = new Date(from);
  while (cur <= to) {
    if (!weeklyOff.has(cur.getDay())) out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Calendar length of the window, inclusive. 0 if the dates are back to front. */
export function calendarDaysIn(fromDate, toDate) {
  const from = parseISO(fromDate);
  const to = parseISO(toDate);
  if (to < from) return 0;
  return Math.round((to - from) / 86400000) + 1;
}
