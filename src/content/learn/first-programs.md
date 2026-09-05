---
title: "First programs"
description: "Functions, bindings, conditionals, numbers, strings, tuples, lists, and imports in Bend2 syntax."
updated: 2026-09-05
verified: 2026-09-05
status: docs-only
canonical: /learn/first-programs/
sources:
  - https://bend2.dev/learn/
---

# First programs

Functions, bindings, branching, numbers, strings, tuples, lists, and
imports — the first ten Bend2 concepts, in the order a new programmer
meets them.

## Functions

```bend2
import Base

# Adds two numbers.
def add(a: U32, b: U32) -> U32:
  a + b

def main() -> U32:
  add(20, 22)
```

`def` names the function, parameters carry types, the return type follows
the arrow, and the body is an expression — no `return`.

## Let bindings

Tuple assignment splits two calls at once (the fork from
[parallelism](./parallelism.md)). A single binding is the same shape:

```bend2
def main() -> U32:
  x = 40 + 2
  x
```

## Conditionals

Branching goes through `match` on numbers and constructors.

```bend2
def describe(n: U32) -> U32:
  match n:
    case 0:
      0
    case 1+d:
      1
```

## Booleans

Boolean constructors and operators *(planned)*.

## Numbers

Numbers are typed as `U32`, including successor-style matching with
`case 0:` and `case 1+d:`.

```bend2
def identity(n: U32) -> U32:
  n
```

## Strings and characters

Strings concatenate with `++` and print through `IO::print` (see
[hello](./hello.md)). Characters and escaping are planned.

## Tuples

Tuples destructure in assignment position: `a, b = f(x), g(x)`.

## Lists

List syntax *(planned)*.

## Imports

`import Base` brings in the standard library, including `IO`.
