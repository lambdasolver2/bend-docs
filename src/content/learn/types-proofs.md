---
title: "Types and proofs, step by step"
description: "Annotations, polymorphism, first dependent types, sized lists, equality, induction, and totality."
updated: 2026-09-05
verified: 2026-09-05
status: docs-only
canonical: /learn/types-proofs/
sources:
  - https://bend2.dev/learn/
---

# Types and proofs, step by step

Items 29–36 of the curriculum (34 has its own page:
[proofs](./proofs.md)). **Documentation-only**: annotation and proof
shapes come from posted samples; the rest is extrapolated or planned.

## Type annotations and polymorphism

Every posted `def` annotates parameters and results (`a: U32`,
`-> U32`, `-> IO<Unit>`). Polymorphism — functions generic over types —
has no posted sample *(planned)*.

## Dependent types, first contact

Types can mention values: the proofs sample quantifies `for all a : Nat`
and states equality `{add(a, b) = add(b, a) : Nat}` as a type. Sized
lists ("a list of exactly this length") and equality types are the same
idea pushed further *(planned beyond the sample)*.

## Induction and totality

Induction in Bend2 is recursion: the `add_comm` proof calls itself as
the induction hypothesis, and each `%` rewrite is checked. Totality —
the guarantee that functions terminate, which is what makes proofs
sound — is enforced by the Live linear mode *(planned detail)*.
