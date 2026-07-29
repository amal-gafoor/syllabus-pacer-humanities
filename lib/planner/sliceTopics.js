/**
 * Steps 2 & 3 — split a chapter's topics into one contiguous slice per day.
 *
 * You can't study half a topic, so when the topics don't divide evenly the
 * remainder is spread out rather than dumped on the first days. 15 topics over
 * 6 days = 2.5, so three days take 3 and three take 2 — interleaved as
 * 3,2,3,2,3,2 rather than 3,3,3,2,2,2.
 *
 * The spread test `(j * rem) % d < rem` is the Bresenham line rule: it hands out
 * exactly `rem` extras, as evenly as integers allow, with no clumping.
 *
 * Slices are cut top-to-bottom and never reordered, so topics are studied in
 * book order with nothing skipped or repeated.
 *
 * @param {any[]} topics
 * @param {number} days
 * @returns {any[][]} one array of topics per day (length === days)
 */
export function sliceTopics(topics, days) {
  const d = Math.max(1, days);
  const t = topics.length;
  if (t === 0) return Array.from({ length: d }, () => []);

  const base = Math.floor(t / d);
  const rem = t % d;

  const out = [];
  let cursor = 0;
  for (let j = 0; j < d; j++) {
    const take = base + ((j * rem) % d < rem ? 1 : 0);
    out.push(topics.slice(cursor, cursor + take));
    cursor += take;
  }
  return out;
}
