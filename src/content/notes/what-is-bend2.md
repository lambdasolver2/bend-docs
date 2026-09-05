---
title: What is Bend2?
description: "Bend2 in one idea first, then the three pieces and the honest release status."
updated: 2026-08-30
verified: 2026-09-05
status: prerelease
canonical: /notes/what-is-bend2/
sources:
  - https://bend2.dev/notes/what-is-bend2/
  - https://github.com/VictorTaelin/Bend2
---

# What is Bend2?

Bend2 is an unreleased programming language from Higher Order Company. Its
one-sentence idea: **write ordinary functional code, get parallelism,
proofs, and even synthesized programs for free** — because the runtime
evaluates your program as a graph where independent pieces cannot interfere,
so scheduling needs no annotations from you.

Three pieces combine here. First, functional code that parallelizes
automatically: recursion that splits work runs on all cores without threads,
locks, or pragmas. Second, a dependent type system in the tradition of
Higher Order Company's Kind: types can state properties like "this list is
sorted", and the checker rejects code that violates them. Third, program
synthesis (called SupGen): types precise enough to pin down behavior give a
searcher something to aim at and the checker something to accept or reject.

## Why this combination matters

Each piece exists elsewhere on its own. Array languages parallelize;
Lean and Kind have dependent types; research languages synthesize code. The
bet is that together they multiply: precise types make generated code
checkable, so a synthesizer can propose and the checker can dispose — and
everything runs on a runtime that parallelizes without being asked. The
[HVM runtime](./hvm-runtime.md) schedules independent graph rewrites; it
never needed annotations and still does not.

## What the language looks like

Bend2 reads like Python with types. A function is `def` with typed
parameters and a return type after the arrow. Effects run in `do` blocks
over an explicit `IO` type. A call runs on the GPU when its name carries
`!`. A theorem is an `assert` block whose proof is an ordinary `def` of the
same name. Each construct gets its own page under Learn by Example.

## Status: what actually exists

As of 2026-08-30: the public `VictorTaelin/Bend2` repository is empty — no
code, no branches, no binary, no package, no license. What is public: four
posted code samples (walked through in Learn by Example) and the HVM4 runtime.
Taelin's estimate at last
check points around 2026-09-02; track the [release status](./release-status.md)
page, which is updated as the public record changes.

