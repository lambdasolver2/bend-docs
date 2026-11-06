---
title: "Bend 2 tutorial 11: checker rules and errors"
description: "The rules the Bend 2 checker enforces, each official diagnostic with the message bend 2.0.25 prints, the errors this tutorial found beyond the official list, and the differences between 2.0.25 and the bend2.dev examples."
updated: 2026-10-17
verified: 2026-10-17
status: runnable
canonical: /tutorial/11-rules-and-errors/
sources:
  - https://bend2.dev/errors/
  - https://bend2.dev/errors/diagnostics.json
  - https://bend2.dev/notes/ai-agents-bend/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 11: checker rules and errors

This chapter is a reference. The checker runs before any program executes, and it stops with a message when a rule fails. Each rule below is taught in an earlier chapter, and each official diagnostic appears here with the text `bend 2.0.25` prints. The official index on bend2.dev was written against 2.0.36, and its wording differs in places. Both wordings are in the tables.

## The rules

| Rule | Why it exists | Chapter |
|------|---------------|---------|
| A definition is defined above its first use | the checker reads top to bottom | 02 |
| Recursive calls shrink their first changing argument | termination makes proofs sound | 02, 08 |
| Matches are exhaustive | every value must have a branch | 02 |
| A match inspects a parameter or a pattern variable | a computed value has no evidence to split | 01, 03 |
| Every operator carries a type annotation | the checker does not infer arithmetic types | 01 |
| A constructor in a `let` needs its type from context | the checker cannot infer it otherwise | 02 |
| A plain binder is used at most once | ownership and freeing | 03 |
| `+` marks reuse of a `Data` value only | only `Data` may be copied | 03 |
| The result has the declared type | ordinary typing | 01 |
| Every name is defined in the file or an import | no silent fallbacks | 02 |
| Every law has a same-named proof, with no holes | the gate | 07 |
| A proof does not depend on `@unsafe` or foreign code | unsafe code is outside the guarantee | 08, 11 |

## The official diagnostics

Each heading names the diagnostic on bend2.dev. The code is the broken program from the official catalogue, and the error lines are what `bend 2.0.25` printed for it. Where a chapter already shows the program and its message, this page links to it.

### A variable was consumed more than once

Chapter 03 shows the program and its fix. The message is `- expected : n` and `- observed : n (consumed more than once)`.

### An operator has no type annotation

Chapter 01 shows the program and its fix. The message is `- message  : a type for this operator (write (a + b : Nat))`.

### A match cannot inspect a computed value

Chapter 01 shows the program and its fix. The message is `- message  : a parameter or field scrutinee (a match cannot scrutinize a computed value: give it its own def)`.

### A function calls one defined below it

Chapter 02 shows the program and its fix. The message is `- expected : a defined name`.

### A recursive call does not decrease

Chapter 02 shows the program and its fix. The message begins `- expected : a decreasing self-call`.

### A name is not defined

```bend
import Base

def main() -> Nat:
  missing()
```

```error
- expected : a defined name
- observed : missing
```

Define `missing` above `main`, or import the file that defines it.

### A law is missing its proof

Chapter 07 shows the program. The message is `Error: 1 TODO found.`, and the same file with `{==}` as its proof prints `All terms check.`

### Definitions rely on unsafe or foreign code

Chapter 08 shows the case that matters. The official program in this catalogue uses names that end in `?`, which bend 2.0.25 cannot parse:

```bend
import Base

def is_even?(n: Nat) -> Bool:
  match n:
    case 0n: True{}
    case 1n+p: is_odd(p)
```

```error
- expected : '('
```

The fix in 2.0.36 is `@unsafe`, and 2.0.25 accepts that spelling too. The rule itself: a law that depends on an `@unsafe` definition is not verified. Chapter 08 shows the warning this version prints.

### The result has the wrong type

```bend
import Base

def main() -> U32:
  True{}
```

```error
- expected : U32
- observed : Bool
```

Return a value of the declared type.

## Errors this tutorial found beyond the official list

These errors were produced by real programs while writing the chapters. They are not in the official index.

**A superposition literal.** `&{1, 2}` is rejected (chapter 06).

**An `if` statement.** Bend has no `if` (chapter 06).

**A constructor without a type.** A `let` with no context cannot infer the type of a constructor:

```bend
import Base

type Tok is Data:
  Tok{n: Nat}

def show(t: Tok) -> Nat:
  match t:
    case Tok{n}:
      n

def main() -> Nat:
  t = Tok{3n}
  show(t)
```

```error
- expected : an annotated term (cannot infer)
```

Write `t : Tok = Tok{3n}`, as chapter 02 does.

**A quantity argument left out.** `List.length` takes its quantity first, so `List.length(String, args)` fails:

```bend
import Base

def main() -> IO(Unit):
  do IO<Unit>:
    args : List<String> <- IO.args()
    IO.print(Nat.show(List.length(String, args)))
```

```error
- expected : Quant
```

Write `List.length(&1, String, args)`, as chapter 09 does.

**A destructured computed value.** `(a, b) = f(x)` inside a definition is a match on a computed value (chapter 03).

**A hole inside a branch.** `?name` stops the proof check and prints the goal (chapter 07).

**A constructor field naming a later type.** Chapter 02 shows the message.

## Version differences

The index page is the table of contents. The table below compares the compiler installed for this tutorial, bend 2.0.25, with the 2.0.36 build the bend2.dev examples were checked against.

| Topic | bend 2.0.25 (checked here) | bend 2.0.36 (site) |
|-------|----------------------------|--------------------|
| Proof success line | `All terms check.` | `ALL PROOFS CHECK` and `Use --verdict for mathematical validity.` |
| `--verdict` option | `unknown option --verdict` | supported |
| Proof that depends on `@unsafe` | prints `All terms check, but N defs rely on unsafe or foreign code` and exits 0 | fails the proof check |
| Datatype fields naming a later type | rejected (`expected : a defined name`) | the guide says datatypes may appear in any order |
| `f?` names | parse error | accepted as shorthand for `@unsafe` |
| Forward reference message | `- expected : a defined name` | `- expected : a filled definition (an unfilled law is a dead claim: live code cannot use it)` |

Two consequences for your workflow. First, the gate must read the output, not only the exit status, because 2.0.25 can exit 0 with an unsafe dependency. Second, `bend update` installs the latest compiler. The site's examples use 2.0.36, which has `--verdict`. The bend2.dev notes say that option needs Lean v4.34.0 exactly, or a prebuilt kernel named by `BENDTT`. Chapter 07 explains what the final check adds. This lab has neither the compiler option nor a Lean toolchain, so it has not run that check.

## Reading an error

Every message has the same shape: a headline, then `- expected` and `- observed` lines, and sometimes a `Location` with the source around it. Read `expected` first. It names what the checker needed at that point, such as `a defined name`, `Data`, or `cases for False`. Then find the same spot in your file. The `observed` line shows what it found instead.

## Next

Chapter 12 is the syntax reference, and chapter 13 is the glossary.
