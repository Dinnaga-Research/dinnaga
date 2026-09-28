# AI tells and honesty bugs on dinnaga.ai

As of 2026-09-28. This resolves research ticket #10, "Catalogue the AI tells on dinnaga.ai". Research only: nothing in the repo was changed.

Method: I read the source at `~/code/dinnaga` (HEAD `be21e72`) and walked every route on the Vite dev server at 1440×900 and 390×844 (mobile emulation) with chrome-devtools. I checked the network log, computed styles, `document.getAnimations()` and rendered text, and compared every count against `src/data/zords.json`. The checklist draws on the web-design-forge corpus, the humanizer skill, Wikipedia's "Signs of AI writing", and the outside writing listed under [Sources](#sources).

Terms, from the repo's `CONTEXT.md`:
- An **AI tell** is a design or copy pattern that marks the site as made from a template or by a machine.
- An **honesty bug** is a UI element that asserts something untrue. It gets fixed whatever the visual direction.

The two inventories below are kept separate.

## Answer

- **Worst honesty bugs.** The first thing every page shows, in full-bleed lime, is a banner about analytics that don't exist. The site gives four different counts for one registry: 23/22 on the live stat row, 22/21 in the dossier, 12 in the ticker, and 13 in the bench boot. A stale screenshot sits alongside them. Open-source claims appear on eight surfaces, but the org has zero public repos. The colophon says "deployed on GitHub Pages"; the site is on Vercel.
- **Worst tells.** The homepage is one vendored UI kit's furniture, almost unchanged:
  - mis-numbered `// 0N` eyebrows (01, 01, 03, 04, 05, 04)
  - twelve all-caps slogan headlines that each end in a period
  - an icon card triplet, a stat row, a marquee, a hazard stripe, and a caption that narrates its own CSS
  - all of it in letterspaced mono caps, over eight endless ambient animations
- **Copy.** The copy repeats one mission line: "genuinely useful" appears 12 times in source, cut with spaced em dashes.
- **Where it came from.** Every seed item traces verbatim to the placeholder chrome of the UI kit that was ported "faithfully" on 2026-05-17. The 2026-06-08 copy scrub treated body text as content and chrome strings as design.
- **Shape of the fix:**
  - Treat every string as a claim: derive it or delete it.
  - Cut kit furniture that serves no stated thesis.
  - Build around the two things that already have one: the terminal's shelf unlock and the loadout bench.
- **Caveat on the palette.** Anthropic's own frontend-design skill lists "near-black background with a single bright acid-green accent" as a default of generated design. Removing the furniture alone may not clear the "AI made this" read.

## Where the tells came from (root cause)

The original spec (`docs/superpowers/specs/2026-05-17-dinnaga-website-design.md:12-30`) chose "Approach A — Faithful port + vendored design system" and "Port the kit's sample copy." The kit is `Dinnaga Design System-2.zip`, named at spec line 30; it is not in the repo. Its `README.md` and `ui_kits/website/*.jsx` contain these strings verbatim:

- **Telemetry.** `SIGNAL // 042`, `ENCRYPTED · 18:42Z`, `UPLINK STABLE`, `PING 42ms`, `FIDELITY 87%` and `v0.4.1` are all in the kit's `Hero.jsx`. The kit README's "Numbers & data" rule gives `v0.4.1`, `87%`, `42ms` as formatting examples, so the "telemetry" is type-specimen filler.
- **The analytics banner** is in `CookieBanner.jsx`.
- **The `EXTRUDED IN EIGHT TINTS OF #C0FE04 · BREATHING ENABLED` caption** is in `AsciiArt.jsx`.
- **The nav "LIVE"** was `LIVE · 2026-04-16` in the kit. The port dropped the date, which left even less meaning.
- **Section numbering** is a README rule ("Double slashes as section indices: `// 01`, `// 02`"), as are the all-caps display headlines and the "status dot that breathes".
- **Stock icons.** The README says the icons come from "a small CDN-loaded line-icon set". The three Practices icons are Feather-style compass, file-text and users paths.

Commit `8dd01e6` ("scrub ticker/transmission/ascii copy to lab voice", 2026-06-08) rewrote the prose, but the chrome strings survived. Later the numbering broke by hand:
- `e527606` (2026-06-08) removed the FieldNotes section, which carried `// 03 · FIELD NOTES` in the kit.
- `7df791d` (2026-07-02) "renumbered" Instruments to 03.

The rendered sequence is still wrong.

The site also breaks its own design system's rules. The kit README says:
- signal green: "at most one signal-green element per ~30% of viewport" (the first desktop viewport has seven)
- "em-dashes are earned"
- "Hierarchy by family"

## Checklist: AI tells

Each row gives the pattern, how to spot it, a designed alternative, and sources. Abbreviations:
- **WDF** = web-design-forge, at `~/code/weytani-skills/skills/web-design-forge/`
- **FD** = Anthropic's frontend-design skill
- **Tasting** = the SLAMWICH Tasting Report at `~/code/dinnaga/public/artifact-docs/slamwich-tasting-report.html`

Full citations are under [Sources](#sources).

### Design tells

| # | Pattern | How to spot it (checkable cues) | What a designed alternative looks like | Sources |
|---|---|---|---|---|
| D1 | **Numbered section eyebrows** (`// 0N · LABEL`) | Numbers on sections that are not a sequence. Numbers that skip, repeat or collide across routes. An eyebrow that restates the heading below it (`// COLOPHON` over "COLOPHON."). Numbers typed by hand instead of derived from order. | Number only real sequences (the five /method steps), and derive the number from array order. Otherwise drop the label and let the heading name the section. | FD ("numbered markers (01 / 02 / 03)… only appropriate if the content actually is a sequence"; "tracked-out ALL-CAPS eyebrow label above every heading"; "Adding unnecessary typographic labels above content"). WDF `references/layout.md` checklist: "chrome serves the thesis (not template furniture)". |
| D2 | **Slogan-with-period display headlines** | Every H1/H2 is a 2–5 word declarative sentence, uppercased, ending in a period ("PROOF YOU CAN PICK UP."). Swap any two between sections and nothing breaks. | Headings that name the content in plain words. One display moment per page, set on a deliberate scale (WDF's "barbell": huge display against small labels, nothing in between, used once). | FD writing section ("Describe what something is or does in plain terms rather than selling it"; "Let each written element do exactly one job"). WDF `references/type.md` ("display treatment serves the organizing idea"). |
| D3 | **Icon card triplet** | Three equal-width cards, each with a stock line icon, a number, a title and one sentence. The icons are generic (compass, document, people). | Prose or a plain list. Use cards only when each holds something you can act on independently, sized to the content rather than equal. | FD trait 4 ("the SaaS-card kit: content chopped into identical… cards"). Humble 2026, sign 5 ("cards should only contain independently actionable content"). Anthropic 2025 blog on convergent "safe design choices". |
| D4 | **Big-number stat row** | 3–5 huge numerals, each with a tiny letterspaced caps label, floating without a date or denominator. | Put the number in a sentence with its source and date ("23 implants from 22 papers, registry snapshot 2026-07-10"), or let the working thing (the bench) be the proof. | FD ("a big number with a small label, supporting stats, and a gradient accent is the default treatment"). |
| D5 | **Marquee ticker** | Infinite, linear, horizontally scrolling slogans, usually `aria-hidden` (so no test or screen reader ever reads them, and they rot). | Remove it. If there is real news, use one static, dated line ("Latest weekly: 2026-09-26 →"). | FD ("Use non-user-triggered motion sparingly… scattered effects… read as AI-generated"). WDF `references/motion.md` ("nothing moves that doesn't serve the thesis"; "stillness is also a choice"). |
| D6 | **Hazard / caution-stripe divider** | A diagonal accent-and-black band between sections when there is no hazard. | A 1px seam or whitespace. Keep the stripe for a real warning state; the loadout's "HARNESS INTEGRITY COMPROMISED" panel is the one place it would mean something. | WDF `references/color.md` checklist ("accent spent in ≤2 places"). WDF `references/layout.md` ("template furniture"). |
| D7 | **Self-narrating caption** | The caption describes the implementation (hex codes, effect names, "ENABLED") instead of the content. | A caption that says what the thing is or why it is there, or no caption. | FD ("Name things by what users will understand… not by how the system is built"). |
| D8 | **Screenshot of the site inside the site** | A raster image of another route, with that route's own nav and chrome visible, placed as a feature image. It goes stale the moment the other route changes. | A live, small rendering of the real thing from the same data (one implant card), or a sentence and a link. | WDF `references/css-artwork.md` ("Could each image be paint instead?", zero-asset confidence). FD ("Open with… a live demo"). |
| D9 | **Letterspaced all-caps mono everywhere** | More than a third of the visible text is uppercase and tracked. Nav, buttons, bullets, footer and captions are all mono. Five or more type families on one page. | Caps only for short labels. Sentence case for UI and headings. No more type voices than the system shape calls for (one family, or a hard two-voice split). | Butterick ("Caps are suitable for headings shorter than one line… labels"; "DON'T CAPITALIZE WHOLE PARAGRAPHS"). FD ("Using all caps for labels"; "a monospace face for small data labels"). WDF `references/type.md` checklist ("Voices ≤ the chosen system's count"). |
| D10 | **Status dots that mean nothing** | A pulsing green dot beside "LIVE", "UPLINK STABLE" or a caption, with no state behind it. It shows the same on a 404. | Dots only where a real state is shown. The loadout's friction report, for example, already computes its states. | Humble 2026, sign 7 ("Status indicators must map to defined states; decoration that resembles data harms usability"). |
| D11 | **Fake HUD / terminal chrome** | Window "traffic-light" dots that do nothing. Scanlines, flicker and curvature layers. Readouts (ping, fidelity, clearance) with no data source. | Diegetic UI, where the chrome *is* the interface: a boot log that carries the art direction, or a focus ring that is the design idiom. Every readout is wired to a real value or cut. | WDF `references/css-artwork.md` § Diegetic UI. FD ("Visual structure is information… encode useful information about the content rather than decorate it"). |
| D12 | **Default palette and chrome kit of generated design** | Near-black ground with one acid-green accent. Tinted near-blacks (`#0b0b0b`, `#050505`). Meta strings joined with ` · `. `WORD — fragment` labels. `→` appended to links. Mono for data labels. | Keeping one accent is legitimate if it carries one meaning and is spent in one or two places: WDF's "one-signal" and "semantic color" economies (lime reserved for achieved states, for example). Otherwise choose a ground and accent from the subject. | FD calibration list, traits 2 and 5 (verbatim match). WDF `references/color.md` § Economies. |
| D13 | **Ambient motion everywhere** | Several concurrent `infinite` animations nobody triggered: pulses, flickers, breathing, marquee. | One motion engine and one orchestrated moment (here, the terminal boot). Everything else still. | FD ("A single orchestrated moment… lands better than scattered effects"). WDF `references/motion.md` ("Pick ONE engine… mixing engines reads as incoherence"). |
| D14 | **Decorative filter over reading surfaces** | A fixed full-screen scanline and vignette overlay that also sits over long-form documents. | Confine the effect to the one diegetic screen (the terminal). Reading surfaces stay clean. | Humble 2026, sign 2 ("decorative glow effects that serve no purpose"). WDF `references/css-artwork.md` checklist ("art serves the thesis, not texture for texture's sake"). |
| D15 | **Template slots filled with the mission statement** | Every section of the kit repeats the same three claims, because each slot needed copy. No single organizing idea shows through the layout. | Write the one-sentence thesis first, then remove every element that doesn't serve it. | WDF `references/layout.md` ("every acclaimed site is a thesis, not a theme"). Tasting §1 ("Nothing in the corpus reads as 'a nice template plus personality sprinkles'"). Müller 2018 (templates are content-agnostic). Ström-Awn 2019 (sameness emerges from locally rational defaults). |

### Copy tells

| # | Pattern | How to spot it | Designed alternative | Sources |
|---|---|---|---|---|
| C1 | **Spaced em-dash cadence** | ` — ` (with spaces) in most paragraphs. Labels built as `WORD — fragment`. Used where a comma, colon or period would do, to punch up a clause. | Commas, colons and periods, with at most an occasional unspaced em dash. Wikipedia notes (Sept 2026) that this signal is weakening in current models and is strongest *combined* with the others. | Wikipedia WP:AIDASH ("AI-generated em dashes are usually surrounded by spaces"). humanizer #13. FD trait 5. |
| C2 | **Mission-phrase repetition** | Search the source for the tagline. One phrase recurs on nearly every surface (hero, cards, dossier, footer, OG card, terminal, ticker). | Say the mission once, on the hero or /method. Everywhere else, say the specific thing that section is for. | FD ("Let each written element do exactly one job"). humanizer "Signs of soulless writing". |
| C3 | **Negative parallelism** ("no X, no Y, just Z"; "credited, never claimed"; "X or it does not ship") | Antithesis used as a slogan, stated about things nobody suggested. | Say what is true, positively and concretely ("We don't run a mailing list. New entries appear on /atisha."). | Wikipedia § Negative parallelisms, "Not X, but Y" (explicitly lists "no …, no …, just …"). humanizer #9. |
| C4 | **Promotional abstraction without a referent** | Claims no reader could check: "consumer-AI frontier", "ACCELERATING AI ADOPTION", "OPEN FOR BUSINESS", "Proof you can pick up". | What it is, how many, since when, and a link. | Wikipedia § Promotional language ("LLMs have serious problems keeping a neutral tone"). humanizer #4. FD ("rather than selling it"). |
| C5 | **Rule of three** | Triplets as rhythm: "measured context costs, real isolation masks, honestly rated buffs"; "Costs are measured, buffs are rated, drift is derived"; "Veracity-first, real APIs, no mocks". | One concrete claim with its evidence. Use lists only when there really are N things. | Wikipedia WP:RO3. humanizer #10. |
| C6 | **Theme vocabulary in place of names** | A section of links called "TRANSMISSION", a decoration called "DOSSIER · TRANSMISSION GATE", "DECODED // WIREFRAME." (it is not a wireframe). | Name things by what they are. Keep theme vocabulary inside the diegetic element (the terminal) where it is play. | FD writing section ("Name things by what users will understand"). |
| C7 | **Emoji headings, Title Case, and "your" addressed to a user** (doc-internal) | 📓/💡/🧭 as heading icons. "Multi-Agent Coordination via Shared Broadcast Logs". "Your Week in Review" on a public page. | Plain sentence-case headings. Write to the actual reader. | Wikipedia § Emoji as formatting, § Title case, § Communication intended for the user. humanizer #16, #17, #19. |
| C8 | **Machine-summary cadence** (doc-internal and /weekly) | Long semicolon chains; participle add-ons ("surfacing recurring themes…"); "was dominated by", "anchored by". | Short, dated, specific sentences: what ran, what was found, and one link. | Wikipedia § Superficial analyses (-ing phrases). humanizer #3. |

## Instance inventory: AI tells

Severity key:
- **High**: on every page, or above the fold on the homepage.
- **Medium**: visible on a primary route.
- **Low**: minor, or on a secondary route.

Line references are to `~/code/dinnaga/src/` unless noted.

### Site-wide chrome (every route)

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `styles/site.css:238,241`, `components/SiteNav.tsx:32,36-39` | D9, D10 | High | Nav links and the "● LIVE" corner are tracked caps mono (`letter-spacing: 0.14em`/`0.18em`). The "LIVE" dot pulses on every route, including the 404. The claim itself is H5. |
| `components/Layout.tsx:20`, `styles/site.css:56-94` | D14 | Medium | A fixed CRT overlay (scanlines, vignette, `crt-flicker` 5.4s infinite) sits over every route, including the iframed docs on `/weekly/:date` and `/artifacts/:slug`. |
| `components/SiteNav.tsx:23`, `styles/site.css:251-270` | D13 | Low | A green square races across the nav on mount. This is kit "whimsy". It respects reduced motion. |
| `components/SiteFooter.tsx:16-19,32-36` | C2, D12 | Low | The footer blurb repeats the hero lede ("genuinely useful… faster for everyone"), and the meta strip reads `// VALIDATE · THEN SHARE` and `// OPEN SOURCE`. The footer nav omits Loadout and Weekly. The claim in the "Open source" column is H3. |
| `index.html:6` | C2 | Low | Every route shares one `<title>`, the slogan "Dinnaga — validate, then share". No per-route titles. |
| `public/og.png` | D1, D12, C1, C2 | Medium | The share card has a `// AN ANONYMOUS AI RESEARCH LAB` eyebrow, the "VALIDATE, THEN SHARE" slogan, "genuinely useful… openly — to make AI adoption faster for everyone" with a spaced em dash, and a live dot beside the domain. It is the site's face on every link preview. |

### `/`: home

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `components/Hero.tsx:15`, `Practices.tsx:80`, `Instruments.tsx:40`, `DataPanel.tsx:16,35`, `AsciiArt.tsx:32`, `Transmission.tsx:7` | D1 | High | The rendered order is `// 01 · DINNAGA`, `// 01 · THE LAB`, `// 03 · INSTRUMENTS`, `// 04` (Surface data), `// 05` (Who we are), `// 04 · DOSSIER · TRANSMISSION GATE`, then an unnumbered `// TRANSMISSION`. There is no 02. The number 05 collides with `/loadout`'s `// 05 · RIPPERDOC`. The practice cards add a further `// 01`–`// 03` (`Practices.tsx:67`) on items that are not a sequence: "Open by ethos" is not step 1. |
| `components/Hero.tsx:16`, `Practices.tsx:81`, `Instruments.tsx:41`, `AsciiArt.tsx:33`, `Transmission.tsx:8` | D2 | High | "VALIDATED, THEN SHARED." / "HOW THE LAB WORKS." / "PROOF YOU CAN PICK UP." / "DECODED // WIREFRAME." / "THE ATISHA INITIATIVE IS OPEN." These are uppercased via `.section-title` (`styles/site.css:536`). The site has 12 such headlines across its routes. |
| `components/Practices.tsx:11-38,54-71`, `data/practices.ts` | D3 | High | Three equal cards with Feather-style stock icons (compass, file-text, users), numbered, each with a one-line summary that expands on click. |
| `components/Instruments.tsx:48-52` | D4 | Medium | "23 / IMPLANTS ON THE SHELF", "22 / PAPERS REPRODUCED", "3,937 / TESTS GREEN". The numbers are derived from real data, but the template form has no snapshot date. The "TESTS GREEN" claim is H11. At 390px it breaks 2+1 with an orphan. |
| `components/Instruments.tsx:53-60`, `public/assets/loadout-bench.png` | D8 | High | The image of `/loadout` shows that route's own nav (four links, no WEEKLY), a "● LIVE" dot, a `// 05 · RIPPERDOC` eyebrow and "snapshot 2026-07-01". It is stale (H2), and at 390px it is unreadable. |
| `components/Ticker.tsx`, `data/tickerItems.ts:3-12`, `styles/components.css:246-270` | D5, C1, C4 | High | 38s linear infinite marquee, `aria-hidden`. Items include "RIPPERDOC BENCH — OPEN FOR BUSINESS", "THE BAR — GENUINELY USEFUL OR IT DOES NOT SHIP", "NO MOCKS — REAL VALIDATION" and "ACCELERATING AI ADOPTION". This is where the stale "12 PAPERS" lives (H2), invisible to tests and to screen readers. |
| `components/CautionDivider.tsx`, `styles/components.css:184-194` | D6 | Medium | A 28px 45° lime/black stripe band between the ASCII section and Transmission. There is no hazard. |
| `components/AsciiArt.tsx:38-41` | D7 | High | "▸ EXTRUDED IN EIGHT TINTS OF #C0FE04 · BREATHING ENABLED" narrates the CSS comment at `styles/site.css:121-122`. It is also wrong on its own terms: the eight `text-shadow` layers are progressively *darker* greens (shades, not tints). |
| `components/AsciiArt.tsx:3-26,32-37` | D15, C6 | Medium | A 60-column ASCII "dossier" restating ETHOS / METHOD / BAR / MOCKS / STATUS, under the meaningless headline "DECODED // WIREFRAME.". It is clipped on the right at 390px (`pre` scrollWidth 411 in a 340px box). Its claims are H3 and H5. |
| `components/Terminal.tsx:121-134,191-198` | D11 | Medium | Window dots, a curvature/scanline/flicker stack, and a readout footer (claims in H4). The terminal *interaction* (one question, the unlock phrase, the Cromulon hint) is the homepage's one element with a thesis. Keep the behaviour and lose the fake chrome. |
| `components/DataPanel.tsx:14-31`, `data/surfaceData.ts` | D1, D15, C2 | Medium | A "SURFACE DATA" table numbers seven unordered facts `01`–`07`. The content duplicates the hero and cards (Ethos, Mission, Method). There is a "PUBLIC" chip and `// DINNAGA` in the panel footer. |
| `components/DataPanel.tsx:48-62` | C3, D9 | Medium | Mono `▸` bullets: "Validated before it ships.", "Open source by default.", "Third-party tools we rely on are credited, never claimed.", "No marketing — only what works." The last sits 1 scroll below a ticker reading "ACCELERATING AI ADOPTION". |
| `components/Transmission.tsx:7-12` | C3, C6 | Medium | "No mailing list, no funnel — the catalog lives in the open…". This contradicts `/method` ("Project Planning is the funnel.", `routes/Method/Method.tsx:14`). The block is labelled "TRANSMISSION". |
| `components/Hero.tsx:17-20`, `data/bootLines.ts:14` | C2, C4, C1 | High | "An anonymous research lab at the consumer-AI frontier. We try things, validate what's genuinely useful, and publish it openly — to make adoption faster for everyone." Across `src/` (excluding tests), "genuinely useful" occurs 12×, "faster for everyone" 5×, and "validate(d), then share(d)" 7×. The rendered home page has 17 em dashes in about 790 words. |
| `components/Instruments.tsx:44-46`, `routes/Loadout/Loadout.tsx:172-175` | C5 | Low | Triplets: "measured context costs, real isolation masks, honestly rated buffs" and "Costs are measured, buffs are rated, drift is derived…". The "measured" claim is H8. |
| Whole page (measured live at 1440) | D9, D12 | High | Of 115 text-bearing elements, 76 are PP Fraktion Mono and 16 Sevastopol Interface, against only 8 in the body face. About 36% of visible characters are uppercase and about 39% are letterspaced. Five families load on `/`; `/loadout` adds a sixth (KH Interference, `styles/loadout.css:89`). The ground is `#000` with tinted near-blacks `#050505`/`#0b0b0b` (`styles/colors_and_type.css:78-91`). The accent is `#c0fe04`. |
| Whole page (measured via `getAnimations()`) | D13 | Medium | Eight `infinite` loops run at once: `dot-pulse` ×3, `term-flicker`, `term-cursor`, `ticker-scroll`, `ascii-breathe`, `crt-flicker`. Also one-shots: the typing boot, `cta-blink` ×2 and the nav square. |
| `components/Hero.tsx:22-27`, `styles/components.css` `.btn` | D9 | Low | CTAs "SEE THE ATISHA INITIATIVE" / "HOW WE WORK" in tracked mono caps. |

### `/atisha`

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/Atisha/Atisha.tsx:11-12` | D1, D2, C2 | Medium | The slogan doubles as the eyebrow (`// VALIDATED, THEN SHARED`) over "THE ATISHA INITIATIVE.". |
| `routes/Atisha/Atisha.tsx:15-21` | C2, C5, C1 | Low | "genuinely useful — published openly to make AI adoption faster for everyone"; "Veracity-first, real APIs, no mocks." The claim in the link text is H3. The empty state (lines 25-28) is honest. Keep it. |

### `/method`

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/Method/Method.tsx:10-11,17-25`, `data/method.ts` | D1, D2, D3 | Low | "// HOW WE WORK" / "FROM READ TO SHIP." over five equal cards `// 01`–`// 05`. This is the one place where numbering is earned, because it is a real sequence; the tell is the `//` prefix and the equal-card grid. The stage copy ("Build it, try it, see what happens. Most die here.") has the most human voice on the site. Use it as the model. |

### `/colophon`

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/Colophon/Colophon.tsx:7-8` | D1, D2 | Medium | `// COLOPHON` directly above "COLOPHON.": the eyebrow restates the heading word for word. |
| `routes/Colophon/Colophon.tsx:15-18` | C4 | Medium | A colophon that names no typeface ("typeset in the Dinnaga design system") on a site shipping six families. See open question 6. Claims are H3 and H6. |

### `/loadout`

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/Loadout/Loadout.tsx:169-170` | D1, D2 | Low | `// 05 · RIPPERDOC` (collides with the home `// 05`) / "LOADOUT.". |
| `components/loadout/ImplantCard.tsx:32-35`, `data/zords.json` | D4-adjacent | Low | All 23 implants show the same "RARE ◆◆◆◇◇" (every `tier` is `rare`). A rating that never varies carries no information. |
| Route as a whole | (none) | n/a | The cyberware-bench parody has its own organizing idea and diegetic UI (HUD gauges, friction report, the "I'm sorry, Dave" over-budget gag). Its tells are the shared furniture only. Claims are H2 (boot "13 FOUND") and H8. |

### `/weekly`

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/Weekly/WeeklyLog.tsx:20-22` | C1, C8 | Medium | Every card has the same title, "WEEK IN REVIEW — <date>" (a spaced-em-dash label), under a "THIS WEEK (SINCE …)" kicker (H9). |
| `routes/Weekly/WeeklyLog.tsx:24`, `data/weeklyRuns.json` `summary` | C8 | Medium | The summaries are the generator's cadence: "The week's Claude Code activity was dominated by…; the substantive learning was less about…", "surfacing recurring themes in…", "The week was anchored by…". The generator is out of scope, but this page chooses to render them as its main copy. |

### `/weekly/2026-09-26` (site chrome only)

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/Weekly/WeeklyViewer.tsx:14-16`, `components/DocFrame.tsx:17-18` | D1, D9 | Medium | The H1 is the generator's `windowLabel` ("THIS WEEK (SINCE 2026-09-21)"). At 1440 it breaks mid-date ("2026-09-" / "21)"). The stale claim is H9. The CRT overlay (D14) sits over the doc. |

### `/artifacts` and `/artifacts/slamwich-tasting-report` (site chrome)

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/Artifacts/Artifacts.tsx:10-16` | D1, D2, C1 | Low | "// ARTIFACTS" / "DOCUMENTS OFF THE BENCH." plus two spaced em dashes in a two-sentence intro. The intro's "the nav forgot this shelf; the home terminal remembers the words" has real voice. Keep it. |
| `styles/artifacts.css:7-17` | (layout) | Low | With three entries in a two-column seam grid, the fourth cell renders as an empty grey block (`.artifact-index` background). |
| `components/DocFrame.tsx:17-26` | D14 | Low | The viewer strip is fine, but the CRT vignette tints the iframed doc's own palette. The note about `localhost:9021` dish links is honest disclosure. Keep it. |

### `/nope` (404)

| Where | Pattern | Sev. | Notes |
|---|---|---|---|
| `routes/NotFound/NotFound.tsx:8-9` | D1, D2, C6 | Low | "// 404 · SIGNAL LOST" / "NO TRANSMISSION HERE." The nav still pulses "● LIVE". |

### Doc-internal tells (iframed docs; the generators are out of scope for change)

| Doc | Tells |
|---|---|
| `public/artifact-docs/weekly/2026-09-26.html` | C7: nine emoji headings (📓 💡 🧭 📊 ⌨️ 🧰 🗂️ 🛠️ 📁), second person on a public page ("Your Week in Review", "What you explored & learned"), and Title Case topic headings. D4: a five-tile stat row (16 SESSIONS · 6 ACTIVE DAYS · 2 PROJECTS · 5.0M OUTPUT TOKENS · 52.8M INPUT TOKENS). D3/FD trait 4: rounded cards (6/10/14px radii). C8: summary semicolon chains and "dominated by". C1: 15 em dashes in about 1,180 words. The "this week (since 2026-09-21)" label is H9. |
| `public/artifact-docs/slamwich-tasting-report.html` | D7: the self-narrating caption "This page practices what the corpus preaches: token-driven light/dark themes, a barbell type scale, one red accent, zero image assets. The header's ghost wordmark is Bleibtgleich's move." D4: a four-number stat row (28 reference sites · 84 dishes rebuilt · 6 selection rounds · 84 docs). D1: `§1`–`§5` section markers and a middle-dot meta eyebrow ("SLAMWICH · TASTING REPORT · 2026-08-08"). C1: 38 em dashes in about 2,570 words. The report that teaches "thesis, not theme" carries some of the furniture it warns against. |
| `public/artifact-docs/llm-best-practices-*.html` (source-profiled only, not walked) | C1: 19 em dashes in about 1,020 words (GitHub Copilot sheet). A title of the form "LLM Best Practices × GitHub Copilot", with twelve two-word noun-phrase headings. |

## Instance inventory: honesty bugs

Each bug asserts something untrue, whatever the visual direction. These are fixed regardless of the redesign.

| # | Route / where | Claim → reality | Sev. |
|---|---|---|---|
| H1 | Every route. `components/CookieBanner.tsx:22-34`, mounted at `components/Layout.tsx:14`. | **Claim:** "This site uses lightweight analytics to understand which research reaches you. Nothing personal — telemetry only." **Reality:** there are no analytics:<br>- no analytics dependency in `package.json`<br>- no script in `index.html`<br>- no analytics code in `src/`<br>- zero analytics requests in the network log<br><br>"Accept" and "Decline" run the same handler (hide), and the choice is not persisted, so the banner reappears on every load. It is full-bleed lime, the loudest element on the page, and takes 135 CSS px of the 844px mobile viewport. | High |
| H2 | `/`, `/loadout` | **Claim:** four different counts for one registry. **Reality:** `zords.json` (snapshot 2026-07-10) holds **23 implants from 22 papers**, and `Instruments.tsx:20-31` derives exactly that. The hardcoded copies are stale:<br>- `data/surfaceData.ts:19`: "22 implants · 21 papers" (stale since the 23-zord refresh, `22b467c`, 2026-07-10, and pinned by `data/data.test.ts:20`, so the test enshrines the wrong copy)<br>- `data/tickerItems.ts:8`: "12 PAPERS REPRODUCED" (last touched 2026-07-02)<br>- `data/loadoutBootLines.ts:9`: "ZORD REGISTRY … 13 FOUND" (the 2026-07-01 13-implant snapshot)<br>- `public/assets/loadout-bench.png`: shows "snapshot 2026-07-01"<br><br>**Root cause:** one derived number, three hand-typed copies. | High |
| H3 | Site-wide. `routes/Colophon/Colophon.tsx:16-17`, `components/DataPanel.tsx:39-41,53`, `data/surfaceData.ts:7`, `data/tickerItems.ts:4`, `components/AsciiArt.tsx:11,17-20`, `components/SiteFooter.tsx:27-30,35`, `data/practices.ts:12,27`, `routes/Atisha/Atisha.tsx:16`, `components/Transmission.tsx:10` | **Claim:** "Open source by default", "OPEN-SOURCE BY ETHOS", "Source for what we publish lives openly under the Dinnaga org", and an ASCII box listing `project planning / open`, `atisha / open`, `source / open`. **Reality:**<br>- As of 2026-09-28 the org's public repository list is empty (unauthenticated `GET /orgs/Dinnaga-Research/repos` returns `[]`).<br>- The "open-source reference" / "Atisha project" links go to a public GitHub *Project board* (5 items), not source.<br>- `data/links.ts:4` already keeps Project Planning unlinked because it is private.<br>- The site's own source is public, but it is not under the org. | High |
| H4 | `/` terminal. `components/Terminal.tsx:122-123,193-197`, `data/bootLines.ts:6-12` | **Claim:** `SIGNAL // 042`, `DINNAGA-OS · ENCRYPTED · 18:42Z` (a frozen timestamp), `UPLINK STABLE`, `PING 42ms`, `FIDELITY 87%`, `DINNAGA-OS v0.4.1`, `ESTABLISHING UPLINK … OK`, `LOADING ATISHA INDEX … OK` (the index is empty), `VALIDATION BAR : ENGAGED`. **Reality:** none has a data source. They are the kit README's number-formatting examples. | High |
| H5 | Every route. `components/SiteNav.tsx:36-39`, `components/AsciiArt.tsx:15,39` | **Claim:** "● LIVE" in the nav, pulsing, including on the 404; `STATUS : LIVE · OPEN`; a live dot on the ASCII caption. **Reality:** a static site with no live state. (The loadout's "FRICTION // LIVE REPORT" is real, since it recomputes per build. Keep that one.) | Medium |
| H6 | `/colophon`. `routes/Colophon/Colophon.tsx:16` | **Claim:** "deployed on GitHub Pages". **Reality:** hosted on Vercel (`README.md:8`, `INDEX.md:53-57`, `vercel.json`). The GitHub Pages fallback in `index.html:25-35` and `public/404.html` are leftovers. | Medium |
| H7 | `/`. `data/surfaceData.ts:12-15`, `data/tickerItems.ts:6`, `components/Transmission.tsx:8-11`, `data/bootLines.ts:8` | **Claim:** "Initiatives live: 3 — Project Planning · Atisha · Ripperdoc bench"; "ATISHA INITIATIVE — ONLINE"; "The Atisha Initiative is open… the catalog lives in the open and grows as we validate". **Reality:** the catalog has 0 entries (`data/atishaCatalog.ts:5`), and Project Planning is private. `/atisha` itself tells the truth with its empty state. | Medium |
| H8 | `/`, `/loadout`. `components/Instruments.tsx:45`, `routes/Loadout/Loadout.tsx:173`, `components/loadout/ImplantModal.tsx:83-88`, `components/loadout/HarnessHUD.tsx:57` | **Claim:** "measured context costs" / "Costs are measured", and a provenance badge reading **measured**. **Reality:** the badge's own tooltip and the page footnote say "estimated tokens = ceil(chars/4)" (`zords.json` `costBasis`). The payload text is real; the token count is an estimate. | Medium |
| H9 | `/weekly`, `/weekly/:date`. `routes/Weekly/WeeklyLog.tsx:20`, `routes/Weekly/WeeklyViewer.tsx:15` | **Claim:** every past run is labelled "THIS WEEK (SINCE …)", and the viewer uses that label as its H1. **Reality:** a relative label frozen at generation time. The site can render the absolute range from `windowStart`/`date` without touching the generator. | Medium |
| H10 | `/` terminal. `components/Terminal.tsx:92-99` | **Claim:** "▸ TRANSMISSION RECEIVED." **Reality:** nothing is sent anywhere; no network request is made. The follow-up line admits no one replies, but "received" is still false. | Low |
| H11 | `/`. `components/Instruments.tsx:51` | **Claim:** "3,937 TESTS GREEN". **Reality:** the figure is summed from the 2026-07-10 snapshot (first implant per paper). Nothing on the site re-verifies that they are green now, and no snapshot date is shown beside it. | Low |
| H12 | `/`. `public/assets/loadout-bench.png` | **Claim:** the image presents the bench as it is. **Reality:** it shows a four-link nav (no WEEKLY), the 2026-07-01 snapshot, and a pre-refresh state. A picture of the product presented as the product. | Low |

## Noticed on the walk (neither tell nor honesty bug)

- **No primary navigation below 900px.** `.nav-links { display: none }` (`styles/site.css:242-244`) has no menu to replace it. On a phone the header offers only the brand mark and "● LIVE".
- **Nested scrolling on mobile.** On `/weekly/2026-09-26` at 390px, the doc iframe is 564px tall and holds a document of about 9,100px.
- **The 404 is soft.** The SPA serves `/nope` with the Vercel rewrite, so it presumably returns HTTP 200. I did not verify this against production.

## Open questions for the operator

1. **Palette.** Keep `#C0FE04` on black? The model vendor's own design guidance names this exact pairing as a default of generated pages. If you keep it, what single meaning does lime carry? (For example, "validated", or "you can touch this".)
2. **Thesis.** What is the one sentence the site is? Candidates from what already works:
   - the terminal as the whole front door
   - a plain dated lab notebook
   - the loadout bench as the proof
3. **Open source.** Publish repos under the org, or rewrite every "open source" claim to name what actually is public (the site repo, the Atisha board)?
4. **Terminal fiction.** Is the CRT/transmission voice sanctioned play, fiction framed as fiction, or must every readout be real? This decides whether H4, H5 and H10 are wired up or cut. The shelf unlock and the Cromulon hint survive either way.
5. **Homepage proof.** Replace the /loadout screenshot with a live component rendered from `zords.json`, or drop it?
6. **Typefaces.** The spec records the shipped faces' licence as an unresolved go-live item (`docs/superpowers/specs/2026-05-17-dinnaga-website-design.md:176-180`). Should they be licensed, or swapped for the substitutes listed there? And should the colophon name them?
7. **Section numbers.** Drop every `// 0N` except `/method`'s real five-step sequence?
8. **Counts.** Should every registry number come from `zords.json`, shown with the snapshot date? Should "TESTS GREEN" stay only if tests are re-run when the snapshot is refreshed?
9. **Weekly labels.** Should the site render absolute date ranges instead of the generator's "this week" label? Should the doc-internal tells (emoji headings, "Your…", the stat tiles) be raised against the generator as a separate ticket?
10. **Analytics.** Is any analytics planned? If not, delete the banner. If yes, the banner must describe what is actually collected, and "Decline" must actually decline.

## Sources

**Corpus (local)**
- web-design-forge skill: `~/code/weytani-skills/skills/web-design-forge/SKILL.md`; `references/layout.md` (thesis-not-theme; "template furniture"); `references/color.md` (one-signal and semantic economies; accent in ≤2 places); `references/type.md` (system shapes, voices checklist); `references/motion.md` (one engine; stillness); `references/css-artwork.md` (diegetic UI; "art serves the thesis").
- SLAMWICH Tasting Report, §1 "What the acclaimed 28 have in common": `~/code/dinnaga/public/artifact-docs/slamwich-tasting-report.html` (2026-08-08). SLAMWICH Originals Report: `~/code/slamwich/docs/originals/README.md`.
- humanizer skill v2.1.1: `~/.claude/skills/humanizer/SKILL.md`, patterns #3, #4, #9, #10, #13, #16, #17 and #19, plus "Signs of soulless writing".
- Repo evidence: `docs/superpowers/specs/2026-05-17-dinnaga-website-design.md`; commits `2e319be`, `8dd01e6`, `e527606`, `7df791d`, `9c71769`, `22b467c`; the vendored kit bundle named at spec line 30.

**Outside writing**
- Wikipedia contributors, "Wikipedia:Signs of AI writing", WikiProject AI Cleanup, retrieved 2026-09-28. Relevant sections: Caveats; Negative parallelisms ("Not X, but Y"); Rule of three; Overuse of em dashes (with its September 2026 note that the sign is weakening); Title case; Emoji as formatting; Promotional language; Ineffective indicators. https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Anthropic (P. Rajasekaran, J. Wei, A. Bricken et al.), "Improving frontend design through Skills", 2025-11-12. Distributional convergence: "Safe design choices… dominate web training data." https://claude.com/blog/improving-frontend-design-through-skills
- Anthropic, `frontend-design` skill, claude-plugins-official, revision of 2026-09-01. The calibration list of AI-design clusters, the numbered-marker rule and the copy guidance. https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
- Jeff Humble, "7 Signs a UI Has Been Vibe Coded", The Fountain Institute, 2026-04-24. Sign 2 (decorative glow), sign 5 (cards for everything), sign 7 (status dots that don't mean anything). https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui
- Boris Müller, "Why Do All Websites Look the Same?", Medium, October 2018. The date comes from the author's follow-up "Medium Rare"; Medium returned 403 to my fetch, so I relied on search summaries for the argument that templates are content-agnostic. https://borism.medium.com/on-the-visual-weariness-of-the-web-8af1c969ce73
- Matt Ström-Awn, "The inevitable same-ification of the internet", 2019-05-31. Convergence as an emergent result of locally rational choices. https://mattstromawn.com/writing/sameification/
- Matthew Butterick, "All caps", *Butterick's Practical Typography* (web book, undated). https://practicaltypography.com/all-caps.html
- Nat Friedman, "No cookie for you", The GitHub Blog, 2020-12-17. No non-essential cookies means no banner is needed. https://github.blog/news-insights/company-news/no-cookie-for-you/
