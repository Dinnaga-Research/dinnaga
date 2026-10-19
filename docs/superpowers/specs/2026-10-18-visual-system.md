# Dinnaga.ai visual system

**Date:** 2026-10-18
**Status:** Design, awaiting the operator's review
**Repo:** `github.com/Dinnaga-Research/dinnaga` → `dinnaga.ai` (Vercel)
**Milestone:** Visual system (Dinnaga Refresh, map #6). Written for #23.
**Decided in:** #18 (visual directions), #11 (type audit), #16 (copy voice), #19 (doc viewer), #20 (Cromulon), #15 (homepage), #26 (thesis)
**Prototype:** branch `prototype/visual-directions` (f293dad), direction A "Register", with direction C's terminal. The terminal's final treatment is on `prototype/cromulon` (d25a0ce). Both branches are throwaway and never merge.

---

## 1. Goal

One visual system for the whole site and for every doc shown inside it. A visitor sees a dark, quiet reading surface set in three legible faces, with one CRT object (the terminal) and one accent colour that means one thing: this was tested.

The system replaces the vendored UI kit's tokens, faces and chrome. It fixes the measured legibility failures from the type audit (#11) and removes the design tells catalogued in the AI-tells note (D1, D9, D11, D12, D13, D14).

## 2. Decisions this spec implements

| Ref | Decision | Where |
|---|---|---|
| #18 decision 1 | Register layout (A) with C's terminal: Departure Mono at 22 px, 16.5 px on small screens | §10 (the layout itself belongs to Pages) |
| #18 decision 2 | Keep the dark ground and lime. Lime `#C0FE04` means only "tested" | §4, §9 |
| #18 decision 3 | Type set A: Archivo wdth 125 / 800 display, Atkinson Hyperlegible Next 400/500 body, JetBrains Mono 400/500 labels and data. Departure Mono in the terminal only. No faces with reserved font names | §5, §6 |
| #18 decision 4 | Retire `#717171` and `#444` for text (kept for rules and dots). Floors: labels `#9a9a9a`, secondary text `#b1b1b1`, dim terminal green `#91c319` | §4 |
| #18 decision 5 | Drop the page-wide CRT overlay (scanlines, vignette, flicker). CRT effects live inside the terminal only | §10, §11 |
| #18 decision 6 | Self-hosted static Latin subsets of the weights actually used, not variable fonts | §5 |
| #18 decision 7 | True italics for body text. IAST and Greek through a small `unicode-range` fallback | §5 |
| #16 rule 7 | Sentence case everywhere. Headings never end in a full stop. Caps only for small mono chrome labels (≥ 12 px, tracking ≤ 0.08 em) | §7 |
| #19 decisions 2 and 10 | Docs take on the site's look through per-family token mapping. Quartz builds living documents in the site's colours and fonts | §13, §14 |
| #20 decisions 8 and 9 | Dim terminal text lifted to `#91c319`. The cursor is drawn as a box (Cromulon builds it; this spec gives its colour) | §10 |
| Map #6 | Keep the hexagon-D logo mark, the dark ground, the terminal as the one CRT object, OFL fonts, and the existing floors: skip link, focus-visible, reduced motion | §15 |

## 3. Scope

**This milestone owns:** the tokens (colour, type, spacing, motion, layout widths), the self-hosted font files and their licences, the text colour floors, removal of the page-wide CRT overlay, the terminal's look, the tested mark and the rule that lime means tested, the global typographic rules, the accessibility floors, and the doc-theme and Quartz values in §13 and §14.

**Other milestones own:**
- **Honesty** (built first): deletes `/loadout` and the zords bench, the analytics banner, the fake terminal readouts and the "LIVE" indicators. This spec never restyles anything Honesty deletes.
- **Pages:** page layouts and content, including the homepage register, nav, footer, the Colophon text and per-page headings. Pages consumes the tokens and type roles defined here.
- **Doc viewer:** the shadow-DOM viewer and the adapter that applies §13 at load. The Quartz build pipeline sits outside this map.
- **Cromulon:** the terminal art, the drawn block cursor's behaviour and the phone terminal layout.

**Non-goals:** a light theme for the site, new routes, the `og.png` card and favicon (the map lists them as not yet specified), and any change to doc HTML files.

## 4. Colour tokens

Every token is a CSS custom property on `:root` with the prefix `--dn-`. The prefix matters: custom properties inherit into the doc viewer's shadow roots, and the docs define their own unprefixed variables (`--bg`, `--ink`, `--line`, `--accent`, `--light` and so on). Unprefixed site tokens would collide with them.

Contrast is WCAG 2.x ratio and APCA Lc (0.0.98G-4g), computed for this spec. Negative Lc means light text on a dark ground.

### 4.1 Grounds and rules

| Token | Value | Role | Notes |
|---|---|---|---|
| `--dn-bg` | `#0a0a0a` | Page ground (the prototype's ground) | `theme-color` already uses it |
| `--dn-bg-raised` | `#141414` | Panels, code blocks, doc "paper" and card surfaces | |
| `--dn-bg-raised-2` | `#1f1f1f` | Hover surface, chips, inline code background | |
| `--dn-rule` | `#262626` | Hairlines between rows and sections | Non-text only |
| `--dn-rule-strong` | `#444444` | Stronger dividers | Non-text only. Retired for text (2.03:1) |
| `--dn-ui-muted` | `#717171` | Dots and inactive marks | Non-text only. 4.06:1 on `--dn-bg` meets the 3:1 non-text minimum. Retired for text |

### 4.2 Text

| Token | Value | Role | On `--dn-bg` | On `--dn-bg-raised` | On `--dn-bg-raised-2` |
|---|---|---|---|---|---|
| `--dn-text` | `#e8e8e8` | Body, headings, links, primary labels | 16.16:1, Lc −92.8 | 15.04:1 | 13.45:1 |
| `--dn-text-2` | `#b8b8b8` | Secondary text: ledes, summaries, footer prose, captions | 9.98:1, Lc −63.9 | 9.29:1 | 8.31:1 |
| `--dn-text-label` | `#9a9a9a` | Labels, dates, kinds, meta | 7.04:1, Lc −47.6 | 6.55:1 | 5.86:1 |

Floors (from #18 decision 4 and the type audit):
- No text colour darker than `#9a9a9a` on any dark ground. That is the label floor (Lc 47).
- Secondary text that runs as prose (ledes, summaries, footer sentences) is at least `#b1b1b1` (9.23:1, Lc 60). `--dn-text-2` sits above it.
- Running body text uses `--dn-text`. APCA's body-column target on black is `#cbcbcb` (Lc 75); `--dn-text` clears it.
- `#717171` and `#444` never appear in a `color` declaration.

### 4.3 Accent, focus and selection

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--dn-tested` | `#c0fe04` | The tested mark (§9) and nothing else | 16.42:1 on `--dn-bg`; 15.28:1 on `--dn-bg-raised` |
| `--dn-focus` | `#ffffff` | Focus ring | 19.80:1 on `--dn-bg` |
| `--dn-selection-bg` | `#e8e8e8` | `::selection` background | Text `--dn-bg` on it: 16.16:1 |
| `--dn-selection-text` | `#0a0a0a` | `::selection` text | |

There are no status colours (warn, error, info). A state is said in words. If a later ticket needs an error colour, it adds a token here first.

### 4.4 Terminal palette

These tokens are the terminal's phosphor. They are the CRT's own colour, not the site accent, and they are used only inside the terminal (selectors that start with `.terminal`, `.t-` or the Cromulon's art layer). `--dn-tested` is never used inside the terminal.

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--dn-term-bg` | `#050b03` | Screen ground | |
| `--dn-term-bar` | `#0e1907` | Chrome bar ground | |
| `--dn-term-edge` | `#0a1605` | 4 px ring outside the frame | Non-text |
| `--dn-term-frame` | `#5e8a00` | 1 px frame and bar divider | Non-text: 4.82:1 on `--dn-bg`. Retired for text |
| `--dn-term-text` | `#b8f720` | Every terminal text line, the visitor's echoed input, the prompt caret and the cursor box | 15.50:1, Lc −89.9 on `--dn-term-bg` |
| `--dn-term-dim` | `#91c319` | Output lines, the placeholder, chrome label | 9.50:1, Lc −61.4 on `--dn-term-bg`; 8.64:1, Lc −60.6 on `--dn-term-bar` |
| `--dn-term-glow` | `rgba(184, 247, 32, 0.35)` | `text-shadow` glow colour | |

The absolute minimum for dim terminal text is `#7ba515` (6.2:1, Lc 45). `#5e8a00` is 4.84:1 and is retired for text.

## 5. Type faces and font files

### 5.1 Faces

| CSS family | Role | Upstream source (pinned) | Licence | RFN |
|---|---|---|---|---|
| `Archivo Expanded` | Display | google/fonts `ofl/archivo/Archivo[wdth,wght].ttf` at commit `47d54ca1ebb14fd864695f1d39dc734f39017c33` | OFL 1.1, "Copyright 2020 The Archivo Project Authors" | None |
| `Atkinson Hyperlegible Next` | Body | google/fonts `ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf` and `-Italic[wght].ttf`, same commit | OFL 1.1, "Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors" | None |
| `JetBrains Mono` | Labels, data, code, body arrows | google/fonts `ofl/jetbrainsmono/JetBrainsMono[wght].ttf`, same commit | OFL 1.1, "Copyright 2020 The JetBrains Mono Project Authors" | None |
| `Departure Mono` | Terminal only | GitHub release `rektdeckard/departure-mono` v1.500, `DepartureMono-1.500.zip` → `DepartureMono-Regular.woff2` | OFL 1.1, "Copyright 2022–2024 Helena Zhang" | None |
| `Noto Sans` | Fallback for IAST dot-below letters and Greek | google/fonts `ofl/notosans/NotoSans[wdth,wght].ttf`, same commit | OFL 1.1, "Copyright 2022 The Noto Project Authors" | None |

Every OFL.txt above was read for this spec; none declares a Reserved Font Name, so subsetting and keeping the family name is allowed (OFL FAQ 2.6–2.8). The type audit's suggested fallback, Source Sans 3, has the RFN "Source" and is ruled out by #18 decision 3. Noto Sans replaces it.

### 5.2 Files, instances and subsets

Unicode ranges used below:
- **LATIN** (Google Fonts' `latin` range): `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`
- **EXTA** (Latin Extended-A, for the IAST letters `ā ī ū ś`; `ñ` is already in LATIN): `U+0100-017F`
- **ARROWS**: `U+2190-2199`
- **BOX** (box drawing and block elements): `U+2500-259F`
- **IAST-GREEK**: `U+0323, U+0391-03A9, U+03B1-03C9, U+1E0C-1E0D, U+1E24-1E25, U+1E36-1E39, U+1E40-1E47, U+1E5A-1E5D, U+1E62-1E63, U+1E6C-1E6D` (dot-below and macron-dot letters `ḍ ḥ ḷ ḹ ṁ ṃ ṅ ṇ ṛ ṝ ṣ ṭ` in both cases, the combining dot below, and the basic Greek alphabet)

| Output file | Face, instance | Subset | Measured bytes | Loads when |
|---|---|---|---|---|
| `archivo-expanded-800.woff2` | Archivo, `wdth=125 wght=800` | LATIN + EXTA | 17,704 | Every page (preloaded) |
| `atkinson-next-400.woff2` | Atkinson Hyperlegible Next, `wght=400` | LATIN + EXTA | 14,272 | Every page (preloaded) |
| `atkinson-next-500.woff2` | `wght=500` | LATIN + EXTA | 14,912 | Every page |
| `atkinson-next-400-italic.woff2` | Italic, `wght=400` | LATIN + EXTA | 16,632 | When italic text is on the page |
| `atkinson-next-500-italic.woff2` | Italic, `wght=500` | LATIN + EXTA | 16,920 | When medium italic is on the page |
| `jetbrains-mono-400.woff2` | JetBrains Mono, `wght=400` | LATIN + ARROWS | 21,108 | Every page |
| `jetbrains-mono-500.woff2` | `wght=500` | LATIN + ARROWS | 21,700 | Every page |
| `departure-mono-400.woff2` | Departure Mono Regular (static upstream) | LATIN + ARROWS + BOX | 8,612 | Pages with the terminal |
| `noto-sans-iast-greek-400.woff2` | Noto Sans, `wdth=100 wght=400` | IAST-GREEK | 7,948 | Only when such a character is on the page |
| `noto-sans-iast-greek-500.woff2` | `wdth=100 wght=500` | IAST-GREEK | 7,972 | Same |

The byte counts were measured on 2026-10-18 by running the commands in §5.4 against the pinned sources. Small differences on rebuild are expected.

**Byte budget:**
- A typical page in Latin text without italics loads 89.7 KB of fonts (Archivo, Atkinson 400 and 500, JetBrains Mono 400 and 500). The homepage adds Departure Mono: 98.3 KB.
- Ceiling for the homepage at first load, without italics or fallback glyphs: **110 KB** of woff2 (the sum of `decodedBodySize` for font requests).
- No single file over 25 KB. The whole font directory, licences excluded, at most 160 KB (measured total 147.8 KB).
- Today's eight files total 295 KB.

### 5.3 Font faces and stacks

Every `@font-face` uses `font-display: swap`, a `src` of the self-hosted woff2 only (no `local()`), and the `unicode-range` of its subset. They live in one stylesheet imported before every other stylesheet.

| Token | Stack |
|---|---|
| `--dn-font-display` | `"Archivo Expanded", "Arial Black", system-ui, sans-serif` |
| `--dn-font-body` | `"Atkinson Hyperlegible Next", "Noto Sans", "JetBrains Mono", system-ui, sans-serif` |
| `--dn-font-mono` | `"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace` |
| `--dn-font-terminal` | `"Departure Mono", "JetBrains Mono", ui-monospace, monospace` |

How the body fallback works: the browser falls back glyph by glyph along the stack. Atkinson has no `ṇ`, `α` or `→`. `Noto Sans` is declared only for IAST-GREEK, so it supplies the dot-below letters and Greek. Arrows fall through to `JetBrains Mono`, whose subset includes ARROWS and which every page already loads for labels. Noto Sans ships upright only; italic IAST is shown upright rather than faked (§7).

`index.html` preloads exactly two files with `<link rel="preload" as="font" type="font/woff2" crossorigin>`: `archivo-expanded-800.woff2` and `atkinson-next-400.woff2`.

### 5.4 Build and licence record

The woff2 files are generated once and committed. The build is a script in `scripts/fonts/` that a reviewer can rerun. It needs `uv` (no project dependency is added):

```bash
# instance a variable source (repeat per row of §5.2)
uvx --with brotli --from fonttools fonttools varLib.instancer "Archivo[wdth,wght].ttf" wdth=125 wght=800 -o archivo-expanded-800.ttf
# subset to woff2, keeping licence and URL name records
uvx --with brotli --from fonttools pyftsubset archivo-expanded-800.ttf \
  --unicodes="<ranges from §5.2>" --flavor=woff2 --layout-features='*' --name-IDs='*' \
  --output-file=public/fonts/archivo-expanded-800.woff2
```

`--name-IDs='*'` keeps name IDs 13 and 14 (licence description and URL) inside each file; pyftsubset drops them by default.

The font directory also holds:
- `OFL-<family>.txt` for each of the five families, copied verbatim from upstream.
- `SOURCES.txt`: one line per output file with family, upstream URL at the pinned commit or release, instance values, unicode ranges, and byte size.

The old files are deleted: `KHInterference-Regular.woff2`, `MarathonShapiroWide65.woff2`, `Shapiro55Middle.woff2`, `PPFraktionMono-Regular.woff2`, `PPFraktionMono-Medium.woff2`, `TTInterphasesPro-Regular.woff2`, `TTInterphasesPro-Bold.woff2`, `Sevastopol-Interface.ttf`.

## 6. Type roles

Sizes are CSS px at 1440 px unless a 390 px value is given. Tokens: `--dn-t-*` for size, `--dn-lh-*` for line height, `--dn-ls-*` for tracking.

| Role | Token | Face, weight | Size | Line height | Tracking | Case | Colour | Minimum (from #11, set A) |
|---|---|---|---|---|---|---|---|---|
| Display (page `h1`) | `--dn-t-display` | Archivo Expanded 800 | `clamp(34px, 4.1vw, 58px)` | 0.98 (`--dn-lh-display`) | −0.02 em (`--dn-ls-display`) | Sentence | `--dn-text` | ≥ 24 px at 800; line height ≥ 0.9; tracking ≥ −0.02 em; `text-wrap: balance` |
| Section heading (`h2`) | `--dn-t-h2` | Archivo Expanded 800 | 28 px | 1.1 (`--dn-lh-heading`) | −0.01 em (`--dn-ls-tight`) | Sentence | `--dn-text` | ≥ 24 px |
| Sub-heading (`h3`) | `--dn-t-h3` | Archivo Expanded 800 | 24 px | 1.1 | −0.01 em | Sentence | `--dn-text` | The display floor |
| Item title (a doc in a list) | `--dn-t-title` | Atkinson 500 | 21 px | 1.3 (`--dn-lh-title`) | 0 | Sentence | `--dn-text` | |
| Brand word | `--dn-t-brand` | Archivo Expanded 800 | 18 px | 1 | 0 | "Dinnaga Research" | `--dn-text` | The one display use under 24 px: it is the wordmark beside the logo |
| Lede | `--dn-t-lede` | Atkinson 400 | 18 px | 1.5 | 0 | Sentence | `--dn-text-2` | |
| Body | `--dn-t-body` | Atkinson 400 | 17 px | 1.55 (`--dn-lh-body`) | 0 | Sentence | `--dn-text` | Running text ≥ 16 px at 400; measure ≤ 64 ch |
| Small | `--dn-t-small` | Atkinson 400 | 15 px | 1.5 | 0 | Sentence | `--dn-text-2` | Secondary ≥ 14 px at 400, or 13 px at 500, in ≥ `#b1b1b1` |
| Meta, tested line | `--dn-t-meta` | Atkinson 400 | 14 px | 1.5 | 0 | Sentence | `--dn-text` (tested line), `--dn-text-2` (other meta) | |
| Label | `--dn-t-label` | JetBrains Mono 500 | 12 px | 1.4 (`--dn-lh-label`) | 0.06 em (`--dn-ls-label`) | Sentence; caps allowed | `--dn-text-label` | ≥ 12 px at 500; caps tracking ≤ 0.08 em; colour ≥ `#9a9a9a` |
| Data, code | `--dn-t-mono` | JetBrains Mono 400 | 14 px; inline `code` 0.9 em | 1.5 | 0 | As written | `--dn-text` | ≥ 13 px |
| Terminal body | `--dn-t-term` | Departure Mono 400 | 22 px; 16.5 px at ≤ 700 px | 1.273 (`--dn-lh-term`): 28 px, or 21 px | 0 | As written (lowercase copy per #16) | §10 | Only 22 px or 16.5 px (the face's 11 px grid) |
| Terminal chrome label | `--dn-t-label` | JetBrains Mono 500 | 12 px | 1.4 | 0.06 em | As written | `--dn-term-dim` | ≥ 12 px in ≥ `#91c319` |

Weights: only 400, 500 and 800 exist (and 400 for Departure Mono). `strong` and `b` are 500. `h1`–`h3` are 800. Nothing requests 700.

## 7. Global typographic rules

1. **Sentence case** for headings, nav, buttons, labels and terminal text. No CSS `text-transform: uppercase` except on the label role, and only where the label is ≤ 3 words of chrome (a date, a kind). Source strings that are typed in capitals for styling are rewritten in sentence case. (#16 rule 7)
2. **Caps rule:** uppercase text is JetBrains Mono, ≥ 12 px, tracking ≤ 0.08 em. Nowhere else.
3. **Tracking:** positive `letter-spacing` never exceeds 0.08 em. Negative tracking is only on display sizes, down to −0.02 em.
4. **Size floor:** no text below 12 px. The exemption is art the Cromulon draws inside an `aria-hidden` layer, marked in CSS with the comment `/* type-lint: art */` directly above the rule.
5. **No faux styles:** `font-synthesis: none` on `html`. Italic comes from the italic files; bold is 500.
6. **Headings** never end in a full stop. This is a copy rule: Pages and Honesty apply it to the words, and the styles add no trailing punctuation.
7. **No styling chrome:** no `//` prefixes, no hand-typed `0N ·` numbers, and no lime or tracked caps on eyebrows. The eyebrow classes in today's CSS (`eyebrow`, `hero-eyebrow`, `section-eye`, `panel-idx`, `practice-num`) take the label role. Whether a label stays on a page is the Pages milestone's call; this system only removes the styling and the `//` and number prefixes on components that survive the homepage cut (#15). A real sequence (the five `/method` stages) keeps numbers derived from array order. (AI tell D1)
8. **Links:** `--dn-text` with a visible underline in running text (`text-decoration-color: --dn-text-label`, offset 3px, turning `--dn-text` on hover). Nav and list-title links may drop the underline at rest and show it on hover and focus; the current page link (`aria-current="page"`) keeps it. Links never change to lime.
9. **One display moment per page:** the `h1`. Section headings are the `h2` role. (AI tell D2; layout is Pages')

## 8. Spacing, layout and motion tokens

- **Spacing:** the existing 4 px scale, renamed: `--dn-sp-1` 4px, `--dn-sp-2` 8px, `--dn-sp-3` 12px, `--dn-sp-4` 16px, `--dn-sp-5` 20px, `--dn-sp-6` 24px, `--dn-sp-7` 32px, `--dn-sp-8` 40px, `--dn-sp-9` 48px, `--dn-sp-10` 64px, `--dn-sp-11` 80px, `--dn-sp-12` 120px.
- **Layout:** `--dn-container` 1240px (the prototype's register width), `--dn-gutter` 24px, `--dn-gutter-lg` 48px, `--dn-measure` 64ch, `--dn-nav-h` 60px.
- **Radius:** none. Every surface and the tested mark are square. `50%` is allowed only on dots.
- **Shadows:** none outside the terminal. No glows.
- **Motion:** `--dn-ease-out` `cubic-bezier(0.2, 0.7, 0.2, 1)`, `--dn-ease-in-out` `cubic-bezier(0.65, 0, 0.35, 1)`, `--dn-dur-fast` 120ms, `--dn-dur-base` 160ms, `--dn-dur-med` 280ms, and for one-shot reveals only, `--dn-ease-reveal` `cubic-bezier(0.77, 0, 0.175, 1)` and `--dn-dur-slow` 560ms. Transitions are for hover and focus feedback only. No ambient `infinite` animation outside the terminal (AI tell D13).

## 9. The tested mark

Lime means tested. It appears in exactly one form.

- **Mark:** a filled square, 9 × 9 px, `background: var(--dn-tested)`, no radius, `vertical-align: 1px`, 10 px gap before the text. It is `aria-hidden="true"`.
- **Tested line:** the mark followed by a sentence that says how the doc was tested, in the meta role (Atkinson 400, 14 px, `--dn-text`). The words carry the meaning; the mark is the visual key. Lime is never the only signal.
- **Key:** where a page explains the mark ("The ■ line says how"), the key is the same mark inline in text.
- **Component:** `TestedLine` renders `<p class="tested-line"><span class="tested-mark" aria-hidden="true"></span>{children}</p>`. `TestedMark` renders the span alone, for the key.
- **Forced colours:** under `@media (forced-colors: active)` the mark uses `background: CanvasText` so it stays visible.
- **Everything else loses lime:** text, links, hover states, focus rings, borders, buttons, chips, selection, cursors, the nav's travelling square, the skip link, the logo mark, the ASCII extrusion and any glow. The terminal uses its own phosphor tokens (§4.4).
- **Allowed occurrences of the colour in source:** the `--dn-tested` definition, and the `.tested-mark` rules. A lint test enforces this (§16).

## 10. The terminal

The terminal is the site's one CRT object. This section is its look. Its art and cursor behaviour belong to the Cromulon milestone, and its words to Honesty and #16.

**Frame**
- `background: var(--dn-term-bg)`, `border: 1px solid var(--dn-term-frame)`.
- `box-shadow: 0 0 0 4px var(--dn-term-edge), 0 0 0 5px var(--dn-rule-strong), 0 0 32px rgba(184, 247, 32, 0.08)`.
- No lime border. No window dots (AI tell D11).

**Chrome bar**
- Solid `--dn-term-bar` ground, bottom border `1px solid var(--dn-term-frame)`.
- Holds one label in the terminal chrome label role (§6): JetBrains Mono 500, 12 px, tracking 0.06 em, `--dn-term-dim`, no `text-transform`. This spec does not choose its words.
- If Honesty leaves the footer strip with no true readout, the strip is removed. Any readout that stays uses the chrome label role.

**Text**
- Body and input: Departure Mono 22 px with 28 px line height (1.273); at `max-width: 700px`, 16.5 px with 21 px line height. Letter spacing 0. No `text-transform`.
- Lines and the visitor's echoed input: `--dn-term-text`, `text-shadow: 0 0 6px var(--dn-term-glow)`. Echoed input is told apart by its `>` prompt, not by colour.
- Output lines, closing messages and the placeholder: `--dn-term-dim`, placeholder at `opacity: 1`. The placeholder copy is "ask a question" with no `_` (#20).
- Prompt caret `>` and the cursor box: `--dn-term-text`. The Cromulon milestone draws the box (0.6 em × 1.05 em) and its glow `0 0 8px rgba(184, 247, 32, 0.55)`.
- The reset button: chrome label role, `1px solid var(--dn-term-dim)` border, `--dn-term-text` text; on hover and focus, border `--dn-term-text`.
- Inline colour styles in the component are replaced by classes.

**CRT effects (inside the screen only)**
- Keep the three screen layers: curvature (radial vignette), scanlines (`repeating-linear-gradient` in the phosphor colour at 0.06 alpha), flicker (3.7 s step animation on a 0.02 alpha phosphor wash).
- Under `prefers-reduced-motion: reduce`: no flicker animation.
- Under `forced-colors: active` or `prefers-contrast: more`: the three layers are hidden and `text-shadow` is `none`.
- The Cromulon's line-box knockouts (opaque `--dn-term-bg` behind each text run) hold text at full contrast over the art.

**Focus:** inside the terminal the focus ring is `2px solid var(--dn-term-text)`. The text input keeps no outline; the cursor box is its focus indicator (Cromulon).

**Variables for other milestones:** the Cromulon prototype's CSS used `--term-green`, `--term-green-dim`, `--term-bg` and `--signal`. Those become `--dn-term-text`, `--dn-term-dim`, `--dn-term-bg` and `--dn-term-text`.

## 11. Removed

| Removed | Why |
|---|---|
| The page-wide `.crt-overlay` (fixed scanlines, vignette with a lime cast, `crt-flicker` animation) and its element in the layout | #18 decision 5; it halved corner text contrast (#11); AI tell D14 |
| The `.scanlines` and `.hud-plate` utility classes | Page-level CRT effects outside the terminal; unused |
| The lime crosshair and pointer cursors | Lime outside "tested"; default cursors |
| The nav's travelling green square | Lime and ambient motion (D13) |
| Every other lime use, including `rgba(192, 254, 4, …)` glows and `#8acd00`-family ASCII extrusion shades | #18 decision 2 |
| Window dots in the terminal chrome | Fake chrome (D11) |
| Marathon Shapiro, Shapiro, KH Interference, PP Fraktion Mono, TT Interphases Pro, Sevastopol Interface | #18 decision 3; Sevastopol and 11 px Fraktion fail (#11) |
| `text-transform: uppercase` on headings, nav, buttons, eyebrows, terminal | #16 rule 7; D9 |
| Letter spacing above 0.08 em (today up to 0.24 em) | #16 rule 7 |
| Text below 12 px (today 10 and 11 px labels) | #11 |
| `#717171`, `#444` and `#5e8a00` as text colours | #18 decision 4 |
| Glow, tier, seam, status-colour and super-type tokens | No remaining role |

## 12. Migration map

Every old token is deleted. Each reference in surviving CSS is replaced as follows. "Text" means `color`; "non-text" means `background`, `border`, `outline`, `fill`, `stroke` or `box-shadow`.

| Old token | New |
|---|---|
| `--bg-0`, `--bg-1` | `--dn-bg` |
| `--bg-2`, `--surface` | `--dn-bg-raised` |
| `--surface-hi` | `--dn-bg-raised-2` |
| `--fg-1` | `--dn-text` |
| `--fg-2`, `--fg-3` | `--dn-text-2` |
| `--fg-4`, `--fg-5` | Text: `--dn-text-label`. Non-text: `--dn-ui-muted` (`--fg-4`) or `--dn-rule-strong` (`--fg-5`) |
| `--signal` | Inside terminal rules: `--dn-term-text`. Text: `--dn-text`. Background fill: `--dn-text`, with the text on it `--dn-bg`. Border: `--dn-rule-strong`. Outline: `--dn-focus` |
| `--signal-dim` | `--dn-ui-muted` |
| `--signal-glow`, `--glow-signal`, `--glow-signal-strong`, `--shadow-card`, `--inset-scanline` | Delete the declaration |
| `--warn`, `--error`, `--info` | Text: `--dn-text`. Non-text: `--dn-rule-strong` |
| `--seam`, `--seam-soft` | `--dn-rule` |
| `--seam-strong` | `--dn-rule-strong` |
| `--border-thin` / `--border-strong` / `--border-signal` | `1px solid var(--dn-rule)` / `1px solid var(--dn-rule-strong)` / `1px solid var(--dn-rule-strong)` |
| `--font-display`, `--font-display-alt` | `--dn-font-display` |
| `--font-body` | `--dn-font-body` |
| `--font-mono`, `--font-decorative` | `--dn-font-mono` |
| `--font-terminal` | `--dn-font-terminal` |
| `--t-detail-sm` (11px) | `--dn-t-label` (12px) |
| `--t-detail` (13px) | `--dn-t-meta` (14px) |
| `--t-body` | `--dn-t-body` |
| `--t-body-hi` | `--dn-t-lede` |
| `--t-h3` / `--t-h2` | `--dn-t-h3` / `--dn-t-h2` |
| `--t-h1`, `--t-super-sm`, `--t-super-md`, `--t-super` | `--dn-t-display` |
| `--lh-heading`, `--lh-super` | `--dn-lh-display` |
| `--lh-heading3` | `--dn-lh-heading` |
| `--lh-body` / `--lh-mono` | `--dn-lh-body` / `--dn-lh-label` |
| `--ls-display` / `--ls-tight` | `--dn-ls-display` / `--dn-ls-tight` |
| `--ls-body` | Delete the declaration |
| `--ls-mono`, `--ls-label`, `--ls-eyebrow`, `--ls-mega` | `--dn-ls-label` |
| `--sp-N` | `--dn-sp-N` |
| `--radius-0`, `--radius-1` | `0` |
| `--radius-full` | `50%` |
| `--ease-*`, `--dur-*` | `--dn-ease-*`, `--dn-dur-*` |
| `--nav-h`, `--container`, `--gutter`, `--gutter-lg` | `--dn-nav-h`, `--dn-container`, `--dn-gutter`, `--dn-gutter-lg` |
| `--term-green`, `--term-green-dim`, `--term-bg`, `--term-edge` | `--dn-term-text`, `--dn-term-dim`, `--dn-term-bg`, `--dn-term-edge` |
| `--tier-*` | Delete (the bench is gone) |

Rules whose only purpose is lime decoration (custom cursors, the green square, the unused hero plate, the caution stripe, the ASCII extrusion) are left for the "lime means tested" ticket, which deletes or neutralises them.

## 13. Doc-theme token targets

The viewer forces dark on screen (#19) and maps each doc family's own variables onto a small set of **doc theme tokens** at load. The Doc viewer milestone builds that mechanism (family detection, an appended `@media screen` rule with `!important` on `:host`, and font-stack rewriting in place). This section gives the values those tokens take and the few rules the mechanism must add. Layout, sizes and content stay the doc's own; no doc file is edited; print keeps each doc's own light styles.

Site tokens reach a shadow root by inheritance: `:host { all: initial }` does not reset custom properties. So the doc theme tokens are defined on `:root` in the site's token stylesheet, as references to `--dn-` tokens.

### 13.1 Doc theme tokens

| Token | Value | Resolves to | Checks (WCAG) |
|---|---|---|---|
| `--doc-bg` | `var(--dn-bg)` | `#0a0a0a` | |
| `--doc-surface` | `var(--dn-bg-raised)` | `#141414` | |
| `--doc-text` | `var(--dn-text)` | `#e8e8e8` | 16.16:1 on bg, 15.04:1 on surface |
| `--doc-text-strong` | `var(--dn-text)` | `#e8e8e8` | Headings; same as text (the site has no brighter text) |
| `--doc-muted` | `var(--dn-text-2)` | `#b8b8b8` | 9.98:1 on bg, 9.29:1 on surface. Deliberately the stronger secondary token, because docs set muted text as small as 11 px |
| `--doc-line` | `var(--dn-rule-strong)` | `#444444` | Non-text |
| `--doc-line-soft` | `var(--dn-rule)` | `#262626` | Non-text |
| `--doc-accent` | `var(--dn-text)` | `#e8e8e8` | 16.16:1. Every doc accent (Copilot purple and teal, SLAMWICH red, weekly indigo) becomes neutral: the site has no second accent, and lime is reserved |
| `--doc-accent-2` | `var(--dn-text-2)` | `#b8b8b8` | 9.98:1 |
| `--doc-accent-3` | `var(--dn-text-label)` | `#9a9a9a` | 7.04:1; as a bar fill on `--doc-line-soft`, 5.38:1 |
| `--doc-font-display` | `var(--dn-font-display)` | Archivo Expanded | New role: doc `h1` (§13.3) |
| `--doc-font-body` | `var(--dn-font-body)` | Atkinson Hyperlegible Next stack | |
| `--doc-font-mono` | `var(--dn-font-mono)` | JetBrains Mono stack | |

No doc token resolves to `#c0fe04`.

### 13.2 Family mappings

The Doc viewer draft's variable-to-role maps hold with these values. Resolved results, for the PR's checklist:

| Family | Doc variable → doc token → resolved value |
|---|---|
| Copilot sheets (both) | `--ground` → bg `#0a0a0a`; `--paper` → surface `#141414`; `--ink` → text `#e8e8e8`; `--muted` → muted `#b8b8b8`; `--line` → line `#444444`; `--line-soft` → line-soft `#262626`; `--accent` → accent `#e8e8e8`; `--accent-soft` → `color-mix(in srgb, var(--doc-accent) 12%, transparent)` (`#2d2d2d` on paper; text on it 11.24:1); `--gold`, `--gold-bar` → accent-2 `#b8b8b8`; `--ghost` → `color-mix(in srgb, var(--doc-text) 5%, transparent)` |
| SLAMWICH | As the Copilot sheets for `--ground --paper --ink --muted --line --line-soft --ghost`; `--accent`, `--accent-ink` → accent `#e8e8e8`; `--gold` → accent-2 `#b8b8b8`; `--gold-soft` → `color-mix(in srgb, var(--doc-accent-2) 20%, transparent)` (`#2d2d2d`; text 11.24:1); `--meter` → accent-3 `#9a9a9a`; `--meter-track` → line-soft `#262626` |
| Weekly reports (all 8) | `--bg` → bg; `--card` → surface; `--ink` → text; `--muted` → muted; `--line` → line `#444444`; `--accent` → accent `#e8e8e8`; `--accent2` → accent-2 `#b8b8b8`; `--accent3` → accent-3 `#9a9a9a` (bar series stay apart by lightness); `--chip` → surface |
| Quartz pages | `--light` → bg; `--lightgray` → **line-soft** `#262626`; `--gray` → muted `#b8b8b8`; `--darkgray` → text; `--dark` → text-strong; `--secondary` → accent `#e8e8e8`; `--tertiary` → accent-2 `#b8b8b8`; `--highlight` → `color-mix(in srgb, var(--doc-accent) 15%, transparent)` (`#2b2b2b`; text 11.56:1); `--textHighlight` → `color-mix(in srgb, var(--doc-accent-2) 35%, transparent)` (`#474747`; text 7.58:1); `--bodyFont`, `--headerFont` → font-body; `--titleFont` → font-display; `--codeFont` → font-mono |

One change from the Doc viewer draft: Quartz `--lightgray` maps to line-soft rather than line. Quartz uses it for code grounds and search fields as well as borders, and `#444444` under text is heavier than the site's `#262626` hairline. It also matches §14, so a fresh Quartz build and the overlay agree.

Quartz's Obsidian-theme variables (`--background-primary`, `--text-normal`, `--link-color`, `--font-text` and the rest) derive from these in Quartz's own CSS and need no separate mapping. Callout and syntax-highlighting colours stay Quartz's: they encode content, and none is `#c0fe04`.

### 13.3 Rules the mechanism adds

- **Display headings.** Append `h1 { font-family: var(--doc-font-display) !important; }` inside the same `@media screen` block. Every family's `h1` renders at 26 px or more, above the display floor; `h2`–`h6` keep the generic stack rewrite (body face). A doc `h1` asking for weight 700 gets the 800 face by normal font matching.
- **Weights.** `font-synthesis` is `none` site-wide, so doc rules asking for 600–800 in the body face render at 500, the heaviest body file. That is intended.
- **Selection.** Docs without their own selection colour use `::selection { background: rgba(232, 232, 232, 0.22); }` (composites to `#3b3b3b`; text 9.14:1).
- **Small doc labels** (11 px eyebrows, 11 px table heads) keep their size, since that is layout. They render in `--doc-muted` (`#b8b8b8`), which is why muted maps to the stronger secondary token. The docs' own letterspaced caps also remain; that is a known residual tell inside docs, not in site chrome.
- **Contrast targets** for the Doc viewer's checks: text on bg and surface ≥ 15:1; muted on bg and surface ≥ 9:1; accent on bg ≥ 15:1; every composited highlight with text on it ≥ 7:1.

## 14. Quartz config values

For the living-documents build (#19 decision 10). The dark values equal the resolved Quartz row in §13.2, so a fresh build and the viewer's overlay agree. The site's `@font-face` rules supply the faces when a page mounts in the viewer, so Quartz loads nothing from Google (`fontOrigin: local`). For the "Open standalone" escape hatch, the Quartz build adds the same `@font-face` rules, pointing at the same `/fonts/` URLs, through its custom stylesheet.

```yaml
configuration:
  theme:
    fontOrigin: local
    cdnCaching: false
    typography:
      header: Atkinson Hyperlegible Next
      body: Atkinson Hyperlegible Next
      code: JetBrains Mono
    colors:
      lightMode:            # print and the light standalone view
        light: "#ffffff"
        lightgray: "#d4d4d4"
        gray: "#595959"     # 7.00:1 on white
        darkgray: "#1a1a1a" # 17.40:1
        dark: "#0a0a0a"
        secondary: "#0a0a0a"
        tertiary: "#444444"
        highlight: rgba(10, 10, 10, 0.06)
        textHighlight: rgba(10, 10, 10, 0.15)
      darkMode:             # what the viewer shows
        light: "#0a0a0a"
        lightgray: "#262626"
        gray: "#b8b8b8"
        darkgray: "#e8e8e8"
        dark: "#e8e8e8"
        secondary: "#e8e8e8"
        tertiary: "#b8b8b8"
        highlight: rgba(232, 232, 232, 0.15)
        textHighlight: rgba(184, 184, 184, 0.35)
plugins:
  - source: "@quartz-community/quartz-fonts"
    enabled: true
    options:
      useThemeFonts: false
      fontOrigin: local
      title: '"Archivo Expanded", "Arial Black", system-ui, sans-serif'
      h1: '"Archivo Expanded", "Arial Black", system-ui, sans-serif'
      header: '"Atkinson Hyperlegible Next", "Noto Sans", system-ui, sans-serif'
      body: '"Atkinson Hyperlegible Next", "Noto Sans", "JetBrains Mono", system-ui, sans-serif'
      interface: '"Atkinson Hyperlegible Next", system-ui, sans-serif'
      code: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace'
```

`header` is the body face on purpose: in `quartz-fonts`, `h2`–`h6` inherit `header`, and only `h1` and the title take the display face. If a Quartz theme plugin (`@quartz-themes/core`) is enabled, its colours must not override these: check the computed `--light` and `--darkgray` on a built page.

## 15. Accessibility floors

These hold after every ticket in this milestone:
- **Skip link:** first focusable element, visible only on focus, `href="#main"`. Label role without caps, `background: var(--dn-text)`, `color: var(--dn-bg)` (16.16:1), 8 px × 14 px padding, top-left at 1 rem.
- **Focus-visible:** `outline: 2px solid var(--dn-focus)`, `outline-offset: 2px` (3 px on links). Never removed without a replacement. Inside the terminal, `--dn-term-text` (§10).
- **Reduced motion:** one global guard in the base styles (today there are two copies) that cuts animations and transitions to 0.001 ms and sets `scroll-behavior: auto`. The terminal flicker stops. The Cromulon settles to still.
- **Forced colours and more contrast:** the tested mark uses `CanvasText`. The terminal's CRT layers and glow are hidden.
- **Colour is never the only signal:** the tested mark always has words; links in prose are underlined.
- **Text floors** as in §4.2 and §6.

## 16. Verification

Each ticket adds its checks to the repo's test suites and keeps them.

- **Token contrast test (vitest):** reads the token stylesheet, parses each `--dn-*` hex value, and asserts the WCAG ratios in §4.2, §4.3 and §4.4 to two decimals: ≥ 7.0 for `--dn-text-label` on `--dn-bg`, ≥ 9.0 for `--dn-text-2`, ≥ 15.0 for `--dn-text`, ≥ 9.0 for `--dn-term-dim` on `--dn-term-bg`, ≥ 8.5 for `--dn-term-dim` on `--dn-term-bar`.
- **Token lint (vitest):** over every stylesheet in the app: every `var(--x)` has a definition; no old token name from §12 remains; no `color` declaration uses `--dn-rule`, `--dn-rule-strong`, `--dn-ui-muted`, `--dn-term-frame` or the literals `#717171`, `#444`, `#444444`, `#5e8a00`.
- **Type lint (vitest):** no `font-size` below 12 px (px, or rem/em below 0.75 at a 16 px root); `text-transform: uppercase` only in a rule that itself declares `font-family: var(--dn-font-mono)`; no `letter-spacing` above 0.08 em; exemption only under `/* type-lint: art */`.
- **Lime lint (vitest):** `c0fe04` (any case), `192, 254, 4` and `192,254,4` occur only in the `--dn-tested` definition; `var(--dn-tested)` occurs only in `.tested-mark` rules; `var(--dn-term-*)` occurs only in rules whose selectors all start with `.terminal`, `.t-` or `.crom`.
- **Rendered checks (Playwright, at 1440 × 900 and 390 × 844, on `/`, `/atisha`, `/method`, `/colophon`, a doc route and a 404):** body ground `rgb(10, 10, 10)`; no element or `::before`/`::after` with computed `color`, `background-color` or `border-color` of `rgb(192, 254, 4)` except `.tested-mark`; every visible text node at ≥ 12 px outside `aria-hidden` art (doc content in shadow roots or iframes is not walked); uppercase text only in JetBrains Mono; `document.fonts.check()` true for each face in use; no request for a deleted font file; font bytes on `/` ≤ 110 KB.
- **Visual review:** screenshots of the routes above at both widths attached to each pull request.

## 17. Risks and open items

- **Departure Mono at 16.5 px** sits on its 11 px grid only at 2× density (33 device px). On 1× and 3× phone screens it renders slightly soft. #18 accepted it; revisit if a 1× complaint arrives.
- **Terminal phosphor and lime look alike.** `#b8f720` reads close to `#c0fe04`. The rule is scoping (§4.4): the terminal is a diegetic screen, and the tested mark never appears inside it. If a reviewer reads the terminal as "tested", shift the phosphor toward a greener `#a8e830` and recheck §4.4's contrast.
- **The terminal flicker** stays as an infinite animation inside the terminal, per #18 decision 5. It is a 0.02 alpha wash and stops under reduced motion. If WCAG 2.2.2 review flags it, make it settle with the Cromulon's 5 s rule.
- **Noto Sans fallback is upright only.** Italic IAST renders upright. The site has three IAST characters in source today.
- **Archivo Expanded for IAST in headings:** `ā ś` are in the display subset; dot-below letters in a heading fall back to Noto Sans at 500, a visible weight drop.
- **Doc families:** the variable lists in §13.2 match today's files. A new doc family needs its own row before it ships.
- **Out of scope here:** the `og.png` card and favicon, and the Colophon's description of the type (Pages owns the words: "Set in Archivo, Atkinson Hyperlegible Next and JetBrains Mono, with Departure Mono in the terminal" is the prototype's line).

## 18. Sources

- `docs/research/type-legibility.md` on `research/type-legibility` (#11): sets A/B/C, minimums by role, colour floors, file sizes, RFNs.
- `docs/research/ai-tells.md` on `research/ai-tells` (#10): design tells D1–D15 and the palette caveat.
- `prototype/visual-directions` (f293dad): `src/routes/Home/prototype/directions.css` and `directions.tsx`.
- `prototype/cromulon` (d25a0ce): `src/routes/Home/prototype/cromulon/cromulon.css`.
- `prototype/doc-viewer` (242aee8): the adapter, for how overlays attach.
- Issues #6, #11, #15, #16, #18, #19, #20, #23, #26 and their comments.
- Upstream OFL.txt files at google/fonts `47d54ca1`, and the Departure Mono v1.500 release `LICENSE`.
- `@quartz-community/quartz-fonts` README and types, for the font option names and `fontOrigin` values.
- OFL FAQ 2.6–2.8 (subsets as Modified Versions; RFNs): https://openfontlicense.org/ofl-faq/
