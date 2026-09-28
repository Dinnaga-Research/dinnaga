# Shadow-DOM injection of standalone HTML docs

As of 2026-09-28. Ticket: #8 ("Research shadow-DOM injection of standalone HTML docs").

## Answer

1. Fetch the doc and parse it with `DOMParser`. Move its `<body>` children into an open shadow root on a host `<div>` that React renders empty, with `key={docPath}`.
2. Load the doc's `<style>` text into a constructed `CSSStyleSheet`, adapt it **in place** (never re-serialise it), and adopt it on the root.
3. Map the root selectors: `:root`/`html` → `:host` (`:root[x]` → `:host([x])`), and `body` → a `<doc-body>` wrapper. Add `:host { all: initial }`.
4. Rewrite `prefers-color-scheme`. Today the dark site's iframe makes Chrome and Firefox show docs dark; a shadow root would follow the OS instead.
5. Change `vw` → `cqi` and width `@media` → `@container` on the host. Change `:target` → an attribute plus delegated anchor scrolling.
6. Hoist any `@font-face` to the document, make relative URLs absolute against the doc URL, strip scripts and `on*` handlers, and contain overflow on the host.
7. Resolve the doc's `<main>`/`<h1>` against the site's own.

Result: all 11 docs rendered **pixel-identical** to standalone in Chromium, Firefox and WebKit at 1280 and 390 px (probe P3).

## Method and probe labels

Nothing in `~/code/dinnaga` was edited. All probes ran against the Vite dev server that serves `public/artifact-docs/`. The throwaway probe scripts are kept locally, outside the repo.

- **P1: Chrome 153** (the chrome-devtools MCP browser). Ran on the real `/artifacts/llm-best-practices-copilot-studio` route: the iframe was swapped for a shadow host, then computed style, the accessibility tree, anchor/`_top` clicks and color scheme were inspected.
- **P2: cross-engine probes.** Playwright 1.60.0 with its bundled **Chromium 148.0.7778.96, Firefox 150.0.2 and WebKit 26.4**. Covered: API presence, `@font-face` in shadow roots, container queries against the host, `:host`/inheritance/`all`, fragment navigation, script execution, Sanitizer, CSP, base URLs, print media, and `window.find`.
- **P3: parity.** 11 docs × {1280, 390} px × 3 engines = 66 comparisons. Side A: each doc standalone with the OS emulated dark. Side B: the same doc mounted in a shadow root **inside the site page** (site CSS loaded), with the OS emulated **light** and the adapter forcing dark. Full-page screenshots were diffed per pixel.
- **P4: jsdom 29.1.1** (the version pinned in `bun.lock`), run under Node. Probed its shadow-root, CSSOM and computed-style support, plus `@testing-library/dom` queries.

## Findings

### 1. Parsing a full document and mounting it

- **Parser choice.** Use `new DOMParser().parseFromString(text, 'text/html')`.
  - It keeps `<html lang>` and `<body class/attrs>`, and yields `<title>`/`<style>` for extraction.
  - It works in every engine and in jsdom (P2, P4).
  - `Document.parseHTMLUnsafe()` produces the same document (P2) and adds declarative-shadow-DOM parsing. The docs don't need that, and jsdom lacks it (P4). Support: Chrome 124, Firefox 128, Safari 26 ([BCD Document.json](https://github.com/mdn/browser-compat-data/blob/main/api/Document.json)).
  - The parsed document's URL is `about:blank`, so relative `href`s stay unresolved ([HTML: parseHTMLUnsafe note](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsehtmlunsafe); P2 returned `link.href === "x.css"`).
- **Don't call `setHTMLUnsafe(wholeDocText)` on the shadow root.**
  - It fragment-parses with the host as context ([HTML: setHTMLUnsafe](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-shadowroot-sethtmlunsafe)).
  - It drops the `<html>`/`<head>`/`<body>` wrappers and their attributes (a body `class`, for example). `meta`, `title`, `link`, `style`, `main` and `script` all become direct children of the root (P2, identical in all three engines).
- **Declarative Shadow DOM (`<template shadowrootmode>`)** only helps HTML that is parsed with the doc already wrapped in a template ([MDN template](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template); [MDN setHTMLUnsafe](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/setHTMLUnsafe): "Unlike `ShadowRoot.innerHTML`, declarative shadow roots in the input will be parsed"). That would mean a build-time wrapping step. It's unnecessary for a client-side fetch.
- **React 19 coexistence**
  - Render `<div ref={hostRef} className="doc-host" />` with **no JSX children**. React docs: "You can safely modify parts of the DOM that React has *no reason* to update. For example, if some `<div>` is always empty in the JSX, React won't have a reason to touch its children list" ([react.dev, Manipulating the DOM with refs](https://react.dev/learn/manipulating-the-dom-with-refs)).
  - `attachShadow` throws `NotSupportedError` if the element already has a (non-declarative) shadow root ([MDN attachShadow](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow)). Moving between `/artifacts/a` and `/artifacts/b` keeps the same component instance, because the route element and position don't change ([react.dev, preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state)).
  - So give the host `key={docPath}` (a fresh element and shadow root per doc) and abort the stale fetch in the effect cleanup. React 19 ref callbacks can also return a cleanup function ([React 19 blog](https://react.dev/blog/2024/12/05/react-19#cleanup-functions-for-refs)).
  - `main.tsx` omits StrictMode, so effects don't double-run. Guard with `host.shadowRoot ?? host.attachShadow(...)` anyway.
- **Missing docs.** Vercel serves the filesystem before rewrites ("precedence is given to the filesystem prior to rewrites being applied", [vercel.json docs](https://vercel.com/docs/project-configuration/vercel-json#rewrites)). The repo's catch-all `rewrites` therefore answer a **missing** doc path with `index.html`, status 200. The Vite dev server does the same for any `Accept` header (curl against `/artifact-docs/nope.html`: 200, `text/html`, the SPA shell).
  - The viewer must detect the SPA shell (for example `#root` or the module entry script) and show the error/"open standalone" state rather than mount an empty shell.
  - Today's iframe would render the whole site inside itself in that case.

### 2. Rewriting the doc's CSS

- **Scoping works for everything except the root selectors.** Selectors in a shadow tree "can't see elements outside the shadow tree at all" ([CSS Shadow Module §selectors](https://drafts.csswg.org/css-shadow-1/)), so the docs' `header`, `h1`, `a`, `main.wrap`, `*` and so on stay inside the doc. The site's own `h1 { text-transform: uppercase; font-family: display }` did not reach the doc's `h1` (P1: `textTransform: none`).
  - Only selectors naming the document root need rewriting: `:root`, `html`, `body`. Every doc uses them; see the inventory.
- **Mapping and specificity**
  - `:root` → `:host`, and `:root[data-theme="dark"]` → `:host([data-theme="dark"])`. The specificity of `:host()` "is that of a pseudo-class, plus the specificity of its argument" ([CSS Shadow §:host](https://drafts.csswg.org/css-shadow-1/)), so `:root[x]` (0,2,0) maps to `:host([x])` (0,2,0).
  - `html` → `:host`. `body` → a wrapper element. Use a **custom-element name such as `<doc-body>`** so `body` (0,0,1) keeps type-selector specificity. P3 used a class (0,1,0) and still matched, but a class can flip ties such as Obsidian-style `body` vs `.theme-dark` rules.
  - Known imperfection: `html` and `:root` both become `:host` (0,1,0), so a doc that sets the same property in both now resolves by source order. No current doc does this.
- **The outer page beats `:host` for normal declarations.** "For normal rules the outer context wins, and for important rules the inner context wins" ([CSS Cascade 5 §cascade-context](https://drafts.csswg.org/css-cascade-5/#cascade-context)). The site's CSS must never style the host's color, background or font, or it overrides the doc's `html{}`/`:root{}` rules.
- **Inheritance crosses the boundary**
  - P2, all three engines: an outer `color: rgb(1,2,3); letter-spacing: 3px` showed up inside the shadow tree.
  - On the live route (P1), the site's `text-rendering: optimizeLegibility` and `color-scheme: dark` leaked into the doc.
  - `:host { all: initial }` reset those in all engines (P2). But `all` "does not reset custom properties" ([CSS Cascade 5 §all](https://drafts.csswg.org/css-cascade-5/#all-shorthand)). The site tokens `--bg-1` and `--signal` were still visible inside the doc (P1, P2).
  - Today no doc uses a custom property it doesn't define, and no doc defines a name the site also defines (checked all 11). Nothing collides now, but future docs could pick up site tokens.
- **Custom properties defined on `:root`** move to `:host` and inherit into the tree normally. The weekly docs' inline `style="background:var(--accent)"` bars resolved correctly (P3 parity).
- **`rem` units.** "Equal to the computed value of the em unit on the root element" ([CSS Values 4 §rem](https://drafts.csswg.org/css-values-4/#rem)), and inside a shadow root that root is the **site's** `<html>`. The docs assume 16 px (they never set a root font size), and the site doesn't set one either: P1 measured 16 px on the site root and 16 px inside the iframe.
  - The two docs families use it very differently: the Copilot docs have 69 rem values, slamwich 92, the weekly docs none (all px).
  - If the site ever sets `html { font-size }`, every rem-based doc rescales.
- **CSSOM re-serialisation silently deletes declarations. Rewrite preludes in place.**
  - The first P3 pass rebuilt rules from `rule.style.cssText`. In both Copilot docs, `.principle` lost its 1 px border and came out 2 px shorter, in all engines.
  - Cause: `border: 1px solid var(--line-soft); border-left: 3px solid …` serialises as empty longhands (`border-top-color: ; …`). Shorthands that contain `var()` become "pending-substitution" values that CSSOM serialises as empty strings; Chrome and Firefox follow this, WebKit differs ([csswg-drafts#6253](https://github.com/w3c/csswg-drafts/issues/6253), [#2515](https://github.com/w3c/csswg-drafts/issues/2515)). P1 reproduced it directly in Chrome 153.
  - Mutating in place fixes it: `rule.selectorText = …`, `rule.media.mediaText = …`, and `style.setProperty(prop, …)` only on the properties that change. With that, **all 66 P3 comparisons were pixel-identical within the viewport**.
  - The alternative is a text-level transform that touches only preludes (for example PostCSS plus postcss-selector-parser), which leaves declaration blocks byte-for-byte intact.
- **Constructed sheets drop `@import`.** `replace()`/`replaceSync()` remove `@import` rules ([CSSOM §CSSStyleSheet](https://drafts.csswg.org/cssom/#dom-cssstylesheet-replacesync)). No current doc uses `@import`. For Obsidian-style CSS, inline imports first.

### 3. Color scheme: the one change a viewer of the live site would notice

- **Today.** The site declares `html { color-scheme: dark }` (`src/styles/colors_and_type.css`). Per spec, "in embedded documents (such as an iframe …), the embedding element's element color scheme is used as the embedded document's preferred color scheme … rather than the user's preference" ([CSS Color Adjust 1 §2.1](https://drafts.csswg.org/css-color-adjust-1/)).
  - Support: Chrome 129 and Firefox 105; not Safari ([BCD `prefers-color-scheme.respects-inherited-scheme`](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json)).
  - P1 (Chrome 153, OS light): the top document reported `prefers-color-scheme: dark` = false, but the iframe reported **true**, and the Copilot Studio doc rendered its dark palette.
  - WebKit 26.4 reported false (P2).
  - So today every doc renders **dark in Chrome and Firefox**, and follows the OS in Safari.
- **In a shadow root**, `@media (prefers-color-scheme)` evaluates against the user's preference. P1 without the rewrite: a light-OS viewer got the doc's cream palette inside the black site (and the leaked `color-scheme: dark`).
- **Fix: rewrite the media text at load**
  - `(prefers-color-scheme: dark)` → `screen`, so print still falls back to the light defaults. `(prefers-color-scheme: light)` → `not all`.
  - Only the Copilot docs and slamwich carry `:root[data-theme]` hooks (which become `:host([data-theme])` and could be driven by a host attribute). The weekly docs only have the media query, so the media rewrite is the uniform mechanism.
  - P3 confirmed forced-dark shadow output was pixel-identical to OS-dark standalone output.
- **Testing trap.** Playwright emulates `colorScheme: 'light'` by default, and in Chromium that emulation overrode the iframe's inherited scheme: 148 reported false under emulation and **true** with `colorScheme: null` (P2).

### 4. `@font-face` inside shadow roots

- **Spec.** `@font-face` names are tree-scoped names that "can be matched by tree-scoped references in the same tree or descendant trees" ([CSS Shadow Module](https://drafts.csswg.org/css-shadow-1/)), so a shadow-root `@font-face` should work in that shadow tree.
- **Reality (P2, a woff2 declared in the shadow root; width 307–308 px = fallback, 147 px = web font):**

  | Engine | `@font-face` in shadow `<style>` | in adopted sheet | hoisted to document, used in shadow | shadow-declared family used in light DOM |
  |---|---|---|---|---|
  | Chromium 148 | ignored (fallback) | ignored | applied | not applied |
  | Firefox 150 | ignored | ignored | applied | not applied |
  | WebKit 26.4 | applied | applied | applied | **applied (leaks to document)** |

- **Tracking and background.** Chromium tracks this as [issue 41085401](https://issues.chromium.org/issues/41085401) ("@font-face definitions in shadowRoot cannot be used within the shadowRoot"). A Chrome for Developers article (2024-08-02) notes "@font-face is flattened to the root scope in Safari" ([Author-defined CSS names and shadow DOM](https://developer.chrome.com/docs/css-ui/css-names)).
- **Workaround.** Pull `CSSFontFaceRule`s out of the doc sheet and add them to `document.adoptedStyleSheets`, de-duplicated. Because names become global, prefix or hash family names if two docs could declare the same family differently. Make `src: url()` absolute first (§5).
- **Today.** No doc uses `@font-face`. Every family is a system stack (Charter/Iowan/Palatino/Georgia, `ui-monospace`/SF Mono/Menlo, `system-ui`/`-apple-system`), so fonts render as in the iframe.

### 5. URLs, anchors, `:target`, `target="_top"`

- **Relative URLs resolve against the page, not the doc.**
  - Inside a shadow root on `/artifacts/…`, `href="sibling.html"` resolved to `/artifacts/sibling.html`, and a `<style>` `url(img/x.png)` to `/artifacts/img/x.png` (P2, all engines).
  - The `CSSStyleSheet({ baseURL })` option would fix CSS URLs, but **Chrome ignores it**. It's unsupported in Chrome per BCD (Firefox 101, Safari 16.4; [BCD CSSStyleSheet.json](https://github.com/mdn/browser-compat-data/blob/main/api/CSSStyleSheet.json)); P2 on Chromium 148 and P1 on Chrome 153 both resolved against the page.
  - So rewrite `href`/`src`/`srcset` and CSS `url()` to absolute URLs against the doc URL at load.
  - Today's docs only use root-relative (`/artifacts/…`) and absolute links, so nothing breaks now. Obsidian-style relative assets would.
- **In-page anchors silently stop working.**
  - The HTML standard finds fragment targets only "in the document tree whose root is document" ([HTML §find a potential indicated element](https://html.spec.whatwg.org/multipage/browsing-the-web.html#find-a-potential-indicated-element)). A shadow tree isn't part of the document tree ([DOM §document trees](https://dom.spec.whatwg.org/#concept-document-tree)).
  - P1: clicking the Copilot rail link `#c07` updated the URL to `…#c07` but `scrollY` stayed 0 and `.card:target` didn't match. It was identical in all three engines (P2).
  - Fix: one `click` listener on the shadow root. Find the anchor via `event.composedPath()`, then `preventDefault()`, `shadowRoot.getElementById(id).scrollIntoView()`, and `history.pushState(…, '#id')`. Set a `data-doc-target` attribute and rewrite `:target` to `[data-doc-target]` in selectors. On mount, honour an existing `location.hash`.
  - P1: with that handler, `#c07` scrolled the card to 16 px from the top, matching the doc's `scroll-margin-top: 1rem`. The site's sticky nav had already scrolled away, so it needed no compensation.
  - Click events are composed ([MDN composedPath](https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath)). Outside the shadow root `event.target` is retargeted to the host ([DOM §retarget](https://dom.spec.whatwg.org/#retarget)). P1 confirmed: a document-level listener saw `target = div.doc-host`, `composedPath()[0] = A`.
- **`target="_top"` still works but reloads the whole page.**
  - `_top` is the topmost browsing context ([MDN `<a target>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#target)), and inside a shadow root that is the current tab.
  - P1: clicking the Copilot Studio sibling link produced a new `performance.timeOrigin` (a full document load), not an SPA transition.
  - To keep SPA navigation, the same click listener can route same-origin, non-`/artifact-docs/` links through react-router's `navigate()`. Then reset scroll to the top, because the site has no `ScrollRestoration`.
- **External links with no `target`** (all 17 in slamwich) navigate the **whole tab** away in shadow mode. In the iframe they navigate the frame.

### 6. Scripts

P2, identical in Chromium, Firefox and WebKit:

- `<script>` elements from `DOMParser` + `importNode`, `setHTMLUnsafe` or `innerHTML` **do not run**. `parseHTMLUnsafe` "script elements are not evaluated during parsing" ([HTML §parseHTMLUnsafe](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsehtmlunsafe)).
- **Inline event handlers do run.** `<img src=… onerror=…>` fired in every path, so strip `on*` attributes and `javascript:` URLs even for first-party docs.
- Re-creating a `<script>` with `document.createElement('script')` runs it, but in the **site's** global scope. Its `document` is the site document, and `getElementById` searches only the document tree, not shadow trees ([DOM getElementById](https://dom.spec.whatwg.org/#dom-nonelementparentnode-getelementbyid)), so doc scripts would fail to find their own elements and could touch site state.
- The HTML standard now defines `setHTMLUnsafe(html, { runScripts: true })` ([HTML §dynamic markup insertion](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-sethtmlunsafe)). Chrome 153 ignored it: scripts didn't run (P1).
- **Recommendation:** drop scripts. A doc that genuinely needs its scripts (a future Obsidian export with search, graph or theme toggle, say) should fall back to today's iframe path.

### 7. Fixed positioning, viewport units, media queries

- **Viewport units and media queries measure the viewport, not the host.** `vw` is "1% of viewport's width" ([CSS Values 4 §vw](https://drafts.csswg.org/css-values-4/#vw)), and `@media` in a shadow sheet evaluates against the top window. In an iframe both measured the iframe (1342 px wide inside a 1440 px window, P1).
- **Container queries are the replacement.** Container queries condition "style rules applying to a query container's flat tree descendants" ([CSS Conditional 5 §container queries](https://drafts.csswg.org/css-conditional-5/)), and the shadow host is a flat-tree ancestor of its shadow content.
  - P2, all engines: with `:host { container: doc / inline-size }` and a 500 px host, `@container doc (max-width: 640px)` matched, and `50cqi` = 250 px.
  - So rewrite `vw` → `cqi` via `setProperty` on the affected properties, and `@media (max-width: …)` → `@container doc (…)`. That conversion needs `insertRule`, which re-serialises the inner rules, which is only safe when they have no `var()`-in-shorthand (true for the weekly `.grid2` rule).
  - Affected today: the Copilot docs and slamwich `clamp(…vw…)` headings and ghostmarks, and the weekly `@media (max-width:640px)`.
- **`position: fixed`** in a shadow tree positions against the viewport, over the site chrome; an iframe clipped it. None of the 11 docs uses `fixed` or `sticky` (the slamwich matches are in prose). Obsidian-style app shells would need a rewrite to `absolute`/`sticky`, or the iframe fallback.
- **Horizontal overflow escapes to the page.** At phone widths the standalone slamwich doc is wider than the screen: scrollWidth 484 px at 375 px in Chromium, caused by `code { white-space: nowrap }` runs. So is weekly 2026-08-15 (434 px at 390 px in all engines), and 2026-08-08 in Firefox (437 px) (P3/P2).
  - The iframe contained this. Shadow mode lets it overflow the site, and `tests/e2e/responsive.spec.ts` checks `/artifacts/slamwich-tasting-report` for overflow at 375 px.
  - Give the host `overflow-x: auto`. That keeps the doc scrollable without clipping content, and it's safe because no doc uses `sticky`.
- **Canvas background.** Standalone, `html{background}` paints the whole canvas. On `:host` it paints only the host box. The only P3 pixel differences, all below the diff threshold, sat in that overflow strip beyond x = 390.

### 8. Print, find-in-page, accessibility

- **Print gets better.**
  - Media queries in shadow sheets see print: `@media print { .r { display: none } }` applied in all engines under print emulation (P2).
  - Chromium print-to-PDF of the Copilot Studio viewer route: the **iframe version contained only clause 01** (3 pages, the frame's fixed `calc(100vh - 280px)` box). The **shadow version contained all clauses, the principle strip and the footer** (8 pages; text extracted with pypdf).
  - Caveat: backgrounds don't print by default, and the site has no print CSS. That's why the colour rewrite maps dark to `screen`: a forced-dark weekly doc would otherwise print light text on white.
- **Find-in-page** can't be automated. As a proxy, `window.find()` found shadow-tree text in Chromium and Firefox but **not WebKit** (P2). Check the Safari find bar by hand.
- **Accessibility**
  - Shadow content is in the page's accessibility tree. P1's snapshot on the live route showed a **second `main` landmark nested in the site's `main`**, and **two level-1 headings** (the strip's `h1` and the doc's `h1`).
  - HTML requires that "a document must not have more than one `main` element that does not have the `hidden` attribute" ([HTML §main](https://html.spec.whatwg.org/multipage/grouping-content.html#the-main-element)).
  - The doc's `<header>`/`<footer>` are now inside `main`, so they map to `sectionheader`/`sectionfooter` rather than `banner`/`contentinfo` ([HTML-AAM](https://w3c.github.io/html-aam/#el-header)). That's a benefit, and P1 showed no extra banner or contentinfo. `nav[aria-label="Clauses"]` stays a navigation landmark.
  - Carry `<html lang>` onto the wrapper so the language is kept.
  - `<title>` and `<meta>` are inert in a shadow root. Use the extracted title for the strip or `document.title` if wanted.

### 9. Trust model, sanitising, CSP

- **The Sanitizer API's default config destroys the docs.**
  - `setHTML` exists in Chrome 146+ and Firefox 148+, not Safari ([BCD Element.json](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json); [Mozilla Hacks, Firefox 148](https://hacks.mozilla.org/2026/02/goodbye-innerhtml-hello-sethtml-stronger-xss-protection-in-firefox-148/)).
  - On the real Copilot Studio doc, the default sanitizer (P2, Chromium and Firefox) removed **every** `<style>`, `id`, `class`, `target` and `aria-*` attribute: 1 style block, 24 ids, 68 classes, 7 targets and 27 aria attributes all went to 0.
  - `setHTML(html, { sanitizer: {} })` kept all of them and still stripped `onclick`, `<script>` and `javascript:` URLs (P2).
  - WebKit 26.4 has no `setHTML` (P2). A cross-browser path needs [DOMPurify](https://github.com/cure53/DOMPurify), which "per default allows CSS" and supports `WHOLE_DOCUMENT`/`RETURN_DOM_FRAGMENT`, or a small allow-list step.
  - For first-party docs committed to `public/`, stripping scripts and `on*` handlers (§6) is the proportionate baseline. Sanitising matters once the docs are generated (the weekly reports are machine-written) or synced from Obsidian.
- **CSP (the site sends no CSP today; `vercel.json` only has rewrites).** P2 under `style-src 'self'`, all three engines:
  - A `<style>` inside a shadow root was **blocked**.
  - An **adopted constructed sheet applied**.
  - Parsed `style="…"` attributes were **blocked**. That breaks the weekly bar widths and slamwich's swatches and meters.
  - `el.style.color = …` via CSSOM was allowed. MDN says `setAttribute('style')` and `style.cssText` are blocked while direct property assignment is not ([MDN style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src)).
  - So adopted sheets are the CSP-friendly choice. Under a strict CSP, inline style attributes would have to be copied through `style.setProperty` (or the policy would need `style-src-attr 'unsafe-inline'`).

### 10. Testing: jsdom (vitest) versus Playwright

**jsdom 29.1.1 (P4) can check**

- `attachShadow`, `shadowRoot.querySelector`/`getElementById`, and `DOMParser` full-document parsing (title, body attributes).
- `new CSSStyleSheet()` + `replaceSync`, the `selectorText` and `media.mediaText` setters, and `CSSContainerRule` parsing.
- `@testing-library/dom`'s `within(host.shadowRoot)` found headings and a `region` by `aria-labelledby` name. `screen` does **not** pierce shadow roots ([dom-testing-library#413](https://github.com/testing-library/dom-testing-library/issues/413), still open).

**jsdom 29.1.1 cannot check**

- No `setHTMLUnsafe`, `parseHTMLUnsafe`, declarative shadow DOM, `setHTML`/`Sanitizer` or `matchMedia`.
- `adoptedStyleSheets` is accepted as a plain property with no effect ([jsdom#3998](https://github.com/jsdom/jsdom/issues/3998)).
- **No style scoping.** A `<style>` inserted into a shadow root with its content already set gets no sheet. One whose text is set after insertion is added to `document.styleSheets` and **styles light-DOM elements too**.
- `:host` rules don't apply, and host→shadow inheritance isn't computed ([jsdom#3941](https://github.com/jsdom/jsdom/issues/3941), open; [#3278](https://github.com/jsdom/jsdom/issues/3278)).
- `var()` stays unresolved in `getComputedStyle`.
- jsdom's own CSSOM **dropped `.principle`'s `border: … var(…)` shorthand entirely**.
- No layout.

**Split the tests**

- **vitest:** keep the adapter pure — selector rewrite, media rewrite, `@font-face` extraction, URL absolutising, SPA-shell detection, script and handler stripping. Feed it the **real files** from `public/artifact-docs/` with `fs` (no mocks), plus the DOM-structure assertions above.
- **Playwright:** rendering. Parity screenshots against the standalone doc, anchors, `_top`, overflow, landmarks, color scheme with `emulateMedia({ colorScheme: 'light' })`. Playwright "locators … by default work with elements in Shadow DOM", except XPath and closed roots ([Playwright locators](https://playwright.dev/docs/locators)).

**Existing tests that will break**

- `tests/e2e/artifacts.spec.ts` and `weekly.spec.ts` "the viewer iframe loads…" use `frameLocator`. Rewrite them as page-level role queries.
- **"renders exactly one main landmark"** uses `page.locator('main')`, which **pierces** the open root. It will count 2 on slamwich and the Copilot docs until the doc's `<main>` is neutralised. It's a genuine catch, not a false alarm.
- `responsive.spec.ts` at 375 px on `/artifacts/slamwich-tasting-report` fails unless the host contains overflow (§7).
- The unit tests `DocFrame.test.tsx`, `ArtifactViewer.test.tsx` and `WeeklyViewer.test.tsx` assert the iframe's `src`/`title`.

### 11. What later Obsidian exports would need the viewer to tolerate

The sibling ticket owns the facts about the exports. The viewer only needs to degrade predictably if an export contains:

- `<script>`: strip it, or use the iframe fallback (§6).
- `<link rel="stylesheet">`: fetch and inline in document order, since constructed sheets drop `@import` (§2).
- `@font-face`: hoist it (§4).
- Relative asset and link URLs: make them absolute (§5).
- Theme classes on `<body>`: copy the body attributes onto `<doc-body>` (§1).
- `html, body { height: 100% }` / `overflow: hidden` app shells, `position: fixed` sidebars, `100vh`: rewrite, or use the iframe fallback (§7).
- A long tail of selectors beyond `:root`/`html`/`body`, such as `:root` inside `:is()`/`:not()`. This argues for a real selector parser over regex if exports are messy.

## Per-doc inventory

Common to every doc: no `<script>`, `<link>`, `@font-face`, `@import`, images/SVG/iframes, `position: fixed/sticky`, or `vh`; system font stacks only; one `h1`; `<html lang="en">`. The "Mobile overflow" column is standalone scrollWidth (P2/P3).

| Doc | Root selectors to rewrite | Theme hooks | `@media` | `vw` | Links | ids / `:target` | Landmarks | Inline `style=` | Mobile overflow |
|---|---|---|---|---|---|---|---|---|---|
| llm-best-practices-copilot-studio | `:root` (×3, incl. inside dark + print), `:root[data-theme=dark\|light]`, `html`, `body` | `prefers-color-scheme: dark` + `data-theme` | dark, `prefers-reduced-motion`, `print` | 2 (`.ghostmark span` `clamp(8rem,22vw,15rem)`, `h1` `clamp(2.1rem,1.2rem+3.4vw,3.4rem)`) | 12 `#c01–#c12` rail anchors; 3 `/artifacts/…` `target=_top`; 4 external `_blank` | 24 ids; `.card:target` | header, `nav[aria-label=Clauses]`, **main**, aside, footer | 0 | none |
| llm-best-practices-github-copilot | same as above | same | same | same 2 | 12 anchors; 3 `_top`; 5 external `_blank` | 24; `.card:target` | same (**main**) | 0 | none |
| slamwich-tasting-report | `:root` (+dark), `:root[data-theme]`, `html`, `body` ×2 (two `<style>` blocks) | dark + `data-theme` | dark, `prefers-reduced-motion` | 3 (ghostmark `clamp(7rem,22vw,15rem)`, `h1` `clamp(2.1rem,5.4vw,3.4rem)`, `h2` `clamp(1.4rem,3vw,1.85rem)`) | 17 external, **no `target`** | 0; `::selection` | header, **main**, footer, 5 section, 12 article | 21 (meter `width:%`, swatch backgrounds, one `margin-top:1.6rem`) | **484 px @375 (Cr)**, 484–494 @390 |
| weekly/2026-08-08 | `:root` (+dark), `body` | dark only | dark, `(max-width:640px)` `.grid2` | 0 (px units) | 8 external `_blank` `noopener` | 0 | header, footer, 8 section, 6 article, 1 table (no main) | 30 (`width:N%;background:var(--accent…)`) | 437 px @390 (Firefox only) |
| weekly/2026-08-15 | same | same | same | 0 | 12 `_blank` | 0 | same, 7 article | 25 | **434 px @390 (all)** |
| weekly/2026-08-22 | same | same | same | 0 | 15 `_blank` | 0 | same, 6 article | 17 | none |
| weekly/2026-08-29 | same | same | same | 0 | 13 `_blank` | 0 | same, 6 article | 21 | none |
| weekly/2026-09-05 | same | same | same | 0 | 17 `_blank` | 0 | same, 6 article | 19 | none |
| weekly/2026-09-12 | same | same | same | 0 | 11 `_blank` | 0 | same, 5 article | 23 | none |
| weekly/2026-09-19 | same | same | same | 0 | 15 `_blank` | 0 | same, 5 article | 20 | none |
| weekly/2026-09-26 | same | same | same | 0 | 15 `_blank` | 0 | same, 6 article | 19 | none |

Parity (P3): with the in-place adapter, all 11 docs × 2 widths × 3 engines matched standalone pixel-for-pixel inside the viewport width. The same was true of full-page heights.

## Adapter sketch

Illustrative only; this is the shape of the verified approach, not repo code.

```ts
const RESET = ':host{all:initial;display:block;container:doc / inline-size;overflow-x:auto} doc-body{display:block}';

async function mountDoc(host: HTMLElement, docPath: string, signal: AbortSignal) {
  const docUrl = new URL(docPath, location.href);
  const res = await fetch(docUrl, { signal });
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
  if (!res.ok || doc.getElementById('root')) throw new Error('not a doc'); // SPA-shell fallback

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(RESET + [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n'));
  // In place only: rule.selectorText (:root/html → :host, body → doc-body, :target → [data-doc-target]),
  // rule.media.mediaText (prefers-color-scheme), style.setProperty for vw → cqi,
  // insertRule for width @media → @container, delete + collect @font-face (urls absolutised).
  hoistFontFaces(adaptInPlace(sheet, docUrl));

  doc.querySelectorAll('script, link, meta, title, base, style').forEach((n) => n.remove());
  stripHandlersAndJsUrls(doc.body);
  absolutiseUrls(doc.body, docUrl); // href/src/srcset, skipping '#…'

  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  root.adoptedStyleSheets = [sheet];
  const body = document.createElement('doc-body');
  for (const a of doc.body.attributes) body.setAttribute(a.name, a.value);
  body.lang = doc.documentElement.lang;
  body.append(...document.importNode(doc.body, true).childNodes);
  root.replaceChildren(body);
  root.addEventListener('click', onDocClick); // #anchor → scrollIntoView + data-doc-target; same-origin → navigate()
}
```

## Risks

- **Colour-scheme regression.** Without the media rewrite, light-OS viewers in Chrome and Firefox switch from dark docs today to light docs inside a black site (§3).
- **Adapter correctness.** Re-serialising through CSSOM silently drops `var()` shorthands (§2). Regex selector rewriting will meet selectors it doesn't understand once Obsidian CSS arrives.
- **Font scoping splits by engine.** `@font-face` is ignored in Chromium and Firefox shadow roots but leaks globally from WebKit ones. Hoisting makes font names global, so two docs with the same family name collide (§4).
- **Behaviour the iframe used to provide:** anchors, `:target`, SPA links, overflow containment and scroll ownership all need explicit code, and each has an existing e2e test that will notice (§5, §7, §10).
- **Site tokens leak** through `all: initial` into every doc. It's harmless now, and a latent collision for future docs (§2).
- **Site-level changes affect the docs.** A future site `html { font-size }` rescales every rem doc; a site rule on the host element overrides the doc's `:host` styles; a site CSP that blocks inline styles breaks the weekly charts (§2, §9).
- **Script-dependent docs** can't be shadow-mounted faithfully (§6).
- **Safari gaps.** It has no Sanitizer API, and the `window.find` proxy missed shadow text in WebKit (§8, §9).

## Open questions for the operator

1. **Which scheme do docs render in?** Always dark to match the dark-only site (today's behaviour in Chrome and Firefox), the OS preference (today's Safari behaviour), or a per-doc choice? The recommendation is forced dark on screen and light for print.
2. **How should the doc's `<main>` and `<h1>` relate to the site's?** Options: rename the doc's `main` to a `div`/`doc-main` at load (with a matching selector rewrite); render the viewer route without the site's `<main>`; or keep two and change the landmark test. Similarly, should the strip title stop being an `h1`, or should the doc's headings drop one level?
3. **Should in-doc site links stay full page loads (`_top`) or become SPA navigations** through the router?
4. **When a doc needs scripts** (a likely Obsidian case), fall back to the iframe, or refuse to publish it?
5. **Runtime adapter or build-time transform?** Zero-dependency in-place CSSOM at load (verified here), or PostCSS (at load or as a prebuild step emitting adapted CSS next to each untouched doc)? The ticket's rule, never hand-edit a doc, holds either way.
6. **Sanitise first-party docs?** `setHTML(…, { sanitizer: {} })` where supported plus DOMPurify for Safari, or only strip scripts and handlers until external or generated content arrives? Is a CSP planned? It would constrain how inline styles are carried (§9).
7. **Keep "Open standalone"?** The standalone URL (and today's iframe) keep each doc's original behaviour, which is a useful escape hatch for anything the adapter can't render.
