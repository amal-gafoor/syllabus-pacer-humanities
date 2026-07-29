"use client";

import { AlertTriangle, BookOpen, Target, Flag, Coffee } from "lucide-react";
import MiniStat from "@/components/ui/MiniStat";
import PlanHero from "./PlanHero";
import SubjectBreakdown from "./SubjectBreakdown";
import DaySchedule from "./DaySchedule";
import { usePlanner } from "@/state/PlannerContext";

export default function PlanResult() {
  const { plan, name, sheetConfigured, saveStatus, saveToSheet } = usePlanner();

  if (plan.error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertTriangle size={22} />
        </div>
        <p className="text-slate-600">{plan.error}</p>
      </div>
    );
  }

  return (
    <div>
      <PlanHero plan={plan} name={name} />

      {plan.tight && (
        <p className="mb-5 flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} className="mt-0.5 flex-none" />
          That&apos;s a heavy pace ({plan.medianTopics} topics a day). Consider an earlier start, fewer
          off-days, or fewer chapters.
        </p>
      )}

      {plan.shared && (
        <p className="mb-5 flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
          <BookOpen size={16} className="mt-0.5 flex-none text-slate-400" />
          You picked more chapters than you have study days, so some days cover more than one
          chapter. The load per day stays even.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat color="#4f46e5" icon={<BookOpen size={15} />} value={plan.totalTopics} label="topics" />
        <MiniStat color="#0284c7" icon={<Target size={15} />} value={plan.availableDays} label="study days" />
        <MiniStat color="#059669" icon={<Flag size={15} />} value={plan.schedule.length} label="days to finish" />
        <MiniStat color="#d97706" icon={<Coffee size={15} />} value={plan.daysToSpare} label="days to spare" />
      </div>

      <SubjectBreakdown plan={plan} />
      <DaySchedule plan={plan} />

      {/* Saving happens silently on Build; only surface a failure so data isn't lost. */}
      {sheetConfigured && saveStatus === "error" && (
        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-rose-500">
            <AlertTriangle size={15} /> Couldn&apos;t save.
            <button onClick={saveToSheet} className="font-medium underline hover:text-rose-600">
              Retry
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
