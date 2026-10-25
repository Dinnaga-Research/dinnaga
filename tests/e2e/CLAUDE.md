Playwright end-to-end specs, run against a live Vite dev server
(`playwright.config.ts`: `baseURL http://localhost:4242`, chromium/firefox/webkit,
`bun run dev` auto-started). Run with `bun run test:e2e` — never part of
`bun run test` (that's vitest unit/integration only).

- `homepage.spec.ts` / `routing.spec.ts` — core page render + route coverage.
- `responsive.spec.ts` — mobile viewport (375×812) has no horizontal overflow.
- `a11y.spec.ts` — accessibility landmarks (e.g. skip-to-content link).
- `artifacts.spec.ts` — /artifacts shelf → viewer navigation, the doc viewer
  mounted in shadow DOM, the raw static doc under `public/artifact-docs/`, and the
  hidden-shelf unlock (terminal passphrase → reveal → routed; reduced-motion
  and full-motion) plus the nav-absence check.
- `weekly.spec.ts` — /weekly run log → viewer navigation, the report viewer
  mounted in shadow DOM, and the raw static report under `public/artifact-docs/weekly/`.
- `doc-viewer.spec.ts` — all 11 doc routes at multiple viewports, forced-dark colors,
  re-serialization canary, missing doc fallback.

Specs drive the real app through the browser, not component internals —
prefer role/label queries over CSS selectors. Playwright locators pierce open shadow roots.
