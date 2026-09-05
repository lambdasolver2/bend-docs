# Research sources — retrieved 2026-09-05

All via `Accept: text/markdown` mirrors (same representation as HTML).

| # | File | Canonical URL | Last updated (source) |
|---|------|---------------|-----------------------|
| 1 | `sources/home.md` | https://bend2.dev/ | 2026-08-27 |
| 2 | `sources/contents.md` | https://bend2.dev/contents/ | 2026-08-30 (index) |
| 3 | `sources/learn-index.md` | https://bend2.dev/learn/ | 2026-08-05 (index; entries 2026-08-13/21) |
| 4 | `sources/what-is-bend2.md` | https://bend2.dev/notes/what-is-bend2/ | 2026-08-30 |
| 5 | `sources/bend2-release-date.md` | https://bend2.dev/notes/bend2-release-date/ | 2026-08-27 |
| 6 | `sources/bend2-vs-bend1.md` | https://bend2.dev/notes/bend2-vs-bend1/ | 2026-08-30 |
| 7 | `sources/hvm4-explained.md` | https://bend2.dev/notes/hvm4-explained/ | 2026-08-21 |
| 8 | `sources/bend2-vs-mojo.md` | https://bend2.dev/notes/bend2-vs-mojo/ | 2026-08-30 |
| 9 | `sources/bend2-vs-lean.md` | https://bend2.dev/notes/bend2-vs-lean/ | 2026-08-30 |
| 10 | `sources/interaction-nets-explained.md` | https://bend2.dev/notes/interaction-nets-explained/ | 2026-08-21 |
| 11 | `sources/hello.md` | https://bend2.dev/learn/hello/ | 2026-08-13 |
| 12 | `sources/parallelism.md` | https://bend2.dev/learn/parallelism/ | 2026-08-13 |
| 13 | `sources/gpu.md` | https://bend2.dev/learn/gpu/ | 2026-08-13 |
| 14 | `sources/proofs.md` | https://bend2.dev/learn/proofs/ | 2026-08-21 |

## Images

No raster `<img>` on any page. All visuals are inline SVG: footer brand icons,
theme-switch illustrations, copy-button icons, and 5 hand-drawn interaction-net
diagrams (`figure.diagram`) on `interaction-nets-explained`. Our docs use
original hand-authored SVGs (cell, confluence diamond), not copies.

## Deep pass (2026-09-05)

- `repos/hvm4-docs/`: HVM4 `docs/primer.md`, `docs/theory/interaction_calculus.md`,
  `docs/hvm/{memory,core,syntax,collapser}.md` + 62 interaction rule docs listed.
- `repos/taelin-theorem-proving-vs-testing.md`: Taelin's proving-vs-testing essay.
- Formality README (master): "proofs as developer productivity" thesis.
- `VictorTaelin/hvm4-formal`: single `main.hs` (347 lines, Haskell formalization).
- HigherOrderCO org: 8 repos total (Kind, HVM1–4, Bend, bench, .github).
- VictorTaelin (261 repos, ranked): Interaction-Calculus, Formality,
  Interaction-Type-Theory, Cedille-Core, calculus-of-constructions, Caramel,
  abstract-algorithm, optlam, articles, nanoproof, BendGen, lambench noted.

## Hands-on verification log (gcc-built HVM4 @ main, 2026-09-05)

| Program | Result | Stats |
|---|---|---|
| `@add = λa.λb.(a+b); @main = @add(1,2)` | `3` | 3 itrs, 23 nodes |
| `@main = (&A{1,2} + 10)` -C10 | `11`, `12` | 4 itrs, 13 nodes |
| `!x&A = &A{1,2}; [x₀,x₁]` | `[1,2]` | 1 itr |
| `!x&A = &B{1,2}; [x₀,x₁]` -C10 | `[1,1]`, `[2,2]` | 5 itrs |
| `λ&x.(x*x)` of 5 | `25` | 3 itrs |
| fib(10) | `55` | 760 itrs, 19.33M itrs/s |
| len via `#CON:` of 3-list | `3` | 16 itrs |

Stale upstream syntax found (README/primer vs current parser): label-less
`&{a,b}` sup, whitespace application, `<>:` match pattern. Docs show working
forms.
