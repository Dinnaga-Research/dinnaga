Static site content: typed modules consumed directly by components. Their contract is the type in
`../types.ts` plus the tests beside them.

- `docs.ts` — the doc catalogue (`DocEntry`). Only entries with `publish: true` appear in Atisha;
  `publishedDocs()` sorts newest first, `unpublishedDocs()` feeds `/backstage`, `docBySlug()` looks
  one up. A published doc needs `kind` and `tested` (its tested line). `docs.test.ts` checks that
  each `docPath` resolves under `public/` and outside the route namespaces.
- `copy.ts` — the headline and lede, defined once. The lede shows only on `/` and `/method`.
- `method.ts` — the five method stages. They carry no numbers: `/method`, the homepage run and the
  `See the five stages →` count all derive the number from array order.
- `links.ts` — external URLs (source repo, Atisha board, Substack, GitHub profile, gists).
- `navLinks.ts` — the four nav links in order.

**`weeklyRuns.json`** is a vendored snapshot appended by the Saturday week-in-review publish step
in `~/.claude/week-in-review/` (sanitize-gated, fail-closed; paused since 2026-09-26); nothing calls
it live. `weeklyRuns.ts` loads it with an unchecked cast and sorts newest first;
`weeklyRuns.schema.test.ts` guards it: non-empty fields, ISO dates, unique and sorted dates,
`docPath` resolving under `public/` and outside the route namespaces.
