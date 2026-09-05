---
title: Proofs
description: "A theorem is an assert block; its proof is an ordinary def of the same name."
updated: 2026-08-21
verified: 2026-09-05
status: docs-only
canonical: /learn/proofs/
sources:
  - https://bend2.dev/learn/proofs/
---

# Proofs

A Bend2 theorem is an `assert` block, and its proof is an ordinary `def`
carrying the same name. The program proves that addition commutes — the
standard Peano argument, induction on the first argument.

```bend2
// Status: documentation-only — no public checker to verify this against.
import Base

# Theorem: "for all numbers a and b, a + b equals b + a".
assert add_comm:
  for all a : Nat
  for all b : Nat
  {add(a, b) = add(b, a) : Nat}

# Proof: case analysis, induction, rewrites (`%`).
def add_comm(a, b):
  match a:
    case Z{}:
      %add_zero(b)
      {=}
    case S{p}:
      %add_succ(b, p)
      %add_comm(p, b)
      {=}
```

## The statement

Propositions are types. `for all a : Nat` (two words) quantifies over the
naturals; `{add(a, b) = add(b, a) : Nat}` is an equality between `Nat`
expressions, braces around the proposition. The `assert` names the
obligation; the `def` of the same name discharges it, parameter types
supplied by the assert.

## The proof

Case analysis plus rewriting. `match a:` splits on `Nat`'s constructors —
`Z{}` zero, `S{p}` successor, brace-suffixed patterns. Each `%` line
rewrites the goal with a named equation: `%add_zero(b)` and
`%add_succ(b, p)` apply lemmas from `Base`; `%add_comm(p, b)`, the
recursive call, **is** the induction hypothesis. `{=}` closes a branch
once rewriting made both sides identical.

## Following the goals

Track each branch's goal and the `%` lines read plainly. Zero case: goal
`add(Z, b) = add(b, Z)`; left reduces by definition, `%add_zero(b)`
rewrites `add(b, Z)` to `b`, `{=}` closes `b = b`. Successor case: goal
`add(S(p), b) = add(b, S(p))`; left reduces to `S(add(p, b))`,
`%add_succ(b, p)` turns the right into `S(add(b, p))`, the induction
hypothesis equates them for `{=}`.

## Next to Lean

Term-level proofs, Agda register: recursion as induction, no tactic layer
(`simp`, `omega`) in sight. Whether that trade pays off is the
[comparison](../notes/vs-lean.md).
