<!-- ABOUTME: Repo README for dinnaga.ai — what the site is, and how to develop/deploy it. -->
<!-- ABOUTME: Operational detail lives in docs/STATUS.md. -->

# Dinnaga Research · dinnaga.ai

The website of Dinnaga Research, run by David Ryan: **[dinnaga.ai](https://dinnaga.ai)**. Living documents for engineers who code with AI.

React 19 · Vite · TypeScript (strict) · react-router 7 · plain CSS tokens · Bun. Hosted on Vercel. **Merging to `main` deploys production** (Vercel Git integration); every PR gets a protected preview. `.github/workflows/ci.yml` runs lint → unit tests → build → e2e tests as a PR/push quality gate. SPA deep links ride the `vercel.json` rewrite of everything except `/api/` to `/index.html`. Production answers `curl` and headless Chromium, so an HTTPS probe verifies a deploy; preview URLs need a Vercel sign-in.

The visual system is **Darkroom** (`docs/superpowers/specs/2026-11-12-darkroom.md`): one family (Archivo), warm neutrals, and safelight red, which means "tested" and nothing else.

**Routes:** `/` · `/atisha` · `/atisha/:slug` · `/building` · `/method` · `/colophon` · 404. **Behind the scenes** (`/backstage`, `/backstage/weekly` and their doc pages) is unlisted: nothing on the site links it; it is reached by URL. Old `/artifacts` and `/weekly` URLs redirect client-side to their new homes.

**`/api/living`** is a Vercel function (`api/living.ts`) that reads GitHub and the Substack for `/building` and the homepage. It takes an optional `GITHUB_TOKEN` environment variable (a fine-grained, public-read token, set in Vercel for Production and Preview); without one it still works under GitHub's unauthenticated rate limit.

## Develop

```bash
bun install
bun run dev        # http://localhost:4242 (PORT overrides); /api/living runs locally
bun run test       # vitest unit + integration
bun run test:e2e   # playwright: chromium, plus firefox and webkit for the cross-browser list
bun run lint       # eslint
bun run build      # tsc --noEmit + vite build
bun run fonts      # rebuild the Archivo and Chivo Mono subsets (needs uv)
bun scripts/generate-og.ts   # rebuild og.png and the favicon set (needs Playwright's Chromium)
```

The e2e server answers `/api/*` from `tests/fixtures/`, so tests never reach GitHub or the Substack.

Operational status, HTTPS notes, and backlog: [docs/STATUS.md](docs/STATUS.md).
