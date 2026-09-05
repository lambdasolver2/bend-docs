# Concept map — Bend, HVM, Bend2

Distilled 2026-09-05 from `sources/*.md` + `repos/*`. Every claim cites its
source file; source files carry canonical URLs + dates (see `README.md`).

## The one-paragraph idea

Ordinary functional code already contains all the parallelism a machine could
want — independent subexpressions can run anywhere, in any order — but
conventional runtimes cannot see that without programmer annotations (threads,
tasks, kernels) because shared mutable state makes order matter
[`interaction-nets-explained.md`]. Interaction nets (Lafont, POPL 1990) fix
this by constraining the machine model itself: a program is a graph of cells,
each step rewrites exactly two cells that face each other, and such rewrites
on disjoint pairs cannot conflict and always converge to the same result
[`interaction-nets-explained.md`]. So parallelism stops being a language
feature and becomes a scheduling decision: any idle core fires any pending
pair [`hvm4-explained.md`, `what-is-bend2.md`]. Bend is the language on top
(HVM2 runtime, May 2024 launch); HVM4 is the fourth runtime generation;
Bend2 (unreleased, est. ≈2026-09-02) adds dependent types and synthesis on
the same substrate [`home.md`, `bend2-release-date.md`, `bend2-vs-bend1.md`].

## Bend (Bend1): what it proved, what it cost

- Python-flavored syntax with recursion + ADTs, zero parallelism annotations,
  saturating a GPU via the HVM2 interaction-net runtime [`bend2-vs-bend1.md`,
  `HigherOrderCO_Bend-README.md`].
- Backends chosen at the CLI: `run`/`run-c` (parallel C), `run-rs`
  (sequential Rust), `run-cu` (CUDA); `gen-c`/`gen-cu` emit standalone files
  [`HigherOrderCO_Bend-README.md`].
- Sequential vs parallel is a dataflow property: `start + Sum(start+1, …)`
  chains (sequential), tree recursion fans out (parallel)
  [`HigherOrderCO_Bend-README.md`, `parallelism.md`].
- Costs, all from packing everything into compact net nodes: 24-bit numbers
  (`u24/i24/f24`), low-GB memory ceiling from fixed-width arena addressing,
  minimal IO, strict-only evaluation, and a large constant factor per rewrite
  (graph surgery in memory) that let a tuned CPU core beat GPU throughput on
  many workloads [`bend2-vs-bend1.md`, `what-is-bend2.md`].

## Interaction nets: the substrate

- Cell = one constructor/operation with one principal port (apex, the only
  reaction site) + auxiliary ports; net = ports wired in pairs; computation
  happens only at active pairs (principal-to-principal)
  [`interaction-nets-explained.md`].
- At most one rule per unordered symbol pair; firing consumes the pair and
  writes a fixed net on the same free ports
  [`interaction-nets-explained.md`].
- One cell ⇒ one active pair ⇒ redexes are disjoint **by construction**, no
  analysis, no locks [`interaction-nets-explained.md`].
- Theorem 1 (Lafont 1990): one-step confluence — either firing order lands on
  the same net in one step; hence same normal form, same step count (work is a
  program property), any worker may fire any pair
  [`interaction-nets-explained.md`].
- Theorem 2 (Lafont 1997): three symbols (γ, δ, ε), six rules suffice for
  universality; annihilation (same meets same) + commutation (distinct pass
  through, copying one cell per step) [`interaction-nets-explained.md`].
- β-reduction becomes one constant-time rule; the hard part moves to
  duplication: Lamping (POPL 1990) gave optimal reduction (Lévy families),
  Asperti–Mairson (1998) proved full-optimality bookkeeping is
  non-elementary; HVM trades Lamping-completeness for constant factors,
  making duplication a primitive rather than transparent substitution
  [`interaction-nets-explained.md`].
- In silicon: a cell is a tagged machine word, an active pair a queue entry,
  an interaction a few loads/stores; ε does GC as local rewriting, no
  collector thread [`interaction-nets-explained.md`].
- Practical concession: machine integers live inside the node word; leftover
  width after ports/tags sets the range (Bend1: 24 bits)
  [`interaction-nets-explained.md`, `bend2-vs-bend1.md`].

## HVM lineage and the Interaction Calculus

- HVM1 (2022, lazy, interaction combinators, Rust) → HVM2 (strict, C+CUDA,
  carried Bend's launch) → HVM3 (early 2026, merged strengths, `run`/`-c`
  compiled flag) → HVM4 (public, single file `src/hvm.c`, `clang -O2`,
  pushed into mid-2026) [`what-is-bend2.md`, `hvm4-explained.md`,
  `HigherOrderCO_HVM1-README.md`, `HigherOrderCO_HVM2-README.md`,
  `HigherOrderCO_HVM3-README.md`, `HigherOrderCO_HVM4-README.md`].
- Interaction Calculus (VictorTaelin/Interaction-Calculus, 948 stars): affine
  vars (≤1 use), global lambdas (no scope boundaries ⇒ continuations, linear
  HOAS, mutable refs), first-class SUP `&{a,b}` + DUP, erasable `*`; affinity
  makes GC cheap and parallelism simple
  [`VictorTaelin_Interaction-Calculus-README.md`,
  `HigherOrderCO_HVM3-README.md`].
- HVM4 surface from its README: `@main = (&{1, 2} + 10)` yields both `11`
  and `12`, sharing common work; DUP `(! x &A= 3; (x₀ + x₁))` feeds two uses
  without copying; docs (theory, core, memory, interactions) sit next to code
  [`HigherOrderCO_HVM4-README.md`, `hvm4-explained.md`].
- Launch blockers (2026-03-05): HVM4 AOT compiler (kills per-rewrite dispatch
  overhead), HVM4 GPU runtime (resolved July: coding model ported Metal→CUDA
  overnight, CUDA beats Metal on RTX, ≈10x parallel C), Bend2–SupGen
  integration [`what-is-bend2.md`, `hvm4-explained.md`, `bend2-vs-bend1.md`].

## Bend2: the combination (all pre-release, none runnable)

- Formula: auto-parallel functional code + dependent types + synthesis from
  precise types; types give SupGen a search target and the checker an
  acceptance condition; HVM4 schedules independent rewrites, no annotations
  [`what-is-bend2.md`].
- Syntax (documentation-only samples): Python `def` + return type after
  `->`; effects in `do IO<Unit>:` blocks with `<-` binds and `IO::` paths;
  GPU per call via `!` (`sum!(24, 0)`); theorems as `assert` + same-named
  `def` proof by case analysis + `%` rewrites + `{=}`
  [`hello.md`, `parallelism.md`, `gpu.md`, `proofs.md`, `what-is-bend2.md`].
- Lifts two Bend1 limits in samples: `U32` args (24→32 bits), real `IO`
  (`input`/`print` on CPU; GPU takes pure code only); memory ceiling unknown
  until release [`bend2-vs-bend1.md`, `hello.md`, `gpu.md`].
- Types from the Kind lineage: linear by default (≤1 live use), `+x` to
  duplicate, only `Data` kinds duplicable; Dead mode (specs, unrestricted,
  may diverge) vs Live mode (code+proofs, linear, terminating) contains
  `Type : Type` paradoxes on the Dead side [`bend2-vs-lean.md`,
  `HigherOrderCO_Kind-README.md`].
- Proofs are term-level (Agda register): recursion is induction, no tactic
  layer (`simp`/`omega`) visible in the single `add_comm` sample
  [`proofs.md`, `bend2-vs-lean.md`].
- Public footprint as of 2026-08-30: empty `VictorTaelin/Bend2` repo (README
  404s, zero code — verified), 4 posted samples, no binary/package/license;
  checker moved to TypeScript-on-Bun (July 2026)
  [`what-is-bend2.md`, `repos/_meta.txt`, `bend2-vs-bend1.md`].

## The two contrasts

- **Mojo** (Modular, Lattner, MLIR, shipped pre-1.0): you schedule —
  kernels, grids, blocks, device buffers, SIMD; ideal for dense regular
  numerics where tiling is the performance. Bend2: the evaluator schedules;
  one character (`!`) picks the device [`bend2-vs-mojo.md`, `gpu.md`].
- **Lean 4** (de Moura, FRO, Apache 2, mathlib 500k+ items): the proof is the
  product; automation = tactics + libraries. Bend2: the program is the
  product; automation = SupGen proposing, checker disposing; no public
  library exists [`bend2-vs-lean.md`].

## Timeline

- 2026-03-05 launch blockers → 2026-07-18 "Bend2 complete" → 2026-08-12
  delay post (≈08-28) → 2026-08-27 plan: copiable-kind fix, weekend testing,
  Monday recording → possible Wednesday ≈2026-09-02
  [`bend2-release-date.md`, `home.md`, `what-is-bend2.md`].

## Gaps (explicit, not silent)

- `VictorTaelin/hvm4-formal`: README 404s on main+master; content unknown.
- `VictorTaelin/Bend2`: empty; all Bend2 code claims rest on 4 posted
  samples only.
- HVM4 repo carries no license text (as of 2026-08-04): no grant to build on
  it [`hvm4-explained.md`].
- Curriculum: only 4 of ~50 `Bend2 by Example` pages written
  [`learn-index.md`].
