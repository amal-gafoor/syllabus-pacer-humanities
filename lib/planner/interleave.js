/**
 * Step 4 — lay each chapter's day-blocks across the calendar so you're not stuck
 * on one chapter for six days straight.
 *
 * Each chapter gets evenly spaced "ideal" positions across the timeline: a
 * chapter with 4 of 10 days wants slots at 1.25, 3.75, 6.25, 8.75 (spacing 2.5,
 * starting half a step in). We then walk the days and always hand the next day
 * to whichever chapter is most overdue. That merge can't collide or double-book,
 * and it keeps each chapter's blocks in order.
 *
 * With A=4 days and B=6 days over 10, this yields A on days 2,4,7,9 and B on
 * 1,3,5,6,8,10.
 *
 * @param {number[]} daysPerChapter
 * @returns {number[]} for each day slot, the index of the chapter studied
 */
export function interleave(daysPerChapter) {
  const total = daysPerChapter.reduce((a, b) => a + b, 0);
  if (total <= 0) return [];

  const step = daysPerChapter.map((d) => (d > 0 ? total / d : Infinity));
  const next = step.map((s) => (Number.isFinite(s) ? s / 2 : Infinity));
  const left = [...daysPerChapter];

  const order = [];
  for (let slot = 0; slot < total; slot++) {
    let pick = -1;
    for (let i = 0; i < left.length; i++) {
      if (left[i] <= 0) continue;
      // Earliest ideal position wins; ties go to the earlier chapter, which
      // keeps the whole thing deterministic.
      if (pick === -1 || next[i] < next[pick]) pick = i;
    }
    if (pick === -1) break;
    order.push(pick);
    left[pick]--;
    next[pick] += step[pick];
  }
  return order;
}
