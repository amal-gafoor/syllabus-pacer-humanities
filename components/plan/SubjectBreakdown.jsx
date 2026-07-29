"use client";

export default function SubjectBreakdown({ plan }) {
  return (
    <>
      <h3 className="mb-2.5 text-sm font-semibold text-slate-700">By subject</h3>
      <div className="mb-6 space-y-2.5">
        {plan.bySubject.map((s) => {
          const pct = plan.totalTopics ? Math.round((s.topics / plan.totalTopics) * 100) : 0;
          return (
            <div key={s.subject}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.subject}</span>
                </span>
                <span className="flex-none whitespace-nowrap text-xs text-slate-400 sm:text-sm">
                  {s.topics} topics · {s.days} {s.days === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
