export const toISO = (d) => d.toISOString().slice(0, 10);

export const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const fmtLong = (d) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export const fmtDeadline = (d) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
