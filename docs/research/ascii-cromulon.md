# ASCII-art techniques for the Cromulon

As of 2026-09-28 · research ticket #12 · feeds the prototype ticket #20

## Answer

1. **The best default is a static sub-cell halftone on its own fine grid.** Use braille dots, or a dense character ramp at about 7px, built from an *original* Cromulon picture or model. Bake it at build time and draw it at 20–30% opacity behind the text. Give the text lines an opaque "knockout" backing. In the scratch test this was the only variant where the face read clearly and every text line kept its original contrast.
2. **Hand-drawn line art in plain ASCII is the most on-model option for a flat cartoon, and the cheapest.** Its risk is drawing quality, not technology. LLMs draw ASCII poorly, so the art needs human iteration. A small planet and stars give the scale that turns "a face" into "a giant floating head".
3. **Live renderers are feasible but cost a lot.** Three.js `AsciiEffect`, ASCII post-processing shaders, textmode.js and SDF raymarching all work. They add 64–194 KB gzipped or a custom renderer. Any idle motion must also end within 5 seconds or have a pause control (WCAG 2.2.2).
4. **Motion should be event-driven or time-bounded, and fully static under `prefers-reduced-motion`.** Event-driven means reacting to keystrokes or the unlock.
5. **Mobile blocks every technique.** Today's mobile screen shows about 5 text rows and clips the boot text. No technique made a face readable behind 5 full-width rows, so the layout needs a decision first.

---

## 1. Measured constraints

These come from the live site on 2026-09-28 (Chrome DevTools, `.terminal` / `.terminal-screen` / `.terminal-body`) and from the repo (`src/components/Terminal.tsx`, `src/styles/site.css`).

| | Desktop (1440 viewport) | Mobile (375 viewport) |
|---|---|---|
| `.terminal` box | 560 × 520 px | 348 × 217 px (`aspect-ratio: 16/10`) |
| `.terminal-screen` | 558 × 454 px, 20/18 px padding | 346 × 151 px |
| Text grid (14px, line-height 20.3px) | 71 cols × 20 rows with today's Sevastopol (7.28px advance); **~59 cols** with a 0.6em-advance OFL mono | ~35 cols (0.6em mono) × **~5 visible rows** |
| Boot text height | 231 px (fits) | 267 px of content clipped to 151 px (overflow hidden) |

What follows from this:

- **The art layer does not have to share the text grid.** A `<pre>` or canvas at 6–7px gives 85–123 columns and 19–58 rows in the same box. The text's 14px grid caps a face at about 47×20 cells on desktop and about 13×5 on mobile.
- **Desktop has free space.** After boot, most lines are 19–33 characters long, so the right ~40% and the bottom ~40% of the screen stay empty. Mobile has none.
- **Layering points already exist.** `.terminal-screen` stacks `.terminal-body` at z-index 2, scanlines at 4, curvature at 5 and flicker at 6 (`site.css`). An art layer at z-index 1 inside `.terminal-screen` would inherit the CRT scanlines and vignette for free.
- The existing `media` prop (`.terminal-media`, `site.css`) could carry a baked image. It covers the whole terminal including the chrome, and it applies `opacity: .35` and `hue-rotate(40deg)`, so it is a poor fit.
- **Precedent in the repo:** `src/components/AsciiArt.tsx` already ships decorative ASCII inside `aria-hidden="true"`. It uses an 8-layer `text-shadow` extrusion with a `breathe` animation that is turned off under reduced motion.

**Contrast headroom.** Figures below are WCAG relative-luminance ratios, computed against `--term-bg #050b03`, with the art drawn in `--term-green #b8f720` at the given opacity:

| Art opacity | Main text `#b8f720` vs brightest art pixel | Dim text `.t-out #5e8a00` vs art |
|---|---|---|
| none | 15.5 : 1 | 4.84 : 1 |
| 10% | 12.8 : 1 | 3.99 : 1 |
| 20% | 9.6 : 1 | 3.00 : 1 |
| 30% | 6.8 : 1 | 2.13 : 1 |

The main text keeps AAA (7:1) up to ~25% art. The **dim text has no headroom**: any art under it drops it below AA's 4.5:1 [27]. The scanline rows alone already take it to 4.39:1. The placeholder, at 0.7 opacity, sits at 2.9:1 today. So the art either avoids the dim-text zones, sits behind an opaque knockout, or the dim colour gets lifted.

**Glyph coverage spot-check.** This is a fontTools `cmap` count on specific files. The sibling font ticket owns the real check.

| Font file | ASCII 20–7E | Box 2500–257F | Blocks 2580–259F | Geometric 25A0–25FF | Braille 2800–28FF | Sextants 1FB00–1FB3B | Octants 1CD00–1CDE5 |
|---|---|---|---|---|---|---|---|
| Sevastopol Interface (current) | 95/95 | 0 | 0 | 0 | 0 | 0 | 0 |
| JetBrains Mono (master) | 95/95 | 128 | 32 | 43 | 0 | 0 | 0 |
| IBM Plex Mono | 95/95 | 128 | 32 | 1 | 0 | 0 | 0 |
| Source Code Pro | 95/95 | 128 | 32 | 32 | 0 | 0 | 0 |
| Departure Mono | 95/95 | 128 | 32 | 14 | 0 | 0 | 0 |
| Space Mono / VT323 | 95/95 | 0 | 0 | 1 | 0 | 0 | 0 |
| Cascadia Mono 2407.24 [41] | 95/95 | 128 | 32 | 96 | 256 | 60 | 230 |

A side finding: today's face lacks `▸` (U+25B8) and `▮` (U+25AE), so the terminal's own caret and cursor already render from a fallback font. Among the files checked, only Cascadia covers braille, sextants and octants. Any technique that needs those ranges should either draw with canvas (no font involved) or accept a fallback font within its own layer.

---

## 2. Technique survey

### 2.1 Hand-drawn / hand-tuned ASCII

- **Craft conventions.** The community separates **line art**, which suggests form with outline characters, from **solid art**, which builds "a 'silhouette' rather than an outline" from heavy characters like `W M H 8` and then anti-aliases the edges [4]. Artists often mix the two: line art for outlines and small details, solid fills for large dark areas [4]. The same tutorial teaches vertical placement inside the cell: `. , _` sit at the bottom, `- = +` in the middle and `' " ^` at the top. It builds slopes with runs of `` _,.-'^` `` [4]. It also insists on a fixed-width font [4]. Wikipedia names the matching scene styles: "oldskool", built mainly from `_/\-+=.()<>:` so it "looks more like the outlined drawings of shapes", and "newskool", built from strings like `$#Xxo` [5].
- **Tools.** Any fixed-width editor works [4]. Moebius is an ANSI/ASCII editor with a half-block brush that paints "closer to Photoshop than a text editor" [37].
- **Fidelity, from the scratch test.** A mirrored line-art head at 47×19 read as a big shouting head at once (panel D). Adding a small planet and stars (panel M) made it read as a *giant head in space*. The show's flat, outlined cartoon style suits line art more than a shaded halftone.
- **The agent-drawing risk.** LLMs "interpret ASCII representations effectively but struggle to produce them from text" [33]. The scratch drawing needed a mirror trick (draw the left half, mirror it) and two correction passes to stay symmetric. Plan for a human pass in an editor, or trace an original sketch.
- **Readability:** sparse strokes interfere with the text less than dense fills do. **Motion:** static; hand-drawn frames can swap on events (see 2.7). **Glyphs:** U+0020–007E only, which every candidate font covers. **Cost:** ~1.2 KB raw, ~0.25 KB gzipped (measured).

### 2.2 Brightness-ramp converters (tone-based)

- **Method.** Split the image into cells and give each cell the character whose grey level best matches the cell's average. Common ramps are Bourke's 70-level `$@B%8&WM#*oahkbd…` and his 10-level `" .:-=+*#%@"`. "It is common to sample half as often in the vertical direction" to allow for tall cells [3]. With this terminal's 14px / 1.45 line-height, a cell is about 8.7 × 20.3 px, an aspect of 0.43, so sample about 2.3× less often vertically.
- **Tools.** chafa is a C CLI and library with symbol classes from `ascii` to `braille`, `sextant`, `half` and `quad`. It offers `--dither none|ordered|diffusion|noise`, `--font-ratio` (default 1/2) and `--colors none` for plain-text output [6]. It is LGPL-3.0; the latest release is 1.18.3 (2026-09-23) [6]. chafa-wasm (LGPL-3.0) wraps it for Node and browsers [7], but its `.wasm` is 2.16 MB raw and 794 KB gzipped (measured), so use it at build time only. ascii-image-converter (Apache-2.0) has `--braille`, `--dither`, `--map` (custom ramp) and `--save-txt` [9].
- **Critique.** Tone-based output "lead[s] to halftone-like results and require[s] high text resolution" [1]. It treats "each grid cell as a pixel", which ignores that "ASCII characters have shape" and blurs edges [2].
- **Scratch results.** At the text grid (59×20, panel A) the face read only faintly. Its features landed under the boot lines, and `#%@` glyphs competed with the letters. At a separate 7px grid (123×58, panels E and H) it read clearly, as a halftone, especially with a knockout.
- **Glyphs:** ASCII only. **Cost:** 0.3–0.8 KB gzipped for a static frame (measured).

### 2.3 Shape-aware converters (structure-based)

- **Structure-based ASCII art** (SIGGRAPH 2010) approximates "the major line structure of the reference image content with the shape of characters". It uses an alignment-insensitive shape similarity (AISS) metric to imitate what hand artists do [1]. I found no browser library; treat it as a design reference.
- **Shape vectors** (a 2026-01-17 write-up [2]). Each glyph gets a 6-D vector: 2×3 sampling regions capture left/right and top/middle/bottom ink. Each cell picks the nearest glyph. "Directional contrast enhancement" uses samples from outside the cell to sharpen edges. The live demo runs as WebGL shader passes, with k-d tree and quantised-cache lookups [2].
- **ML.** A 2025 comparison found classical classifiers (k-NN, random forests) match CNNs at choosing characters [34]. A heavy model buys nothing here.
- **Scratch results.** I built a 6-region version, using rectangles rather than the write-up's circles, with no directional pass (panel B). The eyes and dome had better outlines than the ramp. But the output was letter soup (`$ Z I T "`), which visually fought the uppercase text more than any other variant.
- **Glyphs:** the 95 ASCII glyphs, with vectors measured *from the chosen font*, so they must be recomputed when the font changes. **Cost:** free when baked offline; a live version needs a multi-pass GPU pipeline [2].

### 2.4 Edge-directional renderers (DoG + Sobel)

- **Method.** A difference-of-Gaussians pass pulls out high-frequency detail. Sobel then gives edge direction, which maps to `| / _ \`; everything else falls back to a ramp. This is the approach of the video "I Tried Turning Games Into Text", credited by a p5.js port [18]. The same author's shader pack ships it as `AcerolaFX_ASCII.fx` with edge and fill glyph atlases [18]. Hobby post-processing kits add Sobel edge glyphs to three.js and pmndrs pipelines [15].
- **Scratch result.** A naive CPU version at 59×20 over-inked the mouth into a slab of `_` and was the least recognisable. The technique needs tuning, and it shines on lit 3D scenes rather than a flat face. **Glyphs:** ASCII only.

### 2.5 Sub-cell mosaics: braille, blocks, sextants, octants, shades

- **Braille** gives a 2×4 dot matrix per cell (drawille, AGPL-3.0; JS ports such as node-drawille) [8]. chafa's 1.8 notes praise braille's "luxurious 2×4 dot matrix", its wide font support and the "special blank symbol (U+2800 BRAILLE PATTERN BLANK) for consistent spacing" [6]. It lives at U+2800–28FF [10].
- **Blocks and shades:** Block Elements at U+2580–259F give `▀▄█`, quadrants and `░▒▓` [11]. **Sextants** (2×3) arrived in Unicode 13.0 in Symbols for Legacy Computing, U+1FB00–1FB3B [12]. **Octants** (2×4 solid) arrived in Unicode 16.0 at U+1CD00 onward [13]. Coverage is thin (see §1).
- **Scratch results:**
  - Braille at a 7px grid (246×232 dots, panels F and N) was the most recognisable variant tested. It read like a photo halftone.
  - Dots crowd letters less than letters do, so the text in front stayed easiest to read.
  - Braille at the text grid (panel C) was faint but pleasant.
  - Half-block and shade renders (panel G) looked blocky. At 14% opacity they read as coarse pixels rather than a face.
- **Font independence.** Draw braille or block art with canvas `arc` / `fillRect` from the bitmask. It then needs no font coverage and stays crisp at any device pixel ratio. The payload is small: 21 KB raw, 3.5 KB gzipped for 123×58 braille cells (measured).
- **"Is it still ASCII?"** Strictly, no: braille and blocks are Unicode, not the 95 printable ASCII characters. That is a decision for the operator (see Open questions).

### 2.6 Shader, canvas and WebGL renderers

- **three.js `AsciiEffect`.** Each frame it renders the scene, reads it back with `getImageData`, maps luminance to a ramp (default charset `' .:-=+*#%@'`) and writes an HTML table through `innerHTML`. Options: `resolution` (0.15), `scale`, `color`, `alpha`, `block`, `invert` [14]. The effect itself is 2.8 KB gzipped, but it needs three.js. The prebuilt r186 `three.module.min.js` + `three.core.min.js` is ~194 KB gzipped (measured); tree-shaking can shrink that. drei wraps it as `<AsciiRenderer>` for React Three Fiber [16].
- **GPU post-processing.** pmndrs `postprocessing` has an `ASCIIEffect` with a configurable `ASCIITexture`: characters, font, cell size and scene colour [15]. The classic Shadertoy "Ascii Art" shader (2013) encodes 5×5 glyph bitmaps as integers inside the shader [17].
- **textmode.js** (MIT) is a WebGL2 grid renderer with instanced glyphs, runtime TTF/OTF/WOFF loading, layers with per-layer opacity and blend, and a filters add-on [19]. v0.18.0 ESM is 64 KB gzipped (measured). p5.asciify does the same for p5.js sketches [20].
- **play.core** (Apache-2.0) is a live-coding ASCII runtime. Programs expose `main(coord, context, cursor, buffer)`. It has a DOM `<pre>` renderer that rewrites only changed rows through `innerHTML`, a canvas renderer, and SDF, cursor and camera examples [21]. It is a good pattern library even without using the runtime.
- **Measured cost of a full-grid redraw every frame** (123×58 = 7,134 glyphs, desktop Chrome; the second figure is at 6× CPU throttle):

  | Method | Script + layout per frame |
  |---|---|
  | DOM `<pre>` `textContent` swap | 1.0 ms (1.6 ms) |
  | Canvas `fillText` per row | 1.3 ms (2.3 ms) |
  | Canvas `fillText` per cell | 2.3 ms (14.8 ms, dropping to ~27 fps) |

  DevTools throttling slows only the main thread, so raster and paint cost on a real phone went unmeasured. Avoid per-cell `fillText`. Otherwise a low-rate (8–15 fps) idle loop is cheap.

### 2.7 Animated and reactive ASCII

- **Idle motion.** Breathing (slow opacity or relight), blinking (swap the eye cells) and a drifting light. These run continuously, so WCAG 2.2.2 applies. Motion that "starts automatically, lasts more than five seconds, and is presented in parallel with other content" needs a way to pause, stop or hide it unless it is essential [26]. The intent is to avoid distracting users "during their interaction" [26]. Keep idle motion time-bounded (settled in under 5 s) or user-triggered. The site's infinite `.terminal-flicker` and `.ascii-stack` breathe loops are existing precedent that may already need a look, but they are outside this ticket.
- **Reactive motion:** mouth opens on keystrokes, eyes glance at the caret or pointer, the head reacts to a wrong question, and brightens or resolves fully on unlock. play.core passes a `cursor` to every frame [21]. Reactive motion is user-initiated, so it sidesteps 2.2.2's "starts automatically".
- **Decode / scramble.** GSAP ScrambleTextPlugin "scrambles the text… refreshing new randomized characters at regular intervals while gradually revealing your new text". Options include `chars`, `revealDelay` and `speed` [24]. It ships under GSAP's "Standard 'no charge' license" (npm metadata, gsap 3.15.0) [24]. baffle (MIT) is a tiny older alternative, last pushed 2017 [25]. Either could resolve the Cromulon out of noise on unlock.
- **Parallax.** Layers at different depths can shift with the pointer, but this is a vestibular trigger class. MDN notes "scaling or panning large objects" as triggers [30].
- **Reduced motion.** `prefers-reduced-motion: reduce` means the user wants to minimise non-essential motion [30].
  - The site's global rule clamps CSS animation and transition durations (`site.css`, the `@media (prefers-reduced-motion: reduce)` block), so CSS-driven art motion inherits it.
  - JS/rAF motion must check `matchMedia` itself, as `useTyped.ts` already does.
  - Under reduce, show the resting frame, and let the unlock swap frames instantly.

### 2.8 Generative and procedural

- **Surface sampling to characters.** The ASCII donut plots torus points densely. It lights them with `normal · light`, keeps a z-buffer and maps luminance to `.,-~:;=!*#$@` [22].
- **SDF heads.** Build a head from signed-distance primitives (an ellipsoid dome, sphere eyes, a mouth cavity) combined with smooth min / smooth subtraction [23]. Raymarch per cell and pick glyphs by shading or by shape vector [2].
- **Cheaper alternative** (an estimate; not measured): bake the head's normal and albedo map offline once. Per frame, only a dot product per cell is needed (~7k), plus eye sprite swaps. That is enough for a slow light orbit or blink at low fps on a phone.
- **Noise.** A noise field (flowing hex or telemetry characters) can serve as the medium the face is carved from (see 2.9).
- **Source status.** Procedural geometry is authored, not converted. But if it is designed to evoke the Cromulon, it depicts the character just as fan art does (§3.3).

### 2.9 Inventive composition ideas (design proposals)

- **Line-box knockout.** Give each `.t-line` an opaque `--term-bg` backing (`width: fit-content`, a small spread shadow). The art shows only between lines and past line ends. WCAG treats a wide halo as background [27], so text contrast is back to its bare-background value. It was the clearest win in the scratch test (panels H, M, N). Under forced colours `background-color` is forced but still paints, while `box-shadow` is forced to none [31].
- **Phosphor burn-in.** Draw the head as a static ghost at ~12–16% with a 0.6–0.9 px blur, as if the CRT had shown the Cromulon too long. It is diegetic, fully static and a "second look" discovery. At 12% it may be too subtle (panel O).
- **Separate the art in kind from the text.** In crowding research (mostly peripheral vision), interference falls when flankers differ from targets in "shape and size, orientation, polarity, spatial frequency, depth, color" [32]. By analogy (a design inference): make the art out of dots, strokes or blocks rather than letters, blur it slightly to lower its spatial frequency, and keep it dimmer. Letter-heavy output (shape-vector, `$@#` ramps) fared worst in the scratch test.
- **Depth via dim tiers.** Use 2–3 opacity levels (far stars → head → near planet), or reuse the repo's `text-shadow` extrusion. `text-shadow` is forced to none in forced colours [31].
- **Scale cue.** A small planet plus stars turns "face" into "giant head over a planet". That is the scene that pairs with the phrase.
- **Signal in the noise.** Fill the screen with dim telemetry or hex characters whose per-glyph brightness forms the face. It reads as noise up close and a face at a squint. On unlock, a decode effect resolves it into the full head.
- **Text-mask / calligram.** Paint the terminal text itself with `background-clip: text` [38], so the face lives in the text's tint. I rejected it: it modulates the text's own contrast and contradicts the decided "behind the text". The one safe version, a band of 100–85% brightness, would be invisible.
- **Colour per glyph.** ANSI-style colour is possible [6, 21], but a monochrome phosphor CRT is the diegesis. A hue shift would break it and would clash with lime as the single accent.

---

## 3. Cross-cutting findings

### 3.1 Accessibility

- **Hiding the art.** `aria-hidden="true"` "removes that element and all of its children from the accessibility tree". Never put it on or above a focusable element [29]. The art must live in a sibling layer, not wrap the `<input>`.
- **The screen-reader gap.** WCAG technique H86 says ASCII art "can be very confusing" to screen-reader users. For *meaningful* art it recommends `role="img"` with an `aria-label`, or a skip link [28]. The decided "picture only, no caption" leaves screen-reader users without the hint. That is a parity question for the operator.
- **DOM text art stays in the document's text.** Add `user-select: none` and `pointer-events: none` so selecting the terminal text doesn't grab art. Canvas art avoids this entirely.
- **Forced colours.** `color` is forced and `text-shadow` / `box-shadow` go to none, but `opacity` is not listed [31]. Dim the art with `opacity`, not a dark `color`. Better still, hide it under `@media (forced-colors: active)` and `(prefers-contrast: more)` [39].

### 3.2 Readability and performance summary

- Keep art ≤ ~25% for main text to stay at AAA, and use a knockout wherever dim text sits.
- Put the face's features (eyes, mouth) in the desktop's empty zone: right and lower screen.
- A static, baked frame is effectively free. A live full-grid redraw costs ~1–2 ms per frame on the main thread with DOM or row-wise canvas (measured, desktop).
- WebGL libraries add 64–194 KB gzipped (measured); the site ships only React and react-router today.

### 3.3 Source imagery

This section is not legal advice; it records the difference between the options.

- The Cromulon comes from *Rick and Morty*, "Get Schwifty" (S2E5, Adult Swim, first aired 2015-08-23) [35].
- **Converting a screenshot or still** mechanically transforms a specific copyrighted frame. The US Copyright Office describes a derivative work as "based on or derived from one or more already existing works", listing "art reproductions" among common examples. It also notes that "the unauthorized adaptation of a work may constitute copyright infringement" [36].
- **Original fan art** (drawn, modelled or procedural) still depicts the character but reproduces no particular frame. It can also be designed for the grid: open mouth, eyes placed in the empty zones, a planet for scale. That is a craft advantage as well.
- Practical rule for a public repo: commit only the final art, never the source stills or intermediate conversions.
- The scratch experiments used an original synthetic head (`head.py`: geometric ellipses, not traced from anything).

---

## 4. Scratch experiments

Throwaway files are kept locally, outside the repo (a copy is kept for the Cromulon prototype).

- `head.py` → `synthetic-head.png`: an original test subject. Bald dome, heavy brows, big eyes, huge open mouth, Lambert-shaded.
- `convert.py` → `out/*.txt`: ramp, 6-region shape-vector, DoG+Sobel edges, braille (Floyd–Steinberg), half-block and shade. It renders each at 5 grids: desktop text grid 59×20, desktop 7px 123×58, today's mobile 35×5, mobile 6px 85×19, and a taller mobile screen.
- `hand.py` → `out/hand.lineart.txt`, `out/hand.scene.txt`: mirrored hand line art, then the same with a planet and stars.
- `mock.html` (served locally, JetBrains Mono text over Cascadia Mono art) → `shot-1-A-D.png` … `shot-5-O-P.png`. `shot-live-mobile-375.png` is today's mobile terminal.
- `bench.html`: the DOM vs canvas redraw benchmark (§2.6). `coverage.py`: the glyph table (§1).

Results:

| Panel | Variant | Face reads? | Text in front |
|---|---|---|---|
| A | Ramp, text grid, 18% | Faintly | OK, but `#%@` compete |
| B | Shape-vector, text grid | Yes (eyes) | Worst: letter soup |
| C | Braille, text grid, 22% | Faintly | Good |
| D | Hand line art, 22% | **Yes**, clearly a shouting head | Good |
| E / H | Ramp 7px, 20% / 30% + knockout | Yes / **clearly** | Good / **untouched** |
| F / N | Braille 7px, 24% / 30% + knockout | **Best** / **best** | Good / **untouched** |
| G | Shade `░▒▓`, text grid | Weakly, blocky | OK |
| M | Line art + planet/stars + knockout | **Yes, "giant head in space"** | Untouched |
| O | Braille 7px burn-in, 12% + 0.9px blur | Barely: a ghost | Untouched |
| I, J, K, Q | Any art on today's 35×5 mobile screen | **No** | n/a |
| L, P | Taller mobile (~14 rows) | Partly: an eye peeks past the knockout | Untouched |

Hand line art at text size (for reference, desk grid, before adding the scale cue):

```
                 _..-------.._
            _.-''             ''-._
         .-'                       '-.
      /    .__________     __________.    \
    |      .-'''''-.       .-'''''-.      |
    |    |   (@@@)   |   |   (@@@)   |    |
     \     '-.___.-'       '-.___.-'     /
      |    ._______________________.    |
       \   |vvvvvvvvvvvvvvvvvvvvvvv|   /
         '.|_______________________|.'
              '--..______________..--'
```

(Excerpt with rows removed. It is a generic shouting head, not yet a Cromulon; the full file is in scratch.)

---

## 5. Comparison

"Tested" means the scratch mock; "est." means my estimate.

| Technique | Desktop ~59×20 box | Mobile today (35×5) | Text readability | Runtime cost | Added bundle | Reduced motion | Glyph ranges | Source image |
|---|---|---|---|---|---|---|---|---|
| Hand line art (strict ASCII) | Good (tested) | Poor | Good; excellent with knockout | Static DOM, ~0 | ~0.25 KB gz | Static by nature | U+0020–007E | Original drawing |
| Ramp at text grid | Fair (tested) | Poor | Fair (letters behind letters) | ~0 | <1 KB | Static | U+0020–007E | Needs a picture |
| Ramp at own 7px grid | Good (tested) | Poor | Good with knockout | ~0 static | ~0.8 KB gz | Static | U+0020–007E | Needs a picture |
| Shape-vector (6-region) | Fair+ (tested, simplified) | Poor | Poor (letter soup) | Offline ~0; live = WebGL passes | Custom | Static unless live | U+0020–007E, font-specific vectors | Picture or 3D |
| DoG + Sobel edges | Poor as tested; good for 3D (est.) | Poor | Fair | GPU if live | Shader or custom | Freeze frame | ASCII subset | 3D render |
| Braille at text grid | Fair (tested) | Poor | Good | ~0 | ~1 KB | Static | U+2800–28FF (or canvas) | Needs a picture |
| **Braille at own 7px grid** | **Best (tested)** | Poor | **Best with knockout** | ~0 static; canvas dots | ~3.5 KB gz | Static | U+2800–28FF, or none via canvas | Needs a picture |
| Half-block / shade | Fair–poor (tested) | Poor | Fair | ~0 | <1 KB | Static | U+2580–259F | Needs a picture |
| three.js `AsciiEffect` | Depends on model (est.) | Poor | Fair (ramp letters) | Readback + `innerHTML` per frame | ~194 KB gz + model | Must freeze | ASCII ramp | Original 3D model |
| GPU ASCII post-processing / textmode.js | Good (est.) | Poor | Good if dim | GPU, cheap | 64–194 KB gz | Must freeze | Atlas: any font | 3D, SDF or picture |
| SDF or baked-normal relight | Good (est.) | Poor | Good with dots | ~7k dot products per frame (est.) | Few KB custom | Static frame | Any, or canvas | Original geometry |
| Signal-in-noise field | Fair (est.) | Poor | Poor–fair (letters) | Low-rate DOM or canvas | ~0 | Static field | ASCII | Needs a picture or SDF |

---

## 6. Candidate approaches for the prototype (#20)

**A. "Phosphor ghost": static sub-cell halftone.**
Draw or model an original Cromulon: open "show me" mouth, huge eyes, a small planet for scale. Convert it offline, with chafa or a ~100-line script like `convert.py`, to braille or a dense ramp at a 6–7px grid. Commit the resulting text or bitmask. At runtime, draw it into a `<canvas aria-hidden>` at z-index 1 inside `.terminal-screen`, at 20–30% opacity with a slight blur, under the scanlines. Draw dots, not glyphs, so no font coverage is needed. Give `.t-line` an opaque line-box knockout. Compose the face into the right and lower empty zone. Hide it under forced-colors and `prefers-contrast: more`. Offer a burn-in variant (12–16%, blurred) as the "subtle" dial.
- **Effort:** S–M, about 1–2 days plus making the source picture.
- **Risks:** getting an original source picture made. The photo-like halftone reads less "cartoon" than line art. It is not strict ASCII. Mobile still needs a layout decision.

**B. "Cartoon line art": hand-drawn strict ASCII.**
Draw an oldskool line-art Cromulon in the 95 printable ASCII characters, in two sizes: ~48×19 for desktop and ~30×12 for a taller mobile screen. Add stars and a planet for scale and 2–3 dim tiers for depth. Render a static `<pre aria-hidden>` with the knockout. Optionally swap mouth-closed and mouth-open frames on keystrokes, and a brighter frame on unlock. This is event-driven, and under reduced motion only the final frame shows.
- **Effort:** S in code; the art is the work. Iterate in an editor with a human eye; don't rely on agent output alone [33].
- **Risks:** reading as "a face" rather than *the* Cromulon. Drawing quality. Two sizes to maintain.

**C. "Live head": procedural and reactive.**
Build the head as an SDF (smooth-min primitives [23]), or bake an original model's normal and albedo maps. Relight it per frame in canvas at 10–15 fps and pick glyphs by shape vector [2] or braille dots. Idle: one slow light sweep that settles within 5 s [26]. Reactive: the mouth opens per keystroke, eyes track the caret, and on unlock the face resolves through a decode [24]. Under reduced motion: a static lit frame, no decode. Pause when off-screen or when `document.hidden`.
- **Effort:** M–L, about 4–8 days.
- **Risks:** mobile GPU/CPU and battery cost. It pulls attention from the single question the terminal asks. A library adds 64–194 KB gzipped; a custom renderer avoids that but costs time.

**D. "Signal in the noise": the face hidden in telemetry.**
Fill the screen behind the text with a dim, slowly static field of hex or telemetry characters. Each character's brightness tier (or weight, with a variable OFL mono) comes from the Cromulon picture, so the face appears only at a squint. On unlock, a scramble resolves the field into the full-bright head as the reward, before the shelf navigation.
- **Effort:** M.
- **Risks:** letters behind letters is the worst case for crowding and interference [32], so it needs the knockout and low opacity. It may be *too* hidden to work as the only hint.

I recommend A or B as the base, with C's event-driven reactions (mouth on keystroke, resolve on unlock) layered on only if the operator wants motion.

---

## Open questions for the operator

1. **Strict ASCII or Unicode text art?** The 95 printable ASCII characters only (B), or braille and blocks (A, and the best-reading result)?
2. **Who makes the source picture, and from what?** An original drawing, model or SDF, versus converting a still. §3.3 records the difference; the recommendation is original art and no stills in the repo.
3. **How findable should the hint be?** A subtle burn-in (~12%) or clearly visible (~25–30% with knockout)?
4. **Static, reactive or live?** Does the Cromulon react to typing or to the unlock, or stay a still picture?
5. **Mobile.** Make the terminal taller (e.g. drop the 16:10 ratio so the screen holds ~14 rows), show the Cromulon only on desktop, or accept a peek-through? No technique works behind today's 5 visible rows. The boot text also clips there today.
6. **Screen-reader parity.** Keep the art fully `aria-hidden`, so screen-reader users get no hint, or provide an equivalent that doesn't caption the picture for sighted users?
7. **Dim-text headroom.** Lift `.t-out` and the placeholder colour, or keep the art out from behind them? They are at 4.84:1 and 2.9:1 today.
8. **Scene or head?** Keep the Cromulon to the head alone, or allow the planet-and-stars scene that makes "giant floating head" legible?

---

## References

1. Xu, Zhang, Wong. "Structure-based ASCII art." SIGGRAPH 2010 / ACM TOG 29(4). https://dl.acm.org/doi/10.1145/1833349.1778789 · https://history.siggraph.org/learning/structure-based-ascii-art-by-xu-zhang-and-wong/
2. A. Harri. "ASCII characters are not pixels: a deep dive into ASCII rendering." 2026-01-17. https://alexharri.com/blog/ascii-rendering
3. P. Bourke. "Character representation of grey scale images." https://paulbourke.net/dataformats/asciiart/
4. J. Stark. ASCII art tutorial (archived). https://www.ludd.ltu.se/~vk/pics/ascii/junkyard/techstuff/tutorials/Joan_Stark.html
5. Wikipedia, "ASCII art." https://en.wikipedia.org/wiki/ASCII_art
6. Chafa: man page https://hpjansson.org/chafa/man/ · home https://hpjansson.org/chafa/ · releases/NEWS https://github.com/hpjansson/chafa (1.18.3, 2026-09-23; LGPL-3.0) · 1.8 notes on braille and sextants https://hpjansson.org/blag/2021/09/16/chafa-1-8-terminal-graphics-with-a-side-of-everything/
7. chafa-wasm (npm `chafa-wasm` 0.3.3, LGPL-3.0). https://github.com/hectorm/chafa-wasm
8. drawille (AGPL-3.0; lists ports incl. node-drawille). https://github.com/asciimoo/drawille
9. ascii-image-converter (Apache-2.0). https://github.com/TheZoraiz/ascii-image-converter
10. Unicode chart, Braille Patterns U+2800–28FF. https://www.unicode.org/charts/PDF/U2800.pdf
11. Unicode chart, Block Elements U+2580–259F. https://www.unicode.org/charts/PDF/U2580.pdf
12. Symbols for Legacy Computing (Unicode 13.0; sextants). https://en.wikipedia.org/wiki/Symbols_for_Legacy_Computing · https://www.unicode.org/charts/PDF/U1FB00.pdf
13. Symbols for Legacy Computing Supplement (Unicode 16.0; octants). https://www.unicode.org/charts/PDF/U1CC00.pdf · https://en.wikipedia.org/wiki/Symbols_for_Legacy_Computing_Supplement
14. three.js `AsciiEffect`: source https://github.com/mrdoob/three.js/blob/dev/examples/jsm/effects/AsciiEffect.js · docs https://threejs.org/docs/pages/AsciiEffect.html · example https://threejs.org/examples/webgl_effects_ascii.html
15. pmndrs postprocessing `ASCIIEffect`. https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ASCIIEffect.js~ASCIIEffect.html · Sobel/SDF-glyph kit: https://github.com/niccolofanton/morphing-ascii-shader
16. drei `AsciiRenderer`. http://drei.docs.pmnd.rs/abstractions/ascii-renderer
17. movAX13h, "Ascii Art" (Shadertoy, 2013). https://www.shadertoy.com/view/lssGDj
18. AcerolaFX (`Shaders/AcerolaFX_ASCII.fx`). https://github.com/GarrettGunnell/AcerolaFX · p5.js port crediting "I Tried Turning Games Into Text": https://github.com/humanbydefinition/p5js-edge-detection-ascii-renderer
19. textmode.js (MIT; 0.18.0). https://github.com/humanbydefinition/textmode.js · https://code.textmode.art/docs/introduction
20. p5.asciify. https://github.com/humanbydefinition/p5.asciify
21. play.core (Apache-2.0), incl. `src/core/textrenderer.js`. https://github.com/ertdfgcvb/play.core
22. a1k0n, "Donut math: how donut.c works." 2011-07-20. https://www.a1k0n.net/2011/07/20/donut-math.html
23. I. Quilez, distance functions and smooth minimum. https://iquilezles.org/articles/distfunctions/ · https://iquilezles.org/articles/smin/
24. GSAP ScrambleTextPlugin. https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/ · license https://gsap.com/standard-license
25. baffle (MIT). https://github.com/camwiegert/baffle
26. W3C, Understanding SC 2.2.2 Pause, Stop, Hide. https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
27. W3C, Understanding SC 1.4.3 Contrast (Minimum). https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
28. W3C, Technique H86 (text alternatives for ASCII art). https://www.w3.org/WAI/WCAG22/Techniques/html/H86
29. MDN, `aria-hidden`. https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden
30. MDN, `prefers-reduced-motion`. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
31. MDN, `forced-colors`. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
32. Whitney & Levi. "Visual crowding: a fundamental limit on conscious perception and object recognition." Trends Cogn. Sci. 2011. https://pmc.ncbi.nlm.nih.gov/articles/PMC3070834/
33. "Learning to Draw ASCII Improves Spatial Reasoning in Language Models." arXiv:2604.14641 (2026-04-16). https://arxiv.org/abs/2604.14641
34. Coumar & Kingston. "Evaluating Machine Learning Approaches for ASCII Art Generation." arXiv:2503.14375 (2025). https://arxiv.org/abs/2503.14375
35. Wikipedia, "Get Schwifty." https://en.wikipedia.org/wiki/Get_Schwifty · Adult Swim episode page: https://www.adultswim.com/videos/rick-and-morty/schwifty/
36. U.S. Copyright Office, Circular 14, "Copyright in Derivative Works and Compilations." https://www.copyright.gov/circs/circ14.pdf
37. Moebius ANSI & ASCII art editor. https://github.com/blocktronics/moebius
38. MDN, `background-clip` (`text`). https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip
39. MDN, `prefers-contrast`. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast
40. (Measurements in this note: live dinnaga.ai via Chrome DevTools, 2026-09-28; bundle sizes from jsDelivr builds gzipped at `-9`; glyph coverage via fontTools `getBestCmap()`.)
41. Cascadia Code release 2407.24 (`ttf/CascadiaMono.ttf`). https://github.com/microsoft/cascadia-code
