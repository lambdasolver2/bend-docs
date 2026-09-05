---
title: "Data and matching"
description: "Algebraic data types, records, maps, pattern matching, recursion, higher-order functions, folds, and the bend construct."
updated: 2026-09-05
verified: 2026-09-05
status: docs-only
canonical: /learn/data-matching/
sources:
  - https://bend2.dev/learn/
---

# Data and matching

Items 11–21 of the curriculum. **Documentation-only**: the `Nat`
patterns below come straight from the posted proofs sample; record, map,
and `bend` shapes are extrapolated or planned.

<div class="box box-warn">
<b>How to read this page.</b> Constructor patterns (`Z{}`, `S{p}`) and
numeric patterns (`0`, `1+d`) are posted-sample syntax. Everything else
is flagged.
</div>

## Algebraic data types and pattern matching

The proofs sample matches `Nat` by constructors — brace-suffixed
patterns, one arm per constructor:

```bend2
def is_zero(n: Nat) -> Bool:
  match n:
    case Z{}:
      True
    case S{p}:
      False
```

Numeric matching works the same way (`case 0:` / `case 1+d:`, binding
the predecessor). Lambda-match and mutual recursion have no public
samples *(planned)*.

## Records and maps

No posted sample constructs a record or a map *(planned — shapes
unknown)*. Expect them to follow the `def`/`match` register at release;
this section will be written from the compiler, not from guesses.

## Recursion, higher-order functions, closures, folds

Recursion is ordinary self-call, as in the
[parallel sum](./parallelism.md) — including mutual recursion, which is
just two `def`s naming each other *(extrapolated but unsurprising)*.
Higher-order functions, closures, and folds have no posted samples
*(planned)*; the `bend` construct that gives Bend its name likewise
awaits the release.
