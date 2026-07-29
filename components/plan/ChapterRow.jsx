"use client";

import { Check } from "lucide-react";

export default function ChapterRow({ chapter, onToggle }) {
  const { num, name, topics, selected, ready } = chapter;

  // Some chapters are listed in the syllabus workbook without a topic breakdown
  // yet. They can't be scheduled, so the row is shown but disabled rather than
  // letting a student tick it and then wonder why it never reached their plan.
  if (!ready) {
    return (
      <div
        className="flex w-full min-h-[48px] items-center gap-3 px-3 py-3 text-left sm:px-4"
        aria-disabled="true"
      >
        <span className="h-5 w-5 flex-none rounded border border-dashed border-slate-200 bg-slate-50" />
        <span className="min-w-0 flex-1 break-words text-sm text-slate-400 [overflow-wrap:anywhere]">
          {num && <span className="text-slate-300">{num} </span>}
          {name}
        </span>
        <span className="flex-none whitespace-nowrap text-right text-xs italic text-slate-300">
          topics coming soon
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`flex w-full min-h-[48px] items-center gap-3 px-3 py-3 text-left transition sm:px-4 ${
        selected ? "bg-brand-50/50" : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded border transition ${
          selected ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300 bg-white"
        }`}
      >
        {selected && <Check size={13} />}
      </span>
      <span className="min-w-0 flex-1 break-words text-sm text-slate-700 [overflow-wrap:anywhere]">
        {num && <span className="text-slate-400">{num} </span>}
        {name}
      </span>
      <span className="flex-none whitespace-nowrap text-right text-xs text-slate-400">
        {topics.length} {topics.length === 1 ? "topic" : "topics"}
      </span>
    </button>
  );
}
