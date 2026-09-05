---
title: "Sharing, duplication, superpositions"
description: "What the fork shares, what duplication costs, and how superpositions branch — in Bend2 syntax."
updated: 2026-09-05
verified: 2026-09-05
status: docs-only
canonical: /learn/sharing/
sources:
  - https://bend2.dev/learn/
---

# Sharing, duplication, superpositions

Sharing one value between two uses is where Bend2's cost model lives:
the fork shares nothing, duplication is explicit, and superpositions
branch. Runtime claims link to runnable HVM4.

<div class="box box-key">
<b>The one idea</b> The fork shares nothing (disjoint subgraphs), so it
is free. Sharing one value between two uses needs explicit duplication —
and duplicated functions meet superpositions, which is where HVM's power
lives.
</div>

## Sharing and duplication

```bend2
def main() -> U32:
  x = 40 + 2      # one value...
  x + x           # ...two uses: this is the duplication point
```

Bend2's types are linear by default (at most one live use per binder;
duplication written `+x`, only `Data` kinds duplicable). Where the
checker demands it, shared values duplicate explicitly rather than by
accident — the language-level face of the
[runtime primitive](/notes/four-interactions/).

## Unscoped lambdas

Unscoped lambdas exist in the runtime today (`λ$x` binders — run them in
[HVM4 hands-on](./hvm-hands-on.md)). Their Bend2 surface syntax *(planned)*.

## Superpositions

Superpositions are deliberately introduced later, in
[HVM4 Runtime 9.4](../notes/four-interactions/#superpositions). Their
Bend2 surface syntax *(planned)*.

## Evaluation order

Evaluation needs no annotations — order is the scheduler's business, and
confluence keeps every schedule correct.

## Measuring speedup

Measuring speedup is a release-day exercise: same program, CPU call vs `!`
call, with the runtime's interaction counters as the stopwatch *(planned)*.
