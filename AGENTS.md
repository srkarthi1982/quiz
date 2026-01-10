⚠️ Mandatory: AI agents must read this file before writing or modifying any code in the quiz repo.

# AGENTS.md
## Quiz Repo – Session Notes (Codex)

This file records what was built/changed so far for the quiz app. Read first.

---

## 1. Current Architecture (Quiz App)

- Astro app with `astro:db` tables.
- Auth handled by parent app JWT; middleware enforces auth.
- Actions live in `quiz/src/actions/`.
- One global Alpine store per app pattern; no custom store work added here.

---

## 2. DB Tables (Active)

Defined in `quiz/db/tables.ts` and registered in `quiz/db/config.ts`:

- `Platform`
- `Subject`
- `Topic`
- `Roadmap`
- `Question`
- `Result`

Removed (no longer used): `Quizzes`, `QuizQuestions`, `QuizAttempts`, `QuizResponses`.

---

## 3. Actions (Quiz Domain)

Actions are implemented in `quiz/src/actions/` (moved out of `actions/quiz` folder):

- `platform.ts`: CRUD + list with filters/sort/pagination
- `subject.ts`: CRUD + list with filters/sort/pagination
- `topic.ts`: CRUD + list with filters/sort/pagination
- `roadmap.ts`: CRUD + list with filters/sort/pagination
- `question.ts`: CRUD + list + random fetch
- `result.ts`: save result (JSON) using session user from middleware
- `repositories.ts`: BaseRepository usage + join query repositories
- `baseRepository.ts`: basic CRUD + pagination helpers
- `quiz.ts`: aggregator of quiz actions
- `index.ts`: exports only quiz actions via `server`

Note: `BaseRepository` uses `astro:db` with minimal wrappers; `getPaginatedData` and `getData` are available.

---

## 4. Seeds

Seed entry point: `quiz/db/seed.ts`

Separate seed files:

- `quiz/db/seeds/platform.ts`
- `quiz/db/seeds/subject.ts`
- `quiz/db/seeds/topic.ts`
- `quiz/db/seeds/roadmap.ts`

Roadmap seed reads `quiz/db/seeds/roadmap.json` and inserts in chunks of 500.
`roadmap.ts` also exports default function for `astro db execute`.

---

## 5. Remote DB Status (verified)

Counts from remote DB:

- Platform: 46
- Subject: 260
- Topic: 1182
- Roadmap: 13386

Roadmap seeding required chunking; final count confirmed.

---

## 6. Commands Used

Schema push:
```
npx astro db push --remote
```

Seeds (Astro DB v0.18.3):
```
npx astro db execute db/seed.ts --remote
npx astro db execute db/seeds/roadmap.ts --remote
```

Note: `astro db seed` is not available in this CLI version.

---

## 7. Components

`@ansiversa/components@latest` installed in `quiz/`.

---

## 8. Middleware (Mini-app Standard)

All mini-apps use the quiz middleware file:
`quiz/src/middleware.ts`

Behavior:
- Reads shared session cookie
- Sets `locals.user`, `locals.sessionToken`, `locals.isAuthenticated`
- Redirects to root app login with returnTo

---

## 9. Important Notes

- Roadmap seed uses `process.cwd()` to locate `db/seeds/roadmap.json`.
- Platform/Subject/Topic seeds are static arrays in TS files.
- If re-seeding platforms, UNIQUE constraint will fail unless cleared or made idempotent.

---

## 10. Start-of-Session Checklist (for AI)

1) Read this file first.
2) Check `quiz/db/config.ts` and `quiz/db/tables.ts` for current schema.
3) Check `quiz/src/actions/index.ts` for exported server actions.
4) For DB seeding, use `astro db execute` and confirm counts.

---

## 11. Recent Updates (Admin + Auth + Components)

- Added quiz admin landing page at `quiz/src/pages/admin/index.astro` copied from web.
- Added `quiz/src/layouts/AdminLayout.astro` and `quiz/src/layouts/WebLayout.astro` to support admin layout.
- Admin cards now list quiz tables: Platform, Subject, Topic, Roadmap, Question, Result.
- Quiz middleware now coerces `roleId` to number and guards NaN for admin dropdown visibility.
- Web session token now includes `roleId` (see `web/src/lib/auth.ts` + `web/src/actions/auth.ts`).
- Components `AvNavbarActions` updated: Administration link uses local `/admin` (not ROOT_URL).
- Components version bumped and published: `@ansiversa/components@0.0.99`; installed in `web/` and `quiz/`.
- Added admin pages + Alpine stores for Platforms, Subjects, Topics, Roadmaps:
  - Pages: `quiz/src/pages/admin/platforms.astro`, `quiz/src/pages/admin/subjects.astro`, `quiz/src/pages/admin/topics.astro`, `quiz/src/pages/admin/roadmaps.astro`.
  - Stores: `quiz/src/stores/adminPlatforms.ts`, `quiz/src/stores/adminSubjects.ts`, `quiz/src/stores/adminTopics.ts`, `quiz/src/stores/adminRoadmaps.ts`.
  - Registered stores in `quiz/src/alpine.ts`.
- Fixed Alpine `totalPages` assignment error by removing `totalPages` from admin page initial state payloads.
- Updated admin dropdown selects to load larger datasets:
  - `fetchPlatforms` max pageSize → 500 (`quiz/src/actions/platform.ts`).
  - `fetchSubjects` max pageSize → 500 (`quiz/src/actions/subject.ts`).
  - `fetchTopics` max pageSize → 2000 (`quiz/src/actions/topic.ts`).
  - Pages now preload: platforms 500, subjects 500, topics 2000 as needed.
- Drawer select fix:
  - `subjects.astro` uses server-rendered platform options for correct selection on edit.
  - `topics.astro` and `roadmaps.astro` use server-rendered options + `x-show` filtering via `data-*`.
- Added admin Questions page + store:
  - Page: `quiz/src/pages/admin/questions.astro`.
  - Store: `quiz/src/stores/adminQuestions.ts` (filters, CRUD, roadmap-aware dropdown).

## 12. Next Session

- Continue in evening with data migration work (pending).

---

## 13. Question Migration (Jan 2025)

- Added question seed script: `quiz/db/seeds/question.ts` (reads JSON, chunk insert size 500, auto-generates `Question.id`).
- Seeded question JSON batches in order: `1-20`, `24`, `29-48`, `53` (all from `quiz/public/` during migration).
- Remote DB verified counts:
  - After initial seeds: 633,924
  - After 14–20: 816,022
  - After 24 + 29–48 + 53: 1,576,521
- Found duplicates vs Supabase source; distinct count mismatch of 128,000.
- Ran dedupe cleanup on remote DB (keep min `id` by `platformId/subjectId/topicId/roadmapId/q`); final count: **1,448,521** (matches Supabase).
- Moved all JSON files from `quiz/public/` to `automation/quiz-migration/` in workspace.

---

## 14. Quiz UX + Results Save (Jan 2025)

- Quiz flow now saves results on submit via `saveResult` action (responses include correct index + selected index).
- Fixed scoring bug by coercing selected answers to numbers (`x-model.number`).
- Quiz roadmap list now sorted by `id` ascending.
- Quiz landing CTAs now link to `/quiz` instead of external URL.
- Breadcrumbs added to `quiz` and `results` pages; aligned with admin style and reduced top gap.
- Stepper changed to single-row number circles (labels hidden) and enlarged size.
- Quiz nav buttons updated: Previous/Next icon-only on left, Submit on right.
- Removed `quiz/public/quiz-example-page.astro` and `quiz/public/results-sample.astro`.
