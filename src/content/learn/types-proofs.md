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

From annotations to proofs: how Bend2 types carry values, state
equalities, and discharge obligations by recursion. The full worked proof
is on the [proofs](./proofs.md) page.

## What is a type-based prover?

Every compiler checks your code a little. A type-based prover checks it
all the way down — not just "is this a number?" but "is this claim true
for every possible input?"

Three analogies, from familiar to exact:

**A blueprint inspector.** A function signature is a promise about shape:
takes two numbers, returns a number. A normal type checker verifies the
shape. A prover verifies the *behavior written into the shape*: takes any
two numbers, returns their sum regardless of order. The checker is an
inspector who refuses to sign off until the building matches the
blueprint — before anyone moves in, i.e. before the program ever runs.

**A fact-checker, not a spell-checker.** Testing runs examples: it tries
a million pairs and finds no counterexample. Proving covers the cases you
didn't try — including the one your test suite missed. A test says "it
worked every time we looked"; a proof says "there is nowhere for a bug
to hide."

**Claims are types; evidence is code.** This is the whole trick, called
*propositions as types*. The type `{add(a, b) = add(b, a) : Nat}` is the
claim "addition commutes." A program with exactly that type *is* the
evidence — it can only exist if the claim holds, the way a key can only
exist if it fits its lock. Writing the proof means constructing that
program; checking it means the compiler trying the key. In Bend2 you
state the claim with `assert` and deliver the evidence with an ordinary
`def` of the same name. No separate proof language, no tactic scripts:
the proof is a program, and the checker simply runs its type discipline
over it.

## Type annotations

Every posted `def` annotates parameters and results (`a: U32`,
`-> U32`, `-> IO<Unit>`).

## Polymorphism

Polymorphism — functions generic over types *(planned)*.

## Dependent types

Types can mention values: the proofs sample quantifies `for all a : Nat`
and states equality `{add(a, b) = add(b, a) : Nat}` as a type. Sized
lists ("a list of exactly this length") and equality types are the same
idea pushed further *(planned)*.

## Sized lists

Sized lists *(planned)*.

## Equality

Equality appears in the public theorem sample as `{add(a, b) = add(b, a) : Nat}`.

## Induction

Induction in Bend2 is recursion: the `add_comm` proof calls itself as
the induction hypothesis, and each `%` rewrite is checked.

## Totality

The guarantee that functions terminate, which is what makes proofs sound,
is enforced by the Live linear mode *(planned)*.
