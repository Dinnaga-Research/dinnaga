Pure logic: no React, no imports from `../components` or `../routes`. Deterministic given inputs,
each module with a co-located test.

- `routeMeta.ts` — `metaFor(pathname)`: title, description and noindex for every route (#70);
  `Layout` applies it on each location change.
- `legacyRedirects.ts` — `legacyTarget()`: #64's table from `/artifacts…` and `/weekly…` to the new
  URLs; used by `routes/Redirects/LegacyRedirect` and `routeMeta`.
- `dateFormat.ts` — the site's date formats, weekly ranges and "paused since".
- `living/contract.ts` — the `/api/living` response types and the `isLiving()` guard, shared by
  `api/` and `hooks/useLiving.ts`.
- `darkroom/` — the frame-sequence engine (spec §8): scene, painter, film, frame store, scrub,
  `sequence.ts` (`mountSequence`). `index.ts` is the runtime entry, loaded by dynamic `import()`
  and kept out of the entry chunk. Nothing here may name a red: the painter is monochrome and the
  stamp is a component. `testing.ts` is a fake 2D context for tests only.
- `docViewer/` — the shadow-DOM doc adapter. `adapter.ts` rewrites doc CSS (`vw → cqi`, and
  `pinRem` turns `<n>rem` into `calc(n * var(--dn-doc-rem))` so docs keep their size at every
  viewport, spec §9.3). `families.ts` maps each doc family onto `--doc-*` tokens; mono faces are
  detected by name pattern, not a brand list. `quartz.ts` handles Quartz pages and paints every
  callout type with neutral tokens.
