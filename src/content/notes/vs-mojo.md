---
title: Bend2 vs Mojo
description: "Two opposite routes to fast GPU code: explicit kernels you schedule vs parallelism the evaluator finds."
updated: 2026-08-30
verified: 2026-09-05
status: prerelease
canonical: /notes/vs-mojo/
sources:
  - https://bend2.dev/notes/bend2-vs-mojo/
---

# Bend2 vs Mojo

Both want high-level GPU code. They assign the scheduling job to opposite
actors: in Mojo, **you** schedule; in Bend2, **the evaluator** does.

## Mojo: you are the scheduler

Mojo (Modular, designed under Chris Lattner on MLIR, shipped and pre-1.0
with production users) gives explicit control: you write kernels against a
grid/block/device-memory model, manage buffers and synchronization, use
explicit SIMD types, and one source compiles to NVIDIA, AMD, and Apple
targets. Ownership and borrowing govern values. That control is exactly
what makes dense, regular, arithmetic-heavy workloads fast — performance
there lives in tiling, layout, and occupancy, and no runtime discovers a
tiling for you. If your sentence starts "I would have written CUDA", Mojo
is today's answer for a Python-shaped codebase.

## Bend2: the evaluator is the scheduler

Bend2 programs are ordinary recursive functions with no kernels, no grids,
no memory hierarchy in the programmer's model. Recursion over a tree fans
out because the branches are disjoint subgraphs — not because anyone
scheduled it. The entire device decision is one character: `sum!(24, 0)`
runs on the GPU where `sum(24, 0)` would not. Each reduction step still
moves graph nodes through memory — the constant factor every graph-reduction benchmark argues about.

## Where each wins

Mojo wins anywhere you could name the kernel: inference serving, image
pipelines, dense linear algebra, HPC stencils — with full-width IEEE
numerics and explicit SIMD today. Bend2's bet is everything irregular and
recursive, where writing the kernel is the hard part and the evaluator can
find work you never named. Until it ships, that side of the table is a
design claim with a runtime (HVM4) behind it, not a benchmark you can run.
