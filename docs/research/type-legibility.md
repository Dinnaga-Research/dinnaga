# Type legibility audit and OFL replacement shortlist

As of 2026-09-28 · ticket #11

## Answer

- **Sevastopol Interface fails in every role it has**: terminal body, terminal chrome and footer, and the loadout readouts. It is a pixel face drawn on a 1/16-em grid, and the site sets it off-grid at 10, 11, 13, 14 and 15 px. At "14 px" it renders 7.0 px caps, a 4.4 px x-height and 4.1 px per character. A normal mono at 14 px gives 9.4–11.2 px caps and about 8.4 px per character. At 1× only 7 % of its ink pixels reach 80 % of the nominal colour. The replacements reach 25–45 %.
- **Its 10 px footer and meta text fail outright**: caps are 5 px, the colour pair is 4.40:1 (below WCAG AA) at APCA Lc 33, and the rendered core contrast is 2.7:1. The face also lacks `— · ▸ ▮ " "`, so the terminal switches font partway through a line.
- **PP Fraktion Mono fails in one role**: 10–11 px letterspaced uppercase labels in `#717171`. Its stems are the thinnest measured (0.074 em, about 0.8 px). The colour pair is 4.30:1 / Lc 28, it renders at about 3.1:1, and about 1.8:1 in the vignetted corners. A new face alone won't fix this. The label colour has to change too.
- **Marathon Shapiro, Shapiro and TT Interphases Pro pass.** TT Interphases Pro is thin at 13 px in `#9a9a9a`.
- **Set A (recommended for legibility): Archivo + Atkinson Hyperlegible Next + JetBrains Mono.** Archivo is used Expanded (wdth 125) at weight 800. JetBrains Mono covers both labels and the terminal. Swap in Cascadia Mono for the terminal if the Cromulon needs braille or sextants.
- **Set B (most CRT-like):** Anybody Expanded + Inclusive Sans + Martian Mono for labels + Departure Mono for the terminal, which must be set at 11 or 22 px.
- **Set C (one mono including braille):** Archivo + IBM Plex Sans + Commit Mono.
- **Rules that apply to every set:** labels at least 12 px in at least `#9a9a9a`. Terminal text at least 14 px (22 px for Departure Mono). Dim terminal green at least `#91c319`.

## Method

- **Pages measured.** I used my own chrome-devtools page against the dev server at `localhost:5391`. I covered all eight routes (`/`, `/atisha`, `/method`, `/colophon`, `/loadout` after the boot sequence plus the install modal, `/weekly`, `/artifacts`, `/nope`) at 1440×900 and 390×844.
- **Text styles.** Every element that holds a text node was read with `getComputedStyle`. I grouped identical style signatures.
- **Background and contrast.** I composited ancestor backgrounds and opacity to get the effective background. For gradients I took the first colour stop and marked the value with `*`. Contrast is WCAG 2.x. APCA Lc uses 0.0.98G-4g. A negative Lc means light text on a dark ground.
- **Rendered sizes.** Cap height and x-height in rendered pixels come from canvas `measureText` in the loaded face.
- **Rendered pixels.** I sampled screenshots inside each text box. "Core CR" is the contrast of the 90th-percentile ink pixel against the ground. "Solid %" is the share of ink pixels that reach 80 % of the nominal colour. Both work as proxies for stroke weight at size.
- **Viewing conditions.** 1× is the worst case: non-Retina screens and most Windows laptops. I repeated the key rows at 2×.
- **Font metrics.** fontTools gave cap and x-height (from the H and x outlines), stem width (a scanline through H at 25 % of cap height), cmap coverage, advance widths, and woff2 sizes. "Latin" means the Google Fonts `latin` unicode-range. "Term" means Latin plus U+2500–259F, U+2800–28FF and the site's own symbols.
- **Same-CSS comparison.** I built a specimen page that sets today's faces and the candidates in identical CSS (size, tracking, case, colour, glow) and measured it the same way.
- All scripts, downloads and screenshots are in the session scratch directory. None of them are in the repo.

## Measurements: today's faces, by role

These values hold at both viewports unless a mobile size is given (D = 1440, M = 390). Small-text sizes do not change responsively. Only headings scale. Grounds: `#000` for the page, `#050505` for the footer, `#0a0d0e` and `#0e1818` for loadout panels, `#050b03` for the terminal screen, and `#0e1907*` (gradient) for the terminal bars.

| Role | Selector(s) · route(s) | Face | px D / M | wt | lh | track (em) | case | fg on bg | WCAG | APCA Lc | cap / x px | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Display headline | `h1.hero-title` · `/` | Marathon Shapiro | 96 / 48 | 700 | 0.85 | −0.02 | UPPER | `#fff` / `#000` | 21 | −108 | 68.5 / 51.7 | pass |
| Section title | `.section-title` · all routes incl. 404 | Marathon Shapiro | 56 / 32 | 700 | 0.90 | −0.02 | UPPER | `#fff` / `#000` | 21 | −108 | 40.0 / 30.2 | pass |
| Sub-titles | `.practice-title`, `.panel-title` (30), `.tx-title` (64/36), `.method-name`, `.artifact-title`, `.lo-tray-title`, `.lo-modal-name` (24) | Marathon Shapiro | 24–64 | 700 | 0.90–0.95 | −0.01/−0.02 | UPPER | `#fff` / `#000`, `#0a0d0e` | 19.5–21 | −108 | ≥17.1 / 12.9 | pass |
| Display-alt | `.instr-stat b` (39 / 33), `.lo-card-name` (18 / 16) | Shapiro | 16–39 | 700 / 400 | 0.9 / normal | 0 / −0.01 | — / UPPER | `#fff` / `#000`, `#0a0d0e` | 19.5–21 | −108 | ≥11.4 / 8.5 | pass |
| Brand word | `.nav-brand .word` (16), `.foot-brand .word` (22) | Marathon Shapiro | 16 / 22 | 400→700 face | 1.45 | 0.06 / 0.04 | — | `#fff` / `#000` | 21 | −108 | 11.4 / 8.6 | pass |
| Body lede | `.hero-lede` · `/` | TT Interphases Pro | 18 | 400 | 1.50 | 0 | — | `#9a9a9a` / `#000` | 7.46 | −47.7 | 12.6 / 9.4 | pass WCAG; below APCA Lc 75 body floor |
| Body | `.panel-body` (16, `#d8d8d8`), `p.body` (15, `#fff`) · `/`, `/atisha`, `/colophon`, 404 | TT Interphases Pro | 15–16 | 400 | 1.45–1.60 | 0 | — | `#d8d8d8`/`#fff` on `#000` | 14.7–21 | −83/−108 | 11.2 / 8.3 | pass |
| Secondary body | `.practice-body` (14), `.method-detail`, `.artifact-oneliner`, `.lo-card-headline` (13) · `/`, `/method`, `/weekly`, `/loadout` | TT Interphases Pro | 13–14 | 400 | 1.45–1.55 | 0 | — | `#9a9a9a` / `#000`, `#0a0d0e` | 6.93–7.46 | −47.5 | 9.1 / 6.8 (13 px) | marginal: renders 6.3:1 core, 12 % solid |
| Flavour quote | `.lo-flavor` · `/loadout` modal | TT Interphases Pro (italic synthesised) | 15 | 400 | 1.45 | 0 | — | `#9a9a9a` / `#0a0d0e` | 6.93 | −47.5 | 10.5 / 7.8 | marginal (faux oblique) |
| Eyebrow (lime) | `.hero-eyebrow`, `.section-eye` (12), `.practice-num`, `.panel-idx` (12), `.method-num`, `.artifact-project`, `.artifact-date` (11) | PP Fraktion Mono | 11–12 | 400 | 1.45 | 0.18–0.20 | UPPER | `#c0fe04` / `#000` | 17.42 | −94.4 | 8.2 / 5.9 (12 px) | pass (small) |
| **Label (grey)** | `.data-label`, `.practice-meta`, `.instr-stat span`, `.instr-note`, `.panel-foot`, `.ascii-caption`, `.lo-gauge-label`, `.lo-tray-rule`, `.lo-stat-label`, `.lo-modal-sub`, `.lo-card-meta`, `.lo-nav-system`, `.lo-iso`, `.lo-prov` | PP Fraktion Mono | 11 | 400 | 1.45–1.70 | 0.04–0.18 | UPPER | `#717171` / `#000`, `#0a0d0e` | **4.30 / 4.00** | **−27.8** | 7.5 / 5.4 | **FAIL** AA; below APCA Lc 30 floor; renders 3.1:1 core, 3 % solid |
| **Status label** | `.nav-right` "LIVE" · every route | PP Fraktion Mono | 10 | 400 | 1.45 | 0.18 | UPPER | `#717171` / `#000` | **4.30** | **−27.8** | 6.8 / 4.9 | **FAIL**; renders 1.7:1 under the CRT vignette |
| **Footnote** | `.lo-footnote` · `/loadout` | PP Fraktion Mono | 11 | 400 | 1.45 | 0.04 | — | `#444` / `#000` | **2.16** | **−9.8** | 7.5 / 5.4 | **FAIL** (near-invisible) |
| Loadout badge | `.lo-badge` · `/loadout` | PP Fraktion Mono | **10** | 400 | 1.45 | 0.04 | lower | cyan, amber, blue, grey on `#000`/`#0a0d0e` | 6.93–14.91 | −47.5 to −84.1 | 6.8 / 4.9 | fails on size (10 px) |
| Nav | `.nav-links a` · desktop only | PP Fraktion Mono | 12 / hidden | 400 | 1.45 | 0.14 | UPPER | `#d8d8d8` / `#000` | 14.73 | −82.9 | 8.2 / 5.9 | pass (renders 10.0:1) |
| Buttons | `.btn` (13 / 500), `.btn-mini`, `.lo-hud-btn`, `.filter-chip` (11), `.lo-equip-btn` (13) | PP Fraktion Mono | 11–13 | 400–500 | normal | 0.12 | UPPER | black on lime / white on black / cyan on black | 13.85–21 | ±84–108 | 8.9 / 6.4 (13 px) | pass; 11 px buttons are small |
| Table / data | `.data-value`, `.panel-list` (13), `.data-idx` · `/` | PP Fraktion Mono | 13 | 400 | 1.45 | 0.04 | — | `#fff`/`#d8d8d8`/lime on `#000` | 14.7–21 | −83 to −108 | 8.9 / 6.3 | pass |
| **Terminal text** | `.t-line`, `.t-in`, `.t-caret` · `/` | **Sevastopol Interface** | 14 | 400 | 1.45 | 0.02 | UPPER | `#b8f720`, `#c0fe04` / `#050b03` | 15.5–16.5 | −90/−94 | **7.0 / 4.4** | **FAIL (size)**: 4.1 px per char; 7 % solid at 1× |
| Terminal placeholder | `.t-input::placeholder` "ASK A QUESTION_" | Sevastopol Interface | 14 | 400 | normal | 0.02 | UPPER | `#5e8a00` / `#050b03` | 4.84 | −33.6 | 7.0 / 4.4 | **FAIL**: renders 2.6:1 core |
| **Terminal chrome** | `.terminal-chrome-tag` (11), `.terminal-chrome-meta` (10) | Sevastopol Interface | 11 / 10 | 400 | 1.45 | 0.08 | UPPER | `#b8f720` / `#5e8a00` on `#0e1907*` | 14.1 / **4.40** | −89 / **−32.7** | **5.5 / 3.4**, **5.0 / 3.1** | **FAIL (size; meta also colour)** |
| **Terminal footer** | `.terminal-foot` · `/` | Sevastopol Interface | 10 | 400 | 1.45 | 0.08 | UPPER | `#5e8a00` / `#0e1907*` | **4.40** | **−32.7** | **5.0 / 3.1** | **FAIL**: renders 2.7–2.9:1 core, 1–3 % solid |
| **Loadout readouts** | `.lo-boot-line`, `.lo-stat-row`, `.lo-buff`, `.lo-build-line`, `.lo-nav-slot` (13); `.lo-gauge`, `.lo-nav-occupant` (11); `.lo-unpowered` (15, 0.24 em) | **Sevastopol Interface** | 11–15 | 400 | 1.40–1.45 | 0–0.24 | mixed | cyan, `#d8d8d8`, `#9a9a9a`, `#62d96b`, `#717171` on `#000`/`#0a0d0e`/`#0e1818` | 3.69–14.9 | −27 to −84 | **6.5 / 4.1** (13 px), **5.5 / 3.4** (11 px) | **FAIL (size)**; `L0` slot label renders 3.5:1 |
| Ticker | `.ticker-text` · `/` | PP Fraktion Mono | 11 | 400 | 1.45 | 0.18 | UPPER | `#c0fe04` / `#000` | 17.42 | −94.4 | 7.5 / 5.4 | pass contrast, small |
| Footer links | `.foot-col a` | PP Fraktion Mono | 12 | 400 | 1.45 | 0.06 | — | `#d8d8d8` / `#050505` | 14.3 | −82.9 | 8.2 / 5.9 | pass |
| **Footer grey** | `.foot-col h4` (11, 700: **faux bold**), `.foot-brand p` (12), `.foot-meta` (11, 0.14 em) | PP Fraktion Mono | 11–12 | 400/700 | 1.45–1.5 | 0–0.18 | UPPER | `#717171` / `#050505` | **4.18** | **−27.8** | 7.5 / 5.4 | **FAIL**; corners render 1.9:1 under the vignette |
| Cookie bar | `.cookie-text` (12), `.cookie-tag` (11 / 500) | PP Fraktion Mono | 11–12 | 400–500 | 1.45 | 0.02–0.12 | mixed | `#000` / `#c0fe04` | 17.42 | 93.8 | 8.2 / 5.9 | pass |
| ASCII block | `.ascii-stack pre` · `/` | PP Fraktion Mono (glyphs come from fallback) | 12.6 / 10.8 | 400 | 1.05 | 0 | — | `#c0fe04` / `#050505` | 16.9 | −94.4 | — | `█▓▒░╔═╗…` are not in the face, so they draw from whatever OS mono the visitor has |

**Rendered versus nominal contrast, from live-page screenshots at 1×:**

| Text | Nominal WCAG | Rendered core | Solid ink |
|---|---|---|---|
| Nav link, 12 px Fraktion | 14.73 | 9.98 | 2 % |
| Grey label, 11 px Fraktion (loadout) | 4.00 | 3.09 | 4 % |
| "LIVE", 10 px (top-right corner) | 4.30 | **1.73** | 0 % |
| Footer meta, left and right corners | 4.18 | **1.92** | 0 % |
| Footer meta, centre | 4.18 | 3.14 | 3 % |
| Terminal line, 14 px Sevastopol | 15.50 | 7.97 | 0 % |
| Terminal chrome meta, 10 px | 4.40 | 2.67 | 1 % |
| Terminal footer, 10 px | 4.40 | 2.92 | 3 % |
| Placeholder, 14 px | 4.84 | 2.59 | 0 % |
| Loadout stat value, 13 px Sevastopol | 13.68 | 7.96 | 0 % |
| Hero lede, 18 px Interphases | 7.46 | 7.52 | 32 % |
| H1, 96 px Marathon | 21 | 21 | 93 % |

### Why these faces fail

**Sevastopol Interface**
- **Off-grid pixel font.** The outlines sit on a 1/16-em grid: stem 64/1024 em, cap 8 units (0.50 em), x-height 5 units (0.31 em), advance 5 units (0.31 em, about half a normal mono's 0.60 em). Every size the site uses (10/11/13/14/15 px) puts one design pixel at 0.63–0.94 device px, so every stem is smeared. Set on-grid at 16 px, the same face renders 100 % solid pixels. At 14 px it renders 7 %.
- **Too small at any resolution.** At 2× the stroke problem mostly goes away (48 % solid against 53–68 % for the candidates), but the size problem does not. A "14 px" line is 126 px wide for 31 characters. Every candidate at the same CSS size is 263–312 px wide.
- **All caps.** Every terminal line is uppercase, which removes word shapes.
- **Missing glyphs.** The face has 180 glyphs and no Latin Extended-A. It lacks `— · ▸ ▮ " "`, which the terminal uses. Those characters fall through to PP Fraktion Mono, which itself lacks `▸ ▮`, and then to the OS mono.

**PP Fraktion Mono in the label role**
- **Thinnest stems measured.** The Regular stem is 0.074 em. That is 0.81 px at 11 px and 0.74 px at 10 px. The candidates range from 0.084 to 0.114 em.
- **Colour below the floor.** The labels pair it with `#717171`, which is already under 4.5:1 on every ground used: 4.30 on `#000`, 4.18 on `#050505`, 4.00 on `#0a0d0e`, 3.69 on `#0e1818`. It also sits under APCA's absolute Lc 30 floor for any text.
- **Synthesised bold.** Footer column headings ask for weight 700. The family only ships 400 and 500, so the browser synthesises the bold.
- **Fine in other roles.** At 12–13 px in `#d8d8d8` (nav, data values) the face is legible.

**Not a font problem, same symptom: the CRT overlay.** The `.crt-overlay` vignette (overlay blend, up to 55 % black at the edges) roughly halves the contrast of mid-grey text near the viewport corners: 1.7–1.9:1 there against 3.1–3.3:1 at the centre.

**Other faces**
- KH Interference is only referenced by the loadout's compromised and glitch states. Those states were not reached during the audit, so the face never loaded.
- TT Interphases Pro Bold is declared but never used.

## Same CSS, different face (specimen, measured)

Each row sets the same string with the site's CSS for that role. The grey label is 11 px, 0.12 em, uppercase, `#717171` on `#000`.

| Face | Terminal 14 px: cap / x px | Solid at 1× / 2× | Footer 10 px `#5e8a00`: cap px, core CR at 1× | Label 11 px grey: cap px, core CR at 1×, solid |
|---|---|---|---|---|
| Sevastopol Interface (today) | 7.0 / 4.4 | 7 % / 48 % | 5.0, 2.68 | — |
| PP Fraktion Mono (today) | — | — | — | 7.5, 3.14, 3 % |
| JetBrains Mono | 10.2 / 7.7 | 40 % / 58 % | 7.3, 3.72 | 8.0, 3.71, 18 % |
| Cascadia Mono | 9.7 / 7.2 | 37 % / 63 % | 6.9, **4.40** | 7.6, **4.30**, 26 % |
| Commit Mono | 9.8 / 7.6 | 25 % / 57 % | 7.0, 3.58 | 7.7, 3.50, 4 % |
| Departure Mono at 14 px (off-grid) | 10.2 / 7.6 | 36 % / 56 % | 7.3, 3.92 | 8.0, **4.30**, 43 % |
| Departure Mono at **11 / 22 px** (on-grid) | 8.0 / 6.0 and 16 / 12 | **100 % / 100 %** | — | — |
| Martian Mono | 11.2 / 8.4 | 45 % / 68 % | 8.0, **4.40** | 8.8, **4.30**, 40 % |
| Monaspace Krypton | 10.2 / 7.2 | 44 % / 59 % | 7.3, 4.08 | 8.0, 4.06, 23 % |
| IBM Plex Mono | 9.8 / 7.2 | 28 % / 53 % | 7.0, 3.44 | 7.7, 3.55, 8 % |
| Atkinson Hyperlegible Mono | 9.4 / 6.9 | 37 % / 55 % | 6.7, 3.25 | 7.3, 3.60, 7 % |

For body text at 13 px in `#9a9a9a` on `#000` (nominal 7.46:1), core CR and solid share at 1×:
- TT Interphases Pro (today): 6.33 / 12 %
- Atkinson Hyperlegible Next: 7.28 / 27 %
- Inclusive Sans: 6.92 / 26 %
- IBM Plex Sans: 6.33 / 12 %
- Recursive Sans: 7.46 / 28 %
- Lexend: 7.46 / 33 %
- Source Sans 3: 6.49 / 15 %

No face lifts 10–11 px text in `#717171` or `#5e8a00` to 4.5:1. That ceiling is set by the colour, so the colour tokens have to move along with the face.

## Shortlist by role

All licences below were confirmed from the `OFL.txt` or `LICENSE` file shipped with the font (google/fonts `ofl/<family>/OFL.txt`, or the upstream release). Every one is SIL OFL 1.1.
- **Metrics:** measured at the default or listed instance: cap and x in em, x/cap ratio, stem = H stem in em.
- **woff2:** static instance, subset by me, Latin unless noted.
- **RFN** is a Reserved Font Name. Under OFL FAQ 2.6–2.8, a Latin subset counts as a Modified Version, so it can't keep a reserved name. Families with an RFN must be renamed internally when subset, or served unmodified.
- **Hinted:** TrueType instructions are present in every Google Fonts build. Monaspace, Commit Mono (OTF) and Departure Mono are unhinted, as noted in their rows.

### Display (replaces Marathon Shapiro Wide 65 and Shapiro)

Today's reference: cap 0.714, x/cap 0.75, average uppercase width 0.885 em, stem/cap 0.244, woff2 20.5 KB.

| Face | Licence and source | Axes | Metrics at the display instance | Coverage | woff2 | Fit |
|---|---|---|---|---|---|---|
| **Archivo** | OFL 1.1, Omnibus-Type, no RFN. [Specimen](https://fonts.google.com/specimen/Archivo) · [repo](https://github.com/Omnibus-Type/Archivo) · [OFL.txt](https://github.com/google/fonts/blob/main/ofl/archivo/OFL.txt) | wdth 62–125, wght 100–900, italics | wdth 125 / wght 800: cap 0.688, x/cap 0.77, uppercase width 0.910, stem/cap 0.295 | Latin, Latin Ext, Vietnamese. README claims 200+ languages. | 14.7 KB (variable Latin subset 95 KB) | Closest match to today's wide heavy uppercase. A "grotesque reminiscent of late nineteenth century" (README): archival, not templated. One family also covers display-alt numerals at wdth 100 / wght 600. |
| **Anybody** | OFL 1.1, Etcetera Type Co, no RFN. [Specimen](https://fonts.google.com/specimen/Anybody) · [repo](https://github.com/Etcetera-Type-Co/Anybody) | wdth **50–150**, wght 100–900, italics | wdth 150 / wght 800: cap 0.675, x/cap 0.87, uppercase width 1.074, stem/cap 0.370. At wdth 125 the width is 0.889, the same as today. | Latin, Latin Ext, Vietnamese | 12.6 KB | The widest range of any candidate, so it can serve as a signature headline and animate width. The very large x-height makes lowercase read big. |
| **Hubot Sans** | OFL 1.1, GitHub, **RFN "Hubot"**. [Specimen](https://fonts.google.com/specimen/Hubot+Sans) · [repo](https://github.com/github/hubot-sans) | wdth 75–125, wght 200–900, italics | wdth 125 / wght 800: cap 0.729, x/cap 0.74, uppercase width 0.910, stem/cap 0.305 | Latin, Latin Ext, Vietnamese | 25.8 KB | "Geometric accents to lend a technical and idiosyncratic feel" (README). Caveat: it is GitHub's own marketing face, so the audience will recognise it. |
| Unbounded (caution) | OFL 1.1, no RFN. [Specimen](https://fonts.google.com/specimen/Unbounded) · [repo](https://github.com/googlefonts/unbounded) | wght 200–900 | wght 800: cap 0.750, uppercase width 0.904, stem/cap 0.311 | Latin, Cyrillic | 26.3 KB | Wide and heavy out of the box, but it was "funded by the Polkadot treasury" (README) and reads strongly web3. Listed so it can be ruled out on purpose. |

Also considered: Lexend Zetta (wide, but stem/cap is only 0.243 at 700) and Tektur (not wide enough).

### Body text (replaces TT Interphases Pro)

Today's reference: cap 0.700, x 0.520, x/cap 0.74, stem 0.085, 22.9 KB, no italic file.

| Face | Licence and source | Axes | Metrics | Small-size evidence (13 px `#9a9a9a`) | Coverage of the site's body glyphs `→ ā ṇ α – ' " "` | woff2 | Fit |
|---|---|---|---|---|---|---|---|
| **Atkinson Hyperlegible Next** | OFL 1.1, Braille Institute, no RFN. [Specimen](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next) · [Braille Institute](https://www.brailleinstitute.org/freefont/) · [repo](https://github.com/googlefonts/atkinson-hyperlegible-next) | wght 200–800, italics (7 weights) | cap 0.668, x 0.496 (0.74), stem **0.094** | core 7.28:1, **27 % solid** (today 6.33, 12 %) | **Missing `→ ṇ α`**. Latin and Latin Ext. The institute claims 150+ languages. | 11.8 KB | Letterforms designed for low-vision readers, and a distinctive voice. Needs a small `unicode-range` fallback for the three missing glyphs. |
| **Inclusive Sans** | OFL 1.1, Inclusive Sans project, no RFN. [Specimen](https://fonts.google.com/specimen/Inclusive+Sans) · [repo](https://github.com/LivKing/Inclusive-Sans) | wght 300–700, italics | cap 0.700, x 0.500 (0.71), stem 0.088 | 6.92:1, 26 % | Missing `α` only. Latin, Latin Ext, Vietnamese. | 12.0 KB | "Designed for accessibility and readability… a higher x-height for easier readability at small sizes" (README). A friendly neo-grotesque. |
| **IBM Plex Sans** | OFL 1.1, IBM, **RFN "Plex"**. [Specimen](https://fonts.google.com/specimen/IBM+Plex+Sans) · [repo](https://github.com/googlefonts/plex) | wght 100–700, wdth 75–100, italics | cap 0.698, x 0.516 (0.74), stem 0.084 | 6.33:1, 12 % at 400, no better than today. Use 450–500. | Missing `ṇ` only. Greek, Cyrillic, Vietnamese. | 22.4 KB | An engineered research-lab tone. Needs a heavier weight than 400 to improve on today's face. |
| **Recursive Sans Linear** | OFL 1.1, Arrow Type, no RFN. [Specimen](https://fonts.google.com/specimen/Recursive) · [repo](https://github.com/arrowtype/recursive) | MONO 0–1, CASL 0–1, wght 300–1000, slnt, CRSV | cap 0.700, x 0.532 (0.76), stem 0.095 | **7.46:1, 28 %** (best) | **Complete** | 37 KB static; the full variable Latin subset is **423 KB** | One family also yields a matching mono (MONO=1) for data. The CASL axis could carry the site's "whimsy". The byte cost is high if the axes stay live. |

Fallback with full coverage: Source Sans 3 (OFL, RFN "Source", 27.4 KB) covers every body glyph, but its x-height (0.486) is the smallest here.

### UI and label mono (replaces PP Fraktion Mono)

| Face | Licence and source | Axes | Metrics | Label evidence (11 px) | Coverage | woff2 | Fit |
|---|---|---|---|---|---|---|---|
| **JetBrains Mono** | OFL 1.1, JetBrains, no RFN. [Specimen](https://fonts.google.com/specimen/JetBrains+Mono) · [repo](https://github.com/JetBrains/JetBrainsMono) | wght 100–800, italics | cap 0.730, x **0.550** (0.75), stem 0.090 at 400 and 0.108 at 500 | cap 8.0 px, 3.71:1, 18 % solid | Box and blocks yes. Braille no. Missing `⊕ ▮`. Greek, Cyrillic. | 20.5 KB | "The height of the lowercase is maximized… helps improve rendering in small size" (README). Neutral and dev-native. One file can serve labels and the terminal. |
| **Martian Mono** | OFL 1.1, Evil Martians, no RFN. [Specimen](https://fonts.google.com/specimen/Martian+Mono) · [repo](https://github.com/evilmartians/mono) | wght 100–800, wdth 75–112.5 | cap **0.800**, x **0.600** (0.75), stem **0.114**, width 0.70 em at wdth 100 | cap **8.8 px**, colour reaches nominal, 40 % solid | **No box or blocks.** Missing `▸` and most site symbols. Cyrillic. | 10.0 KB | "Brutalist and eye-catching" with a "tall x-height" (README). It has the strongest HUD voice here. Wide, so tighten tracking to about 0.06 em. |
| **Monaspace Krypton** | OFL 1.1, GitHub Next, **RFN "Monaspace" plus subfamily names**. [repo and LICENSE](https://github.com/githubnext/monaspace) | wght 200–800, wdth 100–125, slnt | cap 0.730, x 0.513 (0.70), stem 0.098, unhinted | 8.0 px, 4.06:1, 23 % | **Every site mono glyph**, box and blocks. Braille no. | 22.6 KB (the full variable Latin subset is 87 KB) | A "mechanical" voice with texture healing via `calt`. Unhinted, so small sizes may render worse on Windows. |
| Atkinson Hyperlegible Mono | OFL 1.1, Braille Institute, no RFN. [Specimen](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Mono) | wght 200–800, italics | cap **0.668**, x 0.496, stem 0.088 | cap 7.3 px, **smaller than today's**, 3.60:1 | No box or blocks. Missing `→`. | 9.9 KB | Only worth it as a systemic match for Atkinson Hyperlegible Next, and only at 12 px or more. |

### Terminal mono (replaces Sevastopol Interface)

| Face | Licence and source | Axes | Metrics | Terminal evidence | Cromulon coverage | woff2 (Latin / term) | Fit |
|---|---|---|---|---|---|---|---|
| **Cascadia Mono** | OFL 1.1, Microsoft, **RFN "Cascadia Code"** in the OFL.txt for both families. [Specimen](https://fonts.google.com/specimen/Cascadia+Mono) · [repo](https://github.com/microsoft/cascadia-code) | wght 200–700, italics | cap 0.693, x 0.518, stem **0.102** | 14 px: cap 9.7 px, 63 % solid at 2×. The 10 px footer is the only candidate that reaches nominal contrast. | **Complete.** Box 128/128, blocks 32/32, braille 256/256, legacy computing 168 including all 60 sextants. | 17.5 / 23.0 KB | Carries any Cromulon technique. Familiar from Windows Terminal. |
| **Commit Mono** | OFL 1.1, no RFN. [Site](https://commitmono.com) · [repo](https://github.com/eigilnikolajsen/commit-mono) | 400 and 700 static, italics | cap 0.700, x 0.540, stem 0.087. OTF is unhinted; a ttfautohint TTF ships too. | 14 px: cap 9.8 px. The 10 px footer is weak (3.58:1), so use 12 px or more. | Box 127/128 (lacks U+252D), blocks 32, **braille 256**. Missing `▸ ⊕ ⚠ ↗`. | 20.6 / 25.5 KB | Describes itself as "an anonymous and neutral coding font" (site). That fits an anonymous lab. Not on Google Fonts. Fontsource has it. |
| **Departure Mono** | OFL 1.1, no RFN. [Site](https://departuremono.com) · [repo README](https://github.com/rektdeckard/departure-mono) | 1 weight | 11-unit grid: cap 0.727 (8/11), x 0.545 (6/11), stem 1/11 em. Unhinted, which doesn't matter on-grid. | **100 % solid at 11 and 22 px** at both 1× and 2×. At 11 px the cap is 8 px, already bigger than Sevastopol at 14 px. | Box 128, blocks 32, shades drawn as pixel dithers. **Braille no.** Missing `▸ ⊕ ✕ ⚠ ◆ ◇ ▮`. | **6.5 / 8.6 KB** | The most CRT-authentic option, and it directly fixes Sevastopol's failure mode. The README says: "For pixel-perfect results, set the font size to increments of 11px." Not on Google Fonts or Fontsource; self-host the release woff2. |
| **JetBrains Mono** | As in the label table | | | 14 px: cap 10.2 px, 40 % solid at 1×, 58 % at 2× | Box and blocks yes. Braille no. | 20.5 / 22.8 KB | One mono for the whole site, if the Cromulon avoids braille. |

Rejected:
- **VT323:** cap 0.56 em, no box drawing.
- **IBM Plex Mono and Fira Code:** no braille. Fira's full block is 1.2 em inside a 1.31 em line box, which leaves gaps at normal line-height.
- **Intel One Mono:** x-height only 0.465, missing `→`.
- **Geist Mono:** Vercel's house face and a very common default in generated sites.
- **Iosevka and JuliaMono:** not downloaded (release archives of roughly 140 MB and 22 MB). Their coverage is broad, but Iosevka's 0.5 em cell is narrow for uppercase HUD text.

## Terminal glyph coverage (Cromulon)

- **Cell** means every glyph in U+2500–259F and U+2800–28FF has the same advance as `0`.
- **█ span** is the full block's height in em. It's the `line-height` at which blocks tile vertically without seams. I checked this by eye at 2×: rows tiled cleanly at that line-height and showed gaps at the site's current 1.45.

| Face | Box U+2500–257F | Blocks U+2580–259F | Shades ░▒▓█ | Braille U+2800–28FF | Sextants U+1FB00–1FB3B | Cell-aligned | █ span = seamless lh | Site mono glyphs missing |
|---|---|---|---|---|---|---|---|---|
| Sevastopol Interface (today) | 0 | 0 | — | 0 | 0 | — | — | `— · ▸ █▓▒░ box ⊕ ✕ ⚠ ↗ ◆ ◇ ▮ " " ρ α` |
| PP Fraktion Mono (today) | 0 | 0 | — | 0 | 0 | — | — | `▸ █▓▒░ box ⊕ ✕ ⚠ ◆ ◇ ▮ ρ α` (today's ASCII art already draws from OS fallback) |
| **Cascadia Mono** | 128/128 | 32/32 | ✓ | **256/256** | **60/60** | ✓ (0.586 em) | 1.321 | `⊕ ✕ ⚠ ↗` |
| **Commit Mono** | 127/128 | 32/32 | ✓ | **256/256** | 0 | ✓ (0.600) | 1.100 (= line box) | `▸ ⊕ ⚠ ↗` |
| JetBrains Mono | 128/128 | 32/32 | ✓ | 0 | 0 | ✓ (0.600) | 1.320 (= line box) | `⊕ ▮` |
| Departure Mono | 128/128 | 32/32 | ✓ (dithered) | 0 | 0 | ✓ (0.636) | 1.273 | `▸ ⊕ ✕ ⚠ ◆ ◇ ▮` |
| Monaspace Krypton / Neon | 128/128 | 32/32 | ✓ | 0 | 0 | ✓ (0.620) | 1.255 | none |
| IBM Plex Mono | 128/128 | 32/32 | ✓ | 0 | 0 | ✓ (0.600) | 1.300 (= line box) | `▸ ⊕ ✕ ⚠ ◆ ◇ ▮ ρ α` |
| Fira Code | 128/128 | 32/32 | ✓ | 0 | 0 | ✓ (0.600) | 1.200 (line box 1.312) | `▸ ⊕ ✕ ⚠` |
| Martian Mono / Atkinson Hyperlegible Mono | 0 | 0 | — | 0 | 0 | — | — | most |

**What happens when a braille glyph is missing:** the browser draws it from a system font with a different advance. In the 2× test that pushed the closing `│` out of line on every braille row for JetBrains, Plex and Departure. Commit and Cascadia stayed aligned.

**If the Cromulon uses braille or sextants**, the terminal face must be Cascadia Mono or Commit Mono. An alternative is to keep another terminal face and load one of them through `@font-face` `unicode-range: U+2800-28FF, U+1FB00-1FBFF` as a glyph-only fallback. Subsets are about 3–10 KB, and the RFN rename applies for Cascadia.

## Pairing sets

**Set A: "Hyperlegible instrument".** Recommended when legibility per byte is the priority.
- **Faces:**
  - Display: Archivo at wdth 125, wght 800. Display-alt numerals use Archivo at wdth 100, wght 600.
  - Body: Atkinson Hyperlegible Next, weights 400 and 500, with italics.
  - UI, labels and terminal: JetBrains Mono at 500 for labels and 400 for the terminal.
  - Fallbacks: a Source Sans 3 subset limited to `→ ṇ α` via `unicode-range`. Add a Cascadia Mono braille and sextant subset only if the Cromulon needs it.
- **Why:**
  - Its body and mono faces showed the largest measured gains at small sizes (label 18 % solid against 3 %; body 13 px 27 % against 12 %).
  - One mono file (about 21 KB) serves labels, data and the terminal on the same cell grid.
  - No RFNs outside the optional Cascadia subset, so everything can be subset freely.
  - About 80 KB for the five static Latin cuts (Archivo 800, Atkinson Next 400 and 500, JetBrains Mono 400 and 500), before italics.
- **Minimums by role:**
  - Display: at least 24 px at 800. `line-height` 0.9. Tracking down to −0.02 em.
  - Body: at least 16 px at 400 for running text. Secondary text at least 14 px at 400, or 13 px at 500, in at least `#b1b1b1` (Lc 60).
  - Labels: at least 12 px at 500, uppercase tracking no more than 0.10 em, colour at least `#9a9a9a`.
  - Terminal: at least 14 px at 400 in sentence case, `line-height` 1.32 for any block art. Chrome and footer at least 12 px, colour at least `#91c319`.

**Set B: "CRT authentic".** Recommended when the terminal's character matters most.
- **Faces:**
  - Display: Anybody at wdth 150, wght 800.
  - Body: Inclusive Sans, weights 400 and 500, with italics.
  - UI and labels: Martian Mono at wdth 100, weights 400 and 500.
  - Terminal: Departure Mono.
  - Fallback: a Cascadia Mono braille subset, and a small symbol fallback for `▸ ▮ ⊕ ✕ ⚠`.
- **Why:**
  - It replaces the broken pixel font with a pixel font that is used on its grid. That fixes the actual failure mode (100 % solid glyphs) and keeps the lo-fi CRT feel.
  - Martian's 0.80 em caps make a 12 px label read like 14 px.
  - Anybody gives the lab a signature headline that doesn't look templated.
  - Departure is the lightest terminal option: 8.6 KB with box drawing and blocks.
- **Minimums by role:**
  - Display: at least 28 px, because of the big x-height.
  - Body: at least 16 px at 400. Secondary at least 14 px.
  - Labels: at least 12 px at 400, tracking 0.06–0.08 em (the face is already wide).
  - Terminal: 22 px for body lines and 11 px only for chrome and footer. Allow 16.5 px only on screens at 2× or higher. Set `line-height` to 14/11 (1.273) for block art. Sentence case. Colours as in Set A.

**Set C: "Anonymous and neutral".** One mono that includes braille.
- **Faces:**
  - Display: Archivo at wdth 125, wght 800. Hubot Sans works if the GitHub association is acceptable.
  - Body: IBM Plex Sans at 450 (variable) with italics.
  - UI, labels and terminal, including a braille Cromulon: Commit Mono at 400 and 700.
- **Why:**
  - The only set where one mono file covers labels, the terminal and a braille Cromulon with no fallback.
  - Commit Mono's own positioning ("anonymous and neutral") matches the lab.
  - Plex brings Greek, Cyrillic and Vietnamese and a research-lab tone.
- **Costs:**
  - The Plex RFN means rename-on-subset.
  - Commit Mono's thinner stems (0.087 em) require at least 12 px everywhere, including the terminal footer.
- **Minimums by role:** as in Set A, except body text at weight 450 or more (Plex at 400 measured no better than today) and every mono text at least 12 px.

**Colour rules for every set.** These are needed because no face fixes the colour ceiling.
- Stop using `--fg-4 #717171` and `--fg-5 #444` for text. Keep them for rules and dots.
- Text floor on the dark grounds: `#9a9a9a`. That is 6.4–7.5:1 and Lc 47–48.
- Dim terminal green floor: `#91c319`. That is 8.6:1 and Lc 60 on `#0e1907`. The absolute minimum is `#7ba515` (6.2:1, Lc 45).
- APCA targets on `#000`: Lc 60 is `#b1b1b1`, Lc 75 (body columns) is `#cbcbcb`, and Lc 90 is `#e4e4e4`.

## Open questions for the operator

1. **Which set?** A (legibility first), B (CRT character), C (one braille-capable mono), or a hybrid? For example, Set A with Departure Mono in the terminal.
2. **Cromulon technique.** The sibling ticket decides this. Does it need braille or sextants? If yes, the terminal face is Cascadia Mono or Commit Mono, or another face plus a glyph-only subset of one of them.
3. **Colour tokens.** Can the text colours change as well: retire `#717171` and `#444` for text, raise the dim terminal green to at least `#91c319`? Without that, labels still fail WCAG AA whatever the face.
4. **Terminal case.** Keep ALL-CAPS terminal lines, or switch body lines to sentence case and keep caps for chrome labels?
5. **CRT vignette.** Can it be softened, or kept off text near the viewport edges? It currently halves the contrast of corner text.
6. **RFN families (Plex, Cascadia, Hubot, Monaspace).** Is it acceptable to rename them internally when subsetting, or should we stay with no-RFN faces so they can be subset freely?
7. **Variable or static.** Ship variable fonts (width animation on Anybody or Archivo, CASL on Recursive; 5–10× the bytes) or static instances only?
8. **Italics and scripts.** Are true italics needed? Must body text render IAST (`ā ṇ`) and Greek (`α`) natively, or is a `unicode-range` fallback acceptable?
9. **Decorative face.** Is a replacement for KH Interference needed at all, given it only appears in the loadout's compromised and glitch state?

## Sources

- Licences and metadata:
  - google/fonts `ofl/<family>/OFL.txt` and `METADATA.pb` for every Google Fonts candidate, for example https://github.com/google/fonts/blob/main/ofl/archivo/OFL.txt
  - Monaspace LICENSE (OFL-1.1, RFN "Monaspace"): https://github.com/githubnext/monaspace
  - Departure Mono LICENSE in the v1.500 release: https://github.com/rektdeckard/departure-mono
  - Commit Mono license.txt in the v1.143 release: https://github.com/eigilnikolajsen/commit-mono
  - Fontsource packages checked with `npm view` (OFL-1.1 for Commit Mono, Cascadia Mono, JetBrains Mono, Atkinson Hyperlegible Next and Mono, Archivo, Anybody, Martian Mono, Inclusive Sans, Monaspace Krypton; none for Departure Mono).
- OFL FAQ on WOFF (2.2), subsetting as modification (2.6), RFN on optimised webfonts (2.7) and Functional Equivalence (2.8): https://openfontlicense.org/ofl-faq/
- APCA Bronze Simple Mode thresholds (Lc 90/75/60/45/30/15): https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html
- WCAG 2.2 SC 1.4.3 Contrast (Minimum): https://www.w3.org/TR/WCAG22/#contrast-minimum
- Braille Institute, Atkinson Hyperlegible Next and Mono: https://www.brailleinstitute.org/freefont/
- Upstream READMEs quoted above: JetBrains/JetBrainsMono, evilmartians/mono, Omnibus-Type/Archivo, Etcetera-Type-Co/Anybody, github/hubot-sans, googlefonts/unbounded, LivKing/Inclusive-Sans, githubnext/monaspace, rektdeckard/departure-mono, and commitmono.com.
- Every metric, coverage count and woff2 size in this document was measured locally with fontTools. Every rendered-contrast figure was measured from Chrome screenshots of `localhost:5391` and a local specimen page.
