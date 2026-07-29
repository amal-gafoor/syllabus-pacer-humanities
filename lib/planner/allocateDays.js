/**
 * Step 1 — give each chapter a whole number of days, in proportion to its
 * TOPIC COUNT.
 *
 * The humanities workbook carries no page counts, so topics are the unit of
 * work: a chapter with twice the topics gets twice the days, and every day
 * therefore holds roughly the same number of topics. With A=6 topics and
 * B=9 topics over 10 days: A takes 6/15 = 40% → 4 days, B takes 60% → 6 days.
 * Both then run at 1.5 topics/day.
 *
 * Two constraints bend the pure proportion:
 *   - min 1 day: a selected chapter always gets studied.
 *   - max `topicCount` days: you can't spread 2 topics over 4 days without
 *     leaving 2 of them empty, so it's capped and the spare days go to
 *     chapters that can use them.
 *
 * Because the weight and the cap are now the same quantity, the proportional
 * share never exceeds the cap on its own — the cap only ever bites after the
 * min-1 floor has been applied.
 *
 * @param {{topicCount:number}[]} chapters
 * @param {number} days  total study days to divide up
 * @returns {number[]} days per chapter, summing to `days` (or to the total
 *                     topic count if there simply aren't enough topics to fill).
 */
export function allocateDays(chapters, days) {
  const n = chapters.length;
  if (n === 0 || days <= 0) return [];

  const cap = chapters.map((c) => Math.max(1, c.topicCount || 1));
  const ceiling = cap.reduce((a, b) => a + b, 0);
  // Can't use more days than there are topics to put in them.
  const target = Math.min(days, ceiling);

  const totalTopics = chapters.reduce((a, c) => a + (c.topicCount || 0), 0);
  const quota = chapters.map((c) =>
    totalTopics > 0 ? ((c.topicCount || 0) / totalTopics) * target : target / n
  );

  // Start at the proportional floor, clamped into [1, cap].
  const out = quota.map((q, i) => Math.min(cap[i], Math.max(1, Math.floor(q))));

  let used = out.reduce((a, b) => a + b, 0);

  // Hand out any leftover days to whoever is furthest below their fair share.
  while (used < target) {
    let best = -1;
    let bestGap = -Infinity;
    for (let i = 0; i < n; i++) {
      if (out[i] >= cap[i]) continue;
      const gap = quota[i] - out[i];
      if (gap > bestGap) {
        bestGap = gap;
        best = i;
      }
    }
    if (best === -1) break; // everyone is capped
    out[best]++;
    used++;
  }

  // Over-allocated (the min-1 floor can overshoot when chapters ≈ days):
  // take days back from whoever is furthest above their fair share.
  while (used > target) {
    let best = -1;
    let bestExcess = -Infinity;
    for (let i = 0; i < n; i++) {
      if (out[i] <= 1) continue;
      const excess = out[i] - quota[i];
      if (excess > bestExcess) {
        bestExcess = excess;
        best = i;
      }
    }
    if (best === -1) break; // everyone is already at 1 day
    out[best]--;
    used--;
  }

  return out;
}
