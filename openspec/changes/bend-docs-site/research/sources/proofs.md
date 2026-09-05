# Proofs in Bend2

Last updated 2026-08-21. Canonical: https://bend2.dev/learn/proofs/

A Bend2 theorem is an `assert` block, and its proof is an ordinary `def` carrying the same
name. The program proves that addition commutes.

```
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

Bend2 states propositions as types. `for all a : Nat`, spelled as two words, quantifies over
the naturals, and `{add(a, b) = add(b, a) : Nat}` is an equality between two `Nat`
expressions, braces around the proposition. The `assert` names the obligation; the `def` of the
same name discharges it, with parameter types supplied by the assert.

## The proof

A Bend2 proof works by case analysis and rewriting. `match a:` splits on the constructors of
`Nat`, `Z{}` for zero and `S{p}` for successor, written as brace-suffixed patterns. Each `%`
line rewrites the goal with a named equation: `%add_zero(b)` and `%add_succ(b, p)` apply
lemmas from `Base`, and `%add_comm(p, b)`, the recursive call, is the induction hypothesis.
`{=}` closes a branch once rewriting has made the two sides identical.

## Following the goals

Bend2's `%` rewrites are easiest to read by tracking each branch's goal. In the zero case the
goal is `add(Z, b) = add(b, Z)`; the left side reduces by definition, `%add_zero(b)` rewrites
`add(b, Z)` to `b`, and `{=}` closes `b = b`. In the successor case the goal is
`add(S(p), b) = add(b, S(p))`; the left reduces to `S(add(p, b))`, `%add_succ(b, p)` turns
the right into `S(add(b, p))`, and the induction hypothesis makes both sides equal for `{=}`.
This is the standard Peano argument: induction on the first argument, two helper lemmas.

## Next to Lean

Bend2 proofs are term-level, in the style of Agda: the function's own recursion is the
induction, with no tactic layer like Lean's `simp` or `omega` in sight. Which side of that
trade pays off is the subject of [Bend2 vs Lean](/notes/bend2-vs-lean/).