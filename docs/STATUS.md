# Dinnaga.ai — Status & Outstanding

_Last updated 2026-11-13._

## Recent changes
- **Darkroom shipped on the branch `refresh/darkroom`** (2026-11-13, #63–#72; production when the PR merges). The site moves to the Darkroom visual system (spec `docs/superpowers/specs/2026-11-12-darkroom.md`): Archivo as the one site family, warm neutrals, safelight red only on tested marks and the stamp. The homepage leads with a scroll-scrubbed frame sequence of the method (five stills under reduced motion), then the library. New pages: `/building`, Behind the scenes under `/backstage`. Docs read in the rethemed shadow-DOM reader.
- **Removed with Darkroom:** the home terminal and its unlock phrase, the Cromulon, the boot ticker, lime, Departure Mono and JetBrains Mono. `/backstage` is reached by URL only.
- Anonymity dropped: site names David Ryan as founder (2026-10-18, #27).
- GitHub Pages fallback script removed (2026-10-18); deep links verified on production in a headless browser (2026-10-25, #38).

## Live now
- dinnaga.ai is **live on Vercel** (`weytanis-projects/dinnaga`) since 2026-07-08, HTTPS via Let's Encrypt through Vercel. **Merging to `main` deploys production**: the project is Git-connected (verified 2026-10-25: merging PR #61 produced a Production deployment within a minute). Every PR gets a Vercel preview behind Deployment Protection (sign in to view). `.github/workflows/ci.yml` runs lint/unit-test/build/e2e (chromium) as the required `gates` check; it does not deploy.
- **Verifying a deploy:** production answers `curl` and headless Chromium (verified 2026-10-25). Preview URLs return 302 to a Vercel sign-in. `vercel ls` / `vercel inspect` work from a linked checkout.
- Until the Darkroom PR merges, production still serves the 2026-10-25 visual system (#61) described in git history.

## Darkroom (on `refresh/darkroom`)
- **Routes:** `/` · `/atisha` · `/atisha/:slug` · `/building` · `/method` · `/colophon` · `/backstage` · `/backstage/:slug` · `/backstage/weekly` · `/backstage/weekly/:date` · 404. `/artifacts…` and `/weekly…` redirect client-side (`src/lib/legacyRedirects.ts`, query and hash kept); `vercel.json` has one rewrite, everything except `/api/` to `/index.html`.
- **Atisha** (`/atisha`) lists the docs in `src/data/docs.ts` with `publish: true`, each with its tested line. Docs are static files under `public/artifact-docs/`, outside the route namespaces.
- **Behind the scenes** (`/backstage`) holds unpublished docs and the weekly archive. It is unlisted (no link anywhere on the site), not authenticated. The published Copilot sheets still contain their own `Shelf: all artifacts` link to `/artifacts`, which redirects to `/backstage`; doc HTML is left unedited (#64).
- **Weekly reports** (`/backstage/weekly`, paused since 2026-09-26): data is `src/data/weeklyRuns.json`, a vendored snapshot appended by the Saturday publish step in `~/.claude/week-in-review/` (sanitize-gated, fail-closed; guard `src/data/weeklyRuns.schema.test.ts`).
- **`api/living`** (#65): a Vercel function reading GitHub (user `weytani`, org `Dinnaga-Research`: repos pushed in the last 183 days, latest releases, public gists) and `https://weytani.substack.com/feed`. Always 200 with per-source `ok`; `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, or `s-maxage=300` when a source failed. Env var **`GITHUB_TOKEN`** is optional (fine-grained, public read; set in Vercel for Production and Preview); without it GitHub's 60 requests an hour per IP apply. Not yet verified under Vercel's runtime: check on the PR preview.
- **Share card and favicon set** regenerated on 2026-11-13 by `bun scripts/generate-og.ts` (needs Playwright's Chromium): `og.png`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `favicon.ico`. Resolves #72.
- **Fonts:** `bun run fonts` (2026-11-12) builds `archivo-var.woff2` (Latin + arrows, preloaded, 90,100 B) and `archivo-var-exta.woff2` (Latin Extended-A under the same family, loaded only when a page uses it, e.g. the Colophon), plus Chivo Mono 400/500 for doc code. `bun run fonts -- --all` also rebuilds Atkinson and Noto. Archivo is split in two because one file with Extended-A measured about 115 KB, over the 95 KB budget. Sources in `public/fonts/SOURCES.txt`.
- **Budgets** (production build, measured 2026-11-13): see the Darkroom PR body; entry JS ≤ 130 KB gzip, the run's lazy runtime ≤ 15 KB gzip, cold `/` ≤ 350 KB, font bytes on `/` ≤ 100 KB.

## Notes
- The **Atisha board** is a GitHub **Project** (`https://github.com/orgs/Dinnaga-Research/projects/1`), not a repo. It must stay **Public** or the site's board link 404s.
- The hexagon-D mark (nav, footer, favicon) is kept as is, restyled only through Darkroom tokens (operator, 2026-11-12). Its 1.5-unit stroke is faint at 16 px; a heavier tab-size stroke would be a later ticket.
- Open: a real iPhone check of the homepage run (memory and stutter; spec §12). If it stutters, drop to 120 frames below 760 px.
- Phase-2 backlog (not built): GRAVEDIGGER / DSPy harnesses / memory-architecture as future Atisha entries, field notes, Quartz-built living documents (spec §9.4 holds the theme values).
