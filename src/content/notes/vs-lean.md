---
title: Bend2 vs Lean
description: "Same dependent types, different jobs: in Lean the proof is the product, in Bend2 the program is."
updated: 2026-08-30
verified: 2026-09-05
status: prerelease
canonical: /notes/vs-lean/
sources:
  - https://bend2.dev/notes/bend2-vs-lean/
  - https://github.com/HigherOrderCO/Kind
---

# Bend2 vs Lean

Both live on the propositions-as-types side of Curry–Howard: a
specification is a type, a proof is a program, checking is type checking.
What differs is which side pays the bills.

## Lean: the proof is the product

Lean 4 (de Moura, Lean FRO, Apache 2, self-hosted through C) exists to
formalize: mathematics, verified algorithms, specifications. Its center of
mass is mathlib — a half-million-item library built by hundreds of
contributors, so new proofs import lemmas instead of rebuilding them.
Automation means tactics: decision procedures, simp sets, `omega`, a
decade of accumulated machinery. Execution is efficient sequential C with
task-level concurrency; nobody chooses Lean because their proof needs a
GPU.

## Bend2: the program is the product

Bend2's types exist to make machine-generated code checkable: synthesis
(SupGen) proposes, the checker disposes. Its ancestor is Kind, Higher
Order Company's proof language. The type theory is linear with no hidden
exceptions: a plain binder allows at most one live use, duplication is
written `+x`, only `Data` kinds may be duplicated. The checker splits in
two — a Dead mode where specifications live unrestricted and may diverge,
and a Live mode where code and proofs are linear and terminating — which
keeps paradox-shaped terms on the Dead side despite `Type : Type` (what
Girard's paradox makes inconsistent as a logic; Lean buys the same safety
with a universe hierarchy plus termination checker).

The one public proof (addition commutes, August 2026) is term-level, Agda
register: the function's own recursion is the induction, lemmas apply as
`%` rewrites, `{=}` closes goals. No `simp`, no `omega`, no visible tactic
layer at all.

## The same theorem in Lean 4

For comparison, here is how a Lean user proves the same fact today —
tactics orchestrating library lemmas, in about four lines:

```lean
-- Illustrative: shows the Lean style, not typechecked for this page.
theorem add_comm' (a b : Nat) : a + b = b + a := by
  induction a with
  | zero => rw [Nat.zero_add, Nat.add_zero]
  | succ n ih => rw [Nat.succ_add, Nat.add_succ, ih]
```

Read the two side by side. Lean's version says *how to search*:
`induction` picks the principle, `rw` fires named equations from the
library, and the library (`Nat.zero_add`, `Nat.add_succ`, hundreds of
thousands of siblings in mathlib) does the heavy lifting. Bend2's
version *is* the search result already: the recursion is the induction,
each `%` line is one rewrite step, `{=}` checks the endpoints match. No
search language exists because, in Bend2's story, the machine
(SupGen) performs the search and the human reads the trace. Which side of
that trade pays off — tactic scripts over a giant library, or
machine-found term proofs over precise types — is the open bet.

## The default today

Lean, for anything needing a proof now — verified algorithms, formalized
specs, mathematics. The library asymmetry is not close: 500,000+ items
versus no public Bend2 library. Bend2 joins proofs to programs that run on
HVM4 and to synthesis from precise types — a combination nobody else is
selling, and nothing you can download.
