# Future Self

A free, private, mobile-first personal growth PWA: goals, future-self reflection, visualization, affirmations, habits, routines, journaling, vision board and guided night audio.

> A personal-development tool, not medical, financial, or mental-health treatment. No guaranteed outcomes.

- **Local-first:** works offline with no account. Data lives in your browser (IndexedDB).
- **Optional sync:** Supabase auth + Postgres with row-level security.
- **No AI service:** personalization and the Advisor run on deterministic, tested templates.
- **Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · vite-plugin-pwa · Vitest.

## Develop
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run typecheck
npm run build      # typecheck + production build to dist/
```

## Enable cloud sync (optional)
1. Create a free Supabase project (check current free-tier limits; inactive free projects may pause).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`.
3. Copy `.env.example` → `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon key is public by design; RLS protects data). Never commit `.env*`.
4. Users can then sign up/in from **Settings → Account & sync**.

## Deploy (Cloudflare Workers static assets, free tier)
Live: https://future-self.luvish612.workers.dev
1. Cloudflare dashboard → Workers & Pages → Create → import this GitHub repo (auto-deploys on every push to main).
2. Build command `npm run build`; deploy command `npx wrangler deploy` (reads `wrangler.jsonc`: serves `dist/` with SPA fallback). Node 22 is pinned in `.node-version`.
3. For sync, add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as build variables and redeploy.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).
