"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Phone, IdCard, ArrowRight, AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHead from "@/components/ui/SectionHead";
import Field, { inputCls, errCls } from "@/components/ui/Field";
import { usePlanner } from "@/state/PlannerContext";
import { CLASSES, mediumsFor } from "@/lib/constants";
import { detailErrors, detailsHint } from "@/lib/validation";

export default function StudentDetailsForm() {
  const router = useRouter();
  const {
    name, setName, phone, setPhone, epsid, setEpsid,
    cls, changeClass, medium, changeMedium,
    details, detailsValid,
  } = usePlanner();

  const [attempted, setAttempted] = useState(false);
  const err = detailErrors(details, attempted);

  const goNext = () => {
    setAttempted(true);
    if (!detailsValid) return;
    router.push("/plan");
  };

  return (
    <Card>
      <SectionHead icon={<GraduationCap size={18} />} n="1" title="Student details" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={err.name}>
          <input
            className={inputCls + (err.name ? errCls : "")}
            value={name}
            placeholder="Name"
            autoComplete="name"
            aria-invalid={!!err.name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Phone number" required error={err.phone}>
          <div className="relative">
            <Phone size={15} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className={inputCls + " pl-9" + (err.phone ? errCls : "")}
              value={phone}
              placeholder="10-digit mobile"
              aria-invalid={!!err.phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
            />
          </div>
        </Field>

        <Field label="Class">
          <select className={inputCls} value={cls} onChange={(e) => changeClass(e.target.value)}>
            {CLASSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Medium">
          {(() => {
            const mediums = mediumsFor(cls);
            const locked = mediums.length === 1;
            return (
              <>
                <select
                  className={inputCls + (locked ? " cursor-not-allowed opacity-60" : "")}
                  value={medium}
                  onChange={(e) => changeMedium(e.target.value)}
                  disabled={locked}
                >
                  {mediums.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                {locked && (
                  <p className="mt-1 text-xs text-slate-500">
                    {cls} is available in English medium only.
                  </p>
                )}
              </>
            );
          })()}
        </Field>

        <Field label="EPSID" required error={err.epsid}>
          <div className="relative">
            <IdCard size={15} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
            <input
              inputMode="text"
              maxLength={9}
              className={inputCls + " pl-9 tracking-wider" + (err.epsid ? errCls : "")}
              value={epsid}
              aria-invalid={!!err.epsid}
              onChange={(e) =>
                setEpsid(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9))
              }
            />
          </div>
        </Field>
      </div>

      <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-end">
        <button
          onClick={goNext}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600 active:bg-brand-700"
        >
          Next <ArrowRight size={18} />
        </button>
        {attempted && !detailsValid && (
          <p className="flex items-center justify-center gap-2 text-sm text-rose-500 sm:justify-end">
            <AlertTriangle size={15} /> {detailsHint(details)}
          </p>
        )}
      </div>
    </Card>
  );
}
