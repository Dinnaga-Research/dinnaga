Playwright specs against the Vite dev server (`playwright.config.ts`). `bun run test:e2e`; never part
of `bun run test`. `PORT` (default 4242) and `PREVIEW_PORT` let parallel worktrees run their own servers.
Firefox and WebKit run only the specs in the config's `CROSS_BROWSER` list; CI runs chromium.

**No live APIs.** The server starts with `API_FIXTURES=tests/fixtures`, so `/api/<name>` answers
`tests/fixtures/<name>/full.json` (routing.spec checks it; a reused dev server without it fails there).
Specs that need another state `page.route('**/api/living')` to `failed.json`/`empty.json` or abort it.

- `chrome` — #70: nav order and targets, titles/description/robots per route, phone nav, footer's six
  links, the 404, skip link first, focus rings. `routing` — every route deep-links; 404s keep their URL.
- `responsive` — no horizontal overflow on every page route at 320–1920 (incl. the 760–1100 band).
- `visual-lint` — spec §10 rendered checks: ground, red only on `.tested-mark`/`.stamp`, caps, 12px
  floor, Archivo loaded, font budget, reduced motion starts no transition. `a11y` — landmarks.
- `home` — the run (frames, rail, stamp), the library, section order, Tab order and skip, reduced
  motion, budgets, LCP/CLS (chromium). `frames` — `/dev/frames` engine budgets (paint and build-size
  tests chromium only). `method` — /method contact sheet stills and /colophon (Noto loads `ṇ`).
- `atisha` — #63 library register and the reader. `building` — /building columns and the homepage
  living sections from fixtures. `backstage` — the unlisted pages, 404s, no link to `/backstage`,
  raw files under `public/artifact-docs/`. `redirects` — old `/artifacts` and `/weekly` URLs.
- `icons` — favicon set and `og.png` served as images, not the SPA fallback.
- `doc-viewer` — all 11 doc routes: mount, canary, anchors and Back, reduced motion, fallback.
  `doc-theme` — Darkroom doc theme: grounds, contrast, h1 at 112%, Chivo Mono, selection, pinned rem.
  `doc-viewer-quartz` — Quartz fixture via `/dev/doc`: article-only, neutral callouts, links.
  `quartz-harness-prod` — builds to a temp dir; `/dev/doc` and `/dev/frames` are 404s in production.

The viewer makes in-doc hrefs absolute, so select doc links with `href$=`. Prefer role/label
queries; Playwright locators pierce open shadow roots.
