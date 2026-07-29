"use client";

import { BookOpen } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHead from "@/components/ui/SectionHead";
import SubjectAccordion from "./SubjectAccordion";
import { usePlanner } from "@/state/PlannerContext";

export default function ChapterPicker() {
  const { subjects, toggleOpen, toggleChapter, selectAllIn, plan } = usePlanner();

  const selectedCount = plan.totalChapters || 0;
  const selectedTopics = plan.totalTopics || 0;

  return (
    <Card>
      <SectionHead
        icon={<BookOpen size={18} />}
        n="3"
        title="Select chapters"
        sub="Tick the chapters you need to finish."
      />

      <div className="space-y-3">
        {subjects.map((s, si) => (
          <SubjectAccordion
            key={s.id}
            subject={s}
            index={si}
            onToggleOpen={() => toggleOpen(si)}
            onToggleChapter={toggleChapter}
            onSelectAll={(v) => selectAllIn(si, v)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white">
        <span className="text-sm">
          <b>{selectedCount}</b> chapters · <b>{selectedTopics}</b> topics selected
        </span>
        {selectedCount === 0 && <span className="text-xs text-slate-400">pick some chapters →</span>}
      </div>
    </Card>
  );
}
