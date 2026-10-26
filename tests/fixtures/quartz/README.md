# Quartz fixture

Synthetic test fixture for the doc viewer (#50, #51). It is a tiny Obsidian vault built twice with
Quartz v5. It lives under `tests/fixtures`, so it never ships (nothing here is under `public/`),
and `tests/fixtures` is excluded from eslint and from vitest discovery.

- `vault/` is the source: 12 short notes written for this fixture and released under CC0.
  They hold a cross-folder wikilink, a heading link, a block reference, a collapsed callout with a
  nested callout, KaTeX maths, a PNG in `attachments/` embedded from another folder, tags, one
  mermaid block, a table and a long unbroken token. No real notes were copied from anywhere.
- `build-a/` is Quartz as shipped by the obsidian template, with the `@quartz-themes/core` port on
  (theme `default`, which adds 600+ `html[saved-theme=...]` selectors).
- `build-b/` is the same vault with the port off and `fontOrigin: local` (the shape decision 10 implies).
- `vendor/katex/` holds the KaTeX 0.16.11 CSS and woff2 fonts that both builds reference on
  `cdn.jsdelivr.net`. Playwright fulfils those requests from here (`tests/e2e/helpers/quartz.ts`).

## Versions

| Piece | Version |
|---|---|
| Quartz | v5.0.0, commit `97a2d05f80c4c50534959b1d0d41cc4b3895625e` (jackyzha0/quartz, shallow clone) |
| Node | v26.10.0 (npm 11.19.1); Quartz requires 22 or later |
| Theme port | `@quartz-themes/core` 2.0.0 (the plugin the template enables), with `@quartz-themes/default` 1.0.1 |
| KaTeX (vendored CSS and fonts) | 0.16.11 |

## Licences

Quartz and `@quartz-themes/core`: MIT. KaTeX: MIT. `@quartz-themes/default` carries no SPDX id; its
LICENSE says the CSS is derived from Obsidian's "Default" theme and is licensed as stated by the
original theme authors, so it is used here only as test input for the selector rewriter. The vault
notes: CC0.

## Rebuild

```sh
Q=$(mktemp -d)/quartz && git clone -q --depth 1 https://github.com/jackyzha0/quartz.git $Q && cd $Q
git checkout 97a2d05f80c4c50534959b1d0d41cc4b3895625e   # only if you need the exact commit
npm ci --no-audit --no-fund --loglevel=error
npx quartz create -t obsidian -s <repo>/tests/fixtures/quartz/vault -X copy -b localhost
# creates quartz.config.yaml and copies the vault into content/; the theme plugins install on first build
npx quartz build -o <out-a>                      # build (a): config exactly as `create` wrote it
```

Build (b) edits `quartz.config.yaml` in two places, then builds again:

1. `configuration.theme.fontOrigin: googleFonts` becomes `fontOrigin: local`.
2. The `@quartz-themes/core` entry under `plugins:` changes from `enabled: true` to `enabled: false`.

```sh
npx quartz build -o <out-b>
```

Then prune each output into `build-a/` and `build-b/`: delete `*-og-image.webp`, `CNAME`,
`favicon.ico`, `index.xml`, `sitemap.xml`, `404.html`, all `*.js` (the viewer strips scripts, so none
is ever run), `static/scripts/`, `static/giscus/`, `static/icon.png` and the two content-index JSON
files. The CSS and `attachments/chart.png` stay. Quartz embeds the build date, so a rebuild differs
from the committed HTML in `<time>` values only.

Notes on the build: the first `npx quartz build` after `npm ci` once died with an esbuild deadlock
while it installed the plugins; running it again worked. Build (b) still carries the Google Fonts
`<link>` in its head. The test helper answers that stylesheet with an empty one.
