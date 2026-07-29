"use client";

import { CalendarDays, CalendarOff, Check, AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHead from "@/components/ui/SectionHead";
import Field, { inputCls } from "@/components/ui/Field";
import MiniStat from "@/components/ui/MiniStat";
import { usePlanner } from "@/state/PlannerContext";
import { WEEKDAYS } from "@/lib/constants";

export default function StudyWindowCard() {
  const {
    fromDate, setFromDate, toDate, setToDate,
    weeklyOff, toggleWeekly, extraLeave, setExtraLeave,
    rawStudyDays, plan,
  } = usePlanner();

  return (
    <Card>
      <SectionHead
        icon={<CalendarDays size={18} />}
        n="2"
        title="Study window"
        sub="Start, deadline, and days you can't study."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input type="date" className={inputCls} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </Field>
        <Field label="Finish by (deadline / exam)">
          <input type="date" className={inputCls} value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </Field>
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-sm font-medium text-slate-700">Weekly off days</span>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={weeklyOff.has(i)}
              onClick={() => toggleWeekly(i)}
              className={`min-h-[44px] rounded-lg border text-xs font-medium transition sm:text-sm ${
                weeklyOff.has(i)
                  ? "border-rose-300 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 max-w-xs">
        <Field
          label="Other days you can't study"
          hint={`Trips, functions, sick days — must be less than your ${rawStudyDays} study days.`}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={inputCls}
            value={extraLeave}
            placeholder="0"
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, "");
              if (v !== "") {
                const cap = Math.max(0, rawStudyDays - 1);
                v = String(Math.min(parseInt(v, 10), cap));
              }
              setExtraLeave(v);
            }}
          />
        </Field>
      </div>

      {!plan.error && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <MiniStat color="#0284c7" icon={<CalendarDays size={15} />} value={plan.calendarDays} label="total days" />
          <MiniStat
            color="#e11d48"
            icon={<CalendarOff size={15} />}
            value={plan.weeklyOffDays + Number(extraLeave || 0)}
            label="off days"
          />
          <MiniStat color="#059669" icon={<Check size={15} />} value={plan.availableDays} label="study days" />
        </div>
      )}

      {plan.error && plan.error.includes("date") && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
          <AlertTriangle size={15} /> {plan.error}
        </p>
      )}
    </Card>
  );
}
