---
title: "Bend 2 tutorial 12: syntax reference"
description: "The Bend 2 language on one sheet: the three layers (kinds, types, values), erasure and quantities, every syntax form, constructors, laws and proofs, evaluation, and the checker's messages for the common mistakes."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/12-syntax-reference/
sources:
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 12: syntax reference

This page is the language on one sheet. Read sections 1 and 4 once, then use the tables as a lookup. Blocks marked `bend` are checked by the tutorial gate with `bend 2.0.25`. The table rows were also run with that compiler when this page was written, except the forms that section 13 lists as not run. Section 12 gives the checker's exact messages for the common mistakes.

## 1. The model

Three layers. Each one classifies the layer below it.

| Layer | Classifies | Examples |
|---|---|---|
| **Kind** | types | `Type` (`Kind(&1)`: used at most once), `Data` (`Kind(&2)`: copied with `+`) |
| **Type** | values | `Nat`, `U32`, `Shape`, `U32 -> U32`, `Maybe<&2, Nat>`, `Array<U32>`, `IsZero(n)` |
| **Value** | the bottom layer | `6n`, `Point{}`, `(1, 2)`, `[1, 2]`, `x => e`, `[0 : U32*8n]` |

Types are terms, so a definition can return one. The guide splits a program in two. *Live* code runs. *Dead* code is types, erased arguments and proofs: the checker reads it, and the compiled program never runs it.

```bend
import Base

def twice(+n: Nat) -> Nat:
  Nat.add(n, n)

def identity(-A: Type, x: A) -> A:
  x

def main() -> Nat:
  identity(Nat, twice(3n))
```

```output
6n
```

In that call, `identity` is code. `Nat` is an erased argument, so the compiled program never receives it. `twice(3n)` is a value computed at run time.

## 2. Declarations

| Form | Meaning |
|---|---|
| `import Base` | the prelude; every file starts with it |
| `import ./m.bend as M` | the definitions of `m.bend` are named `M.x` |
| `type T is Data:` | a datatype whose values may be reused; `is Type` makes it affine |
| `type D<a, -A: Kind(a)> is Kind(a):` | a datatype whose kind comes from a parameter; one constructor per line, as `K{x: A}` |
| `def f(x: A, -y: B, +z: C) -> T:` | a definition: `x` is used at most once, `-y` is erased, `+z` is reusable; the body follows the `:` |
| `def t(~g: A -> B, x: A) -> B:` | a template parameter; template parameters come first |
| `law f:` with `def f(x):` | a claim, and its proof: a def with the same name |
| `@unsafe def f(...)` | skips the termination check; no law may depend on it |
| `def e(x: A) -> IO(B):` with `import "./e.c"` | a foreign effect built from a host file (section 13) |

```bend
import Base

type Box<a, -A: Kind(a)> is Kind(a):
  Box{value: A}

def unbox(a, -A: Kind(a), b: Box<a, A>) -> A:
  match b:
    case Box{value}:
      value

def main() -> U32:
  unbox(&1, U32, Box{7})
```

```output
7
```

## 3. Marks and punctuation

| Mark | Meaning | Example |
|---|---|---|
| `name: T` | has type: a parameter, a field, a `for` binder | `x: U32` |
| `(e : T)` | annotates an expression; covers the operators inside its own parentheses | `(a + b : U32)` |
| `{t : T}` | annotates one term: a literal, a name or a constructor | `{12 : U32}`, `{Tok{3n} : Tok}` |
| `K{...}` | a constructor (ctor); the brace touches the name | `Segment{3n}` |
| `{a == b : T}` | equality: a proposition | `{Nat.add(x, 0n) == x : Nat}` |
| `{a != b : T}` | negated equality, the same as `{a == b : T} -> Empty` | `{1n != 0n : Nat}` |
| `{==}` | reflexivity: proves an equality when both sides compute to one term | |
| `->` | separates the parameters from the result type | |
| `=` | binds a value; a `:` never means equals | `x = v` |
| `<-` | binds the result of an effect inside `do` | `x : T <- m` |
| a line ending in `:` | opens a block: a body, a `case`, a `do`, a `law`, a `type` | |
| `#` | a comment to the end of the line | |
| `?name`, `?TODO` | a hole: `?name` shows the goal; `?TODO` leaves it open | |

- A name directly before braces makes a constructor. Braces with no name make an annotation (`:`), an equality (`==`), or a proof (`{==}`).
- No space goes between a constructor and its braces. `Some{4n}` is a constructor, and `Some {4n}` is rejected.
- Operators need a space on each side: `a + b`, not `a+b`.
- `==` appears only in types. Compare values with `U32.is_eq(a, b)`.
- Signatures write `IO(A)` and `Chan(A)` with parentheses, and datatypes with angle brackets, as in `Maybe<&2, Nat>`. A `do` header takes angle brackets: `do IO<Unit>:`.

## 4. Kinds, quantities, and erasure

| Form | Meaning |
|---|---|
| `Type` = `Kind(&1)` | affine: a value may be used at most once |
| `Data` = `Kind(&2)` | reusable: `+` may copy a value of this kind |
| `Kind(a)` | the kind is a parameter, with `a` equal to `&1` or `&2`. The guide also lists `&0`; this tutorial does not use it |
| `a <&> b` | the smaller of two quantities, which a type holding two element types takes (from the guide; not run here) |
| `is Data`, `is Type` | the kind of a declared type |
| `List<U32>` = `List<&1, U32>`; `+List<U32>` = `List<&2, U32>` | `+` in front of a type gives the reusable form |
| `-x` | erased: exists only for the checker, appears only in types and proofs, and is deleted |
| `x` | affine: used at most once; dropping it is free |
| `+x` | reusable: the type must be `Data` |
| `~f` | template: code substituted at compile time; its argument is closed; one copy per distinct argument |
| `f(Nat, ...)` | an erased argument is passed explicitly, with no marker at the call |
| `a` in a parameter list | short for `-a: Quant` |

```bend
import Base

def replicate(-A: Data, n: Nat, +x: A) -> List<A>:
  match n:
    case 0n:
      Nil{}
    case 1n+p:
      x <> replicate(A, p, x)

def main() -> List<U32>:
  replicate(U32, 3n, 7)
```

```output
[7, 7, 7]
```

```bend
import Base

def dup_k(-A: Kind(&2), +x: A) -> A & A:
  (x, x)

def main() -> Nat & Nat:
  dup_k(Nat, 6n)
```

```output
(6n, 6n)
```

`replicate` mixes three kinds of parameter. `-A` is erased, `n` is affine, and `+x` is reusable because each step uses `x` twice. `<>` puts the head in front of the rest.

- A `Type` argument is written at the call: `identity(U32, 42)`. Bend infers no type arguments (section 12).
- `+` needs `Data`. A function is a `Type` and cannot be copied, so pass a template `~f` instead (chapter 03).
- An erased argument does not reach the compiled program. Compile the same program with `-A` and without it, and compare the C: the version without `-` passes the type in and drops it (chapter 03).

## 5. Types

| Form | Meaning |
|---|---|
| `Nat`, `U32`, `F32`, `Bool`, `Char`, `String` | base types; a `Nat` literal ends in `n`, as in `3n` |
| `Unit`, `Empty` | one value, `Unit{}`; no value |
| `A -> B` | a function, which is a `Type`, so a closure is affine |
| `@x: A -> B` | a dependent function: `B` may name `x` |
| `@-x: A -> B` | a dependent function whose argument is erased |
| `A & B` | a pair |
| `&x: A -> B` | a dependent pair: `B` may name the first component `x` |
| `A \| B` | a sum: `Inl{a}` or `Inr{b}` |
| `D<A>`, `D<&2, A>` | a datatype applied to arguments |
| `Array<A>` | a one-owner array, which is a `Type` |
| `IO(A)`, `Chan(A)` | an effect that returns `A`; a channel of `A` |
| `Result<&1, &1, E, A>` | a fallible result: error `E`, value `A` |
| `{a == b : T}`, `{a != b : T}` | equality and its negation: propositions |
| a def that returns `Type` | a type computed from values, such as `IsZero(n)` |

```bend
import Base

def IsZero(n: Nat) -> Type:
  match n:
    case 0n:
      Unit
    case 1n+p:
      Empty

def needs_ne(e: {1n != 0n : Nat}) -> Nat:
  1n

def require_zero(n: Nat, e: IsZero(n)) -> Nat:
  n

def main() -> Nat:
  require_zero(0n, Unit{})
```

```output
0n
```

```bend
import Base

def pick(b: Bool) -> U32 | Bool:
  match b:
    case True{}:
      Inl{4}
    case False{}:
      Inr{False{}}

def main() -> U32 | Bool:
  pick(False{})
```

```output
Inr{False{}}
```

## 6. Terms and values

| Form | Meaning | Example |
|---|---|---|
| `42`, `1.5`, `3n`, `'c'`, `"s"` | literals: `U32`, `F32`, `Nat`, `Char`, `String` | `(6 * 7 : U32)` |
| `K{a, b}` | a constructor applied: `Ctor(K, [a, b])` | `Segment{3n}` |
| `(a, b)` | a pair | `(19, 23)` |
| `[a, b]` | a list: `Con{a, Con{b, Nil{}}}` | `[5, 10, 15]` |
| `h <> t` | a head placed in front of a list | `x <> replicate(A, p, x)` |
| `x => e` | a lambda: a closure, which is affine | `x => (x + 1 : U32)` |
| `+x => e` | a lambda whose binder is reusable | `+y => (y + y : U32)` |
| `f(a, b)` | a call | `twice(3n)` |
| `f!(a)` | a call on the GPU, with the parallel calls inside it; the CPU on a machine without a GPU | `pow2!(12n)` |
| `t(~g, a)` | a call with a template argument | `twice(~inc, 40)` |
| `(e : T)`, `{t : T}` | an annotated term | `+t = {Tok{3n} : Tok}` |
| `[v : T*n]` | an array of `n` slots; `n` is a power of two | `[0 : U32*8n]` |
| `[v : T^d]` | an array of `2^d` slots | `[0 : U32^3n]` |
| `a[i]`, `a[i] <- v` | a read returns the array with the element; a write returns the array. Indexes wrap | `a[9]` on eight slots is `a[1]` |

```bend
import Base

def inc(x: U32) -> U32:
  (x + 1 : U32)

def twice(~f: U32 -> U32, x: U32) -> U32:
  f(f(x))

def main() -> U32:
  twice(~inc, 40)
```

```output
42
```

```bend
import Base

def value(r: Array<U32> & U32) -> U32:
  match r:
    case (array, item):
      item

def main() -> U32:
  a = [0 : U32*8n]
  a[9] <- 7
  value(a[1])
```

```output
7
```

- A constructor takes its type from its context. In a `let` with no context, annotate it: `+t = {Tok{3n} : Tok}` (chapter 03).
- The braces after a constructor name hold its fields in a `type` (`Segment{length: Nat}`), its arguments in a term (`Segment{3n}`), and its binders in a pattern (`case Segment{length}:`) (chapter 02).
- There is no `if`. Branch with `match` on `True{}` and `False{}` (chapter 01).

## 7. Statements and matching

| Form | Meaning |
|---|---|
| `x = v` | a `let`: affine |
| `+x = v` | a reusable `let`: the type must be `Data` |
| `-x: T = v` | an erased `let`: the type is required |
| `x: T = v` | a typed `let`: required inside `do` |
| `(a, b) = v`, `K{x, y} = v` | a destructuring `let` |
| `a b = f(x) g(y)` | parallel calls: both start, and the line continues when both finish |
| `match x:`, `match a b:` | match on parameters, or on variables bound by a pattern; never on a computed call |
| `case K{x}:`, `case 1n+p:`, `case _ _:` | patterns; `_` matches anything; a case body may sit on the same line |
| `case K{+r}:` | a field bound with `+` is reusable; a plain field binder is affine, so a second use is rejected |
| `do M<xs, R>:` | a monadic block (section 10) |

```bend
import Base

type Pt is Data:
  Pt{x: U32, y: U32}

def sum_pt(p: Pt) -> U32:
  Pt{x, y} = p
  (x + y : U32)

def swap(p: U32 & U32) -> U32 & U32:
  (a, b) = p
  (b, a)

def main() -> U32 & U32:
  swap((sum_pt(Pt{3, 4}), 0))
```

```output
(0, 7)
```

- A recursive call must make a smaller argument. Arguments are read left to right, and each is passed unchanged until one of them is a smaller part. Otherwise the checker prints `expected : a decreasing self-call` (chapter 02).
- `@unsafe` turns that check off, and section 9 says what that costs.

## 8. Operators

| Form | Operand type | Example |
|---|---|---|
| `+ - * / %` | the `T` in the annotation | `(a * b : U32)` |
| `.&.` `.\|.` `.^.` | the `T` in the annotation | `(6 .\|. 1 : U32)` |
| `<<` `>>` | the `T`; the shift count is a `Nat` | `(1 << 3n : U32)` |
| `<` `<=` `>` `>=` | the `T`; the result is `Bool` | `(a <= b : U32)` |
| `&&` `\|\|` | `Bool` | `(False{} \|\| True{})` |
| `++` | `String` | `"ab" ++ "c"` |
| `T.is_eq(a, b)` | value equality | `U32.is_eq(a, b)` |

```bend
import Base

def le(a: U32, b: U32) -> Bool:
  (a <= b : U32)

def main() -> U32 & U32 & U32 & U32 & Bool:
  ((6 .|. 1 : U32), (1 << 3n : U32), (8 >> 2n : U32), (7 % 2 : U32), le(3, 5))
```

```output
(7, 8, 2, 1, True{})
```

- Each operator needs an annotation. `(a + b : U32)` covers the operators in its own parentheses. A call's arguments start a new group, so `(U32.add(a + b, 1) : U32)` is rejected (section 12).
- Braces annotate one term. `{12 : U32}` is fine, but `{6 * 7 : U32}` is rejected, so write `(6 * 7 : U32)`.
- A bare operator is rejected. The guide says it means `Nat`, but 2.0.25 rejects it, so write `(n + 1n : Nat)`.

## 9. Laws, proofs, and properties

A law is a claim, and a def of the same name is its proof. The proof of `add_zero` splits the cases of `x`, uses reflexivity in each, and rewrites with the induction hypothesis.

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

| Form | Meaning |
|---|---|
| `law f:` | a claim; its binders and the claim follow, indented |
| `for x: T` | a universal binder; `for +x: T` makes it reusable |
| `for y: B where P(y)` | `y` is a pair: the value and a proof of `P(y)` |
| `exs z: T` | a witness: the proof returns `(z, proof)` |
| `def f(x):` | the proof of law `f`: a def with the same name |
| `def M.f(x):` | the proof of a law `f` imported from module `M` (chapter 15) |
| `match x:` in a proof | case analysis: each case is a goal |
| `{==}` | proves an equality when both sides compute to one term |
| `%e : P` | rewrites the goal with the equation `e`; the next line continues the proof |
| `%e@E : P` | a named rewrite (guide): the binder before `@` is one name (section 12). This tutorial has no working example |
| `?name`, `?TODO` | a hole (section 3) |

Properties the checker guarantees:

- A law with no def is an open claim. A hole is open too: `?TODO` makes `bend PROOF.bend` print `Error: 1 TODO found.` and refuse the file.
- A false law fails the gate. The gate prints `All terms check.` only when every law has a proof that checks (chapters 07 and 15).
- A safe recursive def terminates, because each recursive call shrinks an argument (section 7). `@unsafe` is outside these guarantees, so no law may depend on it (chapter 08).
- A plain value is used at most once. A second use is an error, `consumed more than once`.
- An erased value is deleted before the program runs (section 4).
- A call computes its arguments first (section 11).
- Nothing is inferred, so type arguments, `let` types and operator types are written (section 12).

## 10. Effects and do

| Form | Meaning |
|---|---|
| `IO(A)` | an effect that returns `A` |
| `do IO<A>:` | a block; its header takes angle brackets |
| `x : A <- m` | runs the effect `m` and names its result, with type `A` |
| `m` | a line that runs an effect whose result is `Unit` |
| `return v` | ends the block with a pure value. The last line is a `return` or an effect; a bare term is rejected |
| `IO.print(s)`, `IO.args()`, `IO.get_env(k)` | print a string; the command-line arguments; an environment variable, as a `Result` |
| `IO.die(-A, code, msg)` | ends the program with an exit code and a message |
| `IO.fork(A, m)`, `IO.join(A, c)` | start `m` in the background and get a channel for its result; wait for that result |
| `IO.spawn(A, m)` | starts `m` and does not wait for it |
| `Chan.new(A, n)`, `Chan.send(A, c, v)`, `Chan.recv(A, c)`, `Chan.close(A, c)` | a channel of `A` with room for `n` values; `Chan.recv` answers a `Maybe`, and `None{}` once the channel is closed |

```bend
import Base

def greet(name: String) -> IO(String):
  do IO<String>:
    return "Hello, " ++ name

def main() -> IO(Unit):
  do IO<Unit>:
    text : String <- greet("Ada")
    n: U32 = (6 * 7 : U32)
    IO.print(text ++ " " ++ U32.show(n))
```

```output
Hello, Ada 42
```

## 11. Evaluation: Bend is strict

- A compiled Bend program is strict: a call computes its arguments before its body runs. A native build of `first(1n, spin(0n))`, where `spin` loops forever and `first` ignores its second argument, did not finish under `timeout 20`. With `0n` in place of `spin(0n)`, it printed `1` at once.
- The checker does not show evaluation order. `bend file.bend` normalises a pure `main`, so judge the order with a native build under `timeout`.
- To keep work unevaluated, use one of three forms: a lambda (`x => ...`), whose body runs when it is applied; a template (`~f`), which is substituted at compile time; or data that `eval` interprets, as below.
- Parentheses and annotations delay nothing. Tail calls compile to loops, and the runtime has no C stack: each definition is a segment of a flat state machine, and a call is a jump (the guide; chapter 05).

```bend
import Base

type Expr is Data:
  Lit{n: Nat}
  Add{a: Expr, b: Expr}

def eval(e: Expr) -> Nat:
  match e:
    case Lit{n}:
      n
    case Add{a, b}:
      Nat.add(eval(a), eval(b))

def twice(~f: U32 -> U32, x: U32) -> U32:
  f(f(x))

def main() -> U32 & Nat & U32:
  later: U32 -> U32 = x => (x + 1 : U32)
  program : Expr = Add{Lit{2n}, Lit{3n}}
  (later(41), eval(program), twice(~(x => (x + 1 : U32)), 40))
```

```output
(42, 5n, 42)
```

## 12. Rejected forms

Each row is a program the checker rejects. The message is the checker's own, and the right column is the fix.

| Wrong | The checker says | Right |
|---|---|---|
| `(a+b : U32)` | `expected : '='`, `observed : ':'` | `(a + b : U32)` |
| `x + y` with no annotation | `a type for this operator (write (a + b : Nat))` | `(x + y : U32)` |
| `{6 * 7 : U32}` | `a type for this operator (write (a * b : Nat))` | `(6 * 7 : U32)` |
| `(a == b)` | `expected : ')'`, `observed : '='` | `U32.is_eq(a, b)` |
| `price = 12` | `expected : an annotated term (cannot infer)` | `price = {12 : U32}` |
| `-n = 3n` | `expected : an annotated term (cannot infer)` | `-n: Nat = 3n` |
| `x = 3` inside `do` | `expected : a pattern (a binder or a constructor)` | `x : U32 = 3` |
| `do IO(Unit):` | `expected : '<'`, `observed : '('` | `do IO<Unit>:` |
| `-> IO<Unit>` | `a declared datatype (unknown: IO)` | `-> IO(Unit)` |
| `-> Maybe(&2, Nat)` | `expected : a family instance (write Maybe<..>)` | `-> Maybe<&2, Nat>` |
| `Some(4n)` | `expected : a defined name`, `observed : Some` | `Some{4n}` |
| `Some {4n}` | `expected : 'def', 'type' or 'law'`, `observed : '{'` | `Some{4n}` |
| `use(+f: U32 -> U32)` | `expected : Data`, `observed : Type` | a plain `f: U32 -> U32` used once, or a template `~f` |
| `+t` on a `type Token is Type:` | `expected : Data`, `observed : Type` | declare `type Token is Data:` |
| `identity(42)` with `-A: Type` | `expected : Type`, `observed : U32` | `identity(U32, 42)` |
| `bad(-A: Type, x: A) -> A` returning `A` | `expected : A`, `observed : Type` | return `x` |
| `f(f(x))` with `f: U32 -> U32` | `expected : f`, `observed : f (consumed more than once)` | a template `~f` |
| a template argument that uses a local `k` | `a template applied to closed ~ arguments (k is a variable here, not comptime: pass it at run time)` | a top-level definition, as in `~inc` |
| `match U32.is_eq(1, 1):` | `a parameter or field scrutinee (a match cannot scrutinize a computed value: give it its own def)` | pass the call to a def and match its parameter |
| `[0 : U32*6n]` | `a power of two count (^d takes a depth)` | `[0 : U32*8n]` or `[0 : U32^3n]` |
| a `do` block that ends in `(6 * 7 : U32)` | `observed : U32` | end with `return v` or an effect |
| `loop(n)` calling itself with the same `n` | `expected : a decreasing self-call` | a call on a smaller part |
| `ih = add_zero(p)` in a proof, then `{==}` | `expected : 1n+Nat.add(p, 0n)`, `observed : 1n+p` | `%add_zero(p) : {1n+Nat.add(p, 0n) == 1n+_ : Nat}` |
| `%add_zero(p)@ih : P` | `expected : a name before @ (a rewrite binder is one name: %e@E : P)` | `%add_zero(p) : P` |
| `?goal` in a case | `expected : {0n == 0n : Nat}`, `observed : ?goal` | fill the case with the goal, as `{==}` |
| `?TODO` left in a proof | `Error: 1 TODO found.` | a complete proof |
| a `where` pair used as a `Nat` | `expected : Nat`, `observed : Sigma<&1, &1, Nat, n => IsNonZero(n)>` | the claim must treat `n` as the pair; this tutorial does not show reading its value |

## 13. Not run here

- Foreign effects (`import "./e.c"`, `import "./e.js"`) need host files. `bend guide effects` describes them.
- `bend main.bend --publish`, `bend page.html -o dist`, and `import 0x<hash>/main.bend as P` need the package hub or the web bundler.
- A working named rewrite `%e@E : P`, and a `where` binder whose claim reads its value out of the pair (section 12).
- GPU timing: the lab machine has no GPU, so `!` runs on the CPU here.
- The `a <&> b` quantity combinator, which the guide describes and this page does not run.

## Next

Chapter 13 maps these terms onto Haskell and OCaml. Chapter 15 uses the forms from this page in one complete program.
