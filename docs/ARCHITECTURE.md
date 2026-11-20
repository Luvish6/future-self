# Architecture & Plan (Phase 0)

## Concept evaluation — major risks
| Risk | Mitigation |
|---|---|
| Sensitive data (journals, fears, voice) | RLS on every table, private storage bucket, minimal fields, export + account delete |
| Pseudoscience drift | Content rules in AGENTS.md; cite established concepts, no guarantees |
| AI cost / privacy | Deterministic template engine first; any LLM opt-in, server-side, disclosed |
| Mobile audio limits | Web Speech API pauses on screen lock/backgrounding (esp. iOS). Prefer user recordings / `<audio>` files + Media Session API; state limits in UI |
| Supabase free tier | Inactive projects pause; DB/storage caps. Verify current limits before Phase 2; keep recordings small (Opus/WebM) |
| Scope creep (10 features) | Strict MVP + phased roadmap |
| Crisis disclosures | Static safety notice + crisis resources link; no diagnosis |

## MVP (first usable release)
1. Auth + editable onboarding questionnaire → generated growth plan
2. Dashboard (today's actions, goal, affirmation, last reflection)
3. Goals + identity statements
4. Affirmation studio (write/suggest/edit, optional voice recording)
5. Visualization script generator (process-focused, 3/5/10 min) + TTS playback
6. Habits/daily actions with flexible streaks
7. Journal (reflection, gratitude, future-self letter)
8. Future Self Advisor (template-based reflective guidance)

Later: routine analysis, night audio mixer + sleep timer, vision board, analytics, reminders.

## Stack (free-first)
- **Frontend:** React + TypeScript + Vite + Tailwind; React Router; Vitest + Testing Library.
- **Data:** local-first IndexedDB (default) or Supabase (Auth, Postgres + RLS) when env vars are set. No custom server.
- **Hosting:** Cloudflare Pages (static SPA). **PWA:** `vite-plugin-pwa` (Phase 9).
- **Audio:** `speechSynthesis`, `MediaRecorder`, Web Audio for CC0 background loops.
- **AI:** none initially. Optional later via Supabase Edge Function proxy, after checking current provider limits.

## Architecture
```
Browser (React SPA / PWA)
 ├─ src/features/*   UI per feature (onboarding, goals, affirmations, advisor, habits, journal, audio, vision)
 ├─ src/lib/engine   pure personalization: templates + profile → plan, scripts, affirmations, advice
 ├─ src/lib/store.ts  Backend interface (local | supabase) + reactive cache + useCollection
 └─ src/components   design system
        │ HTTPS (anon key + user JWT)
IndexedDB (default, on-device: data + voice recordings)  OR  Supabase: Auth · Postgres (RLS user_id = auth.uid())
```
**Advisor (free-first):** classify question (goal category + intent keywords: spend, time, conflict, habit…) → pick framework (values check, WOOP, 10-10-10, implementation intention, cost/benefit) → fill with user's goals, values, obstacles → reflective questions + practical options + disclaimer. Deterministic, offline, testable.

## Database (`supabase/migrations/0001_init.sql`)
Tables mirror `src/lib/types.ts` (snake_case): profiles, goals (milestones jsonb), affirmations, visualizations, habits (minutes, days[]), habit_logs, journal_entries (open_on), routine_blocks, audio_sessions, vision_items. All rows carry `user_id` → auth.users on delete cascade; owner-only RLS; `delete_my_account()` RPC.

## Roadmap
| Phase | Scope |
|---|---|
| 0–9 | All phases implemented ✅ (see PROJECT_STATE.md) |
| 1 | Scaffold, design tokens (light/dark), app shell + nav, dashboard (local mock data) |
| 2 | Supabase auth, migrations + RLS, onboarding + growth plan |
| 3 | Goals, visualization scripts, affirmation studio (+ voice) |
| 4 | Future Self Advisor (template engine) |
| 5 | Routine analysis + habits/streaks |
| 6 | Night audio: TTS, background sounds, sleep timer, history |
| 7 | Journal, vision board, progress analytics |
| 8 | Security/a11y/perf audit, integration tests, export/delete |
| 9 | Cloudflare Pages deploy, PWA |
