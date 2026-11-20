# Project State

**Current phase:** v1 MVP complete (phases 0–9). **Requirements updated to v2 "Goal Worlds"** — plan in [ROADMAP_V2.md](ROADMAP_V2.md). Next: v2.1 (P0 foundation). Deploy still pending (owner).

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

## Next task
**v2.1a — Goal World data model + themes (no new screens):** extend `Category` (love, self_love, academic, peace, custom), add `theme` to Goal and `goal_id` to journal/routine/audio types, lazy local migration, `0002_goal_worlds.sql`, `[data-world]` palette tokens in `index.css` + contrast unit test.
Then v2.1b: `/g/:goalId` shell, goal switcher, preset/custom goal creation from content packs.
Owner (anytime): deploy to Cloudflare Pages (README); approve CC0 image list before v2.3.
