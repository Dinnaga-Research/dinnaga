# Dinnaga.ai — Status & Outstanding

_Last updated 2026-10-18._

## Recent changes
- Anonymity dropped: site now names David Ryan as founder (2026-10-18, #27).
- Consent banner and nav live badge deleted (2026-10-18, #27).
- The megazord bench deleted (2026-10-18, #27).

## Live now
- Multi-page two-pillar lab site is **live at https://dinnaga.ai**, hosted on **Vercel** (`weytanis-projects/dinnaga`) since 2026-07-08. HTTPS is live via Let's Encrypt through Vercel. GitHub Pages hosting is retired. **Deploying is a manual step**: `vercel deploy --prod` from the repo root. There is no Vercel Git integration — merging a PR ships nothing (verified 2026-08-09: PR #4 merged, newest deployment was 29 days old until a manual deploy). `.github/workflows/ci.yml` runs lint/unit-test/build as a deterministic PR gate — it does not deploy.
- **Verifying a deploy:** public HTTPS probes do not work. Vercel bot protection returns 403 + `x-vercel-mitigated: challenge` to `curl` (any UA) and to CDP-automated Chrome ("Code 21"). Use `vercel ls` / `vercel inspect <deployment-url>` and confirm `dinnaga.ai` appears in the aliases; a real human browser passes the challenge.
- **Artifacts shelf live 2026-08-09** (PR #4): `/artifacts` lists standalone research documents; `/artifacts/:slug` frames them; docs are static files under `public/artifact-docs/` — deliberately outside the `/artifacts` route namespace so extensionless static hosts can't shadow the viewer route (invariant enforced by `src/data/artifacts.test.ts`). First entry: the SLAMWICH Tasting Report. **Unlisted since 2026-08-14**: removed from the primary nav; typing `show me what you got` (or the you've-got variant — matcher `src/lib/unlock.ts`) into the home terminal plays a typed reveal (`src/data/unlockLines.ts`) and routes to `/artifacts`. Direct URLs still resolve — hidden means unlinked, not authenticated.
- **Weekly run log live 2026-08-10**: `/weekly` logs the Saturday week-in-review runs; `/weekly/:date` frames each sanitized report (shared `DocFrame` chrome with the artifacts viewer). Data is `src/data/weeklyRuns.json` — a vendored snapshot appended by the Saturday publish step in `~/.claude/week-in-review/` (sanitize-gated, fail-closed deny-list; fallback/raw-prompt reports are never published; schema guard `src/data/weeklyRuns.schema.test.ts`).
- Spec: `docs/superpowers/specs/2026-06-08-dinnaga-living-research-log-design.md`
- Plan: `docs/superpowers/plans/2026-06-08-dinnaga-two-pillar-site.md`
- Routes: `/` · `/atisha` · `/method` · `/colophon` · `/artifacts` (unlisted) · `/artifacts/:slug` (unlisted) · `/weekly` · `/weekly/:date` · 404.

## Notes
- The **Atisha Initiative** is a GitHub **Project** (`https://github.com/orgs/Dinnaga-Research/projects/1`), not a repo — it must stay **Public** or the site's Atisha link 404s.
- `public/og.png` uses the real `logo-mark.svg` mark (the hexagon-gate D). The favicon and nav `BrandMark` are the original logo — unchanged.
- Phase-2 backlog (not built; spec §8): GRAVEDIGGER / DSPy harnesses / memory-architecture as future Atisha entries, field notes, a `/notes` expansion, route code-splitting.
- Anonymity was dropped on 2026-10-18 (#27); the site names David Ryan as the founder.
