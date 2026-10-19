# Dinnaga.ai — Status & Outstanding

_Last updated 2026-10-18._

## Recent changes
- Consent banner and nav live badge deleted (2026-10-18, #27).

## Live now
- Multi-page two-pillar lab site is **live at https://dinnaga.ai**, hosted on **Vercel** (`weytanis-projects/dinnaga`) since 2026-07-08. HTTPS is live via Let's Encrypt through Vercel. GitHub Pages hosting is retired. **Deploying is a manual step**: `vercel deploy --prod` from the repo root. There is no Vercel Git integration — merging a PR ships nothing (verified 2026-08-09: PR #4 merged, newest deployment was 29 days old until a manual deploy). `.github/workflows/ci.yml` runs lint/unit-test/build as a deterministic PR gate — it does not deploy.
- **Verifying a deploy:** public HTTPS probes do not work. Vercel bot protection returns 403 + `x-vercel-mitigated: challenge` to `curl` (any UA) and to CDP-automated Chrome ("Code 21"). Use `vercel ls` / `vercel inspect <deployment-url>` and confirm `dinnaga.ai` appears in the aliases; a real human browser passes the challenge.
- **Artifacts shelf live 2026-08-09** (PR #4): `/artifacts` lists standalone research documents; `/artifacts/:slug` frames them; docs are static files under `public/artifact-docs/` — deliberately outside the `/artifacts` route namespace so extensionless static hosts can't shadow the viewer route (invariant enforced by `src/data/artifacts.test.ts`). First entry: the SLAMWICH Tasting Report. **Unlisted since 2026-08-14**: removed from the primary nav; typing `show me what you got` (or the you've-got variant — matcher `src/lib/unlock.ts`) into the home terminal plays a typed reveal (`src/data/unlockLines.ts`) and routes to `/artifacts`. Direct URLs still resolve — hidden means unlinked, not authenticated.
- **Weekly run log live 2026-08-10**: `/weekly` logs the Saturday week-in-review runs; `/weekly/:date` frames each sanitized report (shared `DocFrame` chrome with the artifacts viewer). Data is `src/data/weeklyRuns.json` — a vendored snapshot appended by the Saturday publish step in `~/.claude/week-in-review/` (sanitize-gated, fail-closed deny-list; fallback/raw-prompt reports are never published; schema guard `src/data/weeklyRuns.schema.test.ts`).
- Spec: `docs/superpowers/specs/2026-06-08-dinnaga-living-research-log-design.md`
- Plan: `docs/superpowers/plans/2026-06-08-dinnaga-two-pillar-site.md`
- Routes: `/` · `/atisha` · `/method` · `/colophon` · `/loadout` · `/artifacts` (unlisted) · `/artifacts/:slug` (unlisted) · `/weekly` · `/weekly/:date` · 404.

## Cyberware Loadout (`/loadout`)
The ripperdoc bench is **merged to `main` and LIVE at [dinnaga.ai/loadout](https://dinnaga.ai/loadout)** (screenshots in `docs/screenshots/`, embedded in the repo README). It lets you equip megazord zords as cyberware implants, see a live friction/conflict/drift readout, and share a build via URL — a proposal surface only; nothing is wired live.
- Plan: `docs/superpowers/plans/2026-07-01-cyberware-loadout.md`
- **Data flow — manual snapshot, not live:** `~/code/megazord` stays the source of truth for zord manifests; the page renders a vendored snapshot at `src/data/zords.json` (snapshot regenerated 2026-07-10, registry now **23 zords** across 9 slots). Refreshing it is a documented **manual** step, not part of any automated build:
  ```bash
  cd ~/code/megazord && bin/megazord export-json --out ~/code/dinnaga/src/data/zords.json
  ```
  Nothing in dinnaga calls megazord at runtime.
- **Easter eggs:** a ripperdoc boot sequence (typed terminal lines, skippable), an `UNPOWERED` dormant readout when no cyberware is installed, and an over-capacity/max-drift "cyberpsychosis" panel (`I'm sorry, Dave. I'm afraid I can't wire that.`) when a build exceeds the context budget or drift ceiling. The boot's typing animation and the cyberpsychosis glitch effect both honor `prefers-reduced-motion` (the animation is skipped/disabled; the underlying content still renders).
- **Test counts:** not tracked here (they rot within a feature). Run `bun run test` (vitest unit/integration) and `bun run test:e2e` (playwright) for the current numbers; `.github/workflows/ci.yml` gates lint → test → build on every PR. megazord's own suite: `uv run pytest` in `~/code/megazord`.

## Notes
- The **Atisha Initiative** is a GitHub **Project** (`https://github.com/orgs/Dinnaga-Research/projects/1`), not a repo — it must stay **Public** or the site's Atisha link 404s.
- `public/og.png` uses the real `logo-mark.svg` mark (the hexagon-gate D). The favicon and nav `BrandMark` are the original logo — unchanged.
- Phase-2 backlog (not built; spec §8): GRAVEDIGGER / DSPy harnesses / memory-architecture as future Atisha entries, field notes, a `/notes` + `/instruments` expansion, route code-splitting.
- "Phylon" was scrubbed everywhere; the lab is presented anonymously as **Dinnaga**.
