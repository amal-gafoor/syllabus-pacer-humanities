"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { usePlanner } from "@/state/PlannerContext";
import { downloadSchedulePdf, scheduleFilename } from "@/lib/export/schedulePdf";
import SchedulePrintable from "./SchedulePrintable";

export default function DownloadButton() {
  const { plan, name, cls, medium, fromDate, toDate } = usePlanner();
  const printRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!plan || plan.error) return null;

  const handle = async () => {
    if (busy || !printRef.current) return;
    setBusy(true);
    setFailed(false);
    try {
      await downloadSchedulePdf(printRef.current, scheduleFilename(name, cls));
    } catch (e) {
      console.error("PDF export failed:", e);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        className="flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {busy ? "Preparing…" : failed ? "Retry download" : "Download PDF"}
      </button>

      {/* Off-screen printable source for html2canvas — laid out but not visible. */}
      <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
        <SchedulePrintable
          innerRef={printRef}
          plan={plan}
          name={name}
          cls={cls}
          medium={medium}
          fromDate={fromDate}
          toDate={toDate}
        />
      </div>
    </>
  );
}
