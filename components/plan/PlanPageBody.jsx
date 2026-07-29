"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/Card";
import StudyWindowCard from "./StudyWindowCard";
import ChapterPicker from "./ChapterPicker";
import BuildBar from "./BuildBar";
import PlanResult from "./PlanResult";
import { usePlanner } from "@/state/PlannerContext";

export default function PlanPageBody() {
  const router = useRouter();
  const {
    plan, detailsValid, hydrated,
    generated, setGenerated,
    sheetConfigured, saveToSheet, reset,
  } = usePlanner();

  const [attempted, setAttempted] = useState(false);
  const planRef = useRef(null);

  // Deep-linking to /plan without filling in the details would show a nameless,
  // unsaveable plan — send them back to step 1. Wait for hydration first, or a
  // refresh would bounce a student who *has* filled it in.
  useEffect(() => {
    if (hydrated && !detailsValid) router.replace("/details");
  }, [hydrated, detailsValid, router]);

  const selectedCount = plan.totalChapters || 0;
  const canBuild = detailsValid && selectedCount > 0;

  const build = () => {
    setAttempted(true);
    if (!canBuild) return;
    setGenerated(true);
    setTimeout(() => planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    if (sheetConfigured && !plan.error) saveToSheet();
  };

  const doReset = () => {
    reset();
    setAttempted(false);
  };

  return (
    <>
      <div className="mb-4">
        <Link
          href="/details"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Back to student details
        </Link>
      </div>

      <StudyWindowCard />
      <ChapterPicker />

      <BuildBar
        onBuild={build}
        onReset={doReset}
        generated={generated}
        hint={attempted && !canBuild ? "Please pick at least one chapter." : ""}
      />

      {generated && (
        <div ref={planRef}>
          <Card>
            <PlanResult />
          </Card>
        </div>
      )}
    </>
  );
}
