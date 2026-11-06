---
title: "Bend 2 tutorial 07: laws and proofs"
description: "State a property as a law, prove it with a same-named def, read the proof goals in each match branch, use induction and rewrites, handle holes, and run the PROOF gate."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/07-laws-and-proofs/
sources:
  - https://bend2.dev/learn/proofs/
  - https://bend2.dev/learn/induction/
  - https://bend2.dev/learn/equality/
  - https://bend2.dev/learn/holes/
  - https://bend2.dev/learn/types-as-specifications/
  - https://bend2.dev/notes/ai-agents-bend/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 07: laws and proofs

A **law** is a claim about a program, written as a type. Bend has no tactics and no proof search, so a proof is an ordinary definition with the same name as the law. The compiler checks that the definition has the claimed type. If you know Haskell, think of a QuickCheck property that the compiler must check for every input, not just sampled ones. If you know Lean, the table below maps the ideas, with one big difference: Bend has no tactics and no proof search, so every step is a term you write.

> **Core insight.** A law is a type, and a proof is a program of that type. This is the Curry-Howard idea: a claim is a type, and a term that inhabits it is its proof. `bend PROOF.bend` accepts a proof only if its def has the law's type, its recursive calls terminate, and each `{==}` holds because both sides compute to the same term.

**Composed of: a law and its proof.**

```text
law add_zero                      the type: a claim
- for x: Nat                      a binder
- {Nat.add(x, 0n) == x : Nat}     the claim

def add_zero(x)                   the program, with the law's name
- one case per constructor of x
- each case: {==}, or a rewrite %e : P followed by {==}
```

| Lean idea | Bend 2 | Note |
|-----------|--------|------|
| a theorem statement and its proof | `law name:` and a same-named `def name(...)` | the law is the claim; the def is the proof |
| `rfl`, closing a goal by computation | `{==}` | both sides must compute to the same term |
| `rw [h]` | `%h : P` | `P` is the goal, with `_` where the right-hand side goes |
| `induction n with` | `match n:` plus a recursive call | the recursive call is the induction hypothesis |
| `∃ w, P w` | `exs w: T` in the law | the proof returns `(w, proof)` |
| `sorry` | `?TODO` | the gate rejects any open hole |
| `simp`, `omega`, other tactics | nothing | write the rewrite or the case split yourself |

## Your first law: induction

This law says that adding zero to any natural number does nothing:

```bend
import Base

law add_zero:
  for x: Nat
  {Nat.add(x, 0n) == x : Nat}

def add_zero(x):
  match x:
    case 0n:
      {==}
    case 1n+p:
      %add_zero(p) : {1n+Nat.add(p, 0n) == 1n+_ : Nat}
      {==}

def main() -> Nat:
  Nat.add(42n, 0n)
```

```output
42n
```

Read the file in three parts.

- `law add_zero:` names the claim. `for x: Nat` quantifies over every natural. The equation `{Nat.add(x, 0n) == x : Nat}` is the claim itself: the two sides are equal at type `Nat`.
- `def add_zero(x):` is the proof. It has the same name as the law and one parameter for each `for`.
- `match x:` splits the proof into cases, and each branch refines the goal.

Look at the goal in each branch. In the case `0n`, the left side `Nat.add(0n, 0n)` computes to `0n`, which is the right side, so `{==}` closes the goal. In the case `1n+p`, the left side is `Nat.add(1n+p, 0n)`, and it computes to `1n+Nat.add(p, 0n)`, which is not yet `1n+p`. The recursive call `add_zero(p)` is the **induction hypothesis**: it proves the claim for the smaller number `p`. The line `%add_zero(p) : {...}` rewrites the goal with that equation. The `_` marks where the right-hand side of the equation goes. After the rewrite, both sides are the same, and `{==}` closes the goal.

The induction hypothesis is allowed only because `p` is smaller than `x`: it is a pattern-bound variable from `1n+p`, so the termination rule of chapter 02 holds.

## Equality by computation

When both sides compute to the same term, `{==}` alone is enough. The law below holds because `Nat.add` matches on its first argument, so `0n` on the left reduces without any induction:

```bend
import Base

law zero_left:
  for x: Nat
  {Nat.add(0n, x) == x : Nat}

def zero_left(x):
  {==}

def main() -> Nat:
  Nat.add(0n, 5n)
```

```output
5n
```

The same reasoning fails when the computed argument is a variable. This law puts the variable where the computation needs it, and `{==}` cannot prove it:

```bend
import Base

law twice_is_double:
  for x: Nat
  {Nat.add(x, x) == Nat.double(x) : Nat}

def twice_is_double(x):
  {==}
```

```error
- expected : Nat.add(x, x)
- observed : Nat.double(x)
```

Both sides are correct, but `{==}` needs them to reduce to the same term, and the variable `x` blocks the reduction. Split the variable with `match` and prove each case, or use induction as `add_zero` does.

## Boolean laws by cases

A law over a finite type needs one `{==}` per constructor. This law says negating twice gives back the original value:

```bend
import Base

law not_not:
  for b: Bool
  {Bool.not(Bool.not(b)) == b : Bool}

def not_not(b):
  match b:
    case True{}:
      {==}
    case False{}:
      {==}

def main() -> Bool:
  Bool.not(Bool.not(True{}))
```

```output
True{}
```

## Equality as a relation

Equality laws state that two computations give the same result. The bend2.dev example proves that cancelling a job twice has the same effect as cancelling it once, for every state. The job type and its cancel function live in another file:

**job.bend**

```bend file=job.bend
import Base

type State is Data:
  Queued{}
  Running{}
  Cancelled{}
  Finished{}

def cancel(state: State) -> State:
  match state:
    case Queued{}: Cancelled{}
    case Running{}: Cancelled{}
    case Cancelled{}: Cancelled{}
    case Finished{}: Finished{}
```

**main.bend**

```bend file=main.bend run
import Base
import ./job.bend as Job

law cancel_idempotent:
  for state: Job.State
  {Job.cancel(Job.cancel(state)) == Job.cancel(state) : Job.State}

def cancel_idempotent(state):
  match state:
    case Job.Queued{}: {==}
    case Job.Running{}: {==}
    case Job.Cancelled{}: {==}
    case Job.Finished{}: {==}

def main() -> Job.State:
  Job.cancel(Job.cancel(Job.Running{}))
```

```output
job.Cancelled{}
```

The law is checked as a type, so `main` does not need to call it. The output prints the constructor with its module prefix, `job.Cancelled{}`.

Two equality lemmas in Base help you rewrite equations: `Equal.sym` turns `e : {a == b : T}` into `{b == a : T}`, and `Equal.trans` chains two equations. The next example uses `Equal.sym`:

```bend
import Base

law flip:
  for +a: Nat
  for +b: Nat
  for e: {a == b : Nat}
  {b == a : Nat}

def flip(a, b, e):
  Equal.sym(Nat, a, b, e)
```

```output
All terms check.
```

## Existential laws

`exs y: T` in a law asks for a witness. The proof returns the witness together with the proof of the equation:

```bend
import Base

law has_zero:
  exs y: Nat
  {Nat.add(y, 0n) == 0n : Nat}

def has_zero():
  (0n, {==})
```

```output
All terms check.
```

## Holes: unfinished proofs

A `?TODO` in a proof leaves that branch open. The checker counts open holes, and a file with any open hole fails the proof check:

```bend
import Base

law cancel_all:
  for x: Nat
  {Nat.add(x, 0n) == x : Nat}

def cancel_all(x):
  match x:
    case 0n:
      {==}
    case 1n+p:
      ?TODO
```

```error
Error: 1 TODO found.
The code is incomplete, and not a valid proof yet.
```

A named hole, `?name`, stops the check and prints the goal that the branch must prove. Here the goal is printed for the branch `1n+p`:

```bend
import Base

law add_zero:
  for x: Nat
  {Nat.add(x, 0n) == x : Nat}

def add_zero(x):
  match x:
    case 0n:
      {==}
    case 1n+p:
      ?inspect
```

```error
- expected : {1n+Nat.add(p, 0n) == 1n+p : Nat}
- observed : ?inspect
```

Use `?name` to see the goal you must prove, then replace it with a proof. Leave `?TODO` only while you write the file. The proof gate rejects both.

## LAWS and PROOF: the project layout

A project keeps its claims and its proofs apart. `LAWS.bend` imports the code and states the laws. `PROOF.bend` imports both and proves each law with a def of the same name, as `def Laws.name` for a law named `name`. The example below stores three files in one directory. `job.bend` is the code under test, and it is the same file as in the equality example. `LAWS.bend` states four laws about it:

**job.bend**

```bend file=job.bend
import Base

type State is Data:
  Queued{}
  Running{}
  Cancelled{}
  Finished{}

def cancel(state: State) -> State:
  match state:
    case Queued{}: Cancelled{}
    case Running{}: Cancelled{}
    case Cancelled{}: Cancelled{}
    case Finished{}: Finished{}
```

**LAWS.bend**

```bend file=LAWS.bend
import Base
import ./job.bend as Job

law cancel_idempotent:
  for state: Job.State
  {Job.cancel(Job.cancel(state)) == Job.cancel(state) : Job.State}

law cancels_queued:
  {Job.cancel(Job.Queued{}) == Job.Cancelled{} : Job.State}

law cancels_running:
  {Job.cancel(Job.Running{}) == Job.Cancelled{} : Job.State}

law preserves_finished:
  {Job.cancel(Job.Finished{}) == Job.Finished{} : Job.State}
```

**PROOF.bend**

```bend file=PROOF.bend run
import Base
import ./job.bend as Job
import ./LAWS.bend as Laws

def Laws.cancel_idempotent(state):
  match state:
    case Job.Queued{}: {==}
    case Job.Running{}: {==}
    case Job.Cancelled{}: {==}
    case Job.Finished{}: {==}

def Laws.cancels_queued():
  {==}

def Laws.cancels_running():
  {==}

def Laws.preserves_finished():
  {==}
```

```output
All terms check.
```

`bend PROOF.bend` is the gate. It checks every law and every proof, and it prints `All terms check.` only when none is open. Run `bend LAWS.bend` alone and every law is an open claim. The message counts them as TODOs:

```text
Error: 4 TODOs found.
```

Two rules follow from the layout:

- **An accepted law is never weakened to pass.** Changing a law so that its proof becomes easy defeats its purpose. If a proof is hard, the law may be correct and the proof is what needs work.
- **A law with no def is an open claim.** It stays open until a same-named def proves it. A file that states a law and leaves it unproved fails the gate.

Chapter 11 covers the gate's other failure mode: a proof that depends on an `@unsafe` definition. Version 2.0.25 prints a warning and still exits with status 0, so do not treat exit status alone as the gate. Bend 2.0.36 adds `bend PROOF.bend --verdict`, which rechecks the proofs with a separate kernel. The bend2.dev notes say that option needs Lean v4.34.0 exactly, or a prebuilt kernel named by the `BENDTT` variable. Version 2.0.25 has no such option, and no Lean toolchain was installed on the lab machine, so the gate in this tutorial is `bend PROOF.bend` plus a reading of its output.

## Exercises

**1. Prove a right identity.** Prove `Nat.add(x, 0n) == x` without copying `add_zero`, by naming the induction hypothesis and rewriting with it.

*Solution.* This is the proof above. Put the hypothesis `add_zero(p)` in a rewrite whose motive is `1n+_`, then close with `{==}`.

**2. Find the failing proof.** The law `cancels_running` states that cancelling a running job yields `Cancelled{}`. Change the `Running{}` branch of `cancel` to return `Queued{}` and predict what the gate prints.

*Solution.* The gate fails, because `cancels_running` no longer holds for the new `cancel`. The law is the specification, and the implementation has to meet it.

## Next

Chapter 08 covers types that depend on values, and why they make preconditions checkable.
