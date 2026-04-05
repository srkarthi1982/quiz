# App Spec: quiz

## 1) App Overview
- **App Name:** Quiz
- **Category:** Learning
- **Version:** V1
- **App Type:** Hybrid
- **Purpose:** Help a user take quizzes from the managed question bank, save results, and use platform/subject/topic filters, while also supporting admin content management and related integrations.
- **Primary User:** A signed-in Ansiversa user taking quizzes, with separate admin-only content management surfaces.

## 2) User Stories
- As a user, I want to choose a quiz by platform, subject, topic, roadmap, and difficulty, so that I can take targeted practice sessions.
- As a user, I want my result to be saved, so that I can review performance over time.
- As an admin, I want to manage quiz taxonomy and questions, so that the public quiz flow uses curated content.

## 3) Core Workflow
1. User opens the landing page or `/quiz`.
2. User chooses quiz filters and starts a quiz session from the available question bank.
3. User answers questions and submits the attempt.
4. The app stores a result record and shows the result view at `/results`.
5. Admin users manage platforms, subjects, topics, roadmaps, and questions through the admin surfaces.

## 4) Functional Behavior
- Quiz stores its taxonomy, questions, verification records, user results, bookmarks, and FAQs in Astro DB.
- The public/user flow is centered on `/quiz` and `/results`, while admin CRUD lives under `/admin/*`.
- Current implementation includes bookmark support for saved entities and API surfaces for related integrations such as FlashNote sourcing.
- Question verification support exists in the schema and API surface; current implementation also includes AI-assisted verification endpoints for question quality workflows.
- Result history is persisted per authenticated user rather than being a local-only score screen.
- Parent notification integration and unread-count proxying are present, but authentication remains parent-owned.

## 5) Data & Storage
- **Storage type:** Astro DB plus related integration endpoints
- **Main entities:** `Platform`, `Subject`, `Topic`, `Roadmap`, `Question`, `QuestionVerification`, `Result`, `Bookmark`, `Faq`
- **Persistence expectations:** Question-bank content is repo-owned; user results and bookmarks persist per authenticated user.
- **User model:** Shared content bank plus per-user result/bookmark records

## 6) Special Logic (Optional)
- The taxonomy model lets the user narrow quiz scope across platform, subject, topic, roadmap, and level.
- Verification metadata is stored on questions and in a dedicated verification table, allowing question-quality workflows without rewriting the base question row blindly.
- FlashNote-facing API routes indicate the question bank can act as a source for another mini-app in the ecosystem.

## 7) Edge Cases & Error Handling
- Invalid taxonomy selection: Missing or inconsistent platform/subject/topic combinations should not produce broken quiz state.
- Empty question pool: The app should fail safely if the selected filters do not produce a valid quiz set.
- Invalid admin edits: Question-bank CRUD should preserve referential consistency across taxonomy entities.
- Auth boundary: User and admin routes rely on the parent session rather than local auth implementation.

## 8) Tester Verification Guide
### Core flow tests
- [ ] Start a quiz from valid filters, submit answers, and confirm a result record is created and rendered.
- [ ] Bookmark a supported entity and confirm it appears on `/bookmarks`.
- [ ] As an admin, create or update taxonomy/question content and confirm the quiz flow reflects the curated data.

### Safety tests
- [ ] Try filter combinations with no valid questions and confirm the app handles the empty state safely.
- [ ] Open invalid admin or result paths and confirm the app fails safely.
- [ ] If verification tooling is enabled, confirm verification results update question quality metadata without corrupting the original question bank.

### Negative tests
- [ ] Confirm the app does not claim adaptive AI tutoring beyond the implemented verification/admin tooling.
- [ ] Confirm FlashNote/export APIs are additive integrations and not a replacement for the core persisted quiz flow.

## 9) Out of Scope (V1)
- Live multiplayer quiz battles
- Real-time collaboration during an attempt
- Fully adaptive tutoring workflows
- Independent auth or billing owned by this repo

## 10) Freeze Notes
- V1 freeze: this document reflects the current question-bank, attempt/result, bookmark, and admin-management implementation.
- Integration and verification surfaces exist in code; final QA should browser-verify user attempt flow, result persistence, bookmarks, and admin CRUD.
- During freeze, only verification fixes, cleanup, and documentation hardening are allowed.
