<!-- ABOUTME: Repo README for dinnaga.ai — what the site is, and how to develop/deploy it. -->
<!-- ABOUTME: Operational detail lives in docs/STATUS.md. -->

# DINNAGA // dinnaga.ai

The website of Dinnaga Research, run by David Ryan: **[dinnaga.ai](https://dinnaga.ai)**.

React 19 · Vite · TypeScript (strict) · react-router 7 · plain CSS tokens · Bun. Hosted on Vercel. **Merging to `main` deploys production** (Vercel Git integration); every PR gets a protected preview. `.github/workflows/ci.yml` runs lint → unit tests → build → e2e tests as a PR/push quality gate (Playwright browsers are cached keyed on the lockfile). SPA deep links ride the `vercel.json` `/(.*)` → `/index.html` rewrite. Production answers `curl` and headless Chromium, so an HTTPS probe verifies a deploy; preview URLs need a Vercel sign-in.

**Routes:** `/` · `/atisha` · `/method` · `/colophon` · `/artifacts` · `/artifacts/:slug` · `/weekly` · `/weekly/:date` — the artifact shelf is **unlisted**: no nav link; type `show me what you got` into the home terminal, or hit the URL directly.

## Develop

```bash
bun install
bun run dev        # http://localhost:4242
bun run test       # vitest unit + integration
bun run test:e2e   # playwright (chromium)
bun run lint       # eslint
bun run build      # tsc --noEmit + vite build
```

Operational status, HTTPS notes, and backlog: [docs/STATUS.md](docs/STATUS.md).

// VALIDATE · THEN SHARE
