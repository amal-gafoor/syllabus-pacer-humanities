"use client";

import { ChevronRight } from "lucide-react";
import ChapterRow from "./ChapterRow";

export default function SubjectAccordion({ subject, index, onToggleOpen, onToggleChapter, onSelectAll }) {
  const sel = subject.chapters.filter((c) => c.selected).length;
  // Chapters still awaiting a topic breakdown can't be picked, so counting them
  // in the denominator would make the tally look permanently unfinished.
  const pickable = subject.chapters.filter((c) => c.ready).length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <button
        type="button"
        aria-expanded={subject.open}
        onClick={onToggleOpen}
        className="flex w-full min-h-[52px] items-center gap-2.5 bg-slate-50 px-3 py-3 text-left sm:gap-3 sm:px-4"
      >
        <span className="h-8 w-1.5 flex-none rounded-full" style={{ backgroundColor: subject.color }} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{subject.name}</span>
        <span className="flex-none whitespace-nowrap text-xs text-slate-400">
          {sel}/{pickable}
          <span className="hidden sm:inline"> chosen</span>
        </span>
        <ChevronRight
          size={16}
          className={`flex-none text-slate-400 transition ${subject.open ? "rotate-90" : ""}`}
        />
      </button>

      {subject.open && (
        <div className="divide-y divide-slate-100">
          <div className="flex gap-4 px-3 py-2 text-xs sm:px-4">
            <button type="button" onClick={() => onSelectAll(true)} className="py-1 font-medium text-brand-600 hover:underline">
              Select all
            </button>
            <button type="button" onClick={() => onSelectAll(false)} className="py-1 font-medium text-slate-400 hover:underline">
              Clear
            </button>
          </div>
          {subject.chapters.map((c, ci) => (
            <ChapterRow key={c.id} chapter={c} onToggle={() => onToggleChapter(index, ci)} />
          ))}
        </div>
      )}
    </div>
  );
}
