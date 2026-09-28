# Obsidian note-to-web-page output: what the doc viewer would have to host

As of 2026-09-28.

## Answer

- **Obsidian has no first-party HTML export.** Its only web path is **Obsidian Publish**, a hosted service. Publish serves a 2.8 kB HTML shell, and `app.js` renders each note in the browser from raw Markdown. There is no HTML for the shadow-DOM viewer to fetch. The only ways to show Publish are to iframe the hosted site or to re-render Obsidian Markdown yourself. It costs $8–10 per site per month.
- **Quartz v5** (MIT; builds static files from Markdown in CI with no Obsidian app) can be hosted **after mechanical adaptation, with no hand edits**. It renders the content on the server into `<article>`. The viewer adapts `:root`, `html` and `body`, drops the scripts, resolves URLs relative to the page and moves `@font-face` rules out to the document.
- **Webpage HTML Export** (MIT plugin) can also be hosted with the same adaptation. It also needs `<base href="..">` resolution and theme classes on `body`, and it ships about 200 kB of Obsidian app CSS. It runs only inside the desktop app. Unattended builds need a container hack, and in our export its "Online" preset lost the MathJax fonts.
- **Digital Garden** (Eleventy HTML) could be hosted the same way; we did not generate a sample. **obsidian-export plus an SSG** gives you Markdown, not HTML. It escapes callouts and leaves `%%comments%%` in the output.
- **Recommendation for Atisha: Quartz v5.** Use the `explicit-publish` plugin (`publish: true`). Set the theme in `quartz.config.yaml` colours and fonts plus `custom.scss`. The viewer mounts only `<article>` and does not run the doc's scripts.

## Comparison

| | Obsidian Publish | Webpage HTML Export 1.9.2 | Quartz v5.0.0 | Digital Garden 2.94.1 + template 1.91.0 | obsidian-export 25.3.0 + SSG |
|---|---|---|---|---|---|
| Who | Obsidian (first-party) | community plugin | independent SSG | community plugin + Eleventy template | independent CLI |
| Output | hosted site only; shell HTML + client render | static files you own (multi-file site, one-file vault, or one self-contained file per note) | static files you own | static files you own (built on Vercel/Netlify/Forestry) | Markdown files you own |
| Full document or fragment | shell `<!doctype html>` with an empty body | full documents | full documents | full documents | n/a (Markdown) |
| Content present without JS | no | yes | yes | yes | n/a |
| Runs without the Obsidian app | yes (`ob publish`, headless beta) | no (desktop plugin; a Docker/xvfb workaround exists) | yes (Node ≥ 22) | plugin needs the app; the site build does not | yes |
| Wikilink output | client-side | `href="tools/ripgrep.html"` relative to `<base href="..">`, plus `data-href="Ripgrep"` | `href="./tools/ripgrep"` (no extension), plus `data-slug` | `/notes/<slug>/` | `[Ripgrep](tools/Ripgrep.md)` |
| Mermaid | client-side | pre-rendered inline SVG | `<code class="mermaid">`, rendered by JS | `<pre class="mermaid">`, rendered by JS | fence passed through |
| Math | client-side | MathJax CHTML (fonts needed) | KaTeX HTML + CDN CSS/fonts | MathJax | passed through |
| Callouts | yes | yes (Obsidian markup) | yes (Obsidian-like classes) | yes | **escaped** (`\[!note\]`) |
| Obsidian theme / snippets carry | community theme renamed `publish.css`; Style Settings not supported | yes: current theme, enabled snippets, body classes | via `@quartz-themes/core` port (on in `obsidian` template) | yes: community theme fetched at build | no |
| Viewer can host unmodified | **no** | yes, with adaptation | yes, with adaptation | likely, with adaptation | n/a (site renders the Markdown itself) |
| Licence / cost | proprietary; $8/site/mo annual, $10 monthly | MIT, free | MIT, free | MIT, free; optional Forestry.md $0 / $8–10 per month | BSD-2-Clause-Patent-style, free |

## Findings per path

### No first-party HTML export

- Obsidian's help documentation lists no HTML export. The only export strings in the desktop app are `export-pdf` / "Export to PDF". We checked the Obsidian 1.13.7 app bundle on this machine and found no HTML export command. The help vault source was read at `obsidianmd/obsidian-help@bc5b4f2` ([repo](https://github.com/obsidianmd/obsidian-help)).
- The closest first-party tools are both automation, not export:
  - **Obsidian CLI** ([docs](https://obsidian.md/help/cli)) drives the running app. Its developer command `dev:dom … inner` returns the rendered DOM's `innerHTML`.
  - **Obsidian Headless** ([docs](https://obsidian.md/help/headless), open beta, Node 22+) is a CLI for Sync and Publish.

### Obsidian Publish

- **What it is:** a hosted service at `publish.obsidian.md/<slug>` ([intro](https://obsidian.md/help/publish)). It costs "$8 USD per site, per month, billed annually" or "$10 … billed monthly", with 4 GB of hosting ([obsidian.md/publish](https://obsidian.md/publish), [pricing](https://obsidian.md/pricing)).
  - The help site `help.obsidian.md` is itself a Publish site ([intro](https://obsidian.md/help/publish)). It now redirects with a 301 to `obsidian.md/help` (observed).
- **What it emits (observed by probe):**
  - Each page URL returns a small shell: `<script defer src="/app.js">`, the site's `publish.css` / `publish.js` links, and `window.siteInfo = {uid, host, customurl}`.
  - Inline `fetch(…, {credentials: "include"})` calls preload three URLs:
    - `https://publish-01.obsidian.md/access/<uid>/<path>.md` returns raw Markdown (`content-type: text/markdown`);
    - `/cache/<uid>` returns JSON with each file's links, embeds and headings;
    - `/options/<uid>` returns the site options.
  - `app.js` (785 kB) renders everything in the browser. The body is a spinner until then.
- **Cross-origin:**
  - The raw-Markdown and cache endpoints are undocumented, and nothing promises they stay stable, so the viewer shouldn't depend on them.
  - `publish.obsidian.md` pages send a CSP without `frame-ancestors` and no `X-Frame-Options`, so they can be iframed. The `obsidian.md/help` deployment adds `x-frame-options: SAMEORIGIN` (observed headers).
- **Custom domain:** supported through Cloudflare (Full SSL) or your own reverse proxy to `https://publish.obsidian.md/serve?url=mysite.com/my-notes/…`. That page includes Nginx, Apache, Netlify, Vercel, Caddy and Traefik examples ([custom domains](https://obsidian.md/help/publish/domains)). `publish.js` only works with a custom domain ([customize](https://obsidian.md/help/publish/customize)).
- **Theme:** `publish.css` at the vault root. You can copy a community theme's CSS and rename it to `publish.css`. Style Settings does not work on Publish ([customize](https://obsidian.md/help/publish/customize)). Publish has its own CSS variables ([Publish CSS variables](https://docs.obsidian.md/Reference/CSS+variables/Publish/Publish), [Build a Publish theme](https://docs.obsidian.md/Themes/Obsidian+Publish+themes/Build+a+Publish+theme)). Its `app.css` scopes page variables under `.published-container` and switches themes with body classes `theme-light` / `theme-dark` (observed).
- **Features:** graph (colours via CSS only), search (file names, aliases and headers first), and minimal community-plugin support: Dataview-style code-block plugins do not render. Upload limit is 50 MB per file ([limitations](https://obsidian.md/help/publish/limitations)). Site-wide password only ([security](https://obsidian.md/help/publish/security)).
- **Automation:** `ob publish` publishes files with `publish: true` frontmatter, or `--all`. `ob publish-site-options` toggles graph, outline, search, backlinks, hover preview and theme toggle ([Headless Publish](https://obsidian.md/help/publish/headless)).
- **Export:** none. The only "export" is the vault you already have.
- **For the viewer:** nothing to inject. The options are:
  - iframe `publish.obsidian.md/<slug>/<page>`, which keeps Publish's own chrome and theme and brings back the iframe the site is removing;
  - fetch the Markdown from the undocumented API and render Obsidian Markdown in the site, which reimplements Publish.

### Webpage HTML Export (KosmosisDire/obsidian-webpage-export)

- **Status:**
  - The latest release is 1.9.2 (2025-07-28) ([releases](https://github.com/KosmosisDire/obsidian-webpage-export/releases)). `master` was last pushed 2026-03-19. MIT licence ([LICENSE](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/LICENSE)).
  - `isDesktopOnly: true` ([manifest.json](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/manifest.json)).
  - The README warns of "frequent large changes between updates" ([README](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/README.md)). Docs and demo: [docs.obsidianweb.net](https://docs.obsidianweb.net/). That demo was built by an older (1.8-style) version: it uses `<include src>` and hides `.document-container` until JS runs (observed).
- **Presets** ([settings.ts](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/src/plugin/settings/settings.ts)):
  - **Online** is the default: a multi-file site with a `site-lib/` folder.
  - **Local** combines the whole vault into one HTML file.
  - **Raw documents** is described as "plain html documents with simple style and scripts but no additional features" ([en.ts](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/src/plugin/translations/en.ts)). It inlines CSS, JS, fonts and media into each page and keeps original file names.
- **What it emits** (observed in our 1.9.2 export; source is [webpage-template.ts](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/src/plugin/website/webpage-template.ts)):
  - **Page structure:** full documents with `<base href="..">`. The body is `#main > #navbar + #main-horizontal > #left-content/#center-content/#right-content`. Content sits in `.obsidian-document.markdown-preview-view.markdown-rendered`.
  - **Body classes and theme:** the body gets Obsidian's classes (`publish css-settings-manager …`). An inline script adds `theme-light`/`theme-dark` and viewport classes, and those classes carry the Obsidian colour variables.
  - **Paths:** online output is slugified (`tools/ripgrep.html`). Assets go under `site-lib/{styles,scripts,fonts,media,html}` ([shared.ts](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/src/shared/shared.ts)). Attachments keep their vault paths (`attachments/swatch.png`). Each attachment also gets a wrapper page (`attachments/swatch.html`).
  - **Links:** internal links look like `href="methods/spaced-review.html#When to use"`, but the heading id is `When_to_use_0`, and the block ref `#^core-claim` has no target. Anchor jumps therefore rely on the page's JS.
  - **Rendering:**
    - mermaid is pre-rendered to inline SVG;
    - math is MathJax CHTML;
    - embeds (`![[note#heading]]`) are rendered inline;
    - callouts use Obsidian markup, and collapsed ones carry an inline `display:none`.
  - **Parts that depend on JS:** the file tree is loaded by `fetch` from `<link itemprop="include" href="site-lib/html/file-tree-content.html">`. Search, graph (WASM) and the theme toggle are also JS.
- **Theme carry-through:**
  - The plugin copies the running app's `app.css`, filtered, into `obsidian.css` ([obsidian-styles.ts](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/src/plugin/asset-loaders/obsidian-styles.ts)). It also copies the active community theme's `theme.css` ([theme-styles.ts](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/src/plugin/asset-loaders/theme-styles.ts)) and the enabled CSS snippets ([snippet-styles.ts](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/src/plugin/asset-loaders/snippet-styles.ts)). The snippet loader rewrites a leading `publish ` to `html body[class].publish `.
  - Observed: our synthetic snippet landed in `site-lib/styles/snippets.css`.
  - But `snippets.css` is linked *before* `obsidian.css`, so a snippet rule with equal specificity loses to it. We confirmed this in a browser: `.callout{border-left:…}` from the snippet was overridden.
- **Size and selector surface (observed, online preset):**
  - `obsidian.css` is 198 kB with 16 `@font-face` rules. `main-styles.css` is 20 kB.
  - Selector counts are 69 `body`, 10 `:root`, 9 `html`, and 6 bare `.theme-*`. Examples: `html body>:not(.print)` and `html>body>#main-horizontal>…`.
  - Raw-documents pages are about 2.6–3.1 MB each because fonts, CSS and JS are inlined.
- **Defect observed:** in the online preset, MathJax `@font-face` rules point at `site-lib/fonts/mathjax_*.woff`, which were never written (HTTP 404). Math renders in fallback fonts. The raw-documents preset inlines those fonts, and math renders correctly there.
- **Running it unattended:**
  - Upstream ships a `Dockerfile` and GitHub `action.yml` that run Obsidian 1.9.12 under `xvfb`. `electron-injector` then calls the plugin from inside the app ([Dockerfile](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/Dockerfile), [run.sh](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/docker/run.sh), [action.yml](https://github.com/KosmosisDire/obsidian-webpage-export/blob/78c973ddc27eb09bf18e07d143889452bc71ffde/action.yml)).
  - No image is published: `ghcr.io/kosmosisdire/obsidian-webpage-export` returned DENIED. The action's image name `KosmosisDire/…` is not a valid registry reference.
  - `docker/export-vault.mjs` calls `plugin.exportVault()`, which 1.9.2 does not expose. 1.9.2 exposes `exportDocker()`.
  - The `/config.json` mount is never read. Settings come from the vault's plugin `data.json`, and 1.9.2 refuses to export while `filesToExport` is empty (observed; the release bundle's `updateSettings` indexes `filesToExport[0]`).
  - The working recipe is kept with the local samples.
- **For the viewer:**
  - Take `#center-content .obsidian-document` rather than the whole body.
  - Resolve every relative `src`/`href` against the document's `<base>`: `<base>` has no effect inside a shadow root.
  - Put the doc's body classes plus `theme-light`/`theme-dark` on the wrapper, and rewrite `body` → wrapper, `html`/`:root` → `:host`.
  - Move the `@font-face` rules out to the document.
- **Site-matched theme:** you could make an Obsidian theme or snippet for the site and export with it. Or override the Obsidian variables (`--text-normal`, `--text-accent`, `--font-text` …) on `:host` at injection time.

### Quartz v5 (jackyzha0/quartz)

- **Status:**
  - v5.0.0 was tagged 2026-03-14, and `main` was at 97a2d05 on 2026-09-20. The GitHub "Latest release" object still says v4.0.8 (2023). MIT licence ([LICENSE.txt](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/LICENSE.txt)).
  - v5 moved to YAML config and to community plugins installed from git or npm ([What's new](https://quartz.jzhao.xyz/getting-started/whats-new)). Node ≥ 22 ([package.json](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/package.json)).
  - Output is a plain folder of HTML, JS and CSS for any static host. Vercel needs `cleanUrls: true` so that extensionless URLs resolve ([Hosting](https://quartz.jzhao.xyz/hosting)).
- **Obsidian support:**
  - Wikilinks in all forms, embeds, callouts including nested and foldable, `==highlight==`, `%%comments%%` stripped, tags, custom task characters, mermaid, block refs, canvas and footnotes ([Obsidian compatibility](https://quartz.jzhao.xyz/features/obsidian-compatibility), [What's new](https://quartz.jzhao.xyz/getting-started/whats-new)).
  - Dataview output comes via the **Quartz Syncer** Obsidian plugin, which exports queries as static content ([compatibility table](https://quartz.jzhao.xyz/features/obsidian-compatibility); [saberzero1/quartz-syncer](https://github.com/saberzero1/quartz-syncer), MIT, 2.0.18).
  - Selective publishing uses `@quartz-community/explicit-publish`, which only publishes pages with `publish: true` ([README](https://github.com/quartz-community/explicit-publish)).
  - `npx quartz create --template obsidian` presets these ([quartz create](https://quartz.jzhao.xyz/cli/create)).
- **What it emits** (observed in our build):
  - **Page structure:** full documents with no `<base>`. `<body data-slug data-basepath>` wraps `#quartz-root.page > #quartz-body`: left sidebar, `.center` (breadcrumbs, title, properties, `<article class="popover-hint"><div class="markdown-preview-view markdown-rendered">`), right sidebar, footer.
  - **Paths:** slugs are lower-case and hyphenated (`methods/spaced-review.html`). Aliases get redirect pages (`rg.html`). Attachments keep their folders. Tag and folder index pages are generated.
  - **Links:** `<a href="./tools/ripgrep" class="internal internal-link" data-slug="tools/ripgrep">`. Headings get slug ids, so `#when-to-use` matches its target. The block ref becomes `<p id="core-claim">`.
  - **Rendering:**
    - note embeds are rendered at build time into `<blockquote class="transclude">`;
    - callouts are `<blockquote class="callout warning is-collapsible is-collapsed">`;
    - math is KaTeX HTML, with `katex.min.css` from jsDelivr (20 `@font-face`);
    - mermaid ships as source in `<code class="mermaid">`, and a runtime script renders it ([Mermaid](https://quartz.jzhao.xyz/features/mermaid-diagrams)).
  - **Parts that depend on JS:** the explorer tree is filled from `static/contentIndex.json`, plus search, graph, popovers, SPA navigation, dark mode and callout folding ([SPA routing](https://quartz.jzhao.xyz/features/spa-routing)).
  - The scripts query `document` directly (`document.documentElement`, `document.getElementsByClassName`), so they cannot work inside a shadow root.
- **Fonts:** Google Fonts `<link>` by default. `fontOrigin: "local"` or `selfHosted` downloads the fonts at build time ([Configuration](https://quartz.jzhao.xyz/configuration), [Fonts plugin](https://quartz.jzhao.xyz/plugins/fonts)).
- **Theme model:**
  - Nine colours (light and dark) and three fonts in `quartz.config.yaml` become `:root{--light…--textHighlight}` and `:root[saved-theme="dark"]{…}`. These are aliased onto Obsidian's variable names (`--background-primary`, `--text-normal`, `--text-accent`, `--font-text` …) ([theme.ts `joinStyles`](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/util/theme.ts)).
  - A prescript sets `html[saved-theme]` from `localStorage` or `prefers-color-scheme`. Your own CSS goes in `quartz/styles/custom.scss`.
  - `@quartz-themes/core` 2.0.0 (MIT) ports Obsidian community themes, including "default", which the `obsidian` template enables. It adds a 418 kB stylesheet with 600+ `html[saved-theme="…"] body …` selectors (observed).
  - With that plugin disabled, all CSS totals about 110 kB, with 15 `:root`, 2 `html` and 1 `body` selectors (observed).
- **Defect observed:**
  - `![[diagram.svg]]` in `tools/` rendered as `<object data="diagram.svg">`, which 404s: the file lives in `attachments/`. Next to it, `![[swatch.png]]` was correctly rewritten to `../attachments/swatch.png`.
  - Cause: `obsidian-flavored-markdown` emits raw HTML for SVGs, and `crawl-links` only rewrites `img/video/audio/iframe` `src`. Both are 1.0.0 and unchanged on `main` as of 2026-09-15 ([ofm transformer](https://github.com/quartz-community/obsidian-flavored-markdown), [crawl-links](https://github.com/quartz-community/crawl-links)).
  - The upstream report was closed as "verified working on main" ([issue #2](https://github.com/quartz-community/obsidian-flavored-markdown/issues/2)), but we reproduced it on 2026-09-28.
- **For the viewer:**
  - Take `.center` or just `article`. Rewrite `:root[saved-theme=x]`/`html[saved-theme=x] body` → `:host([saved-theme=x]) wrapper`, and bare `html`/`:root` → `:host`, `body` → wrapper.
  - Fetch the Google Fonts and KaTeX CSS and move their `@font-face` rules to the document. Resolve URLs against the page URL.
  - Map `a.internal[data-slug]` to viewer routes.
  - Replace or add three behaviours the stripped scripts provided:
    - render mermaid (run `mermaid` on `code.mermaid` nodes inside the shadow root, or pre-render at build time);
    - toggle collapsible callouts;
    - set the theme attribute.
- **Site-matched theme:** set the colour and font tokens in `quartz.config.yaml` (and `custom.scss`) to dinnaga's design tokens, and leave `@quartz-themes/core` off. Or override `--light/--dark/--secondary …` on `:host` at injection. Quartz exposes the Obsidian variable names, so either route also covers callouts.

### Digital Garden (oleeskild/obsidian-digital-garden + oleeskild/digitalgarden)

- **Status:** plugin 2.94.1 (2026-09-11) and Eleventy template 1.91.0 (2026-09-17), both MIT ([plugin](https://github.com/oleeskild/obsidian-digital-garden), [template](https://github.com/oleeskild/digitalgarden)).
- **How it works:** notes marked `dg-publish: true` are pushed to your GitHub repo, which builds on Vercel or Netlify. Alternatively, Forestry.md is managed hosting by the plugin's author: free tier with 1 site, 100 MB and 30 publishes a month, or Pro at $8/month annual or $10 monthly ([plugin README](https://github.com/oleeskild/obsidian-digital-garden), [forestry.md](https://forestry.md/), [docs.forestry.md](https://docs.forestry.md/)).
- **Features:** Obsidian themes and Style Settings, Dataview, canvas, Excalidraw, MathJax, mermaid and PlantUML ([plugin README](https://github.com/oleeskild/obsidian-digital-garden)).
- **What it emits** (from template source):
  - Notes are written at `notes/<slug>/` ([note.njk](https://github.com/oleeskild/digitalgarden/blob/main/src/site/_includes/layouts/note.njk)).
  - `<body class="theme-… markdown-preview-view markdown-rendered markdown-preview-section">`: the content styling lives on `body`.
  - Callouts are rendered server-side with Obsidian markup, and mermaid ships as `<pre class="mermaid">` for client-side rendering ([.eleventy.js](https://github.com/oleeskild/digitalgarden/blob/main/.eleventy.js)).
  - The chosen community theme's CSS is downloaded at build time into `src/site/styles/_theme.<hash>.css` ([get-theme.js](https://github.com/oleeskild/digitalgarden/blob/main/src/site/get-theme.js)).
  - The live docs site links `obsidian-base.css`, `_theme.*.css`, `digital-garden-base.css`, `custom-style.css` (observed on docs.forestry.md).
- **For the viewer:** the same adaptation as the plugin, and body classes must move to the wrapper. We did not generate a sample.

### obsidian-export + an SSG (zoni/obsidian-export)

- **What it is:** a Rust CLI that converts a vault to CommonMark: `[[links]]` become Markdown links and `![[embeds]]` are inlined ([README](https://github.com/zoni/obsidian-export)). BSD-2-Clause-Patent-style licence ([LICENSE](https://github.com/zoni/obsidian-export/blob/main/LICENSE)). Latest release v25.3.0 (2025-03-25).
- **Output issues** (observed on the sample):
  - callout markers are escaped (`> \[!note\] …`), so SSG callout plugins will not match them;
  - `%%comment%%` passes through verbatim, which **publishes private comments** unless something strips them;
  - `#tag` becomes `\#tag`, and block ids stay as literal `^core-claim`.
- **Where this path fits:** only if dinnaga renders the Markdown with its own components. That is not a doc for the shadow-DOM viewer; it is a different architecture.

### Other options checked

- **Enveloppe** (formerly obsidian-github-publisher; Apache-2.0, 7.8.2) pushes notes to a GitHub repo for any SSG ([repo](https://github.com/ObsidianPublisher/obsidian-github-publisher)).
- **Flowershow** (AGPL-3.0) is a Markdown publishing service and CLI ([repo](https://github.com/datopian/flowershow)).
- **obsidian-publish-mkdocs** (CC0) is an MkDocs template ([repo](https://github.com/jobindjohn/obsidian-publish-mkdocs)).

None of these changes the answer: each is either "Markdown to an SSG" or a hosted service.

## Hosting test inside a shadow root (smoke test, not the prototype)

- **The harness:** a throwaway page, kept locally outside the repo:
  1. fetches a doc and parses it with `DOMParser`;
  2. fetches every stylesheet, including cross-origin ones, and rewrites `:root`/`html`/`body` and `[saved-theme]` selectors;
  3. moves `@font-face` rules to the document;
  4. resolves URLs against `<base>` or the page URL;
  5. drops all scripts, and mounts the body in an open shadow root under a host-page header.
- **Results** (Chrome, 1280×900):
  - **Quartz without the theme port:** 89–109 kB CSS. Fonts (Source Sans Pro, Schibsted Grotesk, IBM Plex Mono) and KaTeX glyph fonts loaded. The layout and callouts were correct, and the host page's own styles were unaffected.
  - **What was missing in Quartz:** the explorer and graph were empty (JS), and the SVG `<object>` 404 above showed.
  - **Quartz with the `obsidian` template and theme port:** 538 kB CSS. Dark mode through `:host([saved-theme=dark])` applied correctly. One glitch: part of a nested callout showed inside a collapsed one (folding is JS).
  - **Webpage HTML Export, Online preset:** rendered with Inter and the pre-rendered mermaid SVG. Math glyph fonts were missing, the same 404 as the native page.
  - **Webpage HTML Export, raw documents:** rendered fully, including MathJax fonts, the SVG and the PNG (all inlined).
- **Takeaways:** no generator's output needed hand edits. Every one needed the same generic adaptation, plus replacements for these script behaviours:
  - theme attribute or class;
  - collapsible callouts;
  - mermaid (Quartz and Digital Garden only);
  - internal-link routing.

## Samples produced

The samples are kept locally, outside the repo (they total about 18 MB, mostly the plugin's inlined fonts). They are built from one CC0 synthetic vault, and each folder has a README with the exact commands and licence notes.

- `quartz-v5/site/` (the `obsidian` template as shipped) and `quartz-v5/site-without-theme-port/`: MIT generator output.
- `webpage-html-export-1.9.2/online/` and `raw-documents/`, plus `recipe/` (Containerfile, run script, plugin settings). Plugin output also contains Obsidian's app CSS and fonts.
- `obsidian-export-25.3.0/markdown/`.
- `synthetic-vault/`: the source notes.

## Open questions for the operator

1. **Is a first-party Obsidian feature a requirement?** If "published with Obsidian's ability" must mean first-party, only Publish qualifies, and it cannot feed the shadow-DOM viewer. Choosing Quartz (or the plugin) means that phrase covers the vault and the authoring, not the publishing.
2. **Must publishing work without the desktop app?** Quartz and Digital Garden build in CI from Markdown. Webpage HTML Export needs Obsidian running: either a manual export from the desktop, or the unofficial container recipe.
3. **Should docs look like Obsidian or like dinnaga?**
   - An Obsidian look argues for the plugin or `@quartz-themes/core`: large CSS and heavily document-coupled selectors.
   - A dinnaga look argues for Quartz with its own colour and font tokens, or for overriding Obsidian variables on `:host`.
4. **Viewer scope:** does the viewer host whole pages (the doc's sidebars, search, graph), or only the article, with dinnaga providing navigation? We recommend article only: every chrome feature in these outputs needs the doc's own scripts, and those scripts assume `document`.
5. **Where do the built docs live?** In the dinnaga repo under `public/` (extensionless Quartz links then need `.html` handling, because the site's `vercel.json` rewrites every unmatched path to `index.html`), or as a separate deployment fetched cross-origin (which needs CORS)?
6. **Mermaid and math:** should the viewer run mermaid inside the shadow root, or should docs pre-render diagrams at build time? Is loading KaTeX fonts from jsDelivr acceptable, or must docs self-host fonts (Quartz `fontOrigin: local`)?
