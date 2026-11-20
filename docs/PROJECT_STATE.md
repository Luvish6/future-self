# Project State

**Current phase:** 0 complete → next: Phase 1 (design system, layout, navigation, dashboard shell).

## Done
- Spec, MVP, stack, architecture, DB schema draft, roadmap (`docs/ARCHITECTURE.md`)
- Repo docs, `.gitignore`, `.env.example`, draft migration `supabase/migrations/0001_init.sql` (not applied)

## Key decisions
- No backend server; Supabase + RLS. Cloudflare Pages hosting (static).
- Free-first personalization: deterministic template engine; LLM optional later, server-side only.
- Audio: Web Speech API + MediaRecorder + small royalty-free loops; recordings in private Supabase Storage bucket.
- Phase 1 runs local-only (mock/localStorage data) — no Supabase dependency until Phase 2.

## Known issues / open items
- GitHub remote not yet connected (`gh` CLI not installed) — see README steps given in session.
- Verify Supabase free-tier limits (pausing after inactivity, DB/storage caps) before Phase 2.
- Speech synthesis stops on mobile screen lock; plan pre-recorded/recorded-audio fallback (Phase 6).

## Next task
Phase 1: scaffold Vite React-TS + Tailwind + Vitest, design tokens (light/dark), app shell + bottom nav, dashboard placeholder.
