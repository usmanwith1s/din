# Din

A student productivity web app: weekly timetable, tasks, habits, and **Plan My Free Time**, which fits pending tasks into the gap before your next class.

Built on the original scaffold: Next.js 13.5 (App Router), React 18, TypeScript, Tailwind CSS. No backend and no external services. All data stays in your browser's `localStorage`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (Vitest) for scheduling, planner, validation, storage |
| `npm run build` / `npm start` | Production build / server |

`tests/e2e/flows.py` is an optional browser walkthrough (Python + Playwright). Start the app with `npm run build && npm start -- -p 3111`, then run `python3 tests/e2e/flows.py`.

## What's in it

- **Today**: greeting, date, today's classes, next-class countdown, overdue and due-today tasks, daily habit progress, and Plan My Free Time. Empty states guide new users.
- **Timetable**: add/edit/delete classes across seven days. Validates times and blocks overlaps on the same day (back-to-back is allowed).
- **Tasks**: title, category, priority, deadline (optional time), estimated minutes. Active / Completed / All filters; grouped by urgency (overdue, today, tomorrow, this week, later, no deadline).
- **Habits**: one-tap daily check-in and a 7-day history you can tap to correct. No streak counters or guilt mechanics.
- **Backup and restore**: JSON export/import. Imports are validated record by record; malformed files are rejected without touching your data.

## How Plan My Free Time decides

1. Window = time until the next class (or after the current class ends), minus a **10-minute buffer**. With no class left today it offers a 2-hour focus block.
2. Only pending tasks whose estimate **fits the window** are recommended, up to three, packed so their total never exceeds it.
3. Ranking = urgency (overdue > today > tomorrow > this week) + priority + how well the task uses the gap. Each suggestion states why.
4. Tasks left out are listed with the reason (too long, or crowded out). Alternatives: prepare for the next class, or take a break.

The weights live in `lib/planner.ts`.

## Structure

```
app/            layout, page shell, global styles
components/     views (Today, Timetable, Tasks, Habits), forms, backup dialog, UI primitives
lib/            types, time helpers, schedule rules, planner, storage/validation, state hook
tests/          Vitest unit tests + optional Playwright e2e script
```

## Notes

- Fonts: the system font stack is used instead of `next/font/google`, so builds work offline and nothing is fetched from third parties.
- Data lives per browser/device. Use Backup to move it. Clearing site data erases it.
