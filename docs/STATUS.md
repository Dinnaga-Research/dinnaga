# Dinnaga.ai — Status & Outstanding

_Last updated 2026-10-25._

## Recent changes
- Anonymity dropped: site now names David Ryan as founder (2026-10-18, #27).
- Consent banner and nav live badge deleted (2026-10-18, #27).
- The megazord bench deleted (2026-10-18, #27).
- Visual system shipped: self-hosted type set A and Departure Mono, design tokens, terminal restyle, sentence case, lime reserved for "tested" (2026-10-25, #61).
- GitHub Pages fallback script removed (2026-10-18); deep links verified on production in a headless browser (2026-10-25, #38).

## Live now
- Multi-page two-pillar lab site is **live at https://dinnaga.ai**, hosted on **Vercel** (`weytanis-projects/dinnaga`) since 2026-07-08. HTTPS is live via Let's Encrypt through Vercel. GitHub Pages hosting is retired. **Merging to `main` deploys production**: the Vercel project is Git-connected (verified 2026-10-25: merging PR #61 produced a Production deployment within a minute). Every PR gets a Vercel preview behind Deployment Protection (sign in to view). `.github/workflows/ci.yml` runs lint/unit-test/build/e2e as the required `gates` check — it does not deploy.
- **Verifying a deploy:** the production site answers `curl` and headless Chromium (verified 2026-10-25; the 403 bot challenge seen in August no longer fires). Preview URLs return 302 to a Vercel sign-in. `vercel ls` / `vercel inspect` also work from a linked checkout.
- **CI pipeline:** `.github/workflows/ci.yml` (gate job) runs lint, unit tests, build, and Playwright e2e tests; Playwright browser downloads are cached and keyed on the lockfile. Browsers install with system dependencies on each run.
- **Artifacts shelf live 2026-08-09** (PR #4): `/artifacts` lists standalone research documents; `/artifacts/:slug` frames them; docs are static files under `public/artifact-docs/` — deliberately outside the `/artifacts` route namespace so extensionless static hosts can't shadow the viewer route (invariant enforced by `src/data/artifacts.test.ts`). First entry: the SLAMWICH Tasting Report. **Unlisted since 2026-08-14**: removed from the primary nav; typing `show me what you got` (or the you've-got variant — matcher `src/lib/unlock.ts`) into the home terminal plays a typed reveal (`src/data/unlockLines.ts`) and routes to `/artifacts`. Direct URLs still resolve — hidden means unlinked, not authenticated.
- **Weekly run log** (live since 2026-08-10, **paused since 2026-09-26**): `/weekly` archives the Saturday week-in-review runs with absolute date ranges; `/weekly/:date` frames each sanitized report (shared `DocFrame` chrome with the artifacts viewer). Data is `src/data/weeklyRuns.json` — a vendored snapshot appended by the Saturday publish step in `~/.claude/week-in-review/` (sanitize-gated, fail-closed deny-list; fallback/raw-prompt reports are never published; schema guard `src/data/weeklyRuns.schema.test.ts`).
- Spec: `docs/superpowers/specs/2026-06-08-dinnaga-living-research-log-design.md`
- Plan: `docs/superpowers/plans/2026-06-08-dinnaga-two-pillar-site.md`
- Routes: `/` · `/atisha` · `/method` · `/colophon` · `/artifacts` (unlisted) · `/artifacts/:slug` (unlisted) · `/weekly` · `/weekly/:date` · 404.

## Notes
- The **Atisha Initiative** is a GitHub **Project** (`https://github.com/orgs/Dinnaga-Research/projects/1`), not a repo — it must stay **Public** or the site's Atisha link 404s.
- `public/og.png` was regenerated on 2026-10-18 (resolves #27). The card now shows only the hexagon-D logo mark, the DINNAGA wordmark, and the domain. Regenerate with `npx tsx scripts/generate-og.ts` after installing Playwright's Chromium. The visual redesign belongs to the Pages milestone.
- The favicon and nav `BrandMark` are the original logo — unchanged.
- Phase-2 backlog (not built; spec §8): GRAVEDIGGER / DSPy harnesses / memory-architecture as future Atisha entries, field notes, a `/notes` expansion, route code-splitting.
- Anonymity was dropped on 2026-10-18 (#27); the site names David Ryan as the founder.
