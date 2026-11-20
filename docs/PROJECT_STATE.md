# Project State

**Current phase:** v2 Goal Worlds implemented through v2.5 except the built-in image library (v2.3b, awaiting owner approval of CC0 images). Plan in [ROADMAP_V2.md](ROADMAP_V2.md). Deploy still pending (owner).

## Done
- Phase 0: spec, architecture, docs
- Phase 1: Vite + React 19 + TS + Tailwind v4 design system (light/dark tokens), responsive shell (mobile bottom nav / desktop sidebar), dashboard
- Phase 2: local-first storage (IndexedDB) + optional Supabase auth/sync (email+password), RLS migration, 10-question onboarding → growth plan (habits, identity, if-then plans, WOOP, milestones)
- Phase 3: goals + milestones, visualization studio (process-focused scripts, 3–15 min, editable, TTS), affirmation studio (suggestions, credibility hint, voice recording, favorites, in-app reminder)
- Phase 4: Future Self Advisor — deterministic intent → framework engine, personalized with goals/values; crisis-language routing
- Phase 5: routine mapping + analysis (sleep/free time, gap placement), habits with flexible streaks, daily challenge
- Phase 6: night audio — TTS narration, procedural ambient sounds (Web Audio), volumes, voice/pace, sleep timer w/ fade, Media Session, history
- Phase 7: journal (7 kinds, mood, search, sealed future-self letters, weekly review template), vision board (client-compressed images), progress analytics
- Phase 8: input caps/cleaning, RLS + user-scoped writes (tested), export/import/delete-all, account deletion RPC, a11y (labels, roles, skip link, reduced motion)
- Phase 9: PWA (vite-plugin-pwa, offline precache, manifest), SPA `_redirects` for Cloudflare Pages

## Key decisions
- **Local-first:** works fully offline with no account; Supabase is optional (enabled when `VITE_SUPABASE_*` set).
- Voice recordings never leave the device (IndexedDB blobs). Vision images stored as compressed JPEG data URLs (EXIF stripped).
- No LLM. All personalization in `src/lib/engine/` (pure, unit-tested).
- Ambient sounds are generated, not downloaded (no licensing/assets).

## Known issues / limits
- Speech synthesis stops on mobile screen lock (documented in UI); recordings in own voice are the fallback.
- Reminders fire only while the app is open (no push server).
- Supabase path is unit-tested with a mock only; not yet tested against a live project.
- Main bundle ~92 KB gzip (includes supabase-js); could lazy-load it if cloud is disabled.
- Local data is per browser profile; clearing site data deletes it (export first).

## v2 progress
- **v2.1a done:** categories + love/self_love/academic/peace/custom (starter habits/affirmations), `Goal.theme`, `goal_id` on journal/routine/audio, `migrateLocal()` (local schema v2, idempotent), `0002_goal_worlds.sql`, palettes in `src/lib/worlds.ts` → injected `[data-world]` CSS (light/dark), WCAG AA contrast test (neutral accent darkened to #5e4cc4 to pass).

- **v2.1b done:** content packs `src/content/worlds.ts` (10 presets + custom; ethics/completeness tests), `/goals/new` (pick preset or custom → editable checklists for affirmations, habits, milestones, reflection questions + theme picker), `/g/:goalId` world page (scoped `data-world` on `<html>`, identity hero, today’s goal habits, affirmations, milestones, reflection, quick links), `GoalSwitcher`, sidebar "Goal worlds" list, dashboard worlds strip, theme picker in goal edit. Goal gained optional `description`, `reflection_questions` (added to 0002 SQL). Gradient heroes use `text-accent-ink` for contrast.

- **v2.2a done:** `components/GoalScope.tsx` (`useGoalScope` = `?goal=` scope + world theme; `GoalScopeBar` chips; `useWorldTheme` moved here). Affirmations: scoped list, category-browsable library (adds to scoped goal), favorites filter. Habits: scoped list, category library picker, schedule = every day / specific days / N× per week (`weekly_target`; `weekCount`/`weeklyStreak`/`weeklyRate`, Monday weeks, tested), Progress uses weekly rate. World page links pass `?goal=`. `weekly_target` added to 0002 SQL.
- Known gap: per-habit reminders not yet (single in-app daily reminder only).

- **v2.2b done:** `features/worlds/Daily.tsx` "Today in this world" on the goal page: daily affirmation (listen/another), latest visualization (play/create), optional challenge (logs a goal-linked win), mood + reflection check-in (goal-linked journal entry), progress counts; every card skippable for today, cards customizable per goal (localStorage). Pure picks in `engine/daily.ts` (tested). Advisor accepts `?goal=` (scope bar, goal-only context, saves goal_id).
- **Fixed (v1 bug):** overlapping local saves could drop rows; `localBackend` now serializes writes per collection and `db.save` re-reads cache after await (tested).

- **v2.3a done:** `vision_boards` collection (goal_id, title) + items `board_id/size/position`; local schema v3 migration groups existing items into one board per goal (tested); `lib/board.ts` ordering helpers (tested); Vision page rewritten: goal scope, multiple boards (create/rename/delete), add image/quote/milestone/description, edit text, move earlier/later, S/M/L sizes (dense grid). SQL for boards/columns added to 0002.

- **v2.4a:** situation-based Advisor (`engine/guidance.ts`): new intents ignored/boundary/rejection; interpretation via goal identity (`futureLens`, 2nd person), settle, healthy response, boundaries, example words, avoid, one small step; follow-ups; save; labeled "structured guidance, not AI".
- **v2.4b:** Evidence Journal (`evidence` kind with 5 structured fields), journal goal scope, `/journal?new=evidence` deep link from goal page.
- **v2.4c:** TTS listen per affirmation + "Play all" with speed; goal scope on Night audio, Visualize, Routine; audio sessions store goal_id.
- **v2.5a:** Future Self Simulator `/simulate` (6 steps → `simulation` journal entry + optional narrated rehearsal script; `engine/simulator.ts`, tested).
- **v2.5b:** vision board slideshow (portal overlay, auto-advance, keyboard).
- **v2.5c:** audio playlists (`playlists` collection; affirmations use your recording else TTS, scripts; loop; `lib/audio/playlist.ts` tested).
- Not done (deliberately deferred): freeform drag/resize board canvas, custom-hex theme editor, per-habit reminders, push notifications, multilingual content.

## Next task
**v2.3b — built-in image library:** owner reviews `docs/IMAGE_CANDIDATES.md`; approved images get downloaded, resized to WebP ≤80 KB into `public/library/<category>/` with `LICENSES.json`, then a library browser on the Vision page (category filter, tag search, multi-select add).
Owner (anytime): deploy to Cloudflare Pages (README); optional Supabase setup (run 0001 + 0002).
