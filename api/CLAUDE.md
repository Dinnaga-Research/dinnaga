Vercel functions. Vercel turns every file under `api/` whose name doesn't start with `_` into a
function, so `living.ts` is the only one; helpers, tests and fixtures live in `_lib/` and
`__fixtures__/`.

- `living.ts` — `GET /api/living` (#65): recent repos and releases (GitHub user `weytani`, org
  `Dinnaga-Research`), public gists, and the Substack feed (`https://weytani.substack.com/feed`).
  Always 200 with the contract in `src/lib/living/contract.ts`; a failing source is `{ ok: false }`.
  `Cache-Control` is `s-maxage=3600` when all sources are ok, `300` otherwise.
- `GITHUB_TOKEN` (optional env var, read only from `process.env` in `_lib/github.ts`, redacted from
  logs): without it GitHub allows 60 requests an hour per IP and `repos` fails more often.
- Imports end in `.js` (Node ESM at runtime on Vercel). Tests use `// @vitest-environment node`
  and `__fixtures__/fetchStub.ts`, which fails any unrouted URL, so no test reaches the network.
  Fixtures were recorded on 2026-11-13 and the tests pin the clock to that date.
- Locally, `scripts/vite-api-dev.ts` serves `/api/<name>` from these handlers in `bun run dev`;
  the e2e server sets `API_FIXTURES` and answers from `tests/fixtures` instead.
