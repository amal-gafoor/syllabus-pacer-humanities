# Syllabus Pacer

Turns a student's chapter selection and deadline into a day-by-day topic plan.

Built for Eduport's Kerala Higher Secondary **humanities** students (Plus One and
Plus Two). A student enters their details, picks a study window and the chapters
they need to finish, and gets an even, dated schedule — plus a copy written to a
Google Sheet for the academic team.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. It redirects to `/details`; an EPSID must match
`EPS` followed by six digits (e.g. `EPS123456`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run check` | Planner sanity checks against the real curriculum |
| `npm run curriculum` | Regenerate the curriculum from the syllabus workbook |

## How the planner works

Days are shared out **by topic count**, not by pages — the humanities syllabus
has no page numbers, so topics are the unit of work.

1. `allocateDays` gives each chapter a whole number of days in proportion to its
   topic count, with a floor of one day and a ceiling of its topic count.
2. `sliceTopics` splits each chapter's topics into one contiguous slice per day,
   spreading the remainder rather than front-loading it.
3. `interleave` deals the chapter-days across the calendar so subjects alternate
   instead of being studied in long single-subject blocks.

When more chapters are selected than there are study days, it switches to a
shared-day path that packs chapters against an even topic budget.

`npm run check` asserts the invariants that matter: every selected topic is
scheduled exactly once, each chapter's topics stay in book order, no day is far
heavier than the median, and chapters without a topic breakdown never reach a
plan.

## Curriculum data

`lib/curriculum/plus-one-hum.js` and `plus-two-hum.js` are **generated files** —
edit the source workbook, not these.

```bash
npm run curriculum
```

The workbook itself (`textbooks/`) is not in this repository: it carries internal
teacher names. The generated curriculum is committed, so the app builds and runs
without it — you only need the workbook to pick up syllabus changes. Ask the team
for a copy and drop it into `textbooks/`.

A handful of Plus One Statistics chapters are listed in the workbook with no
topic breakdown yet. They appear in the picker as disabled rows marked "topics
coming soon" rather than being silently dropped from a built plan.

## Saving to Google Sheets

Submissions are proxied through `app/api/students/route.js` to a Google Apps
Script web app, which appends a row per plan. Set the endpoint in `.env.local`:

```
SHEETS_WEBAPP_URL=https://script.google.com/macros/s/.../exec
```

Without it the planner works normally and simply doesn't save. The Apps Script
bridge is kept in a separate private repository, as it references the
submissions spreadsheet directly.

## Stack

Next.js 14 (App Router) · React 18 · Tailwind CSS 3 · lucide-react. No database —
student input lives in React state and `sessionStorage` for the length of a visit.
