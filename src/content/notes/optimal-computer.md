---
title: "Towards an optimal computer"
description: "Why HOC exists: computability is settled, computation is not — and both Turing and Church may be distortions of something deeper."
updated: 2026-09-05
verified: 2026-09-05
status: stable
canonical: /notes/optimal-computer/
sources:
  - https://gist.github.com/VictorTaelin/46936b9fdfc3f982f07963c11756e36b
  - https://gist.github.com/VictorTaelin/77fd5a2a8a4a07e1da6157ebca3c7cf1
---

# Towards an optimal computer

This page distills the founding essay of the Higher Order Company. It is
the "why" behind every runtime, language, and proof system in these
notes — read it before anything else if you want the motive, not just
the mechanism.

<div class="box box-key">
<b>The one claim</b> Turing machines and the λ-calculus are equivalent in
<i>computability</i> — but a model can be inherently less efficient than
another. Church–Turing says nothing about <i>computation</i>.
</div>

## 1936, twice

Humanity answered "what is computation" twice in the same year. Turing
distilled the common components of early machines into one universal
device — the ancestor of every processor, and, through the procedural
mindset, of C, Fortran, Java, Python. Church, independently, distilled
the common components of branches of mathematics into the λ-calculus —
the ancestor of Haskell, Clojure, Agda. Both compute everything
computable. The choice between them was treated as taste. Taelin's
argument: that was the wrong question. The right one is which model
wastes less.

## What each model gets wrong

The procedural model's parallel primitives — mutexes, atomics — are a
contrived solution to synchronization, so programmers still write
sequentially by default; global state and loops make whole classes of
bugs nearly unavoidable. The functional model handles parallelism and
correctness far better in principle — yet functional programs stay mostly
single-threaded. Why? Performance: the λ-calculus's fundamental
operation, **substitution, is not atomic**. Substituting an argument can
copy an unboundedly large term, so it cannot complete in bounded steps
and has no physical mapping. Workarounds only move the problem — shared
references inhibit parallelism, garbage collection isn't atomic. The
functional paradigm never got its efficient machine, never went
mainstream, and its proof tools never caught up.

## Annihilation and commutation

In 1997 Lafont proposed the interaction combinators, where substitution
breaks into two truly atomic laws: **commutation** (creates and copies
information) and **annihilation** (observes and destroys it). Unlike SKI —
whose K erases and whose S copies unboundedly large structures — every
combinator step finishes in constant time with a clear physical mapping,
and all of it is inherently parallel. Everything good in the other models
survives; the pathologies mostly vanish. Both the Turing machine and the
λ-calculus emulate efficiently onto combinators, while the reverse is not
true — equivalent in computability, strictly more capable in computation.
Perhaps, the essay suggests, machines and substitutions aren't
fundamental at all, and some alien civilization does mathematics and
computing entirely in annihilation and commutation.

<div class="box box-info">
<b>Where this goes</b> The atomic-step claim becomes the
<a href="/notes/interaction-nets/">interaction-net model</a>; the
efficiency claim becomes the <a href="/notes/four-interactions/">four
interactions</a>; the company built <a href="/notes/hvm-runtime/">four
runtimes</a> and two languages on top. Each page tests one corner of
this essay.
</div>
