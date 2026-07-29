"use client";

import { usePathname } from "next/navigation";

export default function StepIndicator() {
  const pathname = usePathname();
  const onPlan = pathname?.startsWith("/plan");
  return (
    <div className="mb-5 flex items-center gap-2 text-xs font-medium">
      <span
        className={`rounded-full px-2.5 py-1 ${
          !onPlan ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
        }`}
      >
        1 · Student details
      </span>
      <span className="h-px flex-1 bg-slate-200" />
      <span
        className={`rounded-full px-2.5 py-1 ${
          onPlan ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        2 · Plan
      </span>
    </div>
  );
}
