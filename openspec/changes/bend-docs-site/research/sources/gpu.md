# Running on GPUs in Bend2

Last updated 2026-08-13. Canonical: https://bend2.dev/learn/gpu/

Bend2 runs a function on the GPU when the call carries `!`: `sum!(24, 0)` evaluates on the
GPU where `sum(24, 0)` would use the CPU. The function here is the
[parallel sum](/learn/parallelism/), unchanged; only `main` differs.

```
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

## What the mark does

Bend2's `!` chooses where a call evaluates, not how it parallelizes. The fork inside `sum` is
ordinary divide-and-conquer recursion, identical on either device; the GPU gets its thousands
of threads pointed at the same graph. Kernels, grids, blocks, and device memory do not appear
in the language, which is the [contrast with Mojo](/notes/bend2-vs-mojo/) in one line.

## What stays on the CPU

Bend2 sends pure code through `!` and keeps effects on the host. [Hello world](/learn/hello/)
runs its input and print in `IO` on the CPU; what goes to the GPU here is arithmetic with no
IO in its type.

## The backends

Bend2's GPU runtimes are Metal and CUDA, built on [HVM4](/notes/hvm4-explained/); no public
toolchain ships them yet. [What is Bend2?](/notes/what-is-bend2/) tracks what exists in
public, and this page will get measured numbers when a compiler ships.