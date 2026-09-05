---
title: Running on GPUs
description: "One character picks the device. The exclamation mark chooses where, never how."
updated: 2026-08-13
verified: 2026-09-05
status: docs-only
canonical: /learn/gpu/
sources:
  - https://bend2.dev/learn/gpu/
---

# Running on GPUs

Bend2 runs a function on the GPU when the call carries `!`: `sum!(24, 0)`
evaluates on the GPU where `sum(24, 0)` would use the CPU. The function is
the [parallel sum](./parallelism.md), unchanged — only `main` differs.
That is the entire GPU programming model.

```python title="Bend2"
// Status: documentation-only — no public compiler or backend to run this.
def main() -> U32:
  sum!(24, 0)
```

## What the mark does

`!` chooses **where** a call evaluates, not **how** it parallelizes. The
fork inside `sum` is ordinary divide-and-conquer recursion, identical on
either device; the GPU just points its thousands of threads at the same
graph. Kernels, grids, blocks, and device memory do not appear in the
language — the one-line contrast with Mojo from the
[comparison](../notes/vs-mojo.md).

## What stays on the CPU

Pure code goes through `!`; effects stay on the host. [Hello
world](./hello.md) runs its input and print in `IO` on the CPU — what
flies to the GPU here is arithmetic with no `IO` in its type.

## The backends

Metal and CUDA, built on HVM4. No public toolchain ships them yet, so this
page carries no measured numbers; they arrive when a compiler does.
