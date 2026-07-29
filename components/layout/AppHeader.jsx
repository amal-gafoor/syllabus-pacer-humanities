"use client";

import { ClipboardList } from "lucide-react";
import { usePlanner } from "@/state/PlannerContext";

export default function AppHeader() {
  const { cls } = usePlanner();
  return (
    <header className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
        <ClipboardList size={22} />
      </div>
      <div className="min-w-0">
        <h1 className="font-hand text-4xl font-bold leading-none tracking-tight text-slate-900">
          Syllabus Pacer
        </h1>
        <p className="truncate text-sm text-slate-500">
          {cls} · turn your chapters and deadline into topics a day.
        </p>
      </div>
    </header>
  );
}
