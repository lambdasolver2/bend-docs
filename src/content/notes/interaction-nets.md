---
title: "Interaction nets, explained"
description: "Copying is the hard problem in computing. Interaction nets tame it: local, incremental, consensus-free — from three symmetric symbols."
updated: 2026-09-05
verified: 2026-09-05
status: stable
canonical: /notes/interaction-nets/
sources:
  - https://bend2.dev/notes/interaction-nets-explained/
  - https://gist.github.com/VictorTaelin/311f6a58a7756945196c15733e61d0c6
  - https://github.com/VictorTaelin/Interaction-Calculus
---

# Interaction nets, explained

Every runtime problem that matters is a copying problem. Using a value
twice means duplicating its computation or its data; throwing it away
means reclaiming the memory. Conventional machines solve both with
coordination — locks, reference counts, stop-the-world collectors — and
coordination is what stops programs from scaling. Linear logic's great
export was making this explicit: treat values as resources consumed
exactly once, and copying becomes a first-class operation you can see,
price, and control. Interaction nets (Lafont, POPL 1990) are the machine
that takes that lesson literally.

<div class="box box-key">
<b>The big insight: no consensus.</b> Ten thousand workers can rewrite
one program with zero coordination — no locks, no tags, no collector —
because the model makes conflicting steps <i>unrepresentable</i>. A step
touches exactly two adjacent cells, so two steps never share a cell, so
no interleaving can go wrong. Consensus isn't optimized away. It is
unnecessary by construction.
</div>

## Why they are so great: the benefits up front

- **No coordination.** Redexes are disjoint before any analysis runs; any
  idle worker fires any pending pair. Parallelism is scheduling, not a
  language feature.
- **Copying is incremental and local.** Duplication copies one cell per
  step, interleaved with the computation consuming the copies — never a
  whole structure in one gulp. Shared subgraphs stay shared until use
  forces the split.
- **Erasure is garbage collection.** Throwing a value away is just another
  local rewrite (ε), with no collector thread pausing anything.
- **Every step is atomic.** Each rule completes in constant time with a
  clear physical mapping — unlike substitution, which can copy an
  unbounded term.
- **Perfectly symmetric.** No rule has an active side and a passive side:
  two cells meet as equals through their principal ports. The whole
  system is meetings, never commands.
- **Three symbols suffice.** γ, δ, ε under six rules compute anything —
  the smallest universal machine with all of the above intact.

## How copying works: the shared graph

A program is a graph, and sharing means what it says: two parents point
at one child. When both parents need the child, a duplicator (δ) walks
it — one cell per interaction, copying each cell and moving on while the
rest of the net keeps reducing around it. Nothing stops, nothing locks,
and work common to both copies happens once, before the split. Contrast
the alternatives: textual substitution duplicates unevaluated work
blindly; memcpy-style cloning drags in unused substructure; reference
counting serializes every touch. Here the copy *is* the computation,
interleaved cell by cell.

The dual move is annihilation: when a symbol meets itself, both vanish
and the wires join through — erasure and pairing handled by the same
geometry. And when a duplication meets a superposition with the same
label, the two values project out pairwise; with different labels, they
cross-multiply. Labels are the steering wheel; the engine is always the
same local meeting.

<figure>
<svg width="420" height="130" viewBox="0 0 420 130" role="img" aria-label="Annihilation: two gamma cells meeting become plain wires">
<g fill="none" stroke="currentColor" stroke-width="1.5">
<path d="M70 20 L40 70 L100 70 Z"/>
<circle cx="70" cy="13" r="4" fill="currentColor"/>
<path d="M70 110 L40 70 L100 70 Z"/>
<circle cx="70" cy="117" r="4" fill="currentColor"/>
<line x1="140" y1="65" x2="185" y2="65"/>
<path d="M176 58 L190 65 L176 72"/>
<line x1="220" y1="40" x2="220" y2="90"/>
<line x1="260" y1="40" x2="260" y2="90"/>
</g>
<g font-style="italic" font-size="16" fill="currentColor" text-anchor="middle">
<text x="70" y="55">γ</text>
<text x="70" y="95">γ</text>
</g>
</svg>
<figcaption><span class="label label-fn">annihilate</span> Same meets same: both cells vanish, wires join through.</figcaption>
</figure>

<figure>
<svg width="420" height="150" viewBox="0 0 420 150" role="img" aria-label="Commutation: delta passing through gamma copies both, one cell per step">
<g fill="none" stroke="currentColor" stroke-width="1.5">
<circle cx="90" cy="75" r="22"/>
<circle cx="200" cy="75" r="22"/>
<line x1="230" y1="75" x2="285" y2="75"/>
<path d="M276 68 L290 75 L276 82"/>
<circle cx="320" cy="55" r="16"/>
<circle cx="320" cy="100" r="16"/>
<line x1="320" y1="71" x2="320" y2="84"/>
</g>
<g font-size="16" fill="currentColor" text-anchor="middle">
<text x="90" y="81">δ</text>
<text x="200" y="81" font-style="italic">γ</text>
</g>
</svg>
<figcaption><span class="label label-ty">commute</span> Distinct symbols pass through each other, copying one cell per step.</figcaption>
</figure>

## The model in one minute

A program is a graph of **cells**. A cell is one constructor or operation —
a number, a `+`, a list node, a λ. It has one **principal port** (drawn at
the apex, the only place it can react) and any number of auxiliary ports
where arguments and results wire in. Computation happens in exactly one
configuration: two cells wired principal-port to principal-port, called an
**active pair**. For each pair of symbols there is at most one rule, which
consumes the two cells and writes a fixed replacement on the same free
ports.

<figure>
<svg width="300" height="170" viewBox="0 0 300 170" role="img" aria-label="A cell: symbol alpha, principal port at apex, two auxiliary ports below">
<g fill="none" stroke="currentColor" stroke-width="1.5">
<path d="M150 30 L90 130 L210 130 Z"/>
<circle cx="150" cy="22" r="5" fill="currentColor"/>
<circle cx="110" cy="130" r="4"/>
<circle cx="190" cy="130" r="4"/>
<line x1="110" y1="130" x2="110" y2="152"/>
<line x1="190" y1="130" x2="190" y2="152"/>
</g>
<text x="150" y="100" text-anchor="middle" font-style="italic" font-size="18" fill="currentColor">α</text>
<text x="168" y="26" font-size="13" fill="currentColor">principal</text>
<text x="110" y="166" text-anchor="middle" font-size="13" fill="currentColor">x₁</text>
<text x="190" y="166" text-anchor="middle" font-size="13" fill="currentColor">x₂</text>
</svg>
<figcaption>A cell: symbol α, one principal port at the apex, auxiliary ports below.</figcaption>
</figure>

<figure>
<svg width="420" height="150" viewBox="0 0 420 150" role="img" aria-label="A rule firing: active pair alpha-beta rewrites to net N">
<g fill="none" stroke="currentColor" stroke-width="1.5">
<path d="M70 25 L35 85 L105 85 Z"/>
<circle cx="70" cy="18" r="4" fill="currentColor"/>
<path d="M70 145 L35 85 L105 85 Z"/>
<circle cx="70" cy="152" r="4" fill="currentColor"/>
<line x1="130" y1="85" x2="190" y2="85"/>
<path d="M178 77 L192 85 L178 93"/>
<rect x="210" y="45" width="170" height="80" rx="10"/>
</g>
<g font-style="italic" font-size="16" fill="currentColor" text-anchor="middle">
<text x="70" y="70">α</text>
<text x="70" y="115">β</text>
<text x="295" y="92">N</text>
</g>
</svg>
<figcaption>A rule firing: the active pair α ⋈ β is consumed and the fixed net N takes its place.</figcaption>
</figure>

## The two theorems that carry everything

**Confluence (1990).** Fire two different active pairs in either order and
both orders land on the same net in one step — the pairs share no cell, so
firing one leaves the other intact.

<figure>
<svg width="300" height="190" viewBox="0 0 300 190" role="img" aria-label="Confluence diamond: N rewrites to N1 and N2, both rewrite to M">
<g fill="none" stroke="currentColor" stroke-width="1.5">
<line x1="150" y1="35" x2="70" y2="95"/>
<line x1="150" y1="35" x2="230" y2="95"/>
<line x1="70" y1="105" x2="150" y2="160"/>
<line x1="230" y1="105" x2="150" y2="160"/>
</g>
<g font-style="italic" font-size="17" fill="currentColor" text-anchor="middle">
<text x="150" y="25">N</text>
<text x="55" y="105">N₁</text>
<text x="245" y="105">N₂</text>
<text x="150" y="185">M</text>
</g>
</svg>
<figcaption><span class="label label-law">diamond</span> One-step confluence: firing a then b, or b then a, lands on the same net M.</figcaption>
</figure>

Consequences: every order reaches the same result (no scheduler can be
wrong), every route takes the same number of steps (work is a property of
the program, so profiling counts mean something), and any idle worker may
fire any pair it finds.

**Universality from three symbols (1997).** <span class="label label-cl">γ</span>
<span class="label label-cl">δ</span> <span class="label label-cl">ε</span>
under six rules suffice for anything computable — and every rule is one of
the two symmetric meetings above. That is the whole machine: meet,
annihilate, commute, repeat — at any scale, in any order, with no one in
charge.

## The λ-calculus, with fine print

Encode abstraction and application as cells and β-reduction becomes a
single constant-time interaction. The difficulty moves to duplication:
Lamping's POPL 1990 algorithm answered optimally (never duplicate work in
Lévy's sense), and Asperti and Mairson proved in 1998 that full
optimality's bookkeeping is unbounded — optimal counts β-steps but does
not promise cheap accounting. The HVM line draws the engineering
conclusion: duplication is a **primitive** of the calculus, not
transparent substitution, trading Lamping-completeness for constant
factors.

<div class="box box-info">
<b>The mystery, solved.</b> Taelin's "mystery" post asked why some
functions run <i>faster the more work you give them</i> — e.g. N repeated
applications in O(log N). Answer: functions that <b>fuse under
self-composition</b> (their composed normal form stays constant size) can
be exponentiated by squaring, exactly like integers — <i>provided</i> the
runtime normalizes inside lambdas, which only optimal evaluators do. A
`copy` prefix can even <i>make</i> a function fuse, yielding apparent
"negative complexity". Fusion at runtime is also why β-optimality gives
Haskell-style deforestation for free.
</div>

## In the machine

A cell is a tagged machine word, an active pair is a queue entry, an
interaction is a few loads and stores — none of it locked, because
disjointness plus confluence keeps every schedule correct. The price is the
constant factor: every step is graph surgery against real memory, and
grinding it down is what the runtime generations are for. Numbers meet the
same wall: a pure net would write 1000 as a thousand cells, so real
runtimes store machine integers inside the node word, and the width left
after ports and tags sets the range.
