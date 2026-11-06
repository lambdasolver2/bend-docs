---
title: "Bend 2 tutorial 13: glossary for Haskell and OCaml programmers"
description: "Bend 2 terms with their Haskell and OCaml counterparts, and the differences that matter: affine binders, explicit kinds, checked laws, interaction nets, and the runtime."
updated: 2026-10-18
verified: 2026-10-18
status: docs-only
canonical: /tutorial/13-glossary/
sources:
  - https://bend2.dev/learn/
  - https://bend2.dev/notes/bend2-vs-lean/
  - https://bend2.dev/notes/interaction-nets-explained/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 13: glossary for Haskell and OCaml programmers

Each row says what a Haskell or OCaml programmer would reach for first, and what Bend 2 does with the same idea. The last column flags a difference that will change how you write code.

## Concepts you already know

| You know (Haskell / OCaml) | Bend 2 | Difference that matters |
|----------------------------|--------|-------------------------|
| `data T = A \| B` / `type t = A \| B` | `type T is Data:` with constructors `A{}` and `B{}` | constructors always use braces; a field is `name: Type` |
| `case x of` / `match x with` | `match x:` with `case K{...}:` | the scrutinee must be a parameter or pattern variable |
| `if c then a else b` | `match c:` on `True{}` and `False{}` | there is no `if` |
| `Maybe a` / `option` | `Maybe<a, A>` in Base | the first argument is the quantity or kind |
| `Either a b` / `(a, b) result` | `Result<a, b, E, A>` in Base | the quantities are explicit; `IO.try` unwraps |
| tuples `(a, b)` / `a * b` | `A & B` and `(a, b)` | pairs are the usual way to return two values |
| lists `x : xs` (Haskell) / `x :: xs` (OCaml) | `Con{head, tail}`, `h <> t`, `[a, b]` | a list is affine unless its quantity is `&2` |
| `do` notation | `do IO<T>:` with `x : T <- act` | every bind names its type |
| `return x` / `pure x` (Haskell) | `return x` in a `do` block (`IO.pure`) | the value is boxed as an effect; `<-` runs it; chapter 09 |
| `main :: IO ()` | `def main() -> IO(Unit):` | the same, with `Unit{}` as the value |
| `where`, local `let` | `x = v` in a body | a plain `let` is used once; `+x = v` is reusable |
| type classes | not present; Base uses `Type.verb` names | every operation is a named function, such as `U32.add` |
| `newtype` / abstract types | a `type` with one constructor | constructors are always visible |
| QuickCheck property | `law` | a law is a checked proof, not a sampled test |
| GADT with a length index | a type computed by a `def`, such as `Vec(A, n)` | the index is an ordinary function |
| `INLINE` or specialization | a template `~f` | each distinct argument gets its own compiled copy |
| linear types | affine binders, `+` for `Data` | `+` pays a reference count; there is no `Linear` keyword |
| `Data.Map` | `Map<&2, V>` | string keys; `get` takes its default first |
| mutable arrays in `ST` | `Array<T>` with `a[i] <- v` | one owner; a write returns the array |
| `Just x` (Haskell), `Some x` (OCaml) | `Some{x}` | a constructor takes braces with no space before them; chapter 02 |
| `f :: a -> b` (Haskell), `val f : a -> b` (OCaml) | `def f(x: A) -> B:` | `:` gives a type, `->` gives the result, and the final `:` opens the body; chapter 12 |
| `(e :: t)` (Haskell), `(e : t)` (OCaml) | `(e : T)` | the annotation covers the operators inside its own parentheses; chapter 12 |
| `==` as a comparison | `T.is_eq(a, b)` | `==` appears only in an equality type such as `{a == b : T}`; chapter 12 |
| `id :: a -> a` (Haskell), `let id x = x` (OCaml) | `def id(-A: Type, x: A) -> A:` | the type is an argument: `id(U32, 42)`. Bend does not infer it; chapter 03 |
| `{x : T}` as a constructor | `{t : T}` as an annotation | a constructor has a name before its braces (`Tok{3n}`); braces with no name annotate one term; chapter 02 |

## Terms specific to Bend 2

**Affine.** A binder used at most once. Dropping it is free. Chapter 03.

**Strict.** Compiled Bend computes a call's arguments before the body runs. To keep work unevaluated, use a lambda, a template, or data that an interpreter runs. Chapter 12, section 11, shows all three.

**Quantity.** The number of uses a binder may have: `&1` means at most once, and `&2` means reusable. The binder markers choose one: `+x` is reusable, `x` is used at most once, and `-x` is erased, existing only for the checker. Chapter 03.

**Kind.** A classifier of types that carries a usage budget, written `Kind(q)`, where `q` is a quantity. `Type` is `Kind(&1)`: its values are used at most once. `Data` is `Kind(&2)`: its values may be copied with `+`. A kind is not a quantity. The quantity is the count, and the kind is the classifier that carries it. Haskell's kinds are different; see the table below. Chapter 03.

**Constructor (ctor).** A named way to build a value of a `type`. `Segment{3n}` applies the constructor `Segment` to `3n`. Chapter 02.

**Term and value.** A term is an expression as written, such as `(6 * 7 : U32)`. Its value is what it computes to, `42`. Chapter 12, section 11.

**Annotation.** `(e : T)` gives the type of an expression, and `{t : T}` gives the type of one term. An operator needs parentheses. Chapter 01.

**Erased (`-`).** A binder that exists only for the checker. The compiler deletes it, so it is not a run-time argument. Chapter 03.

**Runtime use.** The compiled body needs the binder's value: it returns the value or computes with it. An erased binder cannot be used at run time. Chapter 03.

**Explicit type argument.** Bend infers almost nothing, so a type is passed at the call, as in `identity(U32, 42)`. Chapter 03.

**Closure.** A function value, such as `x => (x + 1 : U32)`. It is affine, so it may be called once. Chapter 03.

**Array literal.** `[v : T*n]` or `[v : T^d]`: a fill value `v`, an element type `T`, and either `n` slots (a power of two) or `2^d` slots. `Array.new(T, d, v)` builds the same array. Chapter 03.

**Law.** A claim checked by the compiler. A law has a same-named proof def. Chapter 07.

**Proof.** A definition whose type is a law's claim. Chapter 07.

**Curry-Howard.** A law is a type, and its proof is a program of that type. Chapter 07 shows what the gate checks beyond the type.

**`{==}`.** Proves an equality when both sides compute to the same term. Chapter 07.

**Rewrite `%e : P`.** Replaces the goal using the equation `e`, with `_` marking where the right-hand side goes. Chapter 07.

**Hole.** `?TODO` leaves a goal open, and `?name` prints the goal. Chapter 07.

**`exs`.** A law that asks for a witness; the proof returns it with the equation. Chapter 07.

**Unit and Empty.** `Unit` has one value. `Empty` has none, so a function that takes an `Empty` need only match nothing. Chapter 08.

**Dependent type.** A type computed by a `def` from a value, such as `IsZero(n)` or `Vec(A, n)`. A normal type such as `U32` has no parameters, and a function type such as `U32 -> U32` maps values to values. Chapter 08.

**Pure (`return`).** `return v` in a `do` block boxes a pure value as an effect. It is `IO.pure`. Chapter 09.

**Bind (`<-`).** Runs an effect and names its result with a type. It is `IO.bind`. Chapter 09.

**IO value.** An effect of type `IO(A)`. It has no constructors, so only `<-` opens it. Chapter 09.

**Totality.** Every safe recursive call shrinks its first changing argument. Chapter 02.

**Fuel.** A `Nat` argument that bounds a loop the outside world stops. Chapter 02.

**`@unsafe`.** A definition exempt from the termination check and outside the proof guarantees. Chapter 08.

**Parallel call.** `a b = f(x) g(y)`, two calls the compiler may run at once. Chapter 05.

**Bang.** `f!(x)`, the call on the GPU, with its parallel calls. Chapter 05.

**Balanced fork.** A parallel call whose halves do about the same work. Chapter 05.

**Leaf.** A tail loop over 8 to 64 items that runs on one core. Chapter 05.

**Thread count.** The `--threads N` setting of a native binary. It defaults to the CPU count, and the fastest value depends on the program, the input, and the machine, so measure it. Chapter 05.

**`term_keep`, `ctr_take`, `rfc_seal`.** Runtime names for reference counts in the emitted C. Chapter 05.

**BendRT.** The runtime that compiles Bend to flat C with affine ownership and balanced forks. Chapter 04.

**Interaction net.** A graph of cells rewritten by local rules. Chapter 04.

**Cell and port.** A cell has a symbol, one principal port, and auxiliary ports. Chapter 04.

**Active pair.** Two cells joined at their principal ports. Only these reduce. Chapter 04.

**Confluence.** Distinct active pairs commute, so the order does not change the result. Chapter 04.

**CON, DUP, ERA.** The three symbols of Lafont's symmetric interaction combinators. Chapter 04.

**Duplication (dup).** `! &L{x,y} = t; body` splits `t` into two uses, with label `L`. Chapter 14.

**Superposition (sup).** `&L{a,b}` holds two alternatives with label `L`. In a net it is a DUP cell with label `L`, read from the other side. The released Bend 2 parser rejects it. Chapter 14.

**Label.** The number on a `&L{}` or `! &L{}`. Equal labels pair superpositions, and different labels commute. Chapter 14.

**Interaction Calculus (IC).** Victor Taelin's text notation for labelled nets: λ, application, duplication, superposition, and erasure. Chapter 14.

**Collapse.** Rewrites a result so that no superposition or duplication remains inside its alternatives (`ic run FILE -C`). Chapter 14.

**SupGen.** Victor Taelin's program synthesizer, built on superposition search. Its source is not published, and released Bend 2 does not include it. Chapter 14.

**Homoiconic.** Code that is also data the program can build and inspect. Chapter 10 shows a limited form.

**Gate.** `bend PROOF.bend`. It passes only when every law is proved, with no holes and no unsafe dependency. Chapter 07.

## Terms that look alike but differ

| Term | Looks like | Actually |
|------|------------|----------|
| `Type` | Haskell's `Type`, the kind of ordinary types (`Int :: Type`) | Bend's kind `Kind(&1)`: values of these types are used at most once. Haskell values are shared and garbage-collected, so Haskell types are not affine. In Bend, `Type` is also the name of the one universe (`Type : Type`, in the guide). |
| `Data` | the Haskell `Data` class (`Data.Data`, `deriving Data`) | Bend's kind `Kind(&2)`: values may be copied with `+`. It has nothing to do with generic programming |
| `data` | Haskell's `data T = A \| B` keyword | Bend declares a datatype with `type T is Data:`. `is Data` sets its reuse kind, and `is Type` makes it affine |
| `Kind` | Haskell's kind of a type (`Maybe :: Type -> Type`) | a classifier of types that carries a usage budget, `Kind(q)`; it is not a quantity |
| `quantity` | Haskell's `%1 ->` multiplicity (LinearTypes, off by default) | the number of uses a binder may have: `&1` at most once, `&2` reusable. The binder markers choose one |
| `+` | the addition operator | a quantity marker; `(a + b : T)` is the operator |
| `-A` | negation | an erased parameter |
| `~f` | a function value | a template argument: copied into each call at compile time. It is not a closure and does not defer work |
| `IO` | a monad you can run anywhere | an effect whose binds carry types; run only by the event loop |
| `Array` | a Haskell array | one-owner storage updated in place |

## Next

Return to the table of contents in the [index](/tutorial/).
