---
title: "Hello world"
description: "Effects in Bend2: main returns an IO action sequenced in a do block."
updated: 2026-08-13
verified: 2026-09-05
status: docs-only
canonical: /learn/hello/
sources:
  - https://bend2.dev/learn/hello/
---

# Hello world

Every Bend2 program starts at `main`. This one reads a name and prints a
greeting — and in doing so shows how Bend2 handles effects: not as
statements that happen, but as values of type `IO` that describe what to
do.

```bend2
// Status: documentation-only — no public compiler to run this against.
import Base

# Performs effects on the CPU.
def main() -> IO<Unit>:
  do IO<Unit>:
    name <- IO::input()
    IO::print("Hello, " ++ name)
```

## Line by line

- `import Base` brings in the standard library, which supplies `IO`.
- `def main() -> IO<Unit>:` declares a function, Python-style, with the
  return type after the arrow. `IO<Unit>` is `IO` applied to `Unit`: a
  computation run only for its effects. (`main` need not be effectful — a
  pure program declares `def main() -> U32` and returns a number.)
- `do IO<Unit>:` sequences effects in a block that names its type.
- `name <- IO::input()` runs an effect and binds its result; `<-` is "run
  and name the answer".
- `IO::print("Hello, " ++ name)` is the block's value. Strings concatenate
  with `++`, library functions are reached with `::` paths, `#` starts a
  comment.

## Where effects run

On the CPU. GPU evaluation — marking a call with `!` — is for pure
functions; input and output stay on the host. That split is the whole
story of the [GPU page](./gpu.md).
