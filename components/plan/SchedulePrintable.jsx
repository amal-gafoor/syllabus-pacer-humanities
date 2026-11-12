"use client";

import { fmtLong, fmtDeadline, parseISO } from "@/lib/format";

/**
 * A print-optimised, fixed-width (A4) rendering of the whole plan, meant to be
 * rasterised by html2canvas into the downloaded PDF. It is positioned off-screen
 * by the parent and never shown to the user.
 *
 * Deliberately styled with inline hex colours (no Tailwind / theme classes): the
 * browser still shapes every script correctly (Malayalam, Devanagari, Arabic),
 * and html2canvas rasterises reliably without tripping on CSS colour functions.
 */
const A4_WIDTH = 794; // px at 96dpi

const C = {
  ink: "#0f172a",
  sub: "#475569",
  faint: "#94a3b8",
  line: "#e2e8f0",
  band: "#f8fafc",
  brand: "#4f46e5",
};

function StatCard({ value, label }) {
  return (
    <div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

export default function SchedulePrintable({ innerRef, plan, name, cls, medium, fromDate, toDate }) {
  if (!plan || plan.error) return null;

  const window =
    fromDate && toDate ? `${fmtLong(parseISO(fromDate))} – ${fmtLong(parseISO(toDate))}` : "";

  return (
    <div
      ref={innerRef}
      style={{
        width: A4_WIDTH,
        boxSizing: "border-box",
        padding: 36,
        background: "#ffffff",
        color: C.ink,
        fontFamily: "'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${C.brand}`, paddingBottom: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Study Schedule</div>
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "2px 18px", fontSize: 12, color: C.sub }}>
          {name && <span><b style={{ color: C.ink }}>{name}</b></span>}
          <span>{cls}{medium ? ` · ${medium} medium` : ""}</span>
          {window && <span>Window: {window}</span>}
          {plan.finish && <span>Finish by: {fmtDeadline(plan.finish)}</span>}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <StatCard value={plan.totalTopics} label="topics" />
        <StatCard value={plan.availableDays} label="study days" />
        <StatCard value={plan.schedule.length} label="days to finish" />
        <StatCard value={plan.daysToSpare} label="days to spare" />
      </div>

      {plan.tight && (
        <div style={{ marginBottom: 12, background: "#fffbeb", color: "#b45309", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
          Heavy pace ({plan.medianTopics} topics a day). Consider an earlier start, fewer off-days, or fewer chapters.
        </div>
      )}
      {plan.shared && (
        <div style={{ marginBottom: 12, background: C.band, color: C.sub, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
          More chapters than study days, so some days cover more than one chapter. The reading per day stays even.
        </div>
      )}

      {/* Subject breakdown — the Pages column is dropped when the curriculum has no
          page numbers (LMS-based Class 9). */}
      <div style={{ fontSize: 13, fontWeight: 700, margin: "6px 0 8px" }}>Subjects</div>
      {(() => {
        const showPages = plan.bySubject.some((s) => s.pages > 0);
        const th = { padding: "4px 6px", fontWeight: 600, textAlign: "right" };
        const td = { padding: "5px 6px", textAlign: "right", color: C.sub };
        return (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontSize: 12 }}>
            <thead>
              <tr style={{ color: C.faint, textAlign: "left" }}>
                <th style={{ padding: "4px 6px", fontWeight: 600 }}>Subject</th>
                <th style={th}>Chapters</th>
                <th style={th}>Topics</th>
                {showPages && <th style={th}>Pages</th>}
                <th style={th}>Days</th>
              </tr>
            </thead>
            <tbody>
              {plan.bySubject.map((s, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: "5px 6px" }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 8, background: s.color, marginRight: 7 }} />
                    {s.subject}
                  </td>
                  <td style={td}>{s.chapters}</td>
                  <td style={td}>{s.topics}</td>
                  {showPages && <td style={td}>{s.pages}</td>}
                  <td style={td}>{s.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })()}

      {/* Day-by-day */}
      <div style={{ fontSize: 13, fontWeight: 700, margin: "6px 0 8px" }}>
        Day-by-day schedule <span style={{ color: C.faint, fontWeight: 400 }}>· {plan.schedule.length} days</span>
      </div>
      <div>
        {plan.schedule.map((day, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "8px 0",
              borderTop: `1px solid ${C.line}`,
              // keep a day from splitting across pages where the browser honours it
              breakInside: "avoid",
              pageBreakInside: "avoid",
            }}
          >
            <div style={{ width: 78, flex: "none", color: C.sub }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: C.faint, letterSpacing: 0.4 }}>Day {i + 1}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{fmtLong(day.date)}</div>
              <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
                {day.topicCount} {day.topicCount === 1 ? "topic" : "topics"}
                {day.pages > 0 ? ` · ~${day.pages}p` : ""}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {day.items.map((it, j) => (
                <div key={j} style={{ marginBottom: j < day.items.length - 1 ? 8 : 0 }}>
                  <div style={{ fontSize: 12.5 }}>
                    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 7, background: it.color, marginRight: 6 }} />
                    <b style={{ color: C.ink }}>{it.subject}</b>
                    <span style={{ color: C.faint }}> · </span>
                    <span style={{ color: C.sub }}>{it.chapter}</span>
                  </div>
                  <ul style={{ margin: "3px 0 0", paddingLeft: 20 }}>
                    {it.topics.map((t, k) => (
                      <li key={k} style={{ fontSize: 12, color: C.sub, lineHeight: 1.45 }}>{t.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, paddingTop: 10, borderTop: `1px solid ${C.line}`, fontSize: 10, color: C.faint, textAlign: "center" }}>
        Generated by Eduport Time Table Creator
      </div>
    </div>
  );
}
