---
title: "Bend 2 tutorial 10: branching and self-change"
description: "What SupGen, copy-on-write forks, and homoiconic self-change would require, what the released Bend 2 compiler offers instead, and a laws-first workflow for testing a new branch of pure code."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/10-branching-and-self-change/
sources:
  - https://bend2.dev/notes/hvm4-explained/
  - https://bend2.dev/notes/release-status/
  - https://bend2.dev/notes/ai-agents-bend/
  - https://bend2.dev/learn/types-as-specifications/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 10: branching and self-change

The request behind this chapter asks for four things: SupGen, cheap copy-on-write forks of code (with `sup` and `dup`), homoiconic code that changes itself, and forking a running program with new code so that the main code keeps working and new branches can be tested cheaply. This chapter says which of these the released Bend 2 compiler offers, which it does not, and what to do instead. The short answer is that the part you can have is the laws-first workflow for pure code, and the rest is either absent from the compiler or cannot be stated as a law.

## What each requirement needs

| Requirement | Status in bend 2.0.25 | What you can do instead | Can a law pin it? |
|-------------|-----------------------|-------------------------|-------------------|
| SupGen (type-directed program synthesis) | not in the compiler, Base, or guide; the site says it is private | write the program and its laws by hand | no |
| Copy-on-write fork with `sup` and `dup` | no `sup` syntax (chapter 06); no copy-on-write forks | values are immutable; `+` shares by count; `Array.clone` copies | value equality yes; sharing and cost no |
| Homoiconic, self-changing code | programs are fixed definitions; templates specialize at compile time | represent a program as `Data` and interpret it with `eval` | yes, for the interpreter's behaviour |
| Cheap fork of code | the calculus forks a term into labelled alternatives that share their input (chapter 14); released Bend 2 has no such construct | a new definition or constructor is a new branch; `main` is unchanged | the result yes; the cost no |
| Test new branches cheaply and fast | `bend --check-only` and `bend PROOF.bend` check the laws; native builds time the program | the laws-first gate below | the behaviour yes; the time no |

Two lines in that table are absolute. A law states what a value computes, and the released compiler has no way to state the cost of sharing. Time and memory are measurements.

## The workflow that works today

For pure code, a branch is a new value or a new constructor, and the checker tests it against the same laws as `main`.

1. **State the requirement as laws.** Put the claims in `LAWS.bend`, and never weaken an accepted law to get a proof through.
2. **Implement the main behaviour as pure functions over `Data`.** Keep the input and output shell thin, so the laws can pin the pure part.
3. **Add a branch as a new constructor or a new definition.** Existing cases do not change, so the main laws keep their proofs.
4. **Write one law per branch,** plus laws that relate the branch to `main`. A *difference law* says where the branch may differ from `main`. A *fork law* says a branch that changes nothing behaves exactly like `main`.
5. **Prove in `PROOF.bend`.** The gate must print `All terms check.` with no line about `unsafe` or `foreign` code.
6. **Measure the branch separately,** with native builds, as chapter 05 describes.

The pattern works because the laws quantify over every constructor. A new constructor that is not covered by a proof makes the gate fail. The compiler enforces that every new branch carries its own proof.

## Pattern 1: a branch as a template

A template argument is a compile-time choice. Two different steps give two compiled copies of one loop, with no run-time selection:

```bend
import Base

def run(~step: U32 -> U32, n: Nat, x: U32) -> U32:
  match n:
    case 0n:
      x
    case 1n+p:
      run(~step, p, step(x))

def main_step(x: U32) -> U32:
  (x + 1 : U32)

def branch_step(x: U32) -> U32:
  (x + 2 : U32)

def main() -> U32 & U32:
  (run(~main_step, 3n, 0), run(~branch_step, 3n, 0))
```

```output
(3, 6)
```

A law can pin the branch at one input, and the proof is computation. The checker evaluates the concrete U32 arithmetic, so `{==}` is enough:

```bend
import Base

def branch_step(x: U32) -> U32:
  (x + 2 : U32)

law branch_at_zero:
  {branch_step(0) == 2 : U32}

def branch_at_zero():
  {==}

def main() -> U32:
  branch_step(0)
```

```output
2
```

A law over every input needs induction or a proof by cases, as chapter 07 shows. The concrete law is the smallest useful claim, and it runs in the same gate.

## Pattern 2: a program as data

Homoiconic code means that a program is also data that other code can build and inspect. Bend does not quote its own definitions, but you can represent an expression as a `Data` type and interpret it. A branch is then a different expression value, and the main expression is untouched. Bend is strict, so the data below is built and not computed: `eval` is the only step that computes a value. To keep work unevaluated, you can use a lambda (`x => ...`), a template (`~f`), or data like this. Chapter 12, section 11, shows all three:

```bend
import Base

type Expr is Data:
  Lit{n: Nat}
  Add{a: Expr, b: Expr}
  Mul{a: Expr, b: Expr}

def eval(e: Expr) -> Nat:
  match e:
    case Lit{n}:
      n
    case Add{a, b}:
      Nat.add(eval(a), eval(b))
    case Mul{a, b}:
      Nat.mul(eval(a), eval(b))

def main() -> Nat & Nat:
  main_expr : Expr = Add{Lit{2n}, Lit{3n}}
  branch_expr : Expr = Add{Lit{2n}, Mul{Lit{3n}, Lit{2n}}}
  (eval(main_expr), eval(branch_expr))
```

```output
(5n, 8n)
```

Both values are pure, so evaluating the branch cannot change the main value. The interpreter `eval` is the place for laws: a law such as "`eval` of `Add{a, b}` is the sum of the evals" can be proved by a case split. This is homoiconic in a limited sense: the program is data you can build and test. It is not self-modification of the running binary, and it does not give you cheap sharing of two programs. Each `Expr` value is built and stored in memory, and the cost is what chapter 05 measures.

## Pattern 3: the difference between branches

The most useful law for a branch relates it to `main`. Suppose the branch should never give a larger answer than `main`. Write the claim, and let the gate check it:

```text
law branch_never_more:
  for x: U32
  {U32.is_le(branch_step(x), main_step(x)) == True{} : Bool}
```

That law is false for the example above, because `branch_step` adds 2 and `main_step` adds 1. The gate would reject it, and that is the point: a difference law states exactly how the branch may differ from `main`, and a branch that breaks it is not accepted. Write the law you want, then change the branch until the gate accepts it, not the other way round.

## What is not possible, and why

- **SupGen** is not in the released compiler. Nothing in this chapter depends on it, and no law can refer to it.
- **Copy-on-write forks with `sup` and `dup`** need a construct the parser rejects (chapter 06). The nearest things are `Array.fork`, which is `@unsafe` and so cannot support a law, and `Array.clone`, which copies.
- **Bend 2 does not fork a running program.** It compiles each program to a fixed binary, and a second program is a second file that you compile. The calculus forks terms, not processes: a superposition holds two alternatives, and applying it runs both on one shared input (chapter 14). The released compiler does not expose that.
- **Cost is not a law.** The checker proves that a branch computes the right values. It does not prove that the branch is cheap. Measure it, count the keeps in the emitted C (chapter 05), and compare builds.

## Exercises

**1. A third step.** Add a template step `triple_step` that adds 3, and make `main` return the three results as a triple. Predict the output before you run it.

*Solution.* The result is `(3, 6, 9)` for three steps of three applications each. Triples are written `A & B & C`.

```bend
import Base

def run(~step: U32 -> U32, n: Nat, x: U32) -> U32:
  match n:
    case 0n:
      x
    case 1n+p:
      run(~step, p, step(x))

def main_step(x: U32) -> U32:
  (x + 1 : U32)

def branch_step(x: U32) -> U32:
  (x + 2 : U32)

def triple_step(x: U32) -> U32:
  (x + 3 : U32)

def main() -> U32 & U32 & U32:
  (run(~main_step, 3n, 0), run(~branch_step, 3n, 0), run(~triple_step, 3n, 0))
```

```output
(3, 6, 9)
```

**2. A law for a concrete input.** Write the law that `triple_step(0)` is `3`, and prove it by computation.

*Solution.* The same shape as `branch_at_zero`. The concrete arithmetic reduces, so `{==}` proves it.

```bend
import Base

def triple_step(x: U32) -> U32:
  (x + 3 : U32)

law triple_at_zero:
  {triple_step(0) == 3 : U32}

def triple_at_zero():
  {==}

def main() -> U32:
  triple_step(0)
```

```output
3
```

## Next

Chapter 11 lists the checker's rules and every official diagnostic with the message the released compiler prints.
