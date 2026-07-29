"use client";

import { fmtLong } from "@/lib/format";

export default function DayCard({ day, n }) {
  const [weekday, ...rest] = fmtLong(day.date).split(" ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex gap-3">
        {/* date rail */}
        <div className="flex w-14 flex-none flex-col items-center justify-center rounded-lg bg-slate-50 py-1.5">
          <span className="text-[10px] font-medium uppercase text-slate-400">Day {n}</span>
          <span className="text-xs font-semibold text-slate-600">{weekday.replace(",", "")}</span>
          <span className="text-[11px] text-slate-400">{rest.join(" ")}</span>
        </div>

        {/* what to study */}
        <div className="min-w-0 flex-1 space-y-2.5 self-center">
          {day.items.map((it, j) => (
            <div key={j} className="flex items-start gap-2">
              <span
                className="mt-1.5 h-2 w-2 flex-none rounded-full"
                style={{ backgroundColor: it.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug [overflow-wrap:anywhere]">
                  <span className="font-medium text-slate-700">{it.subject}</span>
                  <span className="text-slate-300"> · </span>
                  <span className="text-slate-500">{it.chapter}</span>
                </p>
                <ul className="mt-1 space-y-0.5">
                  {it.topics.map((t, k) => (
                    <li
                      key={k}
                      className="flex gap-1.5 text-[13px] leading-snug text-slate-600 [overflow-wrap:anywhere]"
                    >
                      <span className="flex-none text-slate-300">–</span>
                      <span>{t.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-3 border-t border-slate-50 pt-2 text-[11px] text-slate-400">
        <span>
          {day.topicCount} {day.topicCount === 1 ? "topic" : "topics"}
        </span>
      </div>
    </div>
  );
}
