---
title: "Bend 2 tutorial 09: IO, files, and targets"
description: "The IO type and do blocks, binding effect results with a type, fork and join, channels, affine file handles, command-line arguments, and the C, JavaScript, and native targets."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/09-io-files-and-targets/
sources:
  - https://bend2.dev/learn/io/
  - https://bend2.dev/learn/concurrency/
  - https://bend2.dev/learn/files/
  - https://bend2.dev/learn/compile-to-c/
  - https://bend2.dev/learn/compile-to-javascript/
  - https://bend2.dev/notes/what-is-bend2/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 09: IO, files, and targets

Bend is pure. Effects live in the type `IO`, and a `do` block sequences them, much as Haskell's `IO` monad does. The differences are that every bind names its type, and that a file handle is affine: an operation on a handle gives the handle back with its result. This chapter covers the effect forms, files, arguments, and the three compilation targets.

## Sequencing effects

A `do` block runs its lines in order. A bind `x : T <- action` runs an action and names its result with a type. A plain line runs an action whose result is `Unit`, and `return v` ends the block with a pure value:

```bend
import Base

def main() -> IO(Unit):
  do IO<Unit>:
    IO.print("first")
    IO.print("second")
```

```output
first
second
```

The last line of a `do` block must be an effect or a `return`. A pure term there is rejected:

```bend
import Base

def main() -> IO(Unit):
  do IO<Unit>:
    (6 * 7 : U32)
```

```error
- observed : U32
```

```bend
import Base

def greet(name: String) -> IO(String):
  do IO<String>:
    IO.sleep(1)
    return "Hello, " ++ name

def main() -> IO(Unit):
  do IO<Unit>:
    text : String <- greet("Ada")
    IO.print(text)
```

```output
Hello, Ada
```

In that example `IO.sleep(1)` waits one millisecond, and `return` wraps the pure string as an `IO` result. Every bind carries a type, as in `text : String <- greet("Ada")`. Without it, the checker cannot choose the monad's type arguments.

### Boxes: pure, bind, and effects

The picture is a model, not the runtime. An `IO(A)` is an effect: when it runs, it produces an `A`. Read the outer box as the effect and the inner box as the value, which exists only after the effect runs. A `do` block moves values between the boxes:

```text
               String
          ┌──────────────┐
          │ "Hello, Ada" │
          └──────────────┘
                  │ return v: box a pure value
                  ▼
        ┌──────────────────┐
        │ IO(String)       │
        │                  │
        │ ┌──────────────┐ │
        │ │ "Hello, Ada" │ │
        │ └──────────────┘ │
        └──────────────────┘
                  │ text <- ...: run, then unbox
                  ▼
           text : String
              ┌──────┐
              │ text │
              └──────┘
                  │ IO.print(text): box a new effect
                  ▼
       ┌────────────────────┐
       │ IO(Unit)           │
       │                    │
       │ ┌────────────────┐ │
       │ │ IO.print(text) │ │
       │ └────────────────┘ │
       └────────────────────┘
```

The same program, checked:

```bend
import Base

def greet(name: String) -> IO(String):
  do IO<String>:
    return "Hello, " ++ name

def main() -> IO(Unit):
  do IO<Unit>:
    text : String <- greet("Ada")
    IO.print(text)
```

```output
Hello, Ada
```

- `return v` boxes a pure value. It is `IO.pure`.
- `text : String <- greet("Ada")` runs the effect and takes the value out. This is the only way out of a box.
- `IO.print(text)` makes a new effect: a box of type `IO(Unit)`.

### What a do block means

The guide defines `do` by two rules. `x : A <- v` becomes `M.bind(xs.., A, R, v, x => ...)`, and `return e` becomes `M.pure(xs.., R, e)`. For IO, Base defines `IO.pure(A, x)` and `IO.bind(A, B, m, f)`. The program above is the same as these calls:

```bend
import Base

def greet(name: String) -> IO(String):
  IO.pure(String, "Hello, " ++ name)

def main() -> IO(Unit):
  IO.bind(String, Unit, greet("Ada"), text => IO.print(text))
```

```output
Hello, Ada
```

A plain line is a bind whose result is `Unit`, so two effects in a row are one bind with a lambda that ignores its argument:

```bend
import Base

def main() -> IO(Unit):
  IO.bind(Unit, Unit, IO.print("x"), u => IO.print("y"))
```

```output
x
y
```

### Matching on IO

An `IO(A)` has no constructors, so a constructor pattern on it is rejected:

```bend
import Base

def greet(name: String) -> IO(String):
  do IO<String>:
    return "Hello, " ++ name

def show(io: IO(String)) -> IO(Unit):
  match io:
    case Some{x}:
      IO.print("some")
    case None{}:
      IO.print("none")

def main() -> IO(Unit):
  show(greet("Ada"))
```

```error
- expected : a datatype
```

A `match` also cannot head a statement inside `do`, because a `match` heads a def body. Binding a value and then matching it in the same block is rejected:

```bend
import Base

def greet(name: String) -> IO(String):
  do IO<String>:
    return "Hello, " ++ name

def main() -> IO(Unit):
  do IO<Unit>:
    text : String <- greet("Ada")
    match text:
      case _:
        IO.print(text)
```

```error
- expected : a term (a match heads a def body, not a term)
```

A wildcard `case _:` on an IO parameter is accepted, but its branch cannot see inside the effect. The pattern that works is to bind the value with `<-` and pass it to a def whose `match` inspects it:

```bend
import Base

def find(n: U32) -> IO(Maybe<&2, U32>):
  do IO<Maybe<&2, U32>>:
    return Some{n}

def show(m: Maybe<&2, U32>) -> IO(Unit):
  match m:
    case Some{x}:
      IO.print(U32.show(x))
    case None{}:
      IO.print("none")

def main() -> IO(Unit):
  do IO<Unit>:
    m : Maybe<&2, U32> <- find(7)
    show(m)
```

```output
7
```

## Concurrency: fork and join

`IO.fork` starts an effect in the background and returns a channel for its result. `IO.join` waits on that channel. Between the two, the main effect keeps running:

```bend
import Base

def delayed() -> IO(String):
  do IO<String>:
    IO.sleep(1)
    return "done"

def main() -> IO(Unit):
  do IO<Unit>:
    channel : Chan(String) <- IO.fork(String, delayed())
    IO.print("waiting")
    text : String <- IO.join(String, channel)
    IO.print(text)
```

```output
waiting
done
```

The event loop interleaves the effects. It is not a parallel call: an effect that waits on a timer, a socket, or a channel steps aside for the others. The guide says each computation runs its pure code, possibly in parallel on every core, up to its next effect. Use `IO.fork` for work that waits, and a parallel call (chapter 05) for pure work that divides.

`Chan.new`, `Chan.send`, `Chan.recv`, and `Chan.close` are the low-level operations under `IO.fork` and `IO.join`. Their signatures are in Base, and `bend base Chan` prints them.

### Channels: values between computations

`IO.fork` returns a channel for one result. For a stream of values, make a channel with `Chan.new`, give the sending computation the channel, and receive from the other side. `Chan.new(U32, 4)` makes a channel with room for four values. `Chan.recv` returns `Some{value}` for each value sent, and `None{}` once the channel is closed:

```bend
import Base

def send_numbers(+chan: Chan(U32)) -> IO(Unit):
  do IO<Unit>:
    sent1 : Bool <- Chan.send(U32, chan, 10)
    sent2 : Bool <- Chan.send(U32, chan, 20)
    Chan.close(U32, chan)

def show_message(m: Maybe<&1, U32>) -> IO(Unit):
  match m:
    case None{}:
      IO.print("closed")
    case Some{n}:
      IO.print(U32.show(n))

def main() -> IO(Unit):
  do IO<Unit>:
    +chan : Chan(U32) <- Chan.new(U32, 4)
    IO.spawn(Unit, send_numbers(chan))
    first : Maybe<&1, U32> <- Chan.recv(U32, chan)
    show_message(first)
    second : Maybe<&1, U32> <- Chan.recv(U32, chan)
    show_message(second)
    third : Maybe<&1, U32> <- Chan.recv(U32, chan)
    show_message(third)
```

```output
10
20
closed
```

`IO.spawn` starts a computation whose result nobody waits for. Here the sender runs in the background, and the receiver reads the values in the order they were sent.

## Files: affine handles

A file is a handle, and a handle has one owner. Each operation on it returns the handle beside its result, so you must keep the handle and pass it on. `File.open` returns a `Result`, and `IO.try` unwraps it or ends the program with the error. This program writes a file and closes it:

```bend
import Base

def finish(result: File & Result<&1, &1, U32 & String, Unit>) -> IO(Unit):
  match result:
    case (file, status):
      do IO<Unit>:
        File.close(file)
        IO.pass(Unit, status)
        IO.print("written")

def main() -> IO(Unit):
  do IO<Unit>:
    file : File <- IO.try(File, File.open("message.txt", "w"))
    result : File & Result<&1, &1, U32 & String, Unit> <- File.write(file, "Hello from Bend")
    finish(result)
```

```output
written
```

The program writes `message.txt` in the directory where you run it, and it replaces any earlier contents. The `finish` helper closes the handle on every path before it passes the status along. A handle that is not closed is a leak: the checker does not force you to close it, so you must do it yourself.

The guide's list of effect kinds includes TCP and UDP sockets, windows, and audio. Their handles follow the same affine rule. `bend base` prints their signatures.

## Command-line arguments

`IO.args()` returns the arguments after the program name, as a `List<String>`. The compiler's own options are removed, and `--` ends them. Here the program prints how many arguments it received:

```bend
import Base

def main() -> IO(Unit):
  do IO<Unit>:
    args : List<String> <- IO.args()
    IO.print(Nat.show(List.length(&1, String, args)))
```

```output
0
```

Run it with arguments to see the count change:

```sh
bend main.bend one two
bend main.bend -- one two
```

Both commands print `2` in this lab. The `List.length` call takes its quantity first, `&1` for a list of affine elements, which is why the version without it is rejected (chapter 11).

## Error results and exits

Two Base effects end a program on purpose. `IO.die(-A, code, msg)` ends the program with the exit code and the message. `IO.pass(-A, r)` turns a `Result` into an effect that either returns the value or fails with its error. Prefer `IO.pass` and `IO.try` when the failure can be handled, and reserve `IO.die` for a program that cannot continue.

### Reading the environment

`IO.get_env` returns a `Result`. Matching on it handles the failure case. This variable is unset, so the program prints `missing`:

```bend
import Base

def describe(r: Result<&1, &1, U32 & String, String>) -> IO(Unit):
  match r:
    case Fail{e}:
      IO.print("missing")
    case Done{v}:
      IO.print(v)

def main() -> IO(Unit):
  do IO<Unit>:
    r : Result<&1, &1, U32 & String, String> <- IO.get_env("BEND_TUTORIAL_UNSET")
    describe(r)
```

```output
missing
```

## Compilation targets

Bend has three targets. The same source compiles to each of them.

```sh
bend main.bend -o main.c
bend main.bend -o main
./main --threads 8
bend main.bend -o main.js
node main.js
```

- `-o main.c` writes one C file that contains the runtime and your program. Compile it with any C compiler, or inspect it, as chapter 05 does.
- `-o main` builds a native executable with clang 14 or newer. A binary that uses `!` also writes `main.gpu`, which must stay beside it. `--gpu off` runs bang calls on the CPU.
- `-o main.js` writes standalone JavaScript. The JavaScript target runs parallel bindings one after another.

The native and JavaScript targets print the same text, which this lab checked for the program below. It is the example from the compile-to-JavaScript page:

```bend
import Base

def main() -> IO(Unit):
  IO.print("Bend on JavaScript")
```

```output
Bend on JavaScript
```

`bend main.bend` without `-o` runs the program directly. An `IO` main runs compiled, and a pure main is evaluated by the checker, so a pure main is slow for large work.

## Exercises

**1. Two greetings.** Write `main` so that it runs `greet("Ada")` and then `greet("Lin")`, printing each greeting on its own line.

*Solution.* Two binds in one `do` block run in order.

```bend
import Base

def greet(name: String) -> IO(String):
  do IO<String>:
    return "Hello, " ++ name

def main() -> IO(Unit):
  do IO<Unit>:
    first : String <- greet("Ada")
    second : String <- greet("Lin")
    IO.print(first)
    IO.print(second)
```

```output
Hello, Ada
Hello, Lin
```

**2. Count the handles.** Explain why `File.write(file, ...)` returns the handle again, and what would break if it did not.

*Solution.* A file handle is affine. If the write consumed the handle and returned only the result, the program could not close it afterwards. The handle would be lost, and the file would stay open. Returning the handle with the result keeps the single owner, so the program can close it on every path.

## Next

Chapter 10 applies everything so far to your questions: forks, branches, and self-changing code.
