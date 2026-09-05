---
title: The HVM4 runtime
description: "The current runtime Bend2 builds on: Interaction Calculus, superpositions, and a single C file."
updated: 2026-09-05
verified: 2026-09-05
status: stable
canonical: /notes/hvm-runtime/
sources:
  - https://github.com/HigherOrderCO/HVM4
  - https://github.com/VictorTaelin/Interaction-Calculus
---

# The HVM4 runtime

If interaction nets are the idea, HVM4 is the machine: public, a single C
file built with one compiler invocation, with its memory layout and
interaction rules documented next to the code. It is the half of Bend2 you
can read today — the language, the type checker, and SupGen remain
private, but the calculus, the memory layout, and the rules are
inspectable, and they constrain what the language above them can be:
parallel by default, superposition-capable, compiled rather than
interpreted.

<div class="box box-info">
<b>Run it yourself.</b> Every claim below with a number next to it was
reproduced by building HVM4 and running the snippet — see
<a href="/learn/hvm-hands-on/">HVM4 hands-on</a>. The repository carries
no license text, so treat this as study, not a grant to build on it.
</div>

## The calculus underneath

HVM4 implements the Interaction Calculus: affine variables (each used at
most once — which makes garbage collection cheap and parallelism simple),
global lambdas with no scope boundaries (enabling continuations and linear
encodings), and two first-class primitives most runtimes lack:

- **Superposition** `&A{a, b}`: one term holding two values.
  `(&A{1,2} + 10)` yields both `11` and `12` in 4 interactions, sharing
  all work that does not depend on the choice. This is how an evaluator
  explores many branches of a search space while paying for the common
  structure once.
- **Duplication** `!x&A = v; body`: one value feeding two uses (`x₀`,
  `x₁`) without copying up front — the incremental copy described on the
  [interaction nets](./interaction-nets.md) page. Same label annihilates
  against a superposition; different labels multiply branches.

```hvm
@main = (&A{1,2} + 10)
//11
//12
```

## Metal and CUDA backends

HVM4 ships both GPU backends. The CUDA port was produced overnight by a
coding model working against the Metal implementation as executable
specification and test oracle; its benchmark puts CUDA ahead of Metal on
RTX hardware at roughly 10x parallel C for most programs.

## What the AOT compiler changes

An interpreted evaluator pays dispatch on every rewrite: fetch the node,
branch on its kind, mutate the graph. Compiling a program's rules ahead of
time to native C removes the dispatch and specializes memory access per
rule — attacking exactly the constant factor that lets a tuned CPU core
rival GPU throughput on many workloads. The AOT compiler was one of three
items on the March 2026 launch-blocker list, alongside the GPU runtime
(since resolved) and SupGen integration (still private).
