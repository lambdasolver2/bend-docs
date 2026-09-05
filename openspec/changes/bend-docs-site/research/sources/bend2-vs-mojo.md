# Bend2 vs Mojo

Last updated 2026-08-30. Canonical: https://bend2.dev/notes/bend2-vs-mojo/

Bend2 and Mojo pursue high-level GPU code from opposite directions. Mojo gives you explicit
control and compiles kernels for NVIDIA, AMD, and Apple targets; Bend2 extracts parallelism from
ordinary recursive code with no kernels and is [expected around
2026-09-02](/notes/bend2-release-date/).

## What Mojo is

Mojo, the shipped side of this Bend2 comparison, is Modular's systems language, designed under
Chris Lattner (LLVM, Swift, MLIR) and built on MLIR compilation. The syntax is deliberately close to Python and interoperates with it, but
the semantics are systems-grade: value ownership and borrowing in the Rust lineage, `struct`
over `class` for performance-critical code, explicit SIMD types, and compile-time
metaprogramming. GPU work is explicit: you write kernels in Mojo against a
[GPU programming model](https://docs.modular.com/mojo/manual/gpu/intro-tutorial/) of grids,
blocks, and device memory, and one kernel source compiles to PTX for NVIDIA, AMDGPU IR for
ROCm, or Metal for Apple hardware. The [repository](https://github.com/modular/modular) carries
mixed licensing: the standard library and kernels have been Apache 2 since
[March 2024](https://www.modular.com/blog/the-next-big-step-in-mojo-open-source), the compiler
remains closed with a stated target of open-sourcing by the end of 2026, and a "Path to Mojo
1.0" was laid out in December 2025. This is a funded company's product with production users;
the flagship consumer is Modular's own MAX inference platform.

## How Bend2 works

Bend2 keeps none of those control surfaces. Programs are
ordinary high-level functional code, and the [HVM4 runtime](https://github.com/HigherOrderCO/HVM4)
evaluates them as interaction nets, where reduction steps are two-node-local and
order-independent, so any idle core or warp takes whatever work exists. There is no kernel, no grid, no memory hierarchy in the
programmer's model. Bend2 uses `!` as its device mark.
[`sum!(24, 0)` runs the call on the GPU](/learn/gpu/) where `sum(24, 0)` would not, so
the device is chosen per call even though the schedule never is. [Bend2 was complete by
2026-07-18](https://x.com/VictorTaelin/status/2078553927268589989) with Metal and CUDA backends.
The [CUDA port benchmark report](https://x.com/VictorTaelin/status/2078471338755232193) puts the
backend ahead of the Metal reference on RTX and at roughly 10x parallel C on most programs.

## The mechanical difference

Bend2 and Mojo assign parallel scheduling to different actors.
Mojo's answer is you. You decide what becomes a kernel, how work maps onto blocks, when memory
moves, where SIMD applies. That is exactly the control that makes dense, regular,
arithmetic-heavy workloads fast, because their performance lives in memory layout and occupancy,
and no runtime discovers a tiling for you. Bend2's answer is the evaluator. Recursion over a
tree fans out because the branches are disjoint subgraphs, not because anyone scheduled it.
Each reduction step moves graph nodes through memory, which creates the constant factor visible
in [Bend1's May 2024 launch benchmarks](https://news.ycombinator.com/item?id=40390287).

## Side by side

Bend2 against Mojo as of 2026-08-30.

|                   | Mojo                                             | Bend2                                   |
| ----------------- | ------------------------------------------------ | --------------------------------------- |
| Origin            | Modular Inc., Lattner                            | Higher Order Company, Taelin            |
| Status 2026-08-30 | Shipped, pre-1.0, production users               | Unreleased, expected ≈ 2026-09-02       |
| Parallelism       | Explicit: kernels, grids, SIMD                   | Automatic: interaction-net evaluation   |
| Compilation       | MLIR → native, PTX, AMDGPU, Metal                | HVM4, AOT to C, Metal and CUDA backends |
| Type system       | Static, ownership and borrowing                  | Dependent types, proofs                 |
| Codegen story     | AI-assisted kernel authoring                     | SupGen synthesis from types             |
| License           | Stdlib Apache 2, compiler closed until ~end 2026 | None published                          |

## Where each wins

Against Bend2, Mojo wins today anywhere you could name the kernel, including inference serving,
image pipelines, dense linear algebra, and HPC stencils. It is a better answer to "I would have written
CUDA" for anyone whose codebase is Python, and its numerics are full-width IEEE with explicit
SIMD. The [parallel sum](/learn/parallelism/) forks both branches of each recursive call without
a kernel. Bend1 shipped 24-bit numbers because of its node encoding; Bend2's
[posted samples](/learn/parallelism/) type their integers `U32`, lifting that limit.