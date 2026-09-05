# Bend2 vs Lean

Last updated 2026-08-30. Canonical: https://bend2.dev/notes/bend2-vs-lean/

Bend2 and Lean both have dependent types. Lean is a proof assistant and programming language;
Bend2 is a programming language with proofs and massively parallel execution.

## What Lean is

Lean 4, the mature side of the Bend2 comparison, is a
[theorem prover and programming language](https://github.com/leanprover/lean4) developed under
Leonardo de Moura, stewarded since 2023 by the Lean FRO, Apache 2 licensed, with
its own [system description](https://lean-lang.org/papers/lean4.pdf). Lean 4 is self-hosted,
compiles through C, and runs on a reference-counted runtime with
task-level concurrency that the compiler itself exercises. But Lean's center of mass is
[mathlib](https://github.com/leanprover-community/mathlib4), a single coherent library of
formalized mathematics past
[500,000 items](https://lean-lang.org/use-cases/mathlib/), built by hundreds of contributors,
with tactic automation accumulated over a decade. The
[Mathlib Initiative's 2025–26 roadmap](https://mathlib-initiative.org/roadmap/) includes monthly
dataset publication for AI training. New proofs can import existing definitions and lemmas from
mathlib instead of rebuilding them.

## How Bend2 uses dependent types

Bend2's dependent types come from the same intellectual tradition by a different road. Higher
Order Company's earlier proof language, [Kind](https://github.com/HigherOrderCO/Kind), is the
visible ancestor. Bend2 combines that type system with the
[HVM4](https://github.com/HigherOrderCO/HVM4) interaction-net runtime
and a synthesis component, SupGen, named on the
[2026-03-05 launch-blocker list](https://x.com/VictorTaelin/status/2029567059881857081).
Precise types specify behavior, the checker rejects wrong implementations, SupGen searches for
right ones, and evaluation parallelizes without annotation. [Bend2 was complete by
2026-07-18](https://x.com/VictorTaelin/status/2078553927268589989) and remains unreleased as of
2026-08-30, [expected around 2026-09-02](/notes/bend2-release-date/).

Bend2's type theory uses linearity with no hidden exceptions. A plain binder is at most one live
use for any type, duplication is written `+x`, and only values of kind `Data` may be duplicated.
The checker splits into a Dead mode, where types and specifications live unrestricted and may
diverge, and a Live mode, where code and proofs are linear and terminating. The mode boundary keeps
paradox-shaped terms on the Dead side, where nothing is being proved, despite Bend2 using
`Type : Type`, which Girard's paradox makes inconsistent as a logic. Lean buys the same
guarantee with a universe hierarchy and a termination checker.

## Same types, different jobs

Bend2 and Lean both live on the propositions-as-types side of the Curry–Howard correspondence:
a specification is a type, a proof is a program, checking is type checking. What differs is
which side of the correspondence pays the bills. In Lean, the proof is the product. You
formalize because the theorem matters, or because the algorithm's correctness matters, and the
executable is often incidental. Automation means tactics: decision procedures, simp sets,
`omega`, and the libraries that discharge routine obligations. In Bend2, the program is the
product. Types exist to make machine-generated code checkable, so
synthesis can propose and the checker can dispose. Automation means SupGen, and if the
[superposition primitives](/notes/hvm4-explained/) in HVM4 are its mechanism, they make
generation an evaluator-level search over candidate programs rather than a tactic-level search
over proof terms.

The proof surface itself became visible in August 2026, when Taelin posted a complete Bend2
proof that addition commutes. A theorem is an `assert` block quantified with `for all`; its
proof is a `def` of the same name that matches on constructors, applies lemmas as rewrites
with `%`, and closes goals with `{=}`, the recursive call standing in for the induction
hypothesis. On that one sample the register is term-level, closer to Agda than to Lean's
tactic scripts, with no `simp`, no `omega`, and no visible tactic layer at all; the
[line-by-line walkthrough](/learn/proofs/) tracks the goal through both cases.

## Execution

Bend2's runtime story has no counterpart in Lean, and vice versa. Lean compiles to efficient
sequential C; concurrency is orchestrated with tasks, not extracted from program semantics, and
nobody chooses Lean because their proof needs a GPU. Bend2's entire premise is that evaluation
itself is parallel: interaction-net reduction spreads across cores. The
[CUDA port benchmark report](https://x.com/VictorTaelin/status/2078471338755232193) puts its
backend ahead of the Metal reference on RTX.

## Side by side

|                   | Lean 4                                         | Bend2                                      |
| ----------------- | ---------------------------------------------- | ------------------------------------------ |
| Center of mass    | Formalized mathematics, verification           | Parallel execution, synthesis              |
| Status 2026-08-30 | Mature, FRO-stewarded, self-hosted             | Unreleased, expected ≈ 2026-09-02          |
| Library           | mathlib, 500k+ items, hundreds of contributors | None public                                |
| Automation        | Tactics, decision procedures                   | SupGen synthesis                           |
| Runtime           | Compiled via C, refcounted, sequential + tasks | HVM4 interaction nets, parallel by default |
| License           | Apache 2                                       | None published                             |
| Hiring/community  | Large, academic and industrial                 | Does not exist yet                         |

## Which to use

Between Bend2 and Lean, Lean is the correct default today for anything that needs a proof:
verified algorithms, formalized specs, mathematics, AI-assisted theorem proving. The library
asymmetry is not close. Mathlib contains more than 500,000 items, while Bend2 has no public
library. Bend2 instead joins proofs to programs that run on HVM4 and to SupGen synthesis from
precise types.