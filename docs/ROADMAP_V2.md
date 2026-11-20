# Roadmap v2 — Goal Worlds

Differentiator: **one personalized Goal World per goal, connecting vision, affirmations, habits, audio, advisor and real-world action.**

## Requirement deltas (vs v1)
| Area | v1 (built) | v2 requirement |
|---|---|---|
| Structure | Global feature pages; partial `goal_id` | Every feature scoped to a goal; switch between goals; `/g/:goalId` world with a daily experience |
| Goals | Onboarding creates 1 goal; manual goals | Preset categories (love, self-love, confidence, finance, career, academic, health, peace, relationships, productivity) **or** custom; every preset item (description, affirmations, habits, viz prompts, milestones, reflection questions) editable/removable |
| Vision board | One board, uploads only, fixed grid | Multiple boards per goal; built-in licensed image library (search, filter, multi-select); uploads; text/quotes; resize + reorder; mobile editing |
| Affirmations | Category suggestions, custom, voice, reminder | Browsable library per category, favorites, playlists, built-in spoken (TTS), speed/volume |
| Habits | Library of 4 per category, custom, day schedule | Larger per-category library, weekly targets, reminders, history; no guilt copy |
| Advisor | Intent → framework | Situation-based: interpretation, emotion regulation, healthy response, boundaries, what to say (example script), what to avoid, one small action; follow-ups; save. Labeled **structured guidance**, not AI |
| Themes | One accent palette | Per-goal palette via tokens (love, confidence, finance, peace, career, neutral) + user override; light/dark; AA contrast |
| New | — | Daily goal experience, Evidence Journal, Future Self Simulator |

## Reuse (no rewrite)
- `lib/store.ts` + `useCollection`, `db` — add `goal_id` filters, no new data layer.
- `lib/engine/*` — categorize, plan, affirmations, visualization, advisor, streaks, routine: extend content, keep APIs.
- `lib/audio/*` — narrator, ambient, recorder reused for spoken affirmations and playlists.
- `components/ui.tsx`, `Layout`, theme tokens in `index.css` (add `[data-world]` overrides).
- Journal kinds, vision `compress()`, export/delete, RLS pattern.

## Key decisions
1. **Goal World = route `/g/:goalId`** with tabs (Today · Board · Affirm · Habits · Visualize · Advisor · Journal · Progress). Global pages remain as "All goals" views. Active goal kept in localStorage.
2. **Data:** add `goal_id` to `journal_entries`, `routine_blocks`, `audio_sessions`; add `theme` to `goals`; new tables `vision_boards` (goal_id, title) and later `playlists`. Vision items gain `board_id, x, y, w, h, z`. Existing rows with no goal show under a "General" world (lazy migration, no data loss).
3. **Content packs:** static typed files `src/content/worlds/<category>.ts` (description, affirmations, habits, viz prompts, milestones, reflection questions, image tags, palette). Copied into user rows on selection so users can edit/delete freely.
4. **Themes:** `data-world="love"` on the world wrapper overrides `--accent`, `--accent-soft`, `--warm`, glows. Palettes are suggestions; user can pick any. Contrast checked in a unit test.
5. **Image library:** self-hosted, curated **CC0 / public-domain** images (WebP, ~800px, ≤80 KB each, lazy-loaded, not precached) with `public/library/LICENSES.json` (source URL, author, license per file). Fallback: generated gradient/typographic "mood cards" (zero licensing risk). No scraping, no image APIs.
6. **Advisor stays template-based** (free, offline, private) but restructured around situations and goal context; UI label "Structured guidance". Optional LLM via server-side function only after verifying free-tier limits + privacy — not scheduled.
7. **Vision editor:** v2.3 ships reorder + S/M/L sizes (works well on mobile); freeform drag/resize canvas is P2. Native pointer events, no new dependency.

## Phases
| Phase | Priority | Scope |
|---|---|---|
| v2.1 | P0 | Goal World foundation: categories + content-pack type, data model changes + migration, world theme tokens, `/g/:goalId` shell + goal switcher, preset/custom goal creation |
| v2.2 | P0 | Daily goal experience (affirmation, viz, habits, one challenge, reflection, progress; all skippable). Preset + custom affirmations & habits per world; weekly targets |
| v2.3 | P0 | Vision boards: multiple per goal, built-in library (search/filter/multi-select) + uploads, text/quotes, reorder + sizes |
| v2.4 | P1 | Situation-based Advisor (+ example scripts, follow-ups, save); Evidence Journal (what happened / action / learned / felt / next); spoken affirmations per world; per-goal routine + visualization |
| v2.5 | P2 | Future Self Simulator (imagine → obstacles → response → what to say → one real action); freeform board editor + slideshow; audio playlists; advanced theme customization |

## Additional ideas — evaluation
| Idea | Value | Cost | Plan |
|---|---|---|---|
| Future-self letters | High | Done (sealed letters) | Scope to goal in v2.1 |
| Mood check-ins | Med | Low | Fold into daily reflection (v2.2) |
| Weekly goal review | High | Low (template exists) | Per goal, v2.4 |
| Morning/evening routines | Med | Med | Reuse routine + habits, v2.4 |
| Short guided reflections | Med | Low | Content in packs, v2.2 |
| Board slideshow | Med | Low | v2.5 |
| Audio playlists | Med | Med | v2.5 |
| Offline access | High | Done (PWA) | Keep library images runtime-cached only |
| Notifications | Med | High for true push (needs server) | Keep in-app; push later |
| Milestone celebrations | Med | Low | Private, subtle, v2.2 |
| Export journals/boards | High | Low (JSON exists) | Add printable/HTML export later |
| Multilingual affirmations | Med | High (translation quality) | Later; i18n-ready strings in packs |
| Widgets | Low (PWA can't) | — | Not feasible for web; skip |

## Risks / dependencies
- **Image licensing & weight:** needs a curated CC0 set + license manifest; owner should approve the image list. Keeps repo/app size in check by lazy loading.
- **Content quality:** preset libraries are most of the work; must follow ethics rules (no manifestation claims, no promises about specific people, no imitation-of-wealth spending, autonomy-first). Review checklist in AGENTS.md.
- **Schema change:** `goal_id`/`theme`/board columns require a new migration (`0002_goal_worlds.sql`) and local lazy migration; must not lose v1 data.
- **Contrast:** per-world palettes in both modes need AA checks.
- **Advisor expectations:** templates must be labeled honestly; crisis routing preserved.
- **Mobile audio/TTS limits and reminders without push** remain (documented).
