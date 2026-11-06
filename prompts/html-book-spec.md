# Build spec: the printable, animated HTML book (compendium + coursebook)

Audience: an implementing LLM agent. Follow the phases **in order**. Each phase ends with an acceptance check
you must run and paste the output of. Do not skip checks; do not claim a check passed without running it.

## 0. What you are building

Three static HTML pages that work from `file://` and from any static host, with no server and no CDN:

```
bend-docs/book/index.html        landing page: two cards, "Compendium" and "Coursebook"
bend-docs/book/compendium.html   the compendium, rendered
bend-docs/book/coursebook.html   the coursebook, rendered, with interactive nets and trace players
bend-docs/book/assets/           book.css, print.css, nets.js, trace.js, toc.js (+ fonts if self-hosted)
bend-docs/book/pdf/              coursebook.pdf, compendium.pdf (generated with headless Chromium)
```

Both document pages share one top bar with two tabs, **Compendium · Coursebook**, so the reader can move
between them. Cross-references from the coursebook into the compendium (for example `(H.46)` or
`*(M.4)*`) become links to `compendium.html#file-H-46`.

### Inputs (read-only)

| File | What it is | Size |
|---|---|---|
| `bend-docs/src/content/compendium/bend-hvm-inet-compendium-claude.md` | compendium, **generated**, 13 parts A–M, 478 embedded files, appendix R, link index, provenance | 3.6 MB, 88k lines |
| `bend-docs/src/content/coursebook/bend-hvm-inet-coursebook-claude.md` | coursebook, **generated** from `scripts/claude-docs/cb/*.md` by `scripts/claude-docs/build-coursebook.py` | 194 KB, 3.5k lines, 114 exercises |

Rules about the inputs:

1. **Never edit the two generated `.md` files.** If the coursebook needs a marker (§5), edit the part files in
   `bend-docs/scripts/claude-docs/cb/` and run `python3 bend-docs/scripts/claude-docs/build-coursebook.py`.
2. **Do not regenerate the compendium.** Its builder needs sources in `/tmp` that may be gone. Treat the
   compendium `.md` as a fixed input.
3. **Do not change any wording, number, quote or code block.** This is a rendering task. Every quote and
   interaction count in these documents was verified; a renderer that "improves" text breaks that.
4. Do not touch the Astro site (`src/pages`, `src/content.config.ts`, `astro.config.mjs`). The book is a
   separate build. `bun run build` (the Astro site) must still pass at the end.

## 1. Tooling (use exactly this)

- Runtime: **Bun** (installed, 1.4.0). Scripts live in `bend-docs/scripts/book/`, written in TypeScript.
- Markdown: the **unified** stack already in `bend-docs/node_modules`: `remark-parse`, `remark-gfm`,
  `remark-rehype` (with `allowDangerousHtml: true`), `rehype-raw`, `rehype-stringify`, and `github-slugger`
  for heading ids. Do not add another Markdown parser.
- Syntax highlighting: **shiki** (already installed, `node_modules/shiki`). Use it for the **coursebook only**
  (see §3.4 for why). Alias the language `hvm` to `haskell` (the site does the same) and `bend` to `python`.
- PDF and browser tests: `bun add -d playwright-core@1.62.1` (it is in the local Bun cache and matches the
  installed Chromium revision 1234). Launch with
  `executablePath: ~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`. Do not download browsers.
- Fonts: system fonts are enough. Body: `"Noto Serif", "DejaVu Serif", Georgia, serif`. Headings and UI:
  `"Noto Sans", "DejaVu Sans", system-ui, sans-serif`. Code and ASCII diagrams: `"DejaVu Sans Mono",
  "Noto Sans Mono", monospace`. **DejaVu Sans Mono must come first for code**: the diagrams use box-drawing
  characters (`╱ ╲ ● ○ ║ ╳ │ ─`) and subscripts (`₀ ₁`) that must align on a fixed grid.
- No frameworks, no React, no CDN, no external network requests at runtime. Plain HTML, CSS, and vanilla JS
  modules.

Entry point: `bun bend-docs/scripts/book/build.ts` writes everything under `bend-docs/book/`.
`bun bend-docs/scripts/book/pdf.ts` writes the PDFs. `bun bend-docs/scripts/book/check.ts` runs the checks.

## 2. Phase 1: render both documents to plain HTML

Pipeline per document: read file → strip YAML front matter (between the first two `---` lines; keep `title`
and `description` for `<title>` and the header) → preprocess (§2.1) → unified → postprocess (§2.2) → wrap in
the page template (§4).

### 2.1 Preprocessing (string level, before parsing)

1. **Solution blocks.** The coursebook has 114 `<details><summary>Solution</summary> … </details>` blocks. Some
   are on one line with the answer inline. Markdown inside an HTML block is only parsed if it is separated by
   blank lines, so normalize every block to:
   ```
   <details class="solution"><summary>Solution</summary>

   …original inner text, unchanged…

   </details>
   ```
2. **Compendium file sections.** Every embedded file is delimited by
   `<!-- ===== BEGIN FILE · X.n ===== -->` … `<!-- ===== END FILE · X.n ===== -->` (478 pairs, each at the
   start of a line; the intro also *mentions* the marker syntax inline: ignore matches that are not at column
   0). Replace them with `<section class="file" id="file-X-n">` and `</section>` (dots become dashes).
3. **Heading demotion inside compendium files.** Inside a file section, the first heading is the file's
   title (`### X.n · …`). Every later heading in that section is part of the embedded file: demote it by 3
   levels (`#` → `####`, `##` → `#####`, `###`+ → `######`; deeper than 6 stays 6). Without this the
   embedded files' own `#` headings would break the document outline and the PDF bookmarks.
4. Do not alter anything inside fenced code blocks.

### 2.2 Postprocessing (HTML/AST level)

1. Heading ids with **github-slugger**, one slugger per document, applied to the heading text with
   `` ` * _ `` removed. The coursebook's table of contents was generated with exactly this rule; all 106
   in-page links must resolve (check C1).
2. In the compendium, heading ids inside a file section get the prefix `file-X-n--` so the 478 files cannot
   collide.
3. In the compendium's "Table of contents" list, turn every `X.n · …` item into a link to `#file-X-n`.
4. Cross-document links in the **coursebook**: link compendium ids written as `A.4`, `H.46`, `M.7` etc. Regex
   on text nodes only (never inside `<code>`, `<pre>`, or an existing `<a>`):
   `(?<![A-Za-z0-9.§])([A-M])\.(\d+)(?![\d.])`. Link only ids that exist in the compendium (collect them
   from the `### X.n · ` headings). This must not touch exercise ids (`E7.4`, `E8B.1`), section numbers
   (`§7.7`, `8B.9`) or version numbers (`2.0.39`).
5. External links: `target="_blank" rel="noopener"`.
6. Wrap every table in `<div class="table-wrap">` (horizontal scroll on screen, full width in print).
7. Fenced ` ```text ` blocks are ASCII diagrams or traces: give them class `ascii`. Leave their content
   untouched.

**Acceptance (phase 1):** open both pages in headless Chromium and run check C1 (anchors), C2 (no console
errors), C3 (counts: coursebook has 114 `details.solution`, compendium has 478 `section.file`).

## 3. Phase 2: look and print layout

### 3.1 Screen

- Light theme only (it must print well). Max text width 46rem; tables and code may be wider and scroll.
- Left sidebar with the document's table of contents: `h2` and `h3` for the coursebook; parts and file ids
  for the compendium. Sticky, collapsible, highlights the current section. Hidden in print.
- Top bar: book title, the two tabs (current one marked), a "print" button, a search field (simple
  client-side filter of headings; optional).
- `blockquote` = quotation: left rule, italic not required. A paragraph starting with `> **…**` (bold first
  words, used for "Honesty about this example", "The one convention", etc.) gets class `callout`.
- `details.solution`: closed on screen, a small "Solution" disclosure.
- Code: shiki colors in the coursebook; plain monospace with light background in the compendium.
- Compendium performance: add `content-visibility: auto; contain-intrinsic-size: 1px 2000px` to
  `section.file` so the 3.6 MB page scrolls smoothly.

### 3.2 Print (`print.css`, `@media print`)

- `@page { size: A4; margin: 18mm 16mm 20mm 16mm; }`. Body 10pt serif, code 8pt, line-height 1.35.
- Hide the sidebar, top bar and every interactive control.
- **Open every solution for print.** CSS cannot open `<details>`; add a `beforeprint` listener that sets
  `open` on all `details`, and in `pdf.ts` do the same before calling `page.pdf()`.
- `h2` (each Part) starts on a new page. Never break inside `pre`, `figure`, `table` rows, `.callout`,
  `details` summary lines; `h2–h4` avoid a break after them (`break-after: avoid`).
- Long code lines must wrap in print (`white-space: pre-wrap`) **except** `pre.ascii`, which must not wrap
  (it would destroy the drawing). For `pre.ascii` wider than the page, scale it down with
  `font-size: 7pt` (the widest coursebook diagrams are under 110 columns).
- External links in the coursebook print their URL after the link text in small type
  (`a[href^="http"]::after { content: " (" attr(href) ")"; }`). Do **not** do this in the compendium (it has
  472 URLs and a link index already).
- Interactive figures print as a static strip of all frames (see §5.4).

### 3.3 PDFs

`pdf.ts` opens each page with Playwright (`waitUntil: "load"`, then wait until `window.bookReady === true`,
which `toc.js`, `nets.js` and `trace.js` set when they have finished), opens all `details`, then calls
`page.pdf({ format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate, footerTemplate,
outline: true, tagged: true })`. Footer: document title on the left, `<span class="pageNumber"></span> /
<span class="totalPages"></span>` on the right. `outline: true` gives PDF bookmarks from the headings; if
this Playwright version rejects the option, remove it and note that in the report.

Expect the coursebook PDF to be roughly 80–120 pages and the compendium roughly 800–1,200 pages. The compendium
PDF may take minutes to generate: give `page.pdf` a long timeout (10 minutes) and a large viewport.

### 3.4 Why the compendium gets no syntax highlighting

It has about 2,300 fenced blocks. Shiki emits an inline style per token, which would make the compendium HTML
tens of megabytes and the PDF very slow. If you want color there, use shiki's CSS-variable theme and
highlight only `hvm`, `bend` and `c` blocks, and measure the file size first; keep `compendium.html` under
15 MB.

## 4. Page template (both documents)

```html
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="assets/book.css"><link rel="stylesheet" href="assets/print.css" media="print">
</head><body class="doc-{compendium|coursebook}">
<header class="topbar">… tabs: <a href="compendium.html">Compendium</a> <a href="coursebook.html">Coursebook</a> …</header>
<nav class="sidebar">{generated TOC}</nav>
<main class="content">{rendered document}</main>
<script type="module" src="assets/toc.js"></script>
<!-- coursebook only: --><script type="module" src="assets/nets.js"></script><script type="module" src="assets/trace.js"></script>
</body></html>
```

`index.html`: title, one paragraph per document (use each document's `description` from its front matter,
unchanged), two big links, and a "Print / PDF" link to each PDF if it exists.

## 5. Phase 3: interactive figures in the coursebook

Two kinds of figures. Both are inserted where a marker comment appears in the coursebook source.

### 5.1 Markers

Add these HTML comments to the coursebook **part files** (`scripts/claude-docs/cb/*.md`), each directly
**below** the existing ASCII diagram or trace it animates, then rebuild with `build-coursebook.py`. The
renderer replaces each marker with a `<figure class="widget">` and keeps the ASCII diagram above it (on
screen the ASCII goes into a collapsed `<details>` "plain-text version"; in print the ASCII is kept and the
widget's frame strip is printed below it).

| Marker | Place (section of the coursebook) | Widget |
|---|---|---|
| `<!-- widget: net rule=gg -->` | §3.2 Annihilation γ–γ | net, one rule |
| `<!-- widget: net rule=dd -->` | §3.3 δ–δ | net, one rule |
| `<!-- widget: net rule=ee -->` | §3.4 ε–ε | net, one rule |
| `<!-- widget: net rule=ge -->` and `rule=de` | §3.5 erasure | net, one rule each |
| `<!-- widget: net rule=gd -->` | §3.6 commutation | net, one rule |
| `<!-- widget: net example=hand-reduction -->` | §3.8 complete hand reduction | net, full reduction |
| `<!-- widget: net example=id-app -->` | §4.3 `(λx. x) y` | net, full reduction |
| `<!-- widget: net example=dup-id -->` | §4.4 duplicating a function | net, full reduction |
| `<!-- widget: trace src=traces/share.txt -->` | §0.5 (the showpiece, 11 interactions) | trace player |
| `<!-- widget: trace src=traces/dup-id.txt -->` | §4.4 (2 interactions) | trace player |
| `<!-- widget: trace src=traces/c2k2.txt -->` | §8B.9 Church 2², 14 interactions | trace player |

Also turn two tables into bar charts (inline SVG, generated at build time from the table cells, the table
stays): §7.7 (fusion: k vs interactions) and §9.4 (quadratic slowdown: n vs interactions; use a log-log
axis and draw the measured points only, no fitted curve). Markers `<!-- widget: chart table=next -->`
placed directly above each of those two tables.

### 5.2 Trace player (exact data from HVM4, no simulation)

The trace files are **recorded HVM4 output**, not hand-written. Generate them once and commit them under
`bend-docs/scripts/book/traces/`:

```sh
git clone https://github.com/HigherOrderCO/HVM4 /tmp/hvm4 && cd /tmp/hvm4 && git checkout 6defdfc
clang -O2 -o src/hvm src/hvm.c
# for each program below: write it to prog.hvm, then
./src/hvm prog.hvm -D | sed 's/\x1b\[[0-9;]*m//g' > <name>.txt
```

Programs (copy them **verbatim** from the coursebook; these are the versions in it):
- `share.txt`: the §0.5 program `@f` … `@main = !F& = @f(2); [F₀(10), F₁(20)]` (take the full program text from
  §0.5).
- `dup-id.txt`: `@main = !f&A = λx.x; [f₀, f₁]`.
- `c2k2.txt`: `@c2 = λs. !S&C=s; λx. S₀(S₁(x))`, `@k2 = λs. !S&K=s; λx. S₀(S₁(x))`, `@main = @c2(@k2)`.

Do **not** record `@main = @c2(@c2)`: at HEAD `6defdfc` it only finishes with `-C` (9 interactions), and
`-D` cannot be combined with `-C`; without `-C` the run did not finish within 10 seconds.

Format of `-D` output: the first line is the start term; then repeated pairs of a separator line matching
`/^-{6,} ([A-Z0-9-]+)$/` (the rule name) and the term after that step. The player:

- shows `step i / N`, the rule name as a badge, the term before and after; highlights characters that changed
  (a simple longest-common-prefix/suffix diff is enough);
- buttons: first, previous, play/pause (1 step per 1.2 s), next, last; keyboard ← → space;
- a rule tally ("APP-LAM ×5, DUP-LAM ×3, …") computed from the file.

**Checks:** `share.txt` has 11 steps (APP-LAM ×3, DUP-LAM ×1, DUP-NOD ×5, DUP-SUP ×1, OP2-NUM-NUM ×1); `dup-id.txt` has 2 steps (DUP-LAM,
DUP-SUP); `c2k2.txt` has 14 steps (APP-LAM ×5, APP-SUP ×2, DUP-LAM ×3, DUP-SUP ×4) and its last term is `λa.λb.A₀;!A&K=B₀(B₁(&K{A₁,b}));!B&K=a;`. If any count
differs, stop: you used a different program or HVM4 revision.

Print: render the whole trace as a numbered table (step, rule, term). No animation in print.

### 5.3 Net widget (symmetric interaction combinators, simulated)

This is a small reducer plus an SVG renderer, in `assets/nets.js` (no dependencies).

**Data model.**
```ts
type Kind = "gamma" | "delta" | "eps";           // γ constructor, δ duplicator, ε eraser
type Port = { cell: number; slot: 0 | 1 | 2 }    // slot 0 = principal, 1 = aux1, 2 = aux2 (eps has only 0)
          | { free: string };                     // a free port of the whole net, e.g. "a", "r", "y"
type Net = { cells: Map<number, { kind: Kind; label?: string }>; wires: [Port, Port][] };
```
Every port appears in exactly one wire. An **active pair** is a wire whose two ends are both slot 0.

**Rules (symmetric convention, the book's "one convention": aux1 meets aux1, aux2 meets aux2).** For an active
pair of cells u, v, where `u.1`, `u.2`, `v.1`, `v.2` mean "the port at the other end of the wire attached to
that aux slot":
- **γ–γ and δ–δ with the same label (annihilation):** delete u and v; connect `u.1`–`v.1` and `u.2`–`v.2`.
- **ε–ε:** delete both.
- **γ–ε or δ–ε (erasure):** delete both; attach a new ε (its principal) to `u.1` and to `u.2` of the binary cell.
- **γ–δ, or δ–δ with different labels (commutation):** delete u and v. Create two copies of v's kind (v′₁, v′₂)
  and two copies of u's kind (u′₁, u′₂), with the original labels. Connect v′₁ principal to `u.1`, v′₂
  principal to `u.2`; u′₁ principal to `v.1`, u′₂ principal to `v.2`. Then cross-wire: `u′ᵢ.aux_j` –
  `v′_j.aux_i` for i, j ∈ {1, 2}. ("γ-copies go to the δ's side": the copies of u sit on v's former aux wires.)

Wire splicing: when a rule connects two ports that are themselves ends of wires, merge the wires (a wire
from X to a deleted port, connected to a wire from the deleted port to Y, becomes X–Y). Free ports are
never deleted.

**Scheduler:** deterministic, fire the active pair with the smallest pair of cell ids first; one interaction
per frame. Record a frame after every interaction.

**Built-in examples** (define them as data in `nets.js`; the expected results come from the book):

| Name | Net | Expected |
|---|---|---|
| `rule=gg/dd/ee/ge/de/gd` | the two-cell active pair of that rule, aux ports free (`x₁ x₂ y₁ y₂`) | exactly 1 interaction; cells after: gg 0, dd 0, ee 0, ge 2 ε, de 2 ε, gd 4 (2 γ + 2 δ); free ports unchanged |
| `hand-reduction` (§3.8) | δ (aux → free a, b) principal–principal with γ, whose aux ports each go to an ε principal | 3 interactions; after step 1: 6 cells, 2 active pairs (both δ–ε); final: 6 cells, 0 active pairs: two γ, each with an ε on both aux ports; free ports a, b |
| `id-app` (§4.3) | λ = γ whose aux1 and aux2 are one wire (the body is the variable); @ = γ with principal toward the λ's principal, aux1 → free y, aux2 → free r | exactly 1 interaction; final net is the single wire r–y |
| `dup-id` (§4.4) | δ label A, aux → free f₀, f₁, principal toward the principal of the identity λ (a γ with aux1–aux2 one wire) | 2 interactions: γ–δ commutation, then δ–δ same-label annihilation; final: two γ (two identity λs) at f₀ and f₁, each with aux1 wired to its own aux2 |

Unit tests (`scripts/book/nets.test.ts`, `bun test`) must assert every row of this table, plus: free ports are
identical in every frame, and every port appears in exactly one wire in every frame.

**Rendering (SVG).**
- Cell glyphs follow the book's legend: a triangle for γ and δ with the principal port as a filled dot (●) at
  the apex and aux ports as open dots (○) at the base; δ filled differently from γ and labelled `δ` (plus its
  label, e.g. `δA`); ε as a small filled circle labelled `ε`. Active-pair wires are drawn thick and in the
  accent color. Free ports are labelled text at the edge.
- Layout: compute positions once per frame with a simple layered layout (free ports `a, b, x…, r` on the top
  or bottom edge as in the ASCII figure; BFS from free ports to assign layers; order within a layer by first
  visit). Cells that survive between frames keep their id; **tween** their positions over 400 ms. New cells
  appear at the midpoint of the active pair that created them and move to their place. Deleted cells fade
  out. Wires are drawn as cubic Béziers between port positions.
- Controls: the same as the trace player, plus a status line exactly in the book's style:
  `step 1 · cells 6 · free a, b · active 2 (δ–ε, δ–ε)`.
- Respect `prefers-reduced-motion`: no tweening, step only.

### 5.4 Print form of widgets

For each net widget print the frames as a strip of small SVGs (up to 4 per row), each with its status line.
For each trace widget print the numbered table. Charts print as they are.

**Acceptance (phase 3):** `bun test` passes; check C4 (each widget renders, no console errors); a screenshot of
§3.6 and §3.8 at 1280×900, frame 0 and the last frame, saved to `bend-docs/book/screens/` and looked at by
you: wires do not cross through cells, labels are readable, the status line matches the table above.

## 6. Checks (`scripts/book/check.ts`, headless Chromium)

- **C1 anchors:** every `href="#…"` on both pages resolves to an element id on that page; every
  `compendium.html#file-…` link from the coursebook resolves on the compendium page. Report counts.
- **C2 console:** zero console errors and zero failed requests on all three pages (file:// URLs).
- **C3 completeness:** coursebook: 114 `details.solution`, 128 `h2`+`h3` headings or more, every ` ```hvm `
  block present as `pre`; compendium: 478 `section.file`, 13 `h2` parts `PART A` … `PART M`, the headings
  `APPENDIX R`, `LINK INDEX`, `PROVENANCE` present.
- **C4 text fidelity:** for each document, extract `innerText` of `main`, normalize whitespace, and compare
  against the Markdown source with Markdown syntax stripped (sample 200 random sentences of at least 60
  characters from the source; each must appear in the page text). Report misses; 0 is the target.
- **C5 print:** generate both PDFs; report page counts; open the coursebook PDF's first 3 pages as PNG
  (Playwright screenshot of the PDF viewer is not reliable; instead print to PDF and also take
  `page.screenshot` with `emulateMedia({ media: "print" })` of the first screen) and look at them.
- **C6 site still builds:** `cd bend-docs && bun run build` exits 0.

## 7. Report back

A short list: files created, the output of C1–C6 (numbers, not adjectives), PDF page counts and file sizes,
anything you could not do and why. Do not write "all good" without the numbers.

## Appendix: facts you may rely on (checked 2026-11-06)

- `github-slugger` heading ids match the coursebook's table of contents: 106/106 links resolve
  (`bun bend-docs/scripts/claude-docs/check-anchors.mjs`).
- Compendium file markers are balanced: 478 BEGIN / 478 END at column 0.
- Fenced languages, coursebook: `text` 42, `hvm` 11, `c` 10, `sh` 4, `haskell` 1, untagged ~190 (closing
  fences included in the untagged count). Compendium: `text` 364, `hvm` 331, `bend` 291, `python` 255,
  `output` 190, `sh` 131, `error` 64, plus untagged.
- Fonts present: DejaVu Sans/Serif/Sans Mono, Noto Sans Mono (`fc-list`). Chromium:
  `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`; matching `playwright-core@1.62.1` is in the
  Bun cache.
