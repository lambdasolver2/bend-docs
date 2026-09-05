---
title: "The four interactions"
description: "HVM's whole dynamics in four rules, with reduction traces: optimal sharing, Church 2² in 14 steps, and collapse."
updated: 2026-09-05
verified: 2026-09-05
status: stable
canonical: /notes/four-interactions/
sources:
  - https://github.com/HigherOrderCO/HVM4/blob/main/docs/theory/interaction_calculus.md
  - https://github.com/HigherOrderCO/HVM4/blob/main/docs/hvm/memory.md
---

# The four interactions

The [interaction-net model](./interaction-nets.md) says rewrites are
local and confluent. The Interaction Calculus says which four rewrites.
Everything else in HVM — numbers, constructors, pattern matching — is
practical extension. The theory below comes from HVM4's own
`docs/theory/interaction_calculus.md`; the traces are quoted from it.

## Why lazy needs two new forms

Strict evaluation computes everything now; lazy computes on demand but
recomputes shared values used twice. Haskell memoizes thunks, which works
for data and breaks inside lambdas. The calculus instead makes sharing
structural, with two dual primitives (Lafont's fan nodes, opposite
polarities):

- **Duplication** `!x&L = v; t` — one value in two locations (`x₀`, `x₁`).
- **Superposition** `&L{a, b}` — two values in one location.

Duplication is incremental: cloning `[1,2,3]` peels one layer per step,
and the tail's duplication only fires when both copies are touched. Work
is never duplicated — even inside lambdas.

## The four rules

Two create computation, two propagate it:

1. **APP-LAM** — application eliminates lambda: `(λx.body)(arg)` binds
   `x ← arg` in `body`. Ordinary β.
2. **DUP-SUP** (same label) — duplication eliminates superposition:
   `!x&L = &L{a,b}; t` becomes `x₀ ← a, x₁ ← b` in `t`. Pair projection.
3. **APP-SUP** — application propagates through superposition:
   `(&L{a,b})(c)` becomes `!x&L = c; &L{a(x₀), b(x₁)}`. Applying a pair
   distributes over both elements.
4. **DUP-LAM** — duplication propagates through lambda: `!f&L = λx.body`
   yields two lambdas with a **superposed bound variable**,
   `x ← &L{…}`, and the body shared behind a new dup. This is the deep
   one: the variable temporarily escapes its scope, which is exactly why
   the calculus needs global variables — and exactly how sharing extends
   inside lambdas.

With different labels, DUP-SUP commutes instead of annihilating, nesting
one superposition inside the other (the cross product from the
[hands-on](../learn/hvm-hands-on.md) page, formalized).

## Optimal sharing, on paper

Duplicate a lambda containing `(2+2)`, apply the copies to different
arguments — the addition computes **once** and the result `4` flows to
both copies. The trace (abridged from the theory doc) pivots on one step:
DUP-LAM shares the body behind `b`, OP2-NUM fires a single time marked
"shared!", and both branches observe `4`. Memoization could never do this:
the shared work sits inside a duplicated function body.

## Church 2² in 14 interactions

Applying Church-2 to itself is the literature's sharing benchmark. The
full trace runs APP-SUP, DUP-LAM, and DUP-SUP (both modes) across a
network where bound variables visibly escape scope mid-computation — then
collapses to `λf.λx.f(f(f(f(x))))`. HVM completes it in **14
interactions**, which is optimal. The point for Bend2: this is the
machinery that makes "the evaluator schedules" more than a slogan.

## Collapse: reading the answer out

Reduction has three destinations: WNF (head only), SNF (full, keeps
SUPs/DUPs), CNF (collapsed back to pure lambda terms via DUP-VAR/DUP-APP
cleanup). The `-C` flag selects collapse — the enumeration of `11`, `12`
you saw hands-on. Proofs about programs are proved against SNF; humans
read CNF.

## One word per term

The machine guest of honor: every term is one 64-bit word —
`TAG (8) | EXT (24) | VAL (32)`. Tags name the node kind (APP, LAM, SUP,
DUP, NUM, constructors by arity, MAT/SWI, OP2, REF…); EXT carries the dup
label, op code, or binder level; VAL is a heap slot or an unboxed `u32`.

<figure>
<svg width="420" height="90" viewBox="0 0 420 90" role="img" aria-label="64-bit HVM term layout: 8-bit tag, 24-bit ext, 32-bit val">
<g font-size="14" text-anchor="middle">
<rect x="10" y="20" width="60" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="70" y="20" width="160" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="230" y="20" width="180" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="40" y="45" fill="currentColor">TAG</text>
<text x="150" y="45" fill="currentColor">EXT</text>
<text x="320" y="45" fill="currentColor">VAL</text>
<text x="40" y="76" font-size="12" fill="currentColor">8</text>
<text x="150" y="76" font-size="12" fill="currentColor">24</text>
<text x="320" y="76" font-size="12" fill="currentColor">32</text>
</g>
</svg>
<figcaption>One HVM term: a single 64-bit word. Numbers live unboxed in VAL.</figcaption>
</figure>
When a binder fires, its slot is overwritten with a substitution cell (SUB
bit set) so linked variables resolve without side tables. Static book
definitions stay immutable with de Bruijn levels; ALO nodes expand them
lazily, one layer at a time, preserving sharing. That is the whole
memory story — and why "a cell is a tagged machine word" from the
[model](./interaction-nets.md) page is literal, not metaphor.
