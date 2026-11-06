
---

## Appendix C · Verified-run ledger (HVM4 HEAD `6defdfc`, 2026-11-06)

`-s -C`; Itrs = total interactions. Heap sizes and times are deliberately omitted.

| § | Program (abridged) | Output | Itrs |
|---|---|---|---|
| 0.5 | `(&A{1,2} + 10)` | 11, 12 | 4 |
| 0.5/7.5 | showpiece `!F& = @f(2); [F₀(10), F₁(20)]` | `[[4,10],[4,20]]` | 11 |
| 7.5 | `[@f(2,10), @f(2,20)]` | `[[4,10],[4,20]]` | 8 |
| 4.3 | `(λx.x)(λy.y)` | `λa.a` | 1 |
| 4.4 | `!f&A = λx.x; [f₀, f₁]` | `[λa.a,λb.b]` | 2 |
| 5.3 | `!x&A = &A{1,2}; [x₀, x₁]` | `[1,2]` | 1 |
| 5.3 | `!x&A = &B{1,2}; [x₀, x₁]` | `[1,1]`, `[2,2]` | 5 |
| 5.3 | `(&A{λx.x, λy.10})(7)` | 7, 10 | 4 |
| 5.3 | `(λx.7)(&A{1,2})` | 7 | 1 |
| 5.3 | `!x&A = &{}; x₀` | (nothing) | 1 |
| 5.4 | `!f&A = λx.λy.[x,y]; [f₀(1,2), f₁(3,4)]` | `[[1,2],[3,4]]` | 11 |
| 5.5 | `&A{1,2} + &A{10,20}` | 11, 22 | 4 |
| 5.5 | `&A{1,2} + &B{10,20}` | 11, 21, 12, 22 | 10 |
| 5.6 | `@c2(@c2)` | `λa.λb.a` | 9 |
| 5.6 | `@c2(@k2)` | `λa.λb.a(a(a(a(b))))` | 20 |
| 5.6 | `(λx&. [x₀, x₁])(&A{1,2})` | `[1,1]`, `[2,2]` | 6 |
| E5.1 | `!x&A = &A{3,4}; x₀ + x₁` | 7 | 2 |
| E5.2 | `!x&A = &B{3,4}; x₀ + x₁` | 6, 8 | 7 |
| E5.5 | `(λx&. x₀ + x₁)(&A{1,2})` | 2, 4 | 8 |
| 5.7 | `[*, 1]` | `[*,1]` | 0 |
| 6.1 | `λx. (x + &A{1,2})` | `λa.(a + 1)`, `λa.(a + 2)` | 1 |
| 6.2 | `(λa. &L!{(a + 1); (a * 10)})(5)` | 6, 50 | 4 |
| 6.3 | `@bits(3)` | 8 strings | 40 |
| 6.4 | search `x*x == x+x` over 0..7 | 0, 2 | 167 |
| E6.1 | `&A{1,2} * &B{3,4}` | 3, 4, 6, 8 | 10 |
| E6.2 | search `x*x + 1 == 26` | 5 | 134 |
| E6.6 | pairs with `x + y == 3` | [0,3], [1,2], [2,1], [3,0] | 258 |
| 6.5 | `X + 2 = 4` over all naturals | `#S{#S{#Z{}}}` (at #306) | 536 |
| 7.1 | `@cnot(@cnot(@ctru))` | `λa.λb.a` | 6 |
| 7.2 | `@cadd(@c1,@c2)` / `(@c2,@c2)` / `(@c4,@c4)` | 3 / 4 / 8 | 8 / 9 / 25 |
| 7.2 | `@cmul(@c2,@k2)` / `(@c2,@c2)` | 4 / 4 | 14 / 14 |
| 7.3 | `@fac(3)` / `@fib(5)` / `@sum(4)` (chains) | 6 / 5 / 10 | 109 / 274 / 55 |
| 7.4 | `@map(λx.(x*2), [1,2,3])` | `[2,4,6]` | 35 |
| 7.6 | `fib_small` at 34 (machine ints) | 5702887 | 79,522,600 |
| 7.1/E7.1 | `(λ&x. x(x))(λy.y)` | `λa.a` | 4 |
| 8.9 | dup destructuring / auto-fork examples | see §8.9 | 1 / 1 / 5 / 4 |
| E8.6 | `!x&A = 5; [x₀, x₁]` | `[5,5]` | 1 |

IC reference (`e9f0185`): `(λx.x λy.y)` → `λ$a.$a`, `WORK: 1`. Test suite at HEAD: 217 tests, all pass with `HVM_TEST_TIMEOUT_SECS=20` (with the default 2 s, `fib_small` alone can time out).

## Appendix D · Glossary

| Term | Meaning |
|---|---|
| active pair | two principal ports joined by a wire; the only place a rule fires |
| admissible | a term on which the label discipline is correct (no false same-label meetings) |
| ALO | HVM4 tag for a lazily allocated book term (`@{…}` in traces) |
| annihilation | rule that deletes both cells of an active pair and joins aux1–aux1, aux2–aux2 |
| auto-dup | `λ&x.` / `!&x` / `λx&.`: the parser inserts duplicators, fresh labels where needed |
| book | the static, immutable definitions of a program; in HVM5, a content-addressed `Name → DefHash` map |
| BendRT | released Bend 2's runtime; a flat evaluator, not a net reducer |
| CNF / collapse | lifting superpositions to the top and enumerating worlds (`-C`) |
| commutation | rule where two cells copy each other (2 → 4) |
| DP0 / DP1 | HVM4 tags for the two sides `x₀`, `x₁` of a duplication |
| DUP | duplication `!x&L = v; t`: one value, two locations |
| erasure | ε meeting a cell: delete it, send two erasers outward |
| EXT | 24-bit field of an HVM4 term word holding labels, names, levels |
| fresh label | a label generated to differ from all others |
| γ / δ / ε | constructor / duplicator / eraser cells of the interaction combinators |
| IC | the Interaction Calculus: λ + labeled DUP/SUP, affine global variables |
| Itrs | HVM4's interaction counter (`ITRS_INC`) |
| label | the name of a DUP/SUP fan; equal labels project, different labels commute |
| Lévy-optimal | reduces each redex family once; measured in β-steps |
| oracle | Lamping's bookkeeping deciding which fans are partners; labels are a static version |
| principal port | the single port of a cell where it can interact |
| SNF / WNF | strong / weak normal form |
| SUB | high bit of the HVM4 tag byte: "this slot holds a substitution" |
| SUP | superposition `&L{a,b}`: two values, one location |
| superposed testing | HVM5 v2: running old and new definitions in one reduction via `&T{old,new}` |

## Appendix E · Map to the compendium

| Topic | Compendium ids |
|---|---|
| Bend 2 tutorial (language, BendRT, proofs) | A.1–A.17 |
| Site notes on nets and the four interactions | Part B |
| Bend 2 skills, HVM5-IC skill | Parts C, D |
| Knowledge base on Bend2/HVM5/INET | Part F |
| HVM5 v1 and v2 specifications (README G.51, REVIEW G.52, code-as-data G.57, v1 README G.2, model↔machine G.5) | Part G |
| Taelin and HigherOrderCO primary sources (H.33 IC README, H.41–H.55 posts) | Part H |
| HVM4 March 2026 snapshot (docs and tests) | Part I |
| **HVM4 at HEAD `6defdfc`** (README L.1, AGENTS L.2, primer L.3, theory L.4, core L.5, memory L.6, syntax L.7, collapser L.8, sheets L.9–L.69) | Part L |
| Papers: HVM2 (M.1), BendRT (M.2), BendTT (M.3); Mazza (M.4), Laretto (M.5), Borner (M.6); Taelin's HN comment (M.7) | Part M |
| Audit ledger and v1 → v2 changes | Appendix R |

## Appendix F · Further reading (links checked 2026-11-06)

All returned HTTP 200 on 2026-11-06 unless marked.

| Source | Link | Why |
|---|---|---|
| Interaction-Calculus reference | <https://github.com/VictorTaelin/Interaction-Calculus> | the calculus and its C reference reducer |
| HVM4 | <https://github.com/HigherOrderCO/HVM4> | this book's machine (`src/hvm.c`, `docs/`) |
| HVM2 paper | <https://github.com/HigherOrderCO/HVM2/blob/main/paper/HVM2.pdf> | the parallel interaction-combinator runtime and its limitations (compendium M.1) |
| HVM1 "how it works" | <https://github.com/HigherOrderCO/HVM1/blob/master/guide/HOW.md> | lazy clones, memory format (compendium H.46) |
| HVM3 | <https://github.com/HigherOrderCO/HVM3> | the lazy-with-labels consolidation |
| Symmetric Interaction Calculus | <https://github.com/VictorTaelin/Symmetric-Interaction-Calculus> | the memory format behind HVM1 |
| abstract-algorithm | <https://github.com/VictorTaelin/abstract-algorithm> | Taelin's implementation of Lamping's abstract algorithm |
| optlam | <https://github.com/VictorTaelin/optlam> | his first optimal evaluator (compendium H.41) |
| Interaction Calculus of Constructions | <https://github.com/victortaelin/interaction-calculus-of-constructions> | types on top of the IC |
| "Supercompilation for free" | <https://github.com/VictorTaelin/articles/tree/master/0004-supercompilation-for-free> | an article on what optimal evaluation does to programs |
| Kindelia whitepaper | <https://github.com/kindelia/Kindelia/blob/master/WHITEPAPER.md> | the earlier vision of an IC-based network |
| BendRT / BendTT papers | <https://github.com/bendlang/bend/blob/main/paper/BendRT.pdf>, <https://github.com/bendlang/bend/blob/main/paper/BendTT.pdf> | the Bend 2 runtime (no nets) and type theory |
| Bend | <https://github.com/bendlang/bend> | the language |
| Mazza, *A Denotational Semantics for the Symmetric Interaction Combinators* (MSCS 2007) | <https://www-lipn.univ-paris13.fr/~mazza/papers/CombSem-MSCS.pdf> | the symmetric combinators, their difference from Lafont's, universality for polarized systems, vicious circles (compendium M.4) |
| Laretto, *The Complexity of Optimal Reduction and Sharing Graphs* (seminar slides, Pisa 2021) | <https://iwilare.com/the-complexity-of-optimal-reduction-and-sharing-graphs.pdf> | Lévy optimality, bookkeeping, Asperti–Mairson, Asperti–Coppola–Martini, BOHM benchmarks (M.5) |
| Asperti, *Linear Logic, Comonads and Optimal Reductions* (1993) | <https://www.cs.unibo.it/~asperti/PAPERS/10.1.1.54.9299.pdf> | the categorical reading of Lamping's brackets (not extracted: the PDF's text layer is damaged) |
| Borner, *Optimal Interaction with the Real World* (bachelor thesis, Tübingen 2025) | <https://raw.githubusercontent.com/marvinborner/optimal-effects/refs/heads/bachelor/thesis.pdf> | effects in optimal interaction nets; HVM2's IO loop (M.6) |
| Taelin on how HVM was designed (Hacker News, 2022) | <https://news.ycombinator.com/item?id=30227823> | "learn the abstract algorithm … favor rewrite equations over case-trees" (M.7, coursebook §8B.0) |
| "Truly Optimal Evaluation with Unordered Superpositions" (Taelin, gist) | <https://gist.github.com/VictorTaelin/93c327e5b4e752b744d7798687977f8a> | the quadratic slowdown, safe nodes, unordered DUPs (compendium H.53, coursebook §9.4) |
| HVM3's IC description | <https://github.com/HigherOrderCO/HVM3/blob/main/IC.md> | the Interaction Calculus as stated for HVM3 |
| GHC slowdown issue cited in H.53 | <https://github.com/HigherOrderCO/HVM/issues/60> | **404** on 2026-11-06 (repository reorganized); the essay H.53 summarizes it |

Classic papers to read next (not fetched here): Lafont, *Interaction Nets* (POPL 1990) and *Interaction Combinators* (Information and Computation, 1997); Lamping, *An algorithm for optimal lambda calculus reduction* (POPL 1990); Asperti and Guerrini, *The Optimal Implementation of Functional Programming Languages* (Cambridge, 1998); Asperti and Mairson, *Parallel beta reduction is not elementary recursive* (1998); Mazza, work on the symmetric interaction combinators.
