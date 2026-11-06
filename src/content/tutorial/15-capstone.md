---
title: "Bend 2 tutorial 15: capstone, a checked command parser"
description: "One small program built from the tutorial's parts: types, a codec, a transition function, laws that the gate proves, and a command-line entry point that the laws cover."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/15-capstone/
sources:
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 15: capstone, a checked command parser

This chapter builds one small program from the parts of the tutorial. It reads commands from the command line, moves a job through states, and proves properties of the transitions. The laws are the specification, and the gate checks that the code meets them.

The project has three files in one directory:

- `job.bend`: the program. Pure code comes first: types, a codec, and the transition function. The IO shell `main` comes last.
- `LAWS.bend`: the claims. A person writes them, and nobody edits them to make a proof pass (chapter 07).
- `PROOF.bend`: one proof per law. `bend PROOF.bend` is the gate.

## 1. The three files

**job.bend**

```bend file=job.bend
import Base

type Cmd is Data:
  Start{}
  Cancel{}
  Finish{}

type State is Data:
  Queued{}
  Running{}
  Cancelled{}
  Finished{}

def encode(c: Cmd) -> String:
  match c:
    case Start{}:
      "start"
    case Cancel{}:
      "cancel"
    case Finish{}:
      "finish"

def only(hit: Bool, c: Cmd) -> Maybe<&2, Cmd>:
  match hit:
    case True{}:
      Some{c}
    case False{}:
      None{}

def decode(+s: String) -> Maybe<&2, Cmd>:
  Maybe.or(&2, Cmd, only(String.eq(s, "start"), Start{}), Maybe.or(&2, Cmd, only(String.eq(s, "cancel"), Cancel{}), only(String.eq(s, "finish"), Finish{})))

def step(+s: State, c: Cmd) -> State:
  match s c:
    case Queued{} Start{}:
      Running{}
    case Queued{} Cancel{}:
      Cancelled{}
    case Running{} Cancel{}:
      Cancelled{}
    case Running{} Finish{}:
      Finished{}
    case _ _:
      s

def state_name(s: State) -> String:
  match s:
    case Queued{}:
      "queued"
    case Running{}:
      "running"
    case Cancelled{}:
      "cancelled"
    case Finished{}:
      "finished"

def run1(m: Maybe<&2, Cmd>) -> IO(Unit):
  match m:
    case Some{c}:
      IO.print(state_name(step(Queued{}, c)))
    case None{}:
      IO.die(Unit, 2, "unknown command")

def run2(m: Maybe<&2, Cmd>, n: Maybe<&2, Cmd>) -> IO(Unit):
  match m n:
    case Some{c} Some{d}:
      IO.print(state_name(step(step(Queued{}, c), d)))
    case _ _:
      IO.die(Unit, 2, "unknown command")

def dispatch(args: List<String>) -> IO(Unit):
  match args:
    case Nil{}:
      IO.print("usage: job CMD [CMD]")
    case Con{a, Nil{}}:
      run1(decode(a))
    case Con{a, Con{b, Nil{}}}:
      run2(decode(a), decode(b))
    case _:
      IO.die(Unit, 2, "too many commands")

def main() -> IO(Unit):
  do IO<Unit>:
    args : List<String> <- IO.args()
    dispatch(args)
```

Read the file from the top. `encode` and `decode` are inverses: `encode` writes a command as a string, and `decode` reads it back and returns a `Maybe`. `step` is the transition function, and every pair it does not list leaves the state unchanged. `dispatch` takes one or two commands, and `main` passes it the arguments. Each helper is defined above the function that uses it, so the file has no forward references (chapter 02).

**LAWS.bend**

```bend file=LAWS.bend
import Base
import ./job.bend as J

law round_trip:
  for c: J.Cmd
  {J.decode(J.encode(c)) == Some{c} : Maybe<&2, J.Cmd>}

law finished_stays:
  for c: J.Cmd
  {J.step(J.Finished{}, c) == J.Finished{} : J.State}

law start_then_cancel:
  {J.step(J.step(J.Queued{}, J.Start{}), J.Cancel{}) == J.Cancelled{} : J.State}
```

`round_trip` says that every command survives encoding and decoding. `finished_stays` says that a finished job stays finished, whatever command arrives. `start_then_cancel` is a concrete claim that needs no case split: starting and then cancelling a job cancels it.

**PROOF.bend**

```bend file=PROOF.bend run
import Base
import ./job.bend as J
import ./LAWS.bend as Laws

def Laws.round_trip(c):
  match c:
    case J.Start{}:
      {==}
    case J.Cancel{}:
      {==}
    case J.Finish{}:
      {==}

def Laws.finished_stays(c):
  match c:
    case J.Start{}:
      {==}
    case J.Cancel{}:
      {==}
    case J.Finish{}:
      {==}

def Laws.start_then_cancel():
  {==}
```

```output
All terms check.
```

`PROOF.bend` imports `job.bend`, so the gate also type-checks the program's `main`. Every proof here is a case split with `{==}` in each case, because each case computes to the same term on both sides.

## 4. Run it

The program is a command-line tool. These are the results of running it:

```sh
bend job.bend start
bend job.bend start cancel
bend job.bend start finish
bend job.bend
bend job.bend bogus
bend job.bend start bogus cancel
```

```text
running
cancelled
finished
usage: job CMD [CMD]
unknown command        (exit status 2)
too many commands      (exit status 2)
```

## 5. Break it on purpose

Each exercise has an answer that was checked by running the gate.

1. **A broken encoder.** Change the `"cancel"` string in `encode` to `"start"`. Predict the gate's first message.

   Answer: the gate fails in `LAWS.round_trip`:

   ```text
   - expected : Some{job.Start{}}
   - observed : Some{job.Cancel{}}
   ```

   `round_trip` catches the bug because the claim names the behaviour that broke.

2. **A gap the laws do not cover.** Restore the encoder. Change `step` so that `Queued` plus `Cancel` stays `Queued`. Run the gate.

   Answer: the gate still prints `All terms check.` No law mentions that pair, so the broken transition passes. The laws are the specification, and the gate proves only what they say.

3. **Close the gap.** Add this law to `LAWS.bend` and this proof to `PROOF.bend`:

   ```text
   law cancel_queued:
     {J.step(J.Queued{}, J.Cancel{}) == J.Cancelled{} : J.State}

   def Laws.cancel_queued():
     {==}
   ```

   Answer: the gate fails until `step` is fixed. It reports `expected : job.Queued{}` and `observed : job.Cancelled{}` at `LAWS.cancel_queued`. Restore `Cancelled{}` in `step`, and the gate passes again.

## What to take away

A law names a behaviour, and the gate checks it. Passing the gate says nothing about behaviour that no law names. Write the claim first, keep it fixed, and let the proof change to match the code, not the reverse (chapter 07).

## Next

Chapter 16 maps the repositories that assemble these pieces into real programs, and says which files to read first.

Continue to [chapter 16](/tutorial/16-references/).
