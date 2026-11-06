---
title: "Bend 2 tutorial 01: first programs"
description: "Install Bend 2, learn the four ways to run a file, and write functions, let bindings, Bool matching, numbers, strings, tuples, and lists that the checker accepts."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/01-first-programs/
sources:
  - https://bend2.dev/learn/hello/
  - https://bend2.dev/learn/functions/
  - https://bend2.dev/learn/numbers/
  - https://bend2.dev/notes/bend2-syntax-primer/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 01: first programs

Every program in this tutorial was checked with `bend 2.0.25`. Blocks marked `output` show what the compiler printed. Blocks marked `error` show the checker rejecting a program, and the lines are the real messages.

## Install and check the toolchain

```sh
curl -fsSL https://bend-lang.com/install.sh | sh
bend version
bend guide
```

`bend version` prints the compiler version. `bend guide` prints the language reference that ships with the compiler, and `bend base` prints the standard library. Read the guide before you write Bend code: it is short and it is the authority.

`bend update` installs the latest compiler. The bend2.dev examples are checked against 2.0.36, which has the `--verdict` option. Version 2.0.25 does not have it, and chapter 07 explains what that option needs.

## The four ways to run a file

| Command | What it does |
|---------|--------------|
| `bend file.bend` | Checks the file, then runs `main`. An `IO` `main` runs compiled; a pure `main` is evaluated by the checker, which is slow for big work. |
| `bend file.bend --check-only` | Checks the file and its imports, and runs nothing. Use it after every definition. |
| `bend file.bend -o file` | Builds a native binary with clang 14 or later. Then run `./file --threads 8`. |
| `bend file.bend -o file.c` | Emits one C file. `-o file.js` emits JavaScript instead. |

Two options matter for the binaries: `--threads N` sets the number of CPU threads, and `--gpu off` runs `!` calls on the CPU.

## Hello, world

```bend
import Base

def main() -> IO(Unit):
  do IO<Unit>:
    IO.print("Hello, world!")
```

```output
Hello, world!
```

- `import Base` loads the prelude. Every program in this tutorial starts with it.
- `def main() -> IO(Unit):` declares the entry point. `IO(Unit)` is an effect that returns `Unit`, the type with one value `Unit{}`. In Haskell, this is `main :: IO ()`.
- `do IO<Unit>:` opens a block whose lines run in order, like Haskell's `do`.
- `IO.print` is an effect defined in Base.

## Functions

```bend
import Base

def square(+x: U32) -> U32:
  (x * x : U32)

def main() -> U32:
  square(7)
```

```output
49
```

- Parameter types follow `:`, and the result type follows `->`.
- The last expression is the result. There is no `return`.
- Every operator needs an annotation, even on `Nat`: `(n + 1n : Nat)`. One annotation can cover a whole expression of one type, as in `(x * x * x : U32)`. A bare `x * x` is rejected, as the next example shows. The bundled guide (`bend guide`) still says a bare operator means `Nat`; the 2.0.25 checker rejects that. An annotation covers only the operators inside its own parentheses: in `(U32.add(a + b, 1) : U32)`, the `a + b` needs its own annotation. Chapter 12 lists every rule of this kind.
- `+x` makes the parameter reusable, because `x` appears twice. Chapter 03 explains why plain parameters can be used only once.

```bend
import Base

def add(x: U32, y: U32) -> U32:
  x + y

def main() -> U32:
  add(40, 2)
```

```error
- message  : a type for this operator (write (a + b : Nat))
```

In Haskell, `square :: Word32 -> Word32` and `square x = x * x` would compile without any annotation. Bend asks for the annotation because it does almost no type inference, and that keeps its error messages precise.

## Reading `:`, `->`, and `=`

Three marks do most of the work:

- `name: Type` says *has type*. It appears in parameters, constructor fields, and `for` binders.
- `(expr : Type)` *annotates* an expression, and `{term : Type}` annotates one term, as in `{12 : U32}`. Bend does almost no inference, so you write the type where the checker needs it.
- A `:` at the end of a line *opens a block*: a body, a `case`, a `do`, or a `law`.
- `->` separates the parameters from the result type. `=` binds a value. A `:` never means "equals".

A signature reads from left to right:

```bend
import Base

def greet(name: String) -> IO(String):
  do IO<String>:
    return "Hello, " ++ name
```

- `name: String` gives the parameter `name` its type.
- `-> IO(String)` gives the result: an effect that returns a `String`.
- The final `:` opens the body. The `do IO<String>:` header is a separate form, with angle brackets. Chapter 12 lists the rules for both.

## Let bindings

```bend
import Base

def main() -> U32:
  +price = {12 : U32}
  tax = {3 : U32}
  (price + price + tax : U32)
```

```output
27
```

- `tax = {3 : U32}` binds a value used once.
- `+price = {12 : U32}` binds a value that the body uses twice.
- Inside a `do` block, a let needs its type, as in `n : U32 = (6 * 7 : U32)`. Chapter 09 covers `do`.

### Why a let needs a type

A `let` has no type to take from, and Bend does no inference, so a bare literal is rejected:

```bend
import Base

def main() -> U32:
  +price = 12
  (price + price : U32)
```

```error
- expected : an annotated term (cannot infer)
```

The fix is an annotation, `{12 : U32}`. That is not a constructor: a constructor has a name in front of its braces, as in `Tok{3n}` (chapter 02). Braces with no name hold one term and its type.

### Braces or parentheses

Braces annotate one term, such as `{12 : U32}` or `{x : U32}`. An operator needs parentheses, so that the annotation covers it:

```bend
import Base

def main() -> U32:
  {6 * 7 : U32}
```

```error
- message  : a type for this operator (write (a * b : Nat))
```

Write `(6 * 7 : U32)` instead. The parentheses only group and annotate. They do not delay the work: Bend is strict, so the term runs when its definition runs (chapter 12, section 11).

## Conditionals: match, not if

Bend has no `if`. You branch with `match` on `True{}` and `False{}`, and the scrutinee must be a parameter, not a computed call:

```bend
import Base

def choose(test: Bool, yes: U32, no: U32) -> U32:
  match test:
    case True{}:
      yes
    case False{}:
      no

def main() -> U32:
  choose(U32.is_lt(3, 5), 10, 20)
```

```output
10
```

The computed comparison `U32.is_lt(3, 5)` is passed to `choose`, and `choose` matches its own parameter. Matching the call directly is rejected:

```bend
import Base

def main() -> U32:
  match U32.is_eq(1, 1):
    case True{}:
      1
    case False{}:
      0
```

```error
- message  : a parameter or field scrutinee (a match cannot scrutinize a computed value: give it its own def)
```

## Numbers

Bend has three numeric types. `Nat` is an unbounded natural, written with an `n` suffix (`3n`). `U32` is a 32-bit unsigned integer, and its arithmetic wraps. `F32` is a 32-bit float. This chapter uses `Nat` and `U32`.

```bend
import Base

def main() -> String:
  n = Nat.add(20n, 22n)
  w = (6 * 7 : U32)
  Nat.show(n) ++ " / " ++ U32.show(w)
```

```output
"42 / 42"
```

`Nat` patterns use `0n` and `1n+p`, where `p` is the predecessor (chapter 02). `U32` wraps at 2^32:

```bend
import Base

def main() -> U32:
  (4294967295 + 1 : U32)
```

```output
0
```

`F32` values print as written in a checked program (`1.5`). `F32` arithmetic, however, is declared in Base as a law, so the checker shows `F32.mul(1.5, 2.0)` as an unevaluated term. A native build computes it, and `IO.print(F32.show(F32.mul(1.5, 2.0)))` prints `3`.

## Strings, tuples, and lists

Strings join with `++`. `String.length` returns a `Nat`:

```bend
import Base

def main() -> IO(Unit):
  text = String.to_upper("bend")
  IO.print(text ++ " " ++ Nat.show(String.length("proof")))
```

```output
BEND 5
```

A pair has type `A & B` and value `(a, b)`:

```bend
import Base

def sum(pair: U32 & U32) -> U32:
  match pair:
    case (a, b):
      (a + b : U32)

def main() -> U32:
  sum((19, 23))
```

```output
42
```

A list is `Nil{}` or `Con{head, tail}`, and `[5, 10, 15]` builds one:

```bend
import Base

def sum(xs: List<U32>) -> U32:
  match xs:
    case Nil{}:
      0
    case Con{head, tail}:
      (head + sum(tail) : U32)

def main() -> U32:
  sum([5, 10, 15])
```

```output
30
```

The list in that example is consumed as the function walks it. Chapter 03 explains which lists can be reused and how `List<&2, U32>` changes that.

## Exercises

**1. Double and add.** Write `double_plus` so that it returns `2a + b`. The parameter `a` is used twice, so it needs `+`. Then `main` should print `25`.

```bend
import Base

def double_plus(+a: U32, b: U32) -> U32:
  (a + a + b : U32)

def main() -> U32:
  double_plus(10, 5)
```

```output
25
```

**2. A label from a comparison.** Write `label(n)` that returns `"small"` when `n < 10` and `"big"` otherwise. Remember that `match` cannot inspect `U32.is_lt(n, 10)` directly, so pass it to a helper.

```bend
import Base

def pick(test: Bool) -> String:
  match test:
    case True{}:
      "small"
    case False{}:
      "big"

def label(n: U32) -> String:
  pick(U32.is_lt(n, 10))

def main() -> String:
  label(42)
```

```output
"big"
```

## Next

Chapter 02 covers data types, records, recursion and its termination rule, nested patterns, imports, and definition order.
