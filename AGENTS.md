⚠️ Mandatory: AI agents must read this file before writing or modifying any code.

MANDATORY: After completing each task, update this repo’s AGENTS.md Task Log (newest-first) before marking the task done.
This file complements the workspace-level Ansiversa-workspace/AGENTS.md (source of truth). Read workspace first.

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

---

## 15. Landing + Results Polish (Jan 2025)

- Quiz landing page recreated with premium layout, new hero, stats, process steps, and platform highlights.
- Added platform section (top 5 Academy `type=A` + Professional `type=P`) sourced from `Platform` table.
- “What makes Quiz different” converted to `AvTimeline` items.
- “How it feels to use” converted to `av-steps` layout from web landing.
- Renamed quiz page to `test.astro`; updated internal links to `/test`.
- Results modal adjusted: latest-first ordering, score/level badges on title row, metadata order, and answer table layout.
- Answer review in `test.astro` switched to table layout; labels right-aligned.
- Close buttons use `AvIcon` (added `x` icon in components package).
- Quiz summary grid set to equal column widths on desktop.
- Added `x-cloak` to error panel to prevent initial flash.
- Tested: `npm run build` (Astro build with remote DB) ✅

---

## 16. Landing V1 (Astra Notes Applied)

- Quiz landing now uses live DB counts for Questions/Roadmaps/Platforms with compact formatting.
- Hero bullets copy refined to match Astra’s wording.
- Timeline “Pillar 02” copy updated to avoid over-promising explanations.
- Added “Built like a system” proof section with architecture bullets.
- Top platforms now show fallback text and description line-clamp.
- Public route is `/quiz`; `/test` now redirects to `/quiz` (alias kept).
- Results page links updated to `/quiz`.
- Tested: `npm run build` (Astro build with remote DB) ✅
- Landing page (`quiz.astro`) finalized and locked.

---

## 17. qCount Policy (V1)

- `qCount` is intentionally manual in V1 (informational/admin-visible only).
- No automation, triggers, or derived constraints until V2.

---

## 18. Actions Hardening (Pre-Lock)

- Added action guards: `requireAdmin` for admin CRUD and `requireUser` for quiz fetches.
- CRUD actions now enforce auth + admin role checks before mutation.
- `BaseRepository.countRows()` now uses SQL count with `where` to avoid large in-memory loads.

---

## 19. Stores Polished (Astra Notes)

- Quiz store roadmap search debounced (250ms) with request token to avoid stale list updates.
- AdminQuestions explanation typing relaxed to optional/null for safer UI handling.

---

## 20. Routing + Security Fixes

- Landing route `/` is public; middleware now allows it without auth.
- Admin routes gated by roleId = 1 in middleware.
- Removed `/admin/results` link from admin dashboard (route not implemented).
- Updated package identity to `@ansiversa/quiz` and set `private: true`.

---

## 21. Admin Pages Final Touches

- Admin SSR calls now use `actions.admin.*` namespace.
- Drawer submit buttons call `submit()` explicitly.
- Delete confirm now clears pending delete state after confirm.

---

## 22. Admin Questions Hardened

- Increased SSR roadmap list size for questions filter (2000).
- Drawer platform/subject/topic selects now use Alpine lists with filtered templates.
- Error alerts use `role="alert"` on the questions page.

---

## 23. Quiz Namespace + List Guards

- Exposed `server.quiz` in `src/actions/index.ts` for /quiz SSR calls.
- List actions now require authenticated users: fetchPlatforms/fetchSubjects/fetchTopics/fetchRoadmaps.

---

## 24. Dashboard Summary (V1)

- Added summary contract + builder: `src/dashboard/summary.schema.ts` with `QuizDashboardSummaryV1`.
- Added action `fetchDashboardSummary` (user-scoped) in `src/actions/dashboard.ts`, exposed via `actions.quiz.fetchDashboardSummary`.
- Added docs: `docs/dashboard-summary.md` with versioned JSON example.
- Added React summary component: `src/components/Summary/QuizSummary.tsx` (to be moved to shared components later).

---

## 25. Quiz Activity Webhook (V2 Push)

- Added `PARENT_APP_URL` and `ANSIVERSA_WEBHOOK_SECRET` env vars for activity webhook auth/target.
- Added helper `src/lib/pushActivity.ts` to POST quiz activity signals to the parent app.
- `saveResult` now calls `pushQuizActivity` after successful result insert.
- Webhook is best-effort (fire-and-forget, errors swallowed, no impact on quiz submit).
- Target endpoint: `${PARENT_APP_URL}/api/webhooks/quiz-activity.json`.
- Header required: `X-Ansiversa-Signature: <ANSIVERSA_WEBHOOK_SECRET>`.
- Payload: `{ "userId": "UUID-string", "appId": "quiz", "occurredAt": "ISO-8601" }`.

## 26. Results Modal Answer Format (Feb 2025)

- Results modal now uses labeled answer rows (Your answer, Correct answer, Explanation).
- Answers render from normalized question options; falls back to "Not answered" when selection missing.
- If legacy results lack selected answers but the score is perfect, the modal backfills selected answers with correct options for display.

## 27. Task Log (Recent)

- 2026-02-01 Added `/help` page and wired Help link into the mini-app menu.
- 2026-02-01 Added FlashNote AI source suggestions API and extended FlashNote questions API to accept platform/subject/roadmap filters.
- 2026-01-31 Locked difficult level behind Pro in quiz UI + server guard; added paywall messaging and pricing link.
- 2026-01-31 Normalized payment fields in `Astro.locals.user` to avoid undefined values (stripeCustomerId/plan/planStatus/isPaid/renewalAt).
- 2026-01-31 Added locals.session payment flags in middleware/types and a temporary `/admin/session` debug page for Phase 2 verification.
- 2026-01-29 Added parent notification helper and wired quiz create/result notifications.
- 2026-01-29 Manual smoke test confirmed: Quiz completion triggers notifications ("Quiz completed", "Results saved") visible in parent `/notifications` UI.

- Keep newest first; include date and short summary.
- 2026-02-19 Bumped `/components` to `0.0.141` and refreshed lockfile for latest shared FAQ order-arrow release; verification: `npm run build` ✅.
- 2026-02-19 Bumped `/components` to `0.0.140` and refreshed lockfile to consume the latest shared release; verification: `npm run build` ✅.
- 2026-02-19 Bumped `@ansiversa/components` to `0.0.139` (AvMiniAppBar AppLogo support) and verified with `npm run build` (pass).
- 2026-01-28 Bumped @ansiversa/components to ^0.0.119 for WebLayout mini-app links.
- 2026-01-28 Added quiz mini-app links (Home, Quiz, Results) via AppShell props for AvMiniAppBar.
- 2026-01-28 Added local/remote dev+build scripts for dual DB mode support.
- 2026-01-27 Bumped @ansiversa/components to ^0.0.118, enabled AvMiniAppBar via APP_KEY, and added read-only /api/flashnote/questions with auth + filters.
- 2026-01-25 Fixed Astro DB scripts overriding remote DB URL by removing hardcoded envs and documenting .env.example for local/prod usage so Vercel can use runtime vars.
- 2026-01-25 Standardized Astro DB workflow to file-based remote mode for dev/build and added single `db:push` script.
- 2026-01-18 Updated Question answers using 4-finance-wrong-part-1.csv via temp table bulk update (129 items).
- 2026-01-18 Updated Question answers using 3-law-wrong-only.json via temp table bulk update (627 items). Readbacks blocked by remote DB plan.
- 2026-01-18 Updated Question answers using 2-engineering-wrong-only.json via temp table and bulk update (586 items).
- 2026-01-18 Exported duplicate q groups with counts and ids to automation/quiz-migration/duplicate-q-values.csv.
- 2026-01-18 Deactivated duplicate questions by q-only in remote DB; kept lowest id active per q and verified no active duplicates remain.
- 2026-01-16 Quiz now uses shared Av layouts via AppShell/AppAdminShell.
- 2026-01-16 Removed unsupported `user`/`appId` props from AppShell AvWebLayout usage to fix props typing error.
- 2026-01-16 Moved unread count into AppShell with SSR cookie-forwarding, confirmed no local WebLayout in repo, added typecheck/check scripts.
- 2026-01-16 Switched typecheck to astro check; fixed remaining TS issues.
- 2026-01-16 Unread notification count fetched in AppShell via parent API.
- 2026-01-15 Routed AppShell through local WebLayout so unread badge logic runs on quiz pages.
- 2026-01-15 Added bearer token fallback for unread count fetch to avoid cookie gaps.
- 2026-01-15 Forwarded session cookie explicitly when fetching unread count from parent in quiz layout.
- 2026-01-15 Set dev fallback root app URL for notification badge fetch.
- 2026-01-15 Wired navbar unread notification badge via parent API in quiz layout.
- 2026-01-14 Updated `@ansiversa/components` to `0.0.104` in `quiz/package.json` and lockfile.
- 2026-01-26 Bumped @ansiversa/components to ^0.0.117 to align with latest resume schema (declaration field).

## Verification Log

- 2026-02-01 `npm run build` (pass).
- 2026-02-01 `npm run typecheck` (pass; 6 hints in admin pages/baseRepository).
- 2026-01-31 Verified: free user sees Difficult disabled + paywall, paid user can start Difficult; server returns PAYMENT_REQUIRED on forced difficult for free user.
- 2026-01-31 Pending manual check: paid user sees non-null fields; free user sees null/false in `Astro.locals.user`.
- 2026-01-31 Pending manual check: `/admin/session` shows isPaid true for paid user and false for free user.
- 2026-01-29 `npm run typecheck` (pass; 6 hints in admin pages/baseRepository).
- 2026-01-29 `npm run build` (pass).
- 2026-01-29 Smoke test: quiz completion triggers notifications visible in parent `/notifications` UI.

## Task Log (Recent)
- Keep newest first; include date and short summary.
- 2026-02-22 Mini-app navbar home-link rollout: upgraded `@ansiversa/components` to `0.0.145` so `AvMiniAppBar` app title/icon area is clickable and navigates to mini-app home (`links[0].href`, fallback `/`) with accessible aria-label + focus-visible state; verified no behavior changes to 3-dot menu. Verification: `npm run build` ✅.
- 2026-02-22 FAQ shared rollout: upgraded `@ansiversa/components` to `0.0.144` (shared `FaqManager` now includes debounced search + icon actions + no numeric order UI + no sort-order input), and updated `src/pages/api/admin/faqs.json.ts` GET to support `q` filtering across question/category/audience while preserving audience filter and existing CRUD/reorder behavior. Verification: `npm run build` ✅.
- 2026-02-22 Fix: delete confirmation modal item names now render correctly in admin pages by setting dialog title text at click-time before `AvDialog.open(...)` (platforms/subjects/topics/roadmaps/questions); this resolves `AvConfirmDialog` static-prop limitation where Alpine `:headline` binding showed default "Confirm". Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-22 UX polish: admin delete confirmation dialogs now include the selected entity name (Platform, Subject, Topic, Roadmap, Question) via `AvConfirmDialog` dynamic headlines with fallback `Delete this item?`; delete behavior unchanged.
- 2026-02-22 Bookmarks V1 hardening: added `scripts/apply-bookmark-triggers.ts` using `@libsql/client` (`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`) and wired `db:triggers` + `postdb:push`; applied trigger `bookmark_cleanup_platform_delete` (`Platform` -> `Bookmark` cleanup for `entityType='platform'`). Verification: `npm run db:push` ✅, `npm run db:triggers` ✅, trigger query (`sqlite_master`) ✅, `npm run typecheck` ✅, `npm run build` ✅. Production checklist: pending manual smoke (delete bookmarked platform -> bookmark row auto-removed -> `/bookmarks` no orphan card).
- 2026-02-22 Restored Vercel `quiz` deployment: re-linked local repo to `srilakshmi-tailors-team/quiz`, re-synced required env vars from `.env.production` across production/preview/development, deployed new production build, and verified alias `quiz.ansiversa.com` points to deployment `quiz-dx2wxl2kc-srilakshmi-tailors-team.vercel.app`.
- 2026-02-20 Migrated Bookmarks UI to `@ansiversa/components` (`AvBookmarkButton`, `AvBookmarksEmpty`, `AvBookmarksList`) and updated quiz to consume shared components; removed local `src/components/bookmarks`; added gated mini-app menu Bookmarks link via `bookmarksHref="/bookmarks"` (quiz-only opt-in). Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-20 Refined Quiz platform bookmark UI: moved bookmark control into platform card header row (right of q-count), replaced heart visuals with bookmark/bookmark-check icons, and stabilized toggle rendering to avoid layout shift; no action/DB changes. Verification: `npm run typecheck` ✅.
- 2026-02-20 Quiz Bookmarks V1 (Platforms) implemented: DB `bookmarks` table + actions (`listBookmarks`/`toggleBookmark`) + `/bookmarks` page + platform-list bookmark button; menu link deferred. Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-19 Fixed Quiz public FAQ feed accessibility for parent aggregation by allowing unauthenticated access to `/api/faqs.json` in middleware (`apiPublicRoutes`), so `ansiversa.com/faq?app=quiz` can fetch published Quiz FAQs without login redirects. Verification: `npm run build` ✅, `npm run typecheck` ✅ (0 errors, existing hints only).
- 2026-02-19 Bumped `@ansiversa/components` to `0.0.139` (AvMiniAppBar AppLogo support) and verified with `npm run build` (pass).
- 2026-02-19 FAQ V1 added: faqs table + public endpoint + admin CRUD + /admin/faq using shared FaqManager.
- 2026-02-14 Added Quiz V1 safety scoring/review layer (no DB changes): introduced `src/lib/quiz/effectiveCorrect.ts` to compute stored vs effective correct answer with verification-aware states; updated question action payload to include `verificationSuggestedChoiceIndex`; updated quiz store scoring to use effective answers and treat flagged legacy-answer mismatch as disputed (non-punitive); updated `src/pages/quiz.astro` review UI with calm status badges/messages (`Answer validated live` / `Answer check pending`) and provisional/disputed styling.
- 2026-02-14 Implemented Quiz Progressive Verification V1 (safe/no-overwrite): added `Question` verification metadata columns + new `QuestionVerification` history table in `db/tables.ts`/`db/config.ts`; added canonical parent origin helper `src/server/resolveParentOrigin.ts`; added same-origin AI proxy `src/pages/api/ai/suggest.ts`; standardized notifications proxy to shared resolver; added authenticated chunked verifier endpoint `POST /api/quiz/verify-questions.json` (max 3, updates metadata only, append-only history); triggered one best-effort verify call from `loadQuestions()` for served question IDs; added minimal UI note for `flagged|unsure`; no question text/options/answers/explanations are auto-overwritten.
- 2026-02-14 Upgraded `@ansiversa/components` to `^0.0.128` (lockfile resolved to `0.0.128`) and verified with `npm run typecheck` (pass; 0 errors, existing 6 hints).
- 2026-02-09 Enforced repo-level AGENTS mandatory task-log update rule for Codex/AI execution.
- 2026-02-09 Verified repo AGENTS contract linkage to workspace source-of-truth.
