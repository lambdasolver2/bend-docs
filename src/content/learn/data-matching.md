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

## Algebraic data types

The public samples use constructor-shaped values such as `Nat`.

## Records

Records have no public sample yet *(planned)*.

## Maps

Maps have no public sample yet *(planned)*.

## Pattern matching

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
the predecessor).

## Lambda match

Lambda match has no public sample yet *(planned)*.

## Recursion

Recursion is ordinary self-call, as in the
[parallel sum](./parallelism.md).

## Mutual recursion

Mutual recursion has no public sample yet *(planned)*.

## Higher-order functions

Higher-order functions have no public sample yet *(planned)*.

## Closures

Closures have no public sample yet *(planned)*.

## Folds

Folds have no public sample yet *(planned)*.

## The bend construct

The `bend` construct that gives Bend its name awaits the public compiler.
