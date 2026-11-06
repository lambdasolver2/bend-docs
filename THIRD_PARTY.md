# Third-party attribution

## Ported code

Nothing. Every line under `scripts/book/` is our own.

## Bundled assets

| Asset | Licence | Where |
|---|---|---|
| **Space Grotesk** (variable, `scripts/book/assets/fonts/SpaceGrotesk.ttf`) | SIL Open Font License 1.1 — text in `fonts/OFL-SpaceGrotesk.txt` | the book's display/UI face; self-hosted, no CDN |
| **STIX Two Text** (`src/assets/stix-latin*.woff2`) | SIL Open Font License 1.1 | italic labels in the net drawings |

## Design cues only (no code copied)

| Source | Licence | What was read | What was taken |
|---|---|---|---|
| [`Arrow7000/netties`](https://netties.adler.dev/) — Aron Adler | **PolyForm Noncommercial 1.0.0** (not a permissive licence, so not portable) | `design/brief.md`, `src/render/svg.ts`, `src/render/path.ts`, `src/layout/geometry.ts`, `src/layout/route.ts` (headers), `src/anim/morph.ts` | **Visual language, proportions and the rewiring animation, re-implemented from scratch** in `scripts/book/assets/inet.js`: triangles 48×30 with the tip on the principal port, γ filled black / δ white, italic serif agent and free-port labels, wires leaving ports vertically and running only vertically or horizontally between rounded 9-unit corners, S-curves between facing ports (Lafont's X), ∪/∩ for like-facing ports, side lanes for ports facing away, a paper-coloured halo under each wire so crossings read as bridges, the amber band under an active pair. **Animation (re-implemented):** every wire of the next state is morphed from the chain of old wires it continues, sampled and interpolated point by point with its ends glued to the moving ports; agents slide and flip, new agents grow out of the cell they copy, consumed agents shrink into the point where the pair met. The reducer records the continuation chain (`contract` → `chains`), which is what makes the morph possible. |
| [`Derenash/IcSim`](https://derenash.github.io/IcSim/) | unlicensed | README | none (force-directed physics rejected: frames must match the book's interaction counts exactly) |
| [`racs4/hvm-visualizer`](https://github.com/racs4/hvm-visualizer) | unlicensed | README | none |
| [`eliesgalvira/criba`](https://github.com/eliesgalvira/criba) | unlicensed | README | none |

The interaction calculus, the six symmetric-combinator rules and the reduction semantics are Lafont (1997) and
Mazza, implemented from the papers and the book's own text.
