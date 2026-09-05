---
title: Automatic parallelism
description: "The fork is where data flow splits — ordinary recursion the runtime runs concurrently."
updated: 2026-08-13
verified: 2026-09-05
status: docs-only
canonical: /learn/parallelism/
sources:
  - https://bend2.dev/learn/parallelism/
---

# Automatic parallelism

Bend2 parallelizes ordinary recursion: split the work in two, and the
runtime evaluates the halves concurrently. No pragmas, no threads, no
scheduler in the program. The program below sums 2²⁴ numbers this way.

```bend2
import Base

# Sums a range of numbers in parallel.
def sum(d: U32, i: U32) -> U32:
  match d:
    case 0:
      i
    case 1+d:
      a, b = sum(d, i*2), sum(d, i*2+1) # fork
      a + b

# Runs sum on the GPU, via `!`.
def main() -> U32:
  sum!(24, 0)
```

## The fork

Bend2 forks where the data flow splits. `a, b = sum(d, i*2),
sum(d, i*2+1)` starts both recursive calls, and nothing joins them until
`a + b` needs both results. The calls share no state, so on the
interaction-net runtime they are disjoint subgraphs — recall
[the model](../notes/interaction-nets.md): disjoint pairs cannot conflict
— and any idle core reduces either one without locks.

<figure>
<svg width="420" height="192" viewBox="0 0 420 192" role="img" aria-label="Fork tree: sum splits into two halves that evaluate independently then join">
<g fill="none" stroke="currentColor" stroke-width="1.5">
<circle cx="210" cy="25" r="14"/>
<line x1="198" y1="33" x2="117" y2="89"/>
<line x1="222" y1="33" x2="304" y2="89"/>
<circle cx="100" cy="100" r="20"/>
<circle cx="320" cy="100" r="20"/>
<line x1="100" y1="120" x2="100" y2="140"/>
<line x1="320" y1="120" x2="320" y2="140"/>
<line x1="100" y1="140" x2="210" y2="163"/>
<line x1="320" y1="140" x2="210" y2="163"/>
<circle cx="210" cy="163" r="4" fill="currentColor"/>
</g>
<g font-size="13" fill="currentColor" text-anchor="middle">
<text x="210" y="30">sum</text>
<text x="210" y="184">a + b joins</text>
</g>
<g font-size="12" fill="currentColor" text-anchor="middle">
<text x="100" y="104">left</text>
<text x="320" y="104">right</text>
</g>
</svg>
<figcaption>The fork: one call becomes two disjoint subgraphs; <i>a + b</i> is the only join.</figcaption>
</figure>

## The match

Bend2 pattern-matches on numbers with a successor case. `case 0:` handles
zero; `case 1+d:` matches anything ≥ 1, binding `d` to one less (shadowing
the argument). A branch body is an expression — no `return` anywhere. The
arguments are `U32`, 32-bit unsigned integers — full 32-bit range.

## What it computes

Each call owns a block of 2ᵈ consecutive integers and splits it in half;
at depth 0 the block is the single number `i`. So `sum(24, 0)` covers 0
through 16,777,215, for an exact total of 140,737,479,966,720 — which
notably does not fit in a `U32`. Device selection (`!`) is a separate
decision from parallelism; that is the [GPU page](./gpu.md).
