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
<b>Run it yourself</b> Every claim below with a number next to it was
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

```haskell title="HVM4"
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

## 9.1 Runtime model

An HVM program is a **book** of named terms. A definition such as
`@main = ...` is a reusable static term. Evaluation instantiates the term
into a mutable graph, then repeatedly finds an active pair: two principal
ports connected together.

Each interaction consumes a small local configuration and replaces it with
another configuration. The evaluator does not walk the entire program to
decide what is safe to run. Locality and confluence make that decision
independent for every active pair.

```sh
clang -O2 -o hvm src/hvm.c
./hvm file.hvm -s       # interaction statistics
./hvm file.hvm -s -C10  # collapse alternatives
./hvm file.hvm -D       # print intermediate steps
```

## 9.2 Surface syntax

The runtime language is deliberately smaller than Bend2. Definitions use
`@name = term`; application uses parentheses, not whitespace application:
`@add(1, 2)`, not `@add 1 2`.

```haskell
@add = λa. λb. (a + b)
@main = @add(1, 2)
//3
```

| Form | Meaning |
|---|---|
| `λx. body` | Lambda abstraction |
| `(f x)` or `f(x)` | Application |
| `#Pair{a,b}` | Constructor |
| `λ{#Pair: ...}` | Constructor match |
| `!x&A = value; body` | Explicit duplication with label `A` |
| `&A{left,right}` | Superposition with label `A` |
| `x₀`, `x₁` | The two branches of a duplicated value |
| `&{}` | Erasure |
| `@name` | Book reference |

Variables are affine: an ordinary variable may be used at most once. When
the same value must be used twice, write a cloned binder (`λ&x`) or an
explicit duplication. This is what lets the evaluator represent copying
as graph interaction rather than a global memory operation.

## 9.3 The 64-bit term

Every term is represented by one 64-bit word:

```text
+--------+------------------------+--------------------------------+
| TAG 8  | EXT 24                 | VAL 32                        |
+--------+------------------------+--------------------------------+
```

`TAG` identifies the term kind. `EXT` carries metadata such as an
operation code, constructor identity, duplication label, or binder level.
`VAL` contains an immediate number or an index into the heap/book.

Dynamic terms live in the mutable heap; static definitions live in the
immutable book. ALO allocation terms bridge them: a static term expands
into a dynamic term only when evaluation forces that layer, preserving
compact definitions and sharing.

## 9.4 Evaluation and collapse

HVM distinguishes the amount of a term it evaluates:

- **WNF** — weak normal form; expose the head shape.
- **SNF** — strong normal form; reduce the whole term while preserving
  superpositions and duplication nodes.
- **CNF** — collapsed normal form; enumerate ordinary readable results.

Collapsing is a presentation step, not the same thing as evaluation. A
superposition is not automatically a list, and collapsing it too early can
destroy the sharing that made the computation cheap.

## 9.5 GPU boundary

HVM4 has Metal and CUDA backends. The GPU does not change the interaction
rules; it changes where independent graph work is scheduled. Bend2 keeps
input/output on the host and sends pure computation to a device call marked
with `!`.

Read next: [The four interactions](./four-interactions/),
[HVM4 hands-on](../learn/hvm-hands-on/), and
[Search by superposition](./search-by-superposition/).
