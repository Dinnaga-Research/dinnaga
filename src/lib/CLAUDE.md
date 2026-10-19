Pure, side-effect-free logic — no React, no DOM, no imports from
`../components` or `../routes`.

- `unlock.ts` — `isUnlockPhrase()` normalizes terminal input (case, whitespace,
  trailing punctuation, curly apostrophe) and exact-matches `UNLOCK_PHRASES`;
  gates the hidden `/artifacts` reveal in `src/components/Terminal.tsx`.

All modules are deterministic given their inputs. The `unlock.test.ts` file
pins accepted variants and rejected near-misses.
