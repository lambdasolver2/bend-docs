---
title: "Bend 2 tutorial 06: duplication, superposition, and SupGen"
description: "What dup and sup mean in the Interaction Calculus and HVM4, why search by superposition is documentation only, and which of SupGen, sup syntax, and copy-on-write forks the released Bend 2 compiler lacks."
updated: 2026-10-18
verified: 2026-10-18
status: docs-only
canonical: /tutorial/06-duplication-superposition/
sources:
  - https://bend2.dev/notes/hvm4-explained/
  - https://bend2.dev/notes/search-by-superposition/
  - https://bend2.dev/notes/release-status/
  - https://bend2.dev/notes/bend2-vs-bend1/
  - https://bend2.dev/learn/duplication/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 06: duplication, superposition, and SupGen

Your question mentions three things: copy-on-write with `sup` and `dup`, SupGen, and forks of running code. This chapter explains what the words mean in the lineage behind Bend, then shows what the released compiler accepts. Short version: the released Bend 2 has no `sup` syntax, no SupGen in its compiler or Base library, and no copy-on-write forks of running code. The rest of this chapter gives the evidence.

## Duplication and superposition, in the calculus

The Interaction Calculus, which HVM4 implements, has two kinds of term for sharing:

- A **duplication** `dup` takes one value and gives two copies, linked by a label. It is the term-level form of the DUP cell in chapter 04.
- A **superposition** `sup` holds two alternatives at once, also linked by a label. It is the term-level form of a choice that exists in several places.

The bend2.dev HVM4 page gives a worked example in its own syntax, where `&{1, 2}` is a superposition of two numbers. Adding 10 to it gives the two results 11 and 12. The page says the evaluator performs an addition for each alternative, and that duplication "still consumes work and memory". Sharing saves work only when the alternatives share their computation.

Labels decide how two terms meet. In the HVM literature, a `dup` and a `sup` with the same label route their parts to each other, and with different labels they commute, creating new `dup` and `sup` terms. Chapter 14 runs these rules on Victor Taelin's Interaction-Calculus reference implementation, which is a separate implementation from HVM4. HVM4 itself was not run.

> **Core insight.** `dup` and `sup` are two terms of one calculus. Their syntax differs, and they meet only through a label. Equal labels route, and different labels commute.

**Composed of: a sharing term with label `L`.**

```text
sharing term, label L
- dup: !&L{x, y} = t; body     one value t, two uses x and y
- sup: &L{a, b}                two alternatives a and b, held in one place
```

Chapter 14 runs both rules. In its examples, equal labels take 2 interactions and different labels take 9.

## Search by superposition

The bend2.dev note *Search by superposition* describes a technique built on this calculus. Apply a function to a superposition of its whole input domain, and the evaluator shares work across all inputs at once. The note reports results for a SAT instance and for program search. Those experiments used earlier HVM syntax. The page marks them **documentation only**: the numbers were reported by their author and were not re-run. Do not cite them as Bend 2 measurements.

## What the released compiler accepts

These two programs are rejected by `bend 2.0.25`, and the messages are the real ones:

```bend
import Base

def main() -> U32:
  x = &{1, 2}
  (x + 10 : U32)
```

```error
- expected : a name
- observed : '{'
```

`if` is not a keyword either. Bend branches with `match`, as chapter 01 shows:

```bend
import Base

def main() -> U32:
  if True{}:
    1
  else:
    2
```

```error
- expected : '='
- observed : ':'
```

Adding a label does not help. The labelled form is rejected as well:

```bend
import Base

def main() -> U32:
  x = &0{1, 2}
  (x + 10 : U32)
```

```error
- expected : ':'
- observed : ','
```

The released guide, Base, and the compiler say nothing about SupGen, and the bend2.dev pages document none. The site's own release-status note lists "Bend2–SupGen integration" among the launch blockers, and its HVM runtime note calls SupGen integration "still private". Treat SupGen as **not available** in the released compiler. Chapter 10 explains what you can do in its place.

## What Bend 2 has instead of copy-on-write

The released language has copying operations, but none of them is a copy-on-write fork of a running program:

- **`+` on a `Data` value** shares the value and counts the sharing. Nothing is copied, and the count is kept in 24 bits.
- **`Array.clone`** copies every slot into a second array. The cost grows with the array's size.
- **`Array.fork`** gives two handles to one array in constant time. Both handles read and write the same cells, so racing writes go through atomic operations. It is marked `@unsafe` in Base, which means the checker does not verify it, and no law may depend on it.
- **Templates** make one compiled copy for each distinct template argument. The copy happens at compile time, not while the program runs.

None of these forks a live program. A running Bend program is a value that the compiler has already compiled, and nothing in the language rewrites it.

## Exercises

**1. Read the error.** Explain, in one sentence each, why `&{1, 2}` and `if` are rejected.

*Solution.* `&{` begins a superposition in HVM syntax, which the released parser does not accept, so it expects a name where it sees the brace. `if` is not a keyword, so the parser reads `if True{}` as the start of a binding and expects `=` where it finds `:`.

**2. Two alternatives without superposition.** Replace the idea of a superposed price with an ordinary choice. Write a `Choice` type with two constructors and a function that prices each one. Print both prices as a pair.

*Solution.* The alternatives are values, so they can be passed around, stored, and checked by laws. The output below is the pair of both prices.

```bend
import Base

type Choice is Data:
  Low{}
  High{}

def price(c: Choice) -> Nat:
  match c:
    case Low{}:
      10n
    case High{}:
      20n

def main() -> Nat & Nat:
  (price(Low{}), price(High{}))
```

```output
(10n, 20n)
```

**3. Why no law can use `Array.fork`.** Explain what the `@unsafe` marker in Base changes for a law that depends on `Array.fork`.

*Solution.* The checker treats an `@unsafe` definition as outside its proof guarantees. A law whose proof depends on it is rejected in the proof check, so the law would be unverified. Chapter 11 shows the exact message.

## Next

Chapter 07 covers laws and proofs, the part of Bend that checks properties of the values a program computes.
