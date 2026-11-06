# `scripts/book/` — the two-document HTML book

Builds `book/{index,coursebook,compendium}.html` (plus the PDFs) from
`src/content/{coursebook,compendium}/*.md`. Vanilla JS on the page, no framework, works from
`file://` so the PDF pass can use the same HTML.

| File | Role |
|---|---|
| `build.ts` | chunks each document (one chunk per part), renders and caches each chunk by content hash, assembles the pages, copies `assets/` |
| `dev.ts` | `bun scripts/book/dev.ts` → http://localhost:4321, rebuilds the touched chunk and live-reloads (SSE) |
| `pdf.ts` | A4 PDF via Playwright/Chromium, with bookmarks and page numbers |
| `check.ts` | acceptance checks C1–C6 (anchors, counts, console, text fidelity, nets) |
| `lib/render.ts` | Markdown → HTML (marked), heading-id placeholders, code fences, cross-links |
| `lib/preprocess.ts` | ` ```inet ` fences, `<details>` solutions, chart fences, the compendium's file split |
| `lib/charts.ts` | SVG charts from Markdown tables |
| `lib/inet.ts` | loads `assets/inet.js` for the build |
| `assets/inet.js` | **the whole interaction-net engine**: notation parser, the six rules, readback, chain recording for the morph, layout, wire router, SVG renderer, player markup, archive-diagram vectoriser |
| `assets/fonts/` | Space Grotesk (OFL) — the display face; copied to `book/fonts/` |
| `assets/book.js` | TOC, HVM4 trace players, mounts the net players from `data-inet` |

## Interaction nets

A ` ```inet ` fence is data, not code:

```
net: δ(a, b) ~ γ(ε, ε)     # γ(a,b) λ(x,b) @(a,r) δA(a,b) ε ~ (active pair) x = t
show: steps                # net | rule | steps | legend | cells
title: …                   # panel title
caption: …                 # figure caption
term: … | …                # λ-term per step (pipes separate steps)
under: … | …               # sub-labels under the two trees of a `net`
expect: 3                  # build fails unless the net reduces in exactly this many steps
animate                    # also emit the animated player
```

The build renders a static figure from the same `frames()` the player uses, so print and
screen cannot disagree. `assets/inet.js` is loaded by the page as a classic script and by
the build through `lib/inet.ts`.

## The archive's own diagrams

The compendium reproduces its sources **byte for byte** (446 files in 11 parts; Appendix R hashes them), so
its Markdown is never edited. Instead, `render.ts` vectorises a fence at build time when
`Inet.gridHTML` recognises a diagram in the archive's own dialect:

- labelled boxes joined by wires (`┌─┴─┐ │ DUP L0 │ └──┬──┘`) → black agent boxes, italic
  free ports, port dots (the net viewer's style);
- every other line drawing (trees with `├──`, flow arrows `──▶`, nested effect boxes) →
  clean lines and arrowheads from glyph connectivity, text kept on its own grid.

Anything else (tables, term output, code) is left alone. The ASCII of a converted diagram
stays in the page in `<details class="src">`, so the reproduction is still complete, and it
is hidden in print.

## Two parsing hazards in the archive

The documents are HTML→Markdown conversions of other people's pages, and Marked treats any
`<word>` as raw HTML. A type signature like `Maybe<String>` or `a <s> b` therefore opened a
real element: one stray `<s>` struck out **everything after it** (97 elements on the
compendium page). `escapeStrayTags` in `lib/render.ts` now escapes any tag that is not an
allowed inline tag *with a closing tag still to come in the chunk*, so prose keeps its angle
brackets and real HTML (tables, inline SVG, `<details>`) still works.

The same file also escapes a wildcard asterisk that sits between a word and punctuation
(`bend2*, verbatim`), which otherwise closed a bold span early and printed a literal marker.

Author-written `~~struck out~~` text is kept as `<del>`: it is the author's own editorial
mark, not a rendering accident.

## Tables of contents

- The **sidebar** lists the coursebook's parts and sections as before; for the compendium it
  is a real TOC: front sections, then one collapsible group per part (`A · Bend 2 tutorial`,
  count of files) with short file labels (`A.1 tutorial/index`) and the full source path in
  the tooltip. The filter box opens matching groups.
- The compendium's **printed index** ("## Table of contents", one item per file) is laid out in two
  columns with the `bend-docs/src/content/` prefix dropped from the visible label.

## Design cues

Visual language taken from Lafont's figures as drawn by [netties](https://netties.adler.dev/)
(PolyForm Noncommercial — ideas only, no code); see `THIRD_PARTY.md` at the repo root.
