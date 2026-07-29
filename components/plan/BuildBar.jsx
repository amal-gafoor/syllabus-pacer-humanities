"use client";

import { Sparkles, RotateCcw, AlertTriangle } from "lucide-react";

export default function BuildBar({ onBuild, onReset, generated, hint }) {
  return (
    <div className="mb-8">
      {/* On a phone this sits above the fold of the keyboard-free viewport bottom,
          so the main action is always one thumb away. */}
      <div className="sticky bottom-3 z-10">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/80 p-2 backdrop-blur sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <button
            type="button"
            onClick={onBuild}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 active:bg-brand-700 sm:flex-none sm:px-7 sm:shadow-sm"
          >
            <Sparkles size={18} className="text-gold-400" /> Build my study plan
          </button>
          {generated && (
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-[52px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <RotateCcw size={15} /> Reset
            </button>
          )}
        </div>
      </div>
      {hint && (
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-rose-500">
          <AlertTriangle size={15} /> {hint}
        </p>
      )}
    </div>
  );
}
