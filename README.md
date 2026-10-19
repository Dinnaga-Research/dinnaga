<!-- ABOUTME: Repo README for dinnaga.ai — what the site is, and how to develop/deploy it. -->
<!-- ABOUTME: Operational detail lives in docs/STATUS.md. -->

# DINNAGA // dinnaga.ai

An anonymous AI research lab site. We validate what is genuinely useful, then share it openly — the site is the transmission surface: **[dinnaga.ai](https://dinnaga.ai)**.

React 19 · Vite · TypeScript (strict) · react-router 7 · plain CSS tokens · Bun. Hosted on Vercel. **Deploys are manual** — `vercel deploy --prod` from the repo root; there is **no Vercel Git integration**, pushing `main` does NOT deploy. `.github/workflows/ci.yml` runs lint → unit tests → build as a PR/push quality gate only. SPA deep links ride the `vercel.json` `/(.*)` → `/index.html` rewrite (the `public/404.html` trick is a leftover from the retired GitHub Pages host). Vercel bot protection challenges non-browser clients: `curl` and CDP-driven Chrome get 403 + a security checkpoint — verify deploys with `vercel inspect`, not an HTTPS probe.

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
