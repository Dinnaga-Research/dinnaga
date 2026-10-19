Static site content: TypeScript modules exporting typed arrays/objects consumed
directly by components. Most files (`bootLines.ts`, `unlockLines.ts`,
`links.ts`, `method.ts`, `navLinks.ts`, `practices.ts`, `surfaceData.ts`,
`tickerItems.ts`, `atishaCatalog.ts`, `artifacts.ts`) are plain literal data —
their only contract is the matching type in `../types.ts`. (`artifacts.test.ts`
additionally checks each entry's `docPath` resolves to a real file under
`public/`.)

**`weeklyRuns.json`** is a vendored snapshot appended by the Saturday
week-in-review publish step in `~/.claude/week-in-review/` (sanitize-gated,
fail-closed); nothing here calls it live. `weeklyRuns.ts` loads it with an
unchecked cast and sorts newest-first; `weeklyRuns.schema.test.ts` is the
guard: non-empty fields, ISO dates, unique dates, sortedness, docPath
resolving to a real file under `public/` and outside the `/weekly/` +
`/artifacts/` route namespaces.
