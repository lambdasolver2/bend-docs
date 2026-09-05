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

Items 1–10 of the curriculum. Everything here is **documentation-only**:
the shapes below are extrapolated from the four posted Bend2 samples
(`def`, typed parameters, `match`/`case`, `do` blocks, `::` paths) and
will be corrected against the compiler at release.

<div class="box box-warn">
<b>How to read this page.</b> Constructs matching the posted samples are
shown plainly. Anything the samples never demonstrate is flagged
<i>extrapolated</i>. Nothing here has been compiled — no public compiler
exists.
</div>

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

Branching goes through `match`. The posted samples match numbers and
constructors; this is the documented shape for a conditional.

```bend2
def describe(n: U32) -> U32:
  match n:
    case 0:
      0
    case 1+d:
      1
```

## Booleans

Boolean constructors and boolean operators are not yet demonstrated by a
public Bend2 sample. This curriculum entry is reserved for the release
syntax and is intentionally marked planned.

## Numbers

Numbers are typed. The public samples use `U32`, including successor-style
matching with `case 0:` and `case 1+d:`.

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

List syntax has no public sample yet *(planned — shape unknown)*.

## Imports

`import Base` (every public sample) brings in the standard library,
including `IO`.
