"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { buildCurriculum } from "@/lib/curriculum";
import { buildPlan } from "@/lib/planner/buildPlan";
import { studyDatesIn } from "@/lib/planner/dates";
import { toISO } from "@/lib/format";
import { WEEKDAYS, mediumsFor, CLASSES } from "@/lib/constants";
import { areDetailsValid } from "@/lib/validation";

const PlannerContext = createContext(null);
// v3: the science (Class 12) curriculum was replaced by the Plus One / Plus Two
// humanities syllabus. Bumping the key drops any saved science chapter ticks
// rather than trying to match them against chapter names that no longer exist.
const STORAGE_KEY = "syllabus-pacer:v3";
const DEFAULT_CLASS = "Plus Two";

export const usePlanner = () => {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return ctx;
};

/**
 * Stable identity for a chapter in sessionStorage. The number has to be part of
 * it: within one subject the same title can appear twice — Plus Two Geography
 * has "Transport and Communication" as both 1.7 and 2.7 — so keying on the name
 * alone would restore a tick onto both.
 */
const chapterKey = (subject, chapter) => `${subject.name}||${chapter.num}||${chapter.name}`;

const defaultDates = () => {
  const today = new Date();
  const later = new Date();
  later.setDate(today.getDate() + 29);
  return { from: toISO(today), to: toISO(later) };
};

export function PlannerProvider({ children }) {
  const dates = useRef(defaultDates()).current;

  // student
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cls, setCls] = useState(DEFAULT_CLASS);
  const [medium, setMedium] = useState("English");
  const [epsid, setEpsid] = useState("");

  // timeline
  const [fromDate, setFromDate] = useState(dates.from);
  const [toDate, setToDate] = useState(dates.to);
  const [weeklyOff, setWeeklyOff] = useState(() => new Set([0]));
  const [extraLeave, setExtraLeave] = useState("");

  // syllabus + output
  const [subjects, setSubjects] = useState(() => buildCurriculum("English", DEFAULT_CLASS));
  const [generated, setGenerated] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [sheetConfigured, setSheetConfigured] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore after mount only — reading sessionStorage during render would make
  // the server and client markup disagree.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.name != null) setName(s.name);
        if (s.phone != null) setPhone(s.phone);
        if (s.epsid != null) setEpsid(s.epsid);
        // Coerce a stale saved combo (e.g. a removed class + Malayalam) to a valid medium.
        const savedCls = CLASSES.includes(s.cls) ? s.cls : DEFAULT_CLASS;
        const savedMedium = mediumsFor(savedCls).includes(s.medium) ? s.medium : "English";
        if (s.cls) setCls(savedCls);
        setMedium(savedMedium);
        if (s.fromDate) setFromDate(s.fromDate);
        if (s.toDate) setToDate(s.toDate);
        if (Array.isArray(s.weeklyOff)) setWeeklyOff(new Set(s.weeklyOff));
        if (s.extraLeave != null) setExtraLeave(s.extraLeave);
        if (s.cls || s.medium || Array.isArray(s.selected)) {
          const fresh = buildCurriculum(savedMedium, savedCls);
          if (Array.isArray(s.selected)) {
            const picked = new Set(s.selected);
            fresh.forEach((sub) =>
              sub.chapters.forEach((c) => {
                c.selected = c.ready && picked.has(chapterKey(sub, c));
              })
            );
          }
          setSubjects(fresh);
        }
      }
    } catch {
      /* a corrupt blob shouldn't break the app — just start fresh */
    }
    setHydrated(true);
  }, []);

  // Persist (only once restored, so we never write defaults over saved state).
  useEffect(() => {
    if (!hydrated) return;
    const selected = [];
    subjects.forEach((s) =>
      s.chapters.forEach((c) => c.selected && selected.push(chapterKey(s, c)))
    );
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name, phone, epsid, cls, medium, fromDate, toDate,
          weeklyOff: [...weeklyOff], extraLeave, selected,
        })
      );
    } catch {
      /* private mode / quota — persistence is a convenience, not a requirement */
    }
  }, [hydrated, name, phone, epsid, cls, medium, fromDate, toDate, weeklyOff, extraLeave, subjects]);

  useEffect(() => {
    let alive = true;
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => alive && setSheetConfigured(!!d.configured))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Switching class or medium swaps the whole chapter list, so rebuild and drop
  // any stale plan.
  const rebuild = useCallback((m, c) => {
    setSubjects(buildCurriculum(m, c));
    setGenerated(false);
    setSaveStatus("idle");
  }, []);
  const changeMedium = useCallback((m) => { setMedium(m); rebuild(m, cls); }, [cls, rebuild]);
  // The humanities classes are English-only — coerce the medium so a leftover
  // "Malayalam" selection can't survive the switch.
  const changeClass = useCallback((c) => {
    const m = mediumsFor(c).includes(medium) ? medium : "English";
    setCls(c);
    setMedium(m);
    rebuild(m, c);
  }, [medium, rebuild]);

  const toggleWeekly = useCallback((d) => {
    setWeeklyOff((prev) => {
      const n = new Set(prev);
      n.has(d) ? n.delete(d) : n.add(d);
      return n;
    });
  }, []);

  // `ready` guards below: a chapter with no topic breakdown can't be scheduled,
  // so it must never end up ticked — not by a direct tap, not via "Select all".
  const toggleChapter = useCallback((si, ci) => {
    setSubjects((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, chapters: s.chapters.map((c, j) => (j === ci && c.ready ? { ...c, selected: !c.selected } : c)) }
      )
    );
  }, []);
  const toggleOpen = useCallback((si) => {
    setSubjects((prev) => prev.map((s, i) => (i === si ? { ...s, open: !s.open } : s)));
  }, []);
  const selectAllIn = useCallback((si, val) => {
    setSubjects((prev) =>
      prev.map((s, i) => (i !== si ? s : { ...s, chapters: s.chapters.map((c) => ({ ...c, selected: val && c.ready })) }))
    );
  }, []);
  const reset = useCallback(() => {
    setSubjects(buildCurriculum(medium, cls));
    setGenerated(false);
    setSaveStatus("idle");
  }, [medium, cls]);

  // Study days before extra leave — caps the "other days off" input.
  const rawStudyDays = useMemo(
    () => studyDatesIn(fromDate, toDate, weeklyOff).length,
    [fromDate, toDate, weeklyOff]
  );

  const plan = useMemo(
    () => buildPlan({ subjects, fromDate, toDate, weeklyOff, extraLeave }),
    [subjects, fromDate, toDate, weeklyOff, extraLeave]
  );

  const details = { name, phone, epsid };
  const detailsValid = areDetailsValid(details);

  const saveToSheet = useCallback(async () => {
    if (plan.error) return;
    setSaveStatus("saving");
    const chapters = [];
    subjects.forEach((s) =>
      s.chapters.forEach(
        (c) => c.selected && chapters.push(`${s.name}: ${c.num ? `${c.num} ` : ""}${c.name}`)
      )
    );
    const payload = {
      epsid, name, phone, class: cls, medium, fromDate, toDate,
      // Names, not indices — the sheet is read by humans.
      weeklyOff: [...weeklyOff].sort((a, b) => a - b).map((d) => WEEKDAYS[d]),
      extraLeave: Number(extraLeave || 0),
      totalChapters: plan.totalChapters,
      totalTopics: plan.totalTopics,
      topicsPerDay:
        plan.minTopics === plan.maxTopics
          ? String(plan.medianTopics)
          : `${plan.medianTopics} (${plan.minTopics}-${plan.maxTopics})`,
      finish: toISO(plan.finish),
      chapters,
    };
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSaveStatus(data.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }, [plan, subjects, epsid, name, phone, cls, medium, fromDate, toDate, weeklyOff, extraLeave]);

  const value = {
    name, setName, phone, setPhone, epsid, setEpsid,
    cls, changeClass, medium, changeMedium,
    fromDate, setFromDate, toDate, setToDate,
    weeklyOff, toggleWeekly, extraLeave, setExtraLeave,
    subjects, toggleChapter, toggleOpen, selectAllIn, reset,
    generated, setGenerated,
    saveStatus, saveToSheet, sheetConfigured,
    rawStudyDays, plan, details, detailsValid, hydrated,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}
