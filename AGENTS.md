# AGENTS.md — rules for AI/dev sessions

## Resume
Read `docs/PROJECT_STATE.md` first, then only the files the task touches. Do not re-scan the repo.

## Token rules
- Work one phase at a time; stop when the phase is done.
- Targeted edits; never rewrite working files; no full-file dumps in chat.
- Short terminal output (pipe through `tail`/`head`). Concise summaries:
  files changed · features · tests run + results · commit status · next task.

## Architecture rules
- SPA (React+TS+Vite+Tailwind). No custom backend server. Supabase direct from client, protected by RLS.
- Every user table has `user_id uuid references auth.users` + RLS `user_id = auth.uid()`.
- Secrets never in frontend or Git. Only `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are client-side.
- Personalization = deterministic templates in `src/lib/engine/` (pure, tested). Optional LLM only via a server-side function after cost/privacy review.
- Feature folders: `src/features/<name>/`. Shared UI in `src/components/`. Pure logic in `src/lib/`.
- Minimal dependencies; justify each new one.

## Content integrity
Evidence-informed framing only (self-efficacy, implementation intentions, WOOP, mental rehearsal, habit formation, future-self continuity). Never claim manifestation, sleep "reprogramming", guaranteed outcomes, or diagnoses. Advisor is reflective coaching, not a real future self or professional advice.

## Testing
Vitest + Testing Library. Test pure logic (engine, streaks, validation) and RLS-sensitive paths. Run focused tests while working; full suite + `tsc --noEmit` before phase completion.

## Git
Commit after verified milestones, conventional messages (`feat:`, `fix:`, `docs:`, `chore:`). Never commit `.env*` (except `.env.example`), user data, or keys. Only report a push if it succeeded.
