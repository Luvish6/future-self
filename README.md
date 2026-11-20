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

## Deploy (Cloudflare Pages, free tier)
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → select this repo.
2. Build command `npm run build`, output directory `dist`, add env vars from step 3 above if using sync.
3. Deploy. `public/_redirects` handles SPA routes; the PWA is installable from the browser menu.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).
