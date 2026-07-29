/**
 * Excel → curriculum data generator.
 *
 *   npm run curriculum
 *
 * Reads `textbooks/CHAPTER AND TOPIC HUMANITIES.xlsx` and writes
 * `lib/curriculum/plus-one-hum.js` and `lib/curriculum/plus-two-hum.js`.
 *
 * Re-run this whenever the teachers update the workbook — the generated files
 * are build artefacts, so edit the spreadsheet, not the output.
 *
 * ── Sheet layout it expects ──────────────────────────────────────────────
 * Each sheet lays its subjects out side by side in column PAIRS. Row 2 of the
 * left column holds the subject name; the pair is then (TOPICS, SUBTOPICS):
 *
 *      A            B            D                  E          …
 *   2  ECONOMICS                 POLITICAL SCIENCE
 *   3  CHAPTER 1.1 - … (NAME)    CHAPTER 1.1 - … (NAME)
 *   4  TOPICS       SUBTOPICS    TOPICS             SUBTOPICS
 *   5  1. Foo       1. Foo       1. Bar             1. Bar
 *   6                2. Foo b                                    ← extra subtopic
 *
 * Chapter blocks stack vertically down the same pair, separated by blanks. A
 * topic spanning several subtopics leaves the TOPICS cell empty on the
 * continuation rows — we schedule at TOPIC grain, so those rows are skipped.
 *
 * No page counts exist anywhere in this workbook, which is why the planner is
 * topic-weighted rather than page-weighted.
 *
 * Written against Node's standard library only (its own ZIP + XML readers) so
 * that regenerating the curriculum never depends on an install step.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKBOOK = join(ROOT, "textbooks", "CHAPTER AND TOPIC HUMANITIES.xlsx");
const OUT_DIR = join(ROOT, "lib", "curriculum");

/** Sheet tab → generated file + exported constant. */
const TARGETS = [
  { sheet: "P1H", file: "plus-one-hum.js", constName: "PLUS_ONE_HUM", label: "Plus One" },
  { sheet: "P2H", file: "plus-two-hum.js", constName: "PLUS_TWO_HUM", label: "Plus Two" },
];

/**
 * Display order for the subject accordion. The workbook's column order differs
 * between the two sheets (P1H has Geography before Sociology, P2H the reverse),
 * so we impose one order and students see the same list in both classes.
 * Anything not listed keeps its sheet order and lands at the end.
 */
const SUBJECT_ORDER = [
  "Economics",
  "Political Science",
  "History",
  "Geography",
  "Sociology",
  "Statistics",
];

/**
 * Revision / question-practice rows the teachers keep alongside the syllabus.
 * These are dropped: the pacer schedules syllabus content, and board revision is
 * planned separately. Matches "7. BOARD", "9. BOARD PYQ 2026", "4. PYQ", etc.
 */
const REVISION_ROW = /^(?:board|pyq)\b/i;

/** Spelling slips in the source sheet, fixed on the way through. */
const TYPOS = [
  [/\bLIV\s+ING\b/gi, "Living"],
  [/\bAPRAISAL\b/gi, "Appraisal"],
  [/\bHEGEMONEY\b/gi, "Hegemony"],
  [/\bCONTEMPARARY\b/gi, "Contemporary"],
  [/\bELEMENTRY\b/gi, "Elementary"],
  [/\bDEVELOPEMENT\b/gi, "Development"],
  [/\bSYATEMS\b/gi, "Systems"],
  [/\bINDRODUCTION\b/gi, "Introduction"],
  [/\bZEMINDARS\b/gi, "Zamindars"],
  [/\bMethodes\b/gi, "Methods"],
  [/\bstudiying\b/gi, "studying"],
  [/\bDifferenciation\b/gi, "Differentiation"],
  [/\bMohanjodaro\b/gi, "Mohenjodaro"],
];

/**
 * Chapter titles are tagged with the name of the teacher who owns the chapter,
 * in parentheses — internal bookkeeping that students should never see. They are
 * always a single ALL-CAPS word, so that shape is what we strip, rather than
 * listing the staff names here (this file is public; the workbook is not).
 *
 * A couple of genuine title fragments have the same shape and must survive —
 * "Freedom (LIBERTY)" is a real chapter title, not an author tag.
 */
const KEEP_PARENS = new Set(["LIBERTY"]);
const AUTHOR_TAG = /^[A-Z][A-Z.'-]*$/;

/** Kept upper-case by the title-caser. */
const ACRONYMS = new Set([
  "US", "UK", "UN", "USA", "USSR", "LPG", "WTO", "NHRC", "GDP", "NEP",
  "FPTP", "PR", "IT", "SAARC", "ASEAN", "NATO", "IMF", "WHO", "NGO",
]);

/** Lower-cased by the title-caser unless they lead the title. */
const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into",
  "nor", "of", "on", "or", "the", "to", "up", "vs", "with", "its", "their",
]);

/**
 * `CHAPTER - 2.6 CITIZENSHIP` is duplicated in the P1H workbook: it sits
 * under both Political Science and Sociology. It belongs to Political Science —
 * it is chapter 6 of the NCERT *Political Theory* reader, and P1H Sociology's
 * Part B has only five chapters — so drop the Sociology copy.
 * Keyed by `sheet | subject | chapter number`.
 */
const DUPLICATES = new Set(["P1H|Sociology|2.6"]);

// ── ZIP reader ────────────────────────────────────────────────────────────
// An .xlsx is a ZIP of XML parts. We read the central directory rather than
// scanning local headers, because local headers may carry zeroed sizes when the
// writer used a trailing data descriptor.

function openZip(path) {
  const buf = readFileSync(path);

  let eocd = -1;
  const floor = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= floor; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`${path} is not a readable .xlsx (no ZIP end record)`);

  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("Corrupt ZIP central directory");
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    entries.set(buf.toString("utf8", off + 46, off + 46 + nameLen), { method, compSize, localOff });
    off += 46 + nameLen + extraLen + commentLen;
  }

  return (name) => {
    const e = entries.get(name);
    if (!e) throw new Error(`${name} is missing from the workbook`);
    if (buf.readUInt32LE(e.localOff) !== 0x04034b50) throw new Error(`Corrupt ZIP entry: ${name}`);
    const start =
      e.localOff + 30 + buf.readUInt16LE(e.localOff + 26) + buf.readUInt16LE(e.localOff + 28);
    const raw = buf.subarray(start, start + e.compSize);
    return (e.method === 0 ? raw : inflateRawSync(raw)).toString("utf8");
  };
}

// ── XML helpers ───────────────────────────────────────────────────────────
// The parts are machine-generated by Excel, so targeted regexes are sufficient
// and keep this script dependency-free.

const decodeXml = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** Shared string table: one entry per <si>, joining its <t> runs. */
function readSharedStrings(read) {
  let xml;
  try { xml = read("xl/sharedStrings.xml"); } catch { return []; }
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, body]) =>
    decodeXml(
      [...body.replace(/<rPh[\s\S]*?<\/rPh>/g, "").matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((m) => m[1])
        .join("")
    )
  );
}

/** Tab name → part path, resolved through the workbook relationships. */
function readSheetIndex(read) {
  const rels = new Map(
    [...read("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)].map((m) => [
      /Id="([^"]+)"/.exec(m[0])?.[1],
      /Target="([^"]+)"/.exec(m[0])?.[1],
    ])
  );
  const sheets = new Map();
  for (const m of read("xl/workbook.xml").matchAll(/<sheet\b[^>]*\/?>/g)) {
    const name = /name="([^"]+)"/.exec(m[0])?.[1];
    const target = rels.get(/r:id="([^"]+)"/.exec(m[0])?.[1]);
    if (!name || !target) continue;
    sheets.set(decodeXml(name), target.startsWith("/") ? target.slice(1) : `xl/${target}`);
  }
  return sheets;
}

/** Sheet → { cells: Map<"A5", string>, maxRow }, blanks omitted. */
function readSheet(read, path, shared) {
  const xml = read(path);
  const cells = new Map();
  let maxRow = 0;

  for (const m of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, attrs, body = ""] = m;
    const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
    if (!ref) continue;
    const type = /\bt="([^"]+)"/.exec(attrs)?.[1];

    let value;
    if (type === "inlineStr") {
      value = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("");
    } else {
      value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
    }
    if (value == null) continue;

    let text = decodeXml(value);
    if (type === "s") text = shared[Number(text)] ?? "";
    if (!text.trim()) continue;

    cells.set(ref, text);
    maxRow = Math.max(maxRow, Number(/\d+$/.exec(ref)[0]));
  }
  return { cells, maxRow };
}

/** "A" → 1, "Z" → 26, "AA" → 27. */
const colToNum = (col) =>
  [...col].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);

/** 1 → "A", 27 → "AA". */
function numToCol(n) {
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

// ── text cleaning ─────────────────────────────────────────────────────────

const fixTypos = (s) =>
  TYPOS.reduce(
    (acc, [re, fix]) =>
      acc.replace(re, (match) => (match === match.toUpperCase() ? fix.toUpperCase() : fix)),
    s
  );

/** Curly quotes and dashes → ASCII; collapse runs of whitespace (incl. tabs). */
const normalise = (s) =>
  s
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+([,;:])/g, "$1")
    .trim();

function titleCase(s) {
  let wordIndex = 0;
  let afterColon = false;
  return s
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) return token;
      // A small word still capitalises when it opens the title or a subtitle.
      const opensClause = wordIndex++ === 0 || afterColon;
      afterColon = /[:;.–-]$/.test(token);
      const letters = token.replace(/[^A-Za-z]/g, "");
      // Preserve an acronym only where the sheet already wrote it in caps.
      if (letters && token === token.toUpperCase() && ACRONYMS.has(letters.toUpperCase())) {
        return token.toUpperCase();
      }
      const lower = token.toLowerCase();
      if (!opensClause && SMALL_WORDS.has(letters.toLowerCase())) return lower;
      return lower.replace(/[a-z]/, (c) => c.toUpperCase());
    })
    .join("");
}

/** Sentence-case only when the source is shouting, so mixed-case stays as written. */
const deShout = (s) => (/[a-z]/.test(s) ? s : titleCase(s));

const upperFirst = (s) => s.replace(/^([a-z])/, (c) => c.toUpperCase());

/** Strip the leading "1." / "2)" ordinal the sheet numbers every row with. */
const stripOrdinal = (s) => s.replace(/^\s*\d+\s*[.)]\s*/, "").trim();

/** Drop single-word ALL-CAPS parentheticals (author tags, "(BOARD)"). */
const stripNoiseParens = (s) =>
  s.replace(/\s*\(([^()]*)\)/g, (match, inner) => {
    const word = inner.trim();
    return AUTHOR_TAG.test(word) && !KEEP_PARENS.has(word.toUpperCase()) ? " " : match;
  });

/** Tidy the dangling "-" / ":" left behind once a note is removed. */
const trimPunctuation = (s) => s.replace(/^[\s\-–—:.,]+|[\s\-–—:,]+$/g, "");

const CHAPTER_HEAD =
  /^\s*CHAPTER\s*[-–—]?\s*(\d+)\s*(?:[.:]\s*(\d+))?\s*[-–—:.)]*\s*/i;

/** `CHAPTER - 1: 3. UNDERSTANDING …` → { num: "1.3", name: "Understanding …" }. */
function parseChapter(raw) {
  const clean = (s) => deShout(fixTypos(normalise(trimPunctuation(stripNoiseParens(s)))));
  const text = normalise(raw);
  const m = CHAPTER_HEAD.exec(text);
  if (!m) return { num: "", name: clean(text) };
  const num = m[2] ? `${m[1]}.${m[2]}` : m[1];
  return { num, name: clean(text.slice(m[0].length)) || `Chapter ${num}` };
}

// ── workbook → curriculum ─────────────────────────────────────────────────

function parseSubjects(sheet, sheetName, stats) {
  const { cells, maxRow } = sheet;

  // Subject headings live on row 2; each owns that column and the one to its right.
  const heads = [...cells.keys()]
    .filter((ref) => /^[A-Z]+2$/.test(ref))
    .map((ref) => /^([A-Z]+)/.exec(ref)[1])
    .sort((a, b) => colToNum(a) - colToNum(b));

  const subjects = [];

  for (const topicCol of heads) {
    const name = deShout(normalise(cells.get(`${topicCol}2`)));
    const chapters = [];
    let current = null;

    for (let row = 3; row <= maxRow; row++) {
      const cell = cells.get(`${topicCol}${row}`);
      if (!cell) continue;

      if (CHAPTER_HEAD.test(cell) || /^\s*CHAPTER\b/i.test(cell)) {
        const { num, name: chapterName } = parseChapter(cell);
        if (DUPLICATES.has(`${sheetName}|${name}|${num}`)) {
          stats.duplicatesDropped.push(`${sheetName} ${name} ${num} ${chapterName}`);
          current = null; // skip this block's topic rows too
          continue;
        }
        current = { num, name: chapterName, topics: [] };
        chapters.push(current);
        continue;
      }

      if (/^(TOPICS|SUBTOPICS)$/i.test(cell.trim())) continue;
      if (!current) continue;

      const topic = normalise(stripOrdinal(cell));
      if (!topic) continue;
      if (REVISION_ROW.test(topic)) { stats.revisionDropped++; continue; }

      current.topics.push({ name: upperFirst(fixTypos(topic)) });
    }

    if (chapters.length) subjects.push({ name, chapters });
  }

  // Impose a stable cross-class display order.
  subjects.sort((a, b) => {
    const ai = SUBJECT_ORDER.indexOf(a.name);
    const bi = SUBJECT_ORDER.indexOf(b.name);
    return (ai < 0 ? SUBJECT_ORDER.length : ai) - (bi < 0 ? SUBJECT_ORDER.length : bi);
  });

  return subjects;
}

// ── emit ──────────────────────────────────────────────────────────────────

const quote = (s) => JSON.stringify(s);

function render(subjects, constName, label, sheetName) {
  const lines = [
    `// GENERATED FILE — do not edit by hand.`,
    `// Source: textbooks/CHAPTER AND TOPIC HUMANITIES.xlsx (sheet "${sheetName}")`,
    `// Regenerate with: npm run curriculum`,
    `//`,
    `// ${label} Humanities. There are no page counts in the source workbook, so the`,
    `// planner weights days by topic count instead — see lib/planner/allocateDays.js.`,
    `// Chapters with an empty \`topics\` array are listed in the workbook but have no`,
    `// topic breakdown yet; the picker shows them disabled.`,
    ``,
    `const ${constName} = [`,
  ];

  for (const subject of subjects) {
    lines.push(`  {`);
    lines.push(`    name: ${quote(subject.name)},`);
    lines.push(`    chapters: [`);
    for (const chapter of subject.chapters) {
      const head = `      { num: ${quote(chapter.num)}, name: ${quote(chapter.name)},`;
      if (!chapter.topics.length) {
        lines.push(`${head} topics: [] },`);
        continue;
      }
      lines.push(`${head} topics: [`);
      for (const topic of chapter.topics) lines.push(`        { name: ${quote(topic.name)} },`);
      lines.push(`      ] },`);
    }
    lines.push(`    ],`);
    lines.push(`  },`);
  }

  lines.push(`];`, ``, `export default ${constName};`, ``);
  return lines.join("\n");
}

// ── main ──────────────────────────────────────────────────────────────────

function main() {
  // textbooks/ is gitignored (it carries internal teacher names), so a fresh
  // clone won't have the workbook. The committed curriculum still builds and
  // runs — only regeneration needs the file.
  if (!existsSync(WORKBOOK)) {
    console.error(
      `Workbook not found:\n  ${WORKBOOK}\n\n` +
      `It is deliberately kept out of the repository. Ask the team for\n` +
      `"CHAPTER AND TOPIC HUMANITIES.xlsx" and drop it into textbooks/.\n` +
      `The generated curriculum in lib/curriculum/ is committed, so you only\n` +
      `need this to pick up syllabus changes.`
    );
    process.exit(1);
  }

  const read = openZip(WORKBOOK);
  const shared = readSharedStrings(read);
  const index = readSheetIndex(read);

  mkdirSync(OUT_DIR, { recursive: true });

  for (const target of TARGETS) {
    const path = index.get(target.sheet);
    if (!path) throw new Error(`Sheet "${target.sheet}" not found. Found: ${[...index.keys()].join(", ")}`);

    const stats = { revisionDropped: 0, duplicatesDropped: [] };
    const subjects = parseSubjects(readSheet(read, path, shared), target.sheet, stats);

    writeFileSync(
      join(OUT_DIR, target.file),
      render(subjects, target.constName, target.label, target.sheet),
      "utf8"
    );

    const chapters = subjects.reduce((n, s) => n + s.chapters.length, 0);
    const topics = subjects.reduce(
      (n, s) => n + s.chapters.reduce((m, c) => m + c.topics.length, 0), 0
    );
    const empty = subjects.flatMap((s) =>
      s.chapters.filter((c) => !c.topics.length).map((c) => `${s.name} ${c.num} ${c.name}`)
    );

    console.log(
      `${target.sheet} → lib/curriculum/${target.file}\n` +
      `  ${subjects.length} subjects · ${chapters} chapters · ${topics} topics ` +
      `(dropped ${stats.revisionDropped} board/PYQ rows)`
    );
    for (const d of stats.duplicatesDropped) console.log(`  duplicate removed: ${d}`);
    if (empty.length) {
      console.log(`  ${empty.length} chapter(s) with no topics yet:`);
      for (const e of empty) console.log(`    - ${e}`);
    }
    for (const s of subjects) {
      const t = s.chapters.reduce((m, c) => m + c.topics.length, 0);
      console.log(`    ${s.name.padEnd(18)} ${String(s.chapters.length).padStart(2)} ch · ${String(t).padStart(3)} topics`);
    }
  }
}

main();
