---
title: "Bend 2 tutorial 02: data and recursion"
description: "Algebraic data types, records, nested and multi-scrutinee matching, the termination rule, imports, and definition order, with the real checker messages."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/02-data-and-recursion/
sources:
  - https://bend2.dev/learn/adts/
  - https://bend2.dev/learn/records/
  - https://bend2.dev/learn/pattern-matching/
  - https://bend2.dev/learn/recursion/
  - https://bend2.dev/learn/totality/
  - https://bend2.dev/learn/imports/
  - https://bend2.dev/learn/definition-order/
---

# 02: data and recursion

This chapter covers the data types you define, how a `match` reads them, and the rule that makes recursion safe to check. Haskell and OCaml readers will recognize almost everything. The differences are the explicit annotations and the fixed order of definitions.

## Algebraic data types

```bend
import Base

type Shape is Data:
  Point{}
  Segment{length: Nat}

def measure(shape: Shape) -> Nat:
  match shape:
    case Point{}:
      0n
    case Segment{length}:
      length

def main() -> Nat:
  measure(Segment{3n})
```

```output
3n
```

- `type Shape is Data:` declares a type and says its values may be reused (chapter 03). Each indented line is a constructor.
- Constructors always use braces, even without fields: `Point{}`.
- Fields are named inside the braces: `Segment{length: Nat}` builds `Segment{3n}`.
- Haskell's `data Shape = Point | Segment { length :: Nat }` is the same declaration.

### Types, constructors, and values

A type is a set of values: `Shape`. A constructor (often shortened to *ctor*) is a named way to build one of those values: `Point{}` and `Segment{length: Nat}` are the two constructors declared in `type Shape`. In Haskell, `data Shape = Point | Segment Nat` declares the same two constructors. A value is what a constructor builds: `Point{}` and `Segment{3n}` are both values of type `Shape`.

A name followed by braces, `K{...}`, is always a constructor. The braces do different jobs depending on where they appear:

- In a `type` declaration, `Segment{length: Nat}` lists the fields of the constructor.
- In an expression, `Tok{3n}` applies the constructor to `3n`. The compiler reads it as `Ctor(Tok, [3n])`.
- In a `match` pattern, `case Segment{length}:` takes the value apart and binds the field.

Braces without a name are a different form. `{12 : U32}` is an annotation, `Ann(12, U32)`, and it is not a constructor. Chapter 12 lists every use of braces.

```bend
import Base

type Shape is Data:
  Point{}
  Segment{length: Nat}

def main() -> Shape & Shape:
  (Point{}, Segment{3n})
```

```output
(Point{}, Segment{3n})
```

Both values are built directly, and no `match` is needed to make them. `Point{}` takes no fields, and `Segment{3n}` takes one.

Base declares its own types the same way. `bend base --types` prints them:

| Type | Constructors | Example value |
|---|---|---|
| `Nat` | `Zero{}`, `Succ{pred}` | `2n`, which is `Succ{Succ{Zero{}}}` |
| `Bool` | `False{}`, `True{}` | `True{}` |
| `Unit` | `Unit{}` | `Unit{}` |
| `Maybe<a, A>` | `None{}`, `Some{value}` | `Some{42}` |
| `Result<a, b, E, A>` | `Fail{error}`, `Done{value}` | `Done{5}` |
| `List<a, A>` | `Nil{}`, `Con{head, tail}` | `[1, 2]`, which is `Con{1, Con{2, Nil{}}}` |
| `String` | `SNil{}`, `SCon{head, tail}` | `"hi"`, which is `SCon{'h', SCon{'i', SNil{}}}` |

Angle brackets name types. `Maybe<&2, U32>` is a type, and `Some{42}` is a value of that type. In Haskell, `Maybe a` is a type constructor and `Just x` is a data constructor. Bend keeps the two apart the same way.

A constructor needs its type from context. When a `let` has no context, write the type:

```bend
import Base

type Tok is Data:
  Tok{n: Nat}

def show(t: Tok) -> Nat:
  match t:
    case Tok{n}:
      n

def main() -> Nat:
  t : Tok = Tok{3n}
  show(t)
```

```output
3n
```

## Records

A record is a type with one constructor:

```bend
import Base

type Point is Data:
  Point{x: U32, y: U32}

def translate(p: Point) -> Point:
  match p:
    case Point{x, y}:
      Point{(x + 1 : U32), (y + 2 : U32)}

def main() -> Point:
  translate(Point{3, 4})
```

```output
Point{4, 6}
```

`match` consumes `p` and binds its fields. The result is a new `Point`. Nothing is mutated.

## Recursion and the termination rule

Bend repeats work by recursion, and every recursive call must be checked to terminate. The rule: a recursive call reads its arguments from left to right, and each argument must be passed unchanged until one of them is a smaller part of its parameter. Put the argument that shrinks first.

```bend
import Base

def sum(xs: List<U32>, acc: U32) -> U32:
  match xs:
    case Nil{}:
      acc
    case Con{head, tail}:
      sum(tail, (acc + head : U32))

def main() -> U32:
  sum([1, 2, 3, 4], 0)
```

```output
10
```

`tail` is a smaller part of `xs`, which the `match` exposed, and `xs` is the first argument. The accumulator changes freely because it comes after the shrinking argument.

Counting with a machine integer does not work, because subtraction gives the checker no structural evidence. Count with a `Nat` and match its predecessor. The parameter often called *fuel* bounds a loop that the outside world decides when to stop:

```bend
import Base

def count_down(fuel: Nat, acc: U32) -> U32:
  match fuel:
    case 0n:
      acc
    case 1n+remaining:
      count_down(remaining, (acc + 1 : U32))

def main() -> U32:
  count_down(5n, 0)
```

```output
5
```

A recursive call that passes its input unchanged is rejected:

```bend
import Base

def loop(n: Nat) -> Nat:
  loop(n)

def main() -> Nat:
  loop(1n)
```

```error
- expected : a decreasing self-call
```

Mutual recursion is not allowed in a safe definition. Merge the two functions into one, with an extra argument that selects which branch to run. Chapter 11 covers the `@unsafe` escape hatch and why a law must never depend on it.

## Matching in depth

Patterns nest. This one inspects the second element of a list:

```bend
import Base

def second(xs: List<U32>) -> U32:
  match xs:
    case Nil{}:
      0
    case Con{h, Con{k, rest}}:
      k
    case Con{h, Nil{}}:
      h

def main() -> U32:
  second([4, 9, 7])
```

```output
9
```

`match` can take several scrutinees, and `_` matches anything:

```bend
import Base

def both(a: Nat, b: Nat) -> Nat:
  match a b:
    case 0n 0n:
      0n
    case 0n 1n+q:
      1n+q
    case 1n+p 0n:
      1n+p
    case 1n+p 1n+q:
      Nat.add(p, q)

def first_or_zero(a: Nat, b: Nat) -> Nat:
  match a b:
    case 0n _:
      0n
    case 1n+p _:
      1n+p

def main() -> Nat & Nat:
  (both(3n, 4n), first_or_zero(5n, 7n))
```

```output
(5n, 5n)
```

Three rules govern every `match`:

1. The scrutinee is a parameter or a variable bound by an earlier pattern. `match U32.is_eq(1, 1):` is rejected (chapter 01).
2. Matches are exhaustive. This one omits `False{}`:

```bend
import Base

def pick(b: Bool) -> U32:
  match b:
    case True{}:
      1
```

```error
- expected : cases for False
```

3. Scrutinees follow binder order. A `let` cannot come before a `match` on a parameter.

## Absence without null: Maybe

Bend has no null. A value that may be missing has type `Maybe<&2, A>`: `None{}` means no value, and `Some{x}` wraps one.

```bend
import Base

def add_strings(a: String, b: String) -> Maybe<&2, U32>:
  do Maybe<&2, U32>:
    x : U32 <- U32.read(a)
    y : U32 <- U32.read(b)
    return (x + y : U32)

def main() -> Maybe<&2, U32>:
  add_strings("40", "2")
```

```output
Some{42}
```

Inside `do Maybe<&2, U32>:`, the first `None` ends the block with `None`, as the guide describes. `Maybe.default` turns the result back into a plain value:

```bend
import Base

def add_strings(a: String, b: String) -> Maybe<&2, U32>:
  do Maybe<&2, U32>:
    x : U32 <- U32.read(a)
    y : U32 <- U32.read(b)
    return (x + y : U32)

def main() -> U32:
  Maybe.default(&2, U32, add_strings("40", "oops"), 0)
```

```output
0
```

A division that refuses to divide by zero uses the helper pattern from chapter 01: the helper matches its own parameter. `b` is marked `+` because the function uses it twice:

```bend
import Base

def pick_div(zero: Bool, a: Nat, b: Nat) -> Maybe<&2, Nat>:
  match zero:
    case True{}:
      None{}
    case False{}:
      Some{Nat.div(a, b)}

def safe_div(a: Nat, +b: Nat) -> Maybe<&2, Nat>:
  pick_div(Nat.is_eq(b, 0n), a, b)

def main() -> Maybe<&2, Nat>:
  safe_div(10n, 3n)
```

```output
Some{3n}
```

## Imports and modules

An import gives a file a name. The alias is local to the importing file:

**numbers.bend**

```bend file=numbers.bend
import Base

def three() -> Nat:
  3n
```

**main.bend**

```bend file=main.bend run
import Base
import ./numbers.bend as Numbers

def main() -> Nat:
  Numbers.three()
```

```output
3n
```

`import Base` needs no alias. Imports come before definitions in a file.

## Definition order

Bend checks each definition against the definitions above it. Calling a function written below it is an error:

```bend
import Base

def main() -> U32:
  answer()

def answer() -> U32:
  42
```

```error
- expected : a defined name
```

Move `answer` above `main` and the program checks. Datatypes follow a related rule. In `bend 2.0.25`, a constructor field may only name a type that is already defined above it:

```bend
import Base

type Outer is Data:
  Wrap{inner: Inner}

type Inner is Data:
  Leaf{n: Nat}

def main() -> Nat:
  0n
```

```error
- expected : a defined name
```

The bend2.dev guide says datatypes may appear in any order. The compiler we checked does not allow it, so define the inner type first.

## Exercises

**1. Length of a list.** Write `length(xs)` that returns the number of elements as a `Nat`. The head is not needed, and an unused binder is dropped without any annotation.

```bend
import Base

def length(xs: List<U32>) -> Nat:
  match xs:
    case Nil{}:
      0n
    case Con{head, tail}:
      1n+length(tail)

def main() -> Nat:
  length([1, 2, 3, 4])
```

```output
4n
```

**2. Largest element.** Write `max_of(xs, best)` that folds a list and keeps the larger of each element and the running best. Use `U32.max`, which is in Base.

```bend
import Base

def max_of(xs: List<U32>, best: U32) -> U32:
  match xs:
    case Nil{}:
      best
    case Con{head, tail}:
      max_of(tail, U32.max(head, best))

def main() -> U32:
  max_of([3, 9, 4], 0)
```

```output
9
```

## Next

Chapter 03 explains why a plain binder can be used only once, and what `+` costs.
