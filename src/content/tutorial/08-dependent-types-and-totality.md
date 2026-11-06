---
title: "Bend 2 tutorial 08: dependent types and totality"
description: "Types computed from values, Unit and Empty as checked preconditions, length-indexed lists, the termination rule in practice, and why @unsafe changes what a proof may rely on."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/08-dependent-types-and-totality/
sources:
  - https://bend2.dev/learn/dependent-types/
  - https://bend2.dev/learn/sized-lists/
  - https://bend2.dev/learn/totality/
  - https://bend2.dev/errors/unsafe-dependents/
  - https://bend2.dev/notes/what-is-bend2/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 08: dependent types and totality

A **dependent type** is a type that a function computes from a value. In Haskell you reach for GADTs or type families. In Bend every type is an ordinary function call, so the same machinery that checks values checks types. This chapter shows three uses: a type that is `Unit` for one input and `Empty` for another, a list whose length is part of its type, and the rule that keeps every such definition terminating.

Three kinds of type appear in this chapter:

| Kind | Example | What it depends on |
|---|---|---|
| normal | `U32` | nothing |
| function | `U32 -> U32` | nothing: it is the type of functions from values to values |
| dependent | `IsZero(n)`, `Vec(A, n)` | a value `n`, and for `Vec` also a type `A` |

A dependent type is a function that returns a type. `IsZero` takes a `Nat` and returns `Unit` or `Empty`, and that result limits what a caller may pass: for `0n` there is one value to pass, and for `1n+p` there is none. The two sections below build those dependent types.

## A type that computes

`IsZero(n)` is `Unit` when `n` is zero and `Empty` otherwise. `Empty` has no values, so a function that demands an `IsZero` argument can only be called with zero:

```bend
import Base

def IsZero(n: Nat) -> Type:
  match n:
    case 0n:
      Unit
    case 1n+p:
      Empty

def require_zero(n: Nat, evidence: IsZero(n)) -> Nat:
  n

def main() -> Nat:
  require_zero(0n, Unit{})
```

```output
0n
```

`Unit{}` is the only value of `Unit`, so the caller must supply it. Calling `require_zero(1n, Unit{})` is rejected, because `IsZero(1n)` is `Empty` and `Unit{}` is not an `Empty`:

```bend
import Base

def IsZero(n: Nat) -> Type:
  match n:
    case 0n:
      Unit
    case 1n+p:
      Empty

def require_zero(n: Nat, evidence: IsZero(n)) -> Nat:
  n

def main() -> Nat:
  require_zero(1n, Unit{})
```

```error
- expected : Empty
```

A function whose argument has type `Empty` can be written with an empty `match`. It needs no case, because no value can exist:

```bend
import Base

def from_empty(-A: Type, e: Empty) -> A:
  match e:

def main() -> Nat:
  0n
```

```output
0n
```

## Length in the type

A `Vec` is a nested pair, and its type depends on a `Nat` length. `first` takes a list of length `1n+n`, which is one or more, so it has no empty case:

```bend
import Base

def Vec(-A: Type, n: Nat) -> Type:
  match n:
    case 0n:
      Unit
    case 1n+p:
      A & Vec(A, p)

def first(-A: Type, -n: Nat, xs: Vec(A, 1n+n)) -> A:
  (x, rest) = xs
  x

def total(n: Nat, xs: Vec(U32, n)) -> U32:
  match n:
    case 0n:
      0
    case 1n+p:
      (x, rest) = xs
      (x + total(p, rest) : U32)

def main() -> U32 & U32:
  x = first(U32, 2n, (10, (20, (30, Unit{}))))
  s = total(3n, (10, (20, (30, Unit{}))))
  (x, s)
```

```output
(10, 60)
```

Two things make this work. The length `n` determines how many pairs `total` consumes, and its recursive call gets the smaller length `p`. The parameter `n` of `first` is erased: it appears only in the type, so it does not exist at run time (the `-` marks it).

Haskell would enforce this with a length-indexed GADT and a `Nat`-kinded phantom type. Bend uses the same idea, but the index is an ordinary function that the checker evaluates.

## A proof that uses a type

A law can take evidence as an argument. `IsEven(x)` below is `Unit` for zero, `Empty` for one, and `IsEven(p)` for `2n+p`. The law says halving an even number and doubling the result gives the number back. The evidence `e` is what makes the law true for only even inputs:

```bend
import Base

def IsEven(n: Nat) -> Type:
  match n:
    case 0n:
      Unit
    case 1n+0n:
      Empty
    case 2n+p:
      IsEven(p)

def half(n: Nat) -> Nat:
  match n:
    case 0n:
      0n
    case 1n+0n:
      0n
    case 2n+p:
      1n+half(p)

law half_ok:
  for x: Nat
  for e: IsEven(x)
  {Nat.double(half(x)) == x : Nat}

def half_ok(x, e):
  match x:
    case 0n:
      {==}
    case 1n+0n:
      match e:
    case 2n+p:
      %half_ok(p, e) : {2n+Nat.double(half(p)) == 2n+_ : Nat}
      {==}

def main() -> Nat:
  half(8n)
```

```output
4n
```

The branch `1n+0n` has no proof body of its own. Its evidence `e` has type `Empty`, so `match e:` with no cases closes the branch. The indentation of `case 2n+p:` is the one the checker accepts after an empty `match`, and it is the same as the bend2.dev example.

## Totality: every recursion shrinks

Bend requires every safe recursive call to pass a structurally smaller input, as chapter 02 explains. The rule holds for proofs as well as for programs, because a proof is also a recursive definition. Two consequences matter in practice.

1. A recursion that does not shrink is rejected, so a loop bounded by the outside world takes a `Nat` fuel argument and matches its predecessor.
2. Mutual recursion is not allowed in a safe definition. Merge the functions into one with a selector argument.

## When @unsafe changes the rules

`@unsafe` disables the termination check for one definition. The compiler still runs the function, but any proof that depends on it is outside the guarantee. This program runs and prints 3, with a warning that the proof check now depends on unsafe code:

```bend
import Base

@unsafe def idu(n: Nat) -> Nat:
  match n:
    case 0n:
      0n
    case 1n+p:
      1n+idu(p)

def main() -> Nat:
  idu(3n)
```

```contains
3n
All terms check, but 2 defs rely on unsafe or foreign code:
```

The same definition used by a law is the case that matters. Version 2.0.25 reports it and exits with status 0, so the gate must read the message, not just the status:

```bend
import Base

@unsafe def idu(n: Nat) -> Nat:
  match n:
    case 0n:
      0n
    case 1n+p:
      1n+idu(p)

law idu_two:
  {idu(2n) == 2n : Nat}

def idu_two():
  {==}
```

```contains
All terms check, but 2 defs rely on unsafe or foreign code:
```

Be careful with unsafe loops too. A law that requires the checker to evaluate a non-terminating `@unsafe` function does not finish. In one run on this machine, a law of that shape ran for more than 20 seconds before the run was stopped. Keep `@unsafe` out of every definition that a law depends on, and keep laws about terminating functions.

## Exercises

**1. Odd numbers.** Write `IsOdd(n)` that is `Empty` for zero, `Unit` for one, and `IsOdd(p)` for `2n+p`. It is the complement of `IsEven`. Check that a function `pred_odd(n, e)` needs `IsOdd(n)`: prove `IsOdd(1n)` by building `Unit{}`, and check that `IsOdd(0n)` is empty.

*Solution.* `IsOdd` mirrors `IsEven`. The function `pred_odd` takes evidence that its argument is odd. `IsOdd(0n)` is `Empty`, so the zero case is closed by an empty `match`. Odd numbers such as `5n` pass the evidence `Unit{}`:

```bend
import Base

def IsOdd(n: Nat) -> Type:
  match n:
    case 0n:
      Empty
    case 1n+0n:
      Unit
    case 2n+p:
      IsOdd(p)

def pred_odd(n: Nat, e: IsOdd(n)) -> Nat:
  match n:
    case 0n:
      match e:
    case 1n+p:
      p

def main() -> Nat:
  pred_odd(5n, Unit{})
```

```output
4n
```

To check that `IsOdd(0n)` is empty, match on evidence of that type. A `match` with no cases closes the branch:

```bend
import Base

def IsOdd(n: Nat) -> Type:
  match n:
    case 0n:
      Empty
    case 1n+0n:
      Unit
    case 2n+p:
      IsOdd(p)

def odd_zero_empty(e: IsOdd(0n)) -> Nat:
  match e:

def main() -> Nat:
  1n
```

```output
1n
```

**2. Fuel.** Write `repeat(fuel, x)` that returns `x` plus `fuel`, using the fuel as the loop bound: each step adds 1 to `x`. Explain why it terminates.

*Solution.* It terminates because the first argument `fuel` is matched and the recursive call gets its predecessor. The following program adds 5 to 10:

```bend
import Base

def repeat(fuel: Nat, x: U32) -> U32:
  match fuel:
    case 0n:
      x
    case 1n+p:
      repeat(p, (x + 1 : U32))

def main() -> U32:
  repeat(5n, 10)
```

```output
15
```

## Next

Chapter 09 covers the IO monad, files, command-line arguments, and the compilation targets.
