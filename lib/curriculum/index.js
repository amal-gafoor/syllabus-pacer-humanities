import { PALETTE } from "@/lib/constants";

import PLUS_ONE_HUM from "./plus-one-hum";
import PLUS_TWO_HUM from "./plus-two-hum";

// class → medium → subject list. The humanities syllabus is English medium only.
// Both files are generated from textbooks/CHAPTER AND TOPIC HUMANITIES.xlsx —
// run `npm run curriculum` after the teachers update the workbook.
export const CURRICULA = {
  "Plus One": { English: PLUS_ONE_HUM },
  "Plus Two": { English: PLUS_TWO_HUM },
};

let _id = 0;
const nextId = () => ++_id;

/**
 * Look up the subject list for a class + medium. Humanities is English-only, so
 * any medium resolves to the English list; an unknown class falls back to empty.
 */
export const curriculumFor = (medium = "English", cls = "Plus Two") => {
  const byMedium = CURRICULA[cls] || {};
  return byMedium.English || [];
};

/**
 * Turn the static data into the editable shape the UI drives: ids, colours, and
 * open/selected flags.
 *
 * A handful of chapters are listed in the workbook with no topic breakdown yet
 * (Plus One Statistics 2–10). They're kept in the list so students can see the
 * chapter exists, but flagged `ready: false` so the picker disables them — the
 * planner can't schedule a chapter it has no topics for, and silently dropping a
 * ticked chapter from the finished plan would be worse than saying so up front.
 */
export const buildCurriculum = (medium = "English", cls = "Plus Two") =>
  curriculumFor(medium, cls).map((sub, i) => ({
    id: nextId(),
    name: sub.name,
    color: PALETTE[i % PALETTE.length],
    open: i === 0,
    chapters: sub.chapters.map((c) => ({
      id: nextId(),
      num: c.num || "",
      name: c.name,
      topics: c.topics || [],
      ready: (c.topics?.length ?? 0) > 0,
      selected: false,
    })),
  }));
