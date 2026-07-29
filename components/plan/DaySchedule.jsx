"use client";

import { useState } from "react";
import DayCard from "./DayCard";

const PREVIEW = 14;

export default function DaySchedule({ plan }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? plan.schedule : plan.schedule.slice(0, PREVIEW);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Day-by-day schedule</h3>
        <span className="text-xs text-slate-400">{plan.schedule.length} study days</span>
      </div>

      <div className="space-y-2">
        {visible.map((day, i) => (
          <DayCard key={i} day={day} n={i + 1} />
        ))}
      </div>

      {plan.schedule.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 min-h-[44px] w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-brand-600 hover:bg-slate-50"
        >
          {showAll ? "Show less" : `Show all ${plan.schedule.length} days`}
        </button>
      )}
    </>
  );
}
