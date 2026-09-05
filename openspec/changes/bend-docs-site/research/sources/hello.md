# Hello world in Bend2

Last updated 2026-08-13. Canonical: https://bend2.dev/learn/hello/

Hello world in Bend2 is a `main` function returning an IO action. The program reads a name
from standard input and prints a greeting.

```
import Base

# Performs effects on the CPU.
def main() -> IO<Unit>:
  do IO<Unit>:
    name <- IO::input()
    IO::print("Hello, " ++ name)
```

## The definition line

Bend2 declares functions with Python's `def` plus a return type after the arrow. Type
arguments go in angle brackets, so `IO<Unit>` is `IO` applied to `Unit`, a computation run
only for its effects. `import Base` brings in the standard library, which supplies `IO`, and
`#` starts a comment. `main` does not have to be effectful; a pure program declares
`def main() -> U32` and [returns a number](/learn/parallelism/).

## The do block

Bend2 sequences effects in a `do` block that names its type, here `do IO<Unit>:`. Inside the
block `<-` runs an effect and binds its result, so `name <- IO::input()` reads a line into
`name`, and the final `IO::print(...)` is the block's value. Strings concatenate with `++`,
and library functions are reached with `::` paths, as in `IO::input`.

## Where effects run

Bend2 runs effects on the CPU. GPU evaluation, written by
[marking a call with `!`](/learn/gpu/), is for pure functions; input and output stay on the
host.