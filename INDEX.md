# INDEX

Root routing table — one line per artifact/dir, so a session can find things
without bulk-loading the repo. Every content dir below carries its own
`CLAUDE.md` contract (≤40 lines); this file is capped at ≤80 lines. Both are
enforced by `src/test/dirDocs.test.ts`.

## Visual system: Darkroom
Spec `docs/superpowers/specs/2026-11-12-darkroom.md`. Tokens, fonts, base and layout
primitives in `src/styles/`. One family (Archivo, variable); warm neutrals; safelight red
(`--dn-tested`) means "tested" and appears only on tested marks and the stamp (lint-enforced
in `src/test/lint.test.ts` and `tests/e2e/visual-lint.spec.ts`).

## Routes (`src/routes/`, table in `src/App.tsx`)
- `/` — `Home/` — the run (`ProcessSequence`, a scroll-scrubbed frame sequence; five stills under
  reduced motion), then the library, What we're building, Writing, How we test.
- `/atisha`, `/atisha/:slug` — `Atisha/` — the public library register and the doc reader
  (data: `src/data/docs.ts`, published entries only).
- `/building` — `Building/` — repositories, Substack posts and gists from `/api/living`.
- `/method` — `Method/` — How we test: lede, five stages from `src/data/method.ts` as a contact
  sheet of `FrameStill`s.
- `/colophon` — `Colophon/` — faces (checked against `fonts.css` by its test), build, source, name.
- `/backstage`, `/backstage/:slug`, `/backstage/weekly`, `/backstage/weekly/:date` — `Backstage/` —
  Behind the scenes: unpublished docs and the weekly reports. **Unlisted**: nothing links it; reached
  by URL only. A published slug redirects to `/atisha/:slug`.
- `/artifacts…`, `/weekly…` — `Redirects/LegacyRedirect` — client-side redirects to the new URLs.
- `/dev/doc`, `/dev/frames` — `Dev/` — DEV-only harnesses, absent from the production build.
- 404 — `NotFound/` — SPA fallback (via the `vercel.json` rewrite).

## Components (`src/components/`)
Chrome (`Layout`, `SiteNav`, `SiteFooter`, `PageHead`, `BrandMark`, `TestedMark`), the doc reader
(`DocFrame`, `DocViewer`: shadow DOM over `src/lib/docViewer/`), `LibraryRegister/`, `LivingRows/`,
and `darkroom/` (the run, stills, contact strip, rail, stamp over `src/lib/darkroom/`).

## Data and API
- `src/data/` — catalogue, copy, method, links (see its `CLAUDE.md`). Docs are static files under
  `public/artifact-docs/`, outside the route namespaces.
- `api/living.ts` — Vercel function aggregating GitHub and the Substack (see `api/CLAUDE.md`);
  read only through `src/hooks/useLiving.ts`.
- `src/data/weeklyRuns.json` — vendored snapshot from the Saturday week-in-review publish step
  (`~/.claude/week-in-review/`, sanitize-gated, paused 2026-09-26); reports under
  `public/artifact-docs/weekly/`.

## Scripts
- `bun run fonts` — rebuilds the Archivo and Chivo Mono subsets (`scripts/fonts/`, `-- --all` also
  Atkinson and Noto). `bun scripts/generate-og.ts` — share card and favicon set (needs Playwright's
  Chromium).

## Docs (`docs/`)
- `docs/STATUS.md` — current live/outstanding state (see `docs/CLAUDE.md`).
- `docs/superpowers/specs/`, `docs/superpowers/plans/` — dated design history.

## Tests
- Unit/integration: vitest, co-located `*.test.ts(x)` (`bun run test`); claims and dir-doc guards in
  `src/test/`.
- End-to-end: Playwright in `tests/e2e/` (`bun run test:e2e`) — see `tests/e2e/CLAUDE.md`.

## Deploy
Vercel (project `dinnaga`) — dinnaga.ai is live via Vercel. **Merging to `main` deploys
production** (Vercel Git integration); every PR gets a protected preview. `.github/workflows/ci.yml`
runs lint/test/build/e2e as a gate only (no deploy step). Production answers curl and headless
Chromium; preview URLs need a Vercel sign-in.
