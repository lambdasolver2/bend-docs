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

Data definitions and the many shapes of `match`: algebraic data types,
records, maps, pattern matching, recursion, and folds.

## Algebraic data types

Algebraic data types introduce constructor-shaped values such as `Nat`.

## Records

Records *(planned)*.

## Maps

Maps *(planned)*.

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

Lambda match *(planned)*.

## Recursion

Recursion is ordinary self-call, as in the
[parallel sum](./parallelism.md).

## Mutual recursion

Mutual recursion *(planned)*.

## Higher-order functions

Higher-order functions *(planned)*.

## Closures

Closures *(planned)*.

## Folds

Folds *(planned)*.

## The bend construct

The `bend` construct that gives Bend its name awaits the public compiler.
