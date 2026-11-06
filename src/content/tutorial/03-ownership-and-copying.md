---
title: "Bend 2 tutorial 03: ownership and copying"
description: "Affine binders, + and - quantities, Data versus Type, kinds, one-owner arrays, maps, templates, closures, and folds, with what each kind of copy costs."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/03-ownership-and-copying/
sources:
  - https://bend2.dev/learn/duplication/
  - https://bend2.dev/learn/kinds/
  - https://bend2.dev/learn/arrays/
  - https://bend2.dev/learn/maps/
  - https://bend2.dev/learn/templates/
  - https://bend2.dev/learn/closures/
  - https://bend2.dev/learn/folds/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 03: ownership and copying

Haskell shares values by default, and a garbage collector frees them later. Bend does the opposite: every binder says how many times it may be used, and the checker enforces it. This chapter explains those quantities, the cost of each way to copy, and the containers that rely on them.

## Affine by default

A plain binder may be used at most once. Dropping it is free:

```bend
import Base

def twice(n: Nat) -> Nat:
  Nat.add(n, n)

def main() -> Nat:
  twice(3n)
```

```error
- expected : n
- observed : n (consumed more than once)
```

The fix is `+`, which marks the binder as reusable:

```bend
import Base

def twice(+n: Nat) -> Nat:
  Nat.add(n, n)

def main() -> Nat:
  twice(3n)
```

```output
6n
```

`+` is allowed only when the binder's type is `Data`. Nat, U32, Bool, and records declared `is Data` qualify. Functions, arrays, and file handles never do.

## Data versus Type

A type declared `is Data` may be copied with `+`. A type declared `is Type` may not:

```bend
import Base

type Token is Type:
  Tok{n: Nat}

def show(t: Token) -> Nat:
  match t:
    case Tok{n}:
      n

def main() -> Nat:
  t : Token = Tok{3n}
  +u = t
  show(u)
```

```error
- expected : Data
- observed : Type
```

The same program works when `Token` is declared `is Data`, and it uses an annotation to build the value:

```bend
import Base

type Tok is Data:
  Tok{n: Nat}

def show(t: Tok) -> Nat:
  match t:
    case Tok{n}:
      n

def main() -> Nat:
  +t = {Tok{3n} : Tok}
  Nat.add(show(t), show(t))
```

```output
6n
```

Think of a kind as a reuse budget. `Type` allows one use, and `Data` allows as many copies as the code asks for, marked with `+`. A type with arguments takes its kind from them, so `Maybe<&2, Nat>` is `Data` and `Maybe<&1, Nat>` is `Type`:

```bend
import Base

def dup(+m: Maybe<&2, Nat>) -> Maybe<&2, Nat> & Maybe<&2, Nat>:
  (m, m)

def main() -> Maybe<&2, Nat> & Maybe<&2, Nat>:
  dup(Some{4n})
```

```output
(Some{4n}, Some{4n})
```

With `&1`, the same `+m` is rejected:

```bend
import Base

def dup(+m: Maybe<&1, Nat>) -> Maybe<&1, Nat> & Maybe<&1, Nat>:
  (m, m)

def main() -> Maybe<&1, Nat> & Maybe<&1, Nat>:
  dup(Some{4n})
```

```error
- expected : Data
- observed : Type
```

## The minus sign: erased parameters

`-A` is a parameter that exists only at compile time. It appears in types and is deleted before the program runs. `keep_first` below ignores its second argument, which is dropped:

```bend
import Base

def twice(+n: Nat) -> Nat:
  Nat.add(n, n)

def keep_first(-A: Type, x: A, y: A) -> A:
  x

def main() -> Nat:
  keep_first(Nat, twice(3n), 9n)
```

```output
6n
```

### Why mark a parameter erased

Without the minus sign, `A` is an ordinary parameter. The checker accepts both versions, but the compiled programs differ: the plain version receives the type as a value and drops it at the end. Write the program twice, once with `-A` and once with `A`, and compare the C each one emits (chapter 05 shows `-o file.c`):

```sh
bend erased.bend -o erased.c
bend plain.bend -o plain.c
grep -c _A_0 erased.c plain.c
```

```text
erased.c:0
plain.c:2
```

The erased version has no variable for `A`. The plain version has one, `_A_0`, which it receives and then drops. The minus sign removes that cost.

### What a run-time use is

A binder is used at run time when the compiled body needs its value: it returns the value or computes with it. An erased binder cannot be used that way, because its only uses are in types and proofs:

```bend
import Base

def bad(-A: Type, x: A) -> A:
  A

def main() -> Nat:
  bad(Nat, 6n)
```

```error
- expected : A
- observed : Type
```

### Type arguments are explicit

Bend infers almost nothing, so a type argument is passed like any other argument. Leaving it out is rejected:

```bend
import Base

def identity(-A: Type, x: A) -> A:
  x

def main() -> U32:
  identity(42)
```

```error
- expected : Type
- observed : U32
```

With the type passed, the call checks. The type is erased, so it costs nothing at run time:

```bend
import Base

def identity(-A: Type, x: A) -> A:
  x

def main() -> U32:
  identity(U32, 42)
```

```output
42
```

## Kinds: how often a value may be used

Every type has a kind that caps its uses. `Type` is `Kind(&1)` (affine) and `Data` is `Kind(&2)` (reusable). Base declares `List<a, A>` so that a list is exactly as reusable as its elements. A function can take the kind as an argument:

```bend
import Base

def count(a, -A: Kind(a), xs: List<a, A>) -> Nat:
  match xs:
    case Nil{}:
      0n
    case Con{head, tail}:
      1n+count(a, A, tail)

def main() -> Nat:
  count(&2, U32, [10, 20, 30])
```

```output
3n
```

A parameter of type `+List<U32>` is a list whose elements are reusable. The type is `List<&2, U32>`, so the `+` on the parameter lets the function use the whole list twice:

```bend
import Base

def twice_len(+xs: +List<U32>) -> Nat:
  Nat.add(List.length(&2, U32, xs), List.length(&2, U32, xs))

def main() -> Nat:
  twice_len([1, 2, 3])
```

```output
6n
```

## Arrays: one owner, updated in place

An array has exactly one owner. Writing to it changes the storage in place, and the array comes back to you. `[0 : U32*8n]` creates eight slots (the count must be a power of two). A read returns the array together with the element:

```bend
import Base

def value(result: Array<U32> & U32) -> U32:
  match result:
    case (array, item):
      item

def main() -> U32:
  a = [0 : U32*8n]
  a[5] <- 42
  value(a[5])
```

```output
42
```

The bracket form is an array literal, and its type part says what the slots hold. `[fill : Type*slots]` asks for `slots` slots, which must be a power of two. `[fill : Type^depth]` names a depth, so `U32^3n` is 2^3 = 8 slots. The function form is `Array.new(-T: Data, +d: Nat, +v: T) -> Array<T>` in Base. `Array.new(U32, 3n, 0)` builds the same array as `[0 : U32^3n]`, because its second argument is the depth. Indexes wrap, so on an eight-slot array `a[9]` is slot 1. A slot count that is not a power of two is rejected:

```bend
import Base

def main() -> U32:
  a = [0 : U32*6n]
  a[5] <- 42
  0
```

```error
- message  : a power of two count (^d takes a depth)
```

An array passed to a function is updated there and returned. Put the write in a def that takes the array as a parameter:

```bend
import Base

def first_of(r: Array<U32> & U32) -> U32:
  match r:
    case (arr, item):
      item

def set_first(a: Array<U32>) -> Array<U32>:
  a[0] <- 7
  a

def main() -> U32:
  a = [1 : U32*4n]
  b = set_first(a)
  first_of(b[0])
```

```output
7
```

A second independent array needs `Array.clone`, which copies every slot. Its result is a pair, and the pair cannot be destructured in `main`: a `match` may not inspect a computed value. Pass it to a helper that matches its parameter:

```bend
import Base

def first_of(r: Array<U32> & U32) -> U32:
  match r:
    case (arr, item):
      item

def set_first(a: Array<U32>) -> Array<U32>:
  a[0] <- 7
  a

def use_clone(p: Array<U32> & Array<U32>) -> U32:
  match p:
    case (a1, a2):
      b = set_first(a1)
      x = first_of(b[0])
      y = first_of(a2[0])
      (x + y : U32)

def main() -> U32:
  a = [1 : U32*4n]
  use_clone(Array.clone(U32, a))
```

```output
8
```

Here `x` is 7 and `y` is 1, so the copies stayed independent. Destructuring the result in `main` is rejected:

```bend
import Base

def main() -> U32:
  a = [1 : U32*4n]
  (a1, a2) = Array.clone(U32, a)
  first_of(a1[0])

def first_of(r: Array<U32> & U32) -> U32:
  match r:
    case (arr, item):
      item
```

```error
- message  : a parameter or field scrutinee (a match cannot scrutinize a computed value: give it its own def)
```

## Maps

A `Map` associates string keys with values. `Map.new` takes the kind and the value type. `Map.set` and `Map.get` return the map with their result, so the map keeps its owner. `Map.get` takes its default before the map:

```bend
import Base

def value(result: Map<&2, U32> & U32) -> U32:
  match result:
    case (map, item):
      item

def main() -> U32:
  m = Map.new(&2, U32)
  m = Map.set(&2, U32, m, "answer", 42)
  value(Map.get(U32, 0, m, "answer"))
```

```output
42
```

A `Set` is a map with no values. `Set.add` returns the set, and `Set.size` counts its keys:

```bend
import Base

def main() -> Nat:
  s = Set.new()
  s = Set.add(s, "x")
  s = Set.add(s, "y")
  Set.size(s)
```

```output
2n
```

## Templates: compile-time arguments

A template parameter starts with `~`. Its argument is substituted at compile time and is not passed at run time. Each distinct template argument produces its own compiled copy, so a template may be called as often as you like:

```bend
import Base

def twice(~f: U32 -> U32, x: U32) -> U32:
  f(f(x))

def main() -> U32:
  twice(~(x => (x + 1 : U32)), 40)
```

```output
42
```

A template may call itself and pass its template argument along. Two different steps give two compiled copies of the same loop:

```bend
import Base

def run(~step: U32 -> U32, n: Nat, x: U32) -> U32:
  match n:
    case 0n:
      x
    case 1n+p:
      run(~step, p, step(x))

def main() -> U32 & U32:
  (run(~(x => (x + 1 : U32)), 3n, 0), run(~(x => (x + 2 : U32)), 3n, 0))
```

```output
(3, 6)
```

A template argument must be closed: it may mention top-level definitions, but not a local variable of the caller. Here `k` is a local variable, and the checker rejects the call:

```bend
import Base

def twice(~f: U32 -> U32, x: U32) -> U32:
  f(f(x))

def add_k(k: U32, x: U32) -> U32:
  twice(~(y => (y + k : U32)), x)

def main() -> U32:
  add_k(1, 40)
```

```error
- expected : a template applied to closed ~ arguments (k is a variable here, not comptime: pass it at run time)
- observed : twice
```

### Why a template, not a closure

A parameter of type `U32 -> U32` is a closure, and a closure is affine. `f(f(x))` uses `f` twice, so the checker rejects this program:

```bend
import Base

def apply_twice(f: U32 -> U32, x: U32) -> U32:
  f(f(x))

def main() -> U32:
  apply_twice(x => (x + 1 : U32), 40)
```

```error
- expected : f
- observed : f (consumed more than once)
```

A `~f` argument is substituted at compile time, so `f` is code rather than a value that can be used up. The `twice` above is that fix.

## Closures

A function may return a closure that captures a value. A closure is affine: it may be called once, even when everything it captures is `Data`:

```bend
import Base

def offset(k: U32) -> U32 -> U32:
  x => (x + k : U32)

def main() -> U32:
  add2 = offset(2)
  add5 = offset(5)
  add5(add2(35))
```

```output
42
```

A top-level definition may be called many times. Use a template when you need a function called repeatedly.

## Folds

`List.foldl` reduces a list. Its signature takes the quantity of the elements, their kind, the accumulator type, and the combining function as template arguments, then the list and the starting value. Here `add` is a top-level definition, so it costs nothing to pass:

```bend
import Base

def add(a: U32, b: U32) -> U32:
  (a + b : U32)

def main() -> U32:
  List.foldl(~&1, ~U32, ~U32, ~add, [10, 20, 12], 0)
```

```output
42
```

`List.filter` and `List.sort` take the element type and a function as template arguments, and they return `List<&2, A>`, the reusable form. This `filter` keeps the elements greater than 5:

```bend
import Base

def is_big(x: U32) -> Bool:
  U32.is_gt(x, 5)

def main() -> List<&2, U32>:
  List.filter(~U32, ~is_big, [1, 6, 3, 8])
```

```output
[6, 8]
```

## What a copy costs

| Operation | What happens | Cost |
|-----------|--------------|------|
| `+x` on a `Data` value | both uses share one value; a reference count tracks the copies | a count update per shared use |
| `Array.clone(T, a)` | every slot is copied into a second array | proportional to the array's size |
| `Array.fork` | two handles share one array; reads and writes race through atomics | cheap, but marked `@unsafe`, so no law may depend on it |
| a template argument | a separate compiled copy for each distinct argument | code size, no run-time cost |
| a closure | affine: called once | no sharing to pay for |

The guide says `+` pays a reference count. The emitted C keeps that count in 24 bits (`RFC_CNT`). Chapter 05 shows how to find the counts. Chapter 10 explains why none of this gives you copy-on-write forks of running code.

## Exercises

**1. Cube.** The parameter appears three times in `x * x * x`. Add the qualifier that makes it reusable, then check that `cube(3)` prints `27`.

```bend
import Base

def cube(+x: U32) -> U32:
  (x * x * x : U32)

def main() -> U32:
  cube(3)
```

```output
27
```

**2. Keep the original.** Clone the array, change the first slot of one copy to 7, and return the first slot of the other copy. The answer is `1`.

```bend
import Base

def first_of(r: Array<U32> & U32) -> U32:
  match r:
    case (arr, item):
      item

def set_first(a: Array<U32>) -> Array<U32>:
  a[0] <- 7
  a

def other_copy(p: Array<U32> & Array<U32>) -> U32:
  match p:
    case (a1, a2):
      b = set_first(a1)
      first_of(a2[0])

def main() -> U32:
  a = [1 : U32*4n]
  other_copy(Array.clone(U32, a))
```

```output
1
```

## Next

Chapter 04 is the machine model: interaction nets, the rules that rewrite them, and why the model is the reason copying is explicit in Bend.
