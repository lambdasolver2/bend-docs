# What is Bend2?

Last updated 2026-08-30. Canonical: https://bend2.dev/notes/what-is-bend2/

Bend2 is the in-development successor to [Bend](https://github.com/HigherOrderCO/Bend), Higher
Order Company's massively parallel programming language. There is no public code as of
2026-08-30; [Taelin's 2026-08-27 launch plan](https://x.com/VictorTaelin/status/2093045510101676483)
puts the current estimate around 2026-09-02.

## What Bend2 combines

Bend2 combines [functional code that parallelizes automatically](/learn/parallelism/), a
[dependent type system that proves program properties](/learn/proofs/), and
[program synthesis from precise types](https://x.com/VictorTaelin/status/2029567059881857081).
Automatic parallelism exists in array languages, dependent types in Lean and Higher Order
Company's [Kind](https://github.com/HigherOrderCO/Kind), and synthesis in research languages.
Precise types give SupGen a search target and the checker an acceptance condition;
[HVM4](https://github.com/HigherOrderCO/HVM4) schedules independent graph rewrites instead of
requiring annotations. The [public Bend2 repository](https://github.com/VictorTaelin/Bend2)
contains no compiler as of 2026-08-30.

## What the syntax looks like

Bend2 reads as Python with dependent types. Functions are Python-style `def` with typed
parameters and a return type after the arrow;
effects run in `do` blocks over an explicit `IO` type; a call runs on the GPU when its name
carries `!`, as in `sum!(24, 0)`; and a theorem is an `assert` block whose proof is an
ordinary `def` of the same name, written by case analysis and `%` rewrites. The numbers in the
samples are typed `U32`, where Bend1's node encoding stopped at 24 bits. Each program is walked
through line by line in [Bend2 by Example](/learn/): [hello world](/learn/hello/), the
[parallel sum](/learn/parallelism/), the [GPU call](/learn/gpu/), and the
[commutativity proof](/learn/proofs/).


## Why interaction nets parallelize

Bend2's performance model rests on the same substrate as Bend1's: interaction nets. A program is
a graph, and evaluation is a small fixed set of rewrite rules, each of which touches exactly two
adjacent nodes. Two useful properties fall out of that locality. First, rewrites that share no
nodes cannot conflict, so every independent redex in the graph can fire concurrently without
locks. Second, the rules are confluent, meaning the final result does not depend on the order in
which redexes fire, so a scheduler can hand work to any idle thread, or any idle GPU warp,
without coordination. Every step still performs graph surgery with real memory traffic, and
that constant factor is where the
[criticism of Bend1 concentrated](https://news.ycombinator.com/item?id=40390287) at its launch.

## The runtime lineage

Bend2 targets the fourth generation of a runtime line that Higher Order Company has been
iterating on since 2022: [HVM1](https://github.com/HigherOrderCO/HVM1), the original lazy
evaluator for interaction combinators, then [HVM2](https://github.com/HigherOrderCO/HVM2), the
strict rewrite that compiled to C and CUDA and carried Bend at its
[May 2024 launch](https://news.ycombinator.com/item?id=40390287), then
[HVM3](https://github.com/HigherOrderCO/HVM3), and now
[HVM4](https://github.com/HigherOrderCO/HVM4), which is public and saw pushes into mid-2026.
[Bend2 was complete by 2026-07-18](https://x.com/VictorTaelin/status/2078553927268589989), and
the [CUDA port report](https://x.com/VictorTaelin/status/2078471338755232193) records an
overnight implementation by a coding model (Anthropic's Fable) from the reference Metal
runtime, reusing most of the existing code. Its benchmark puts CUDA ahead of Metal on RTX and
at roughly 10x parallel C for most programs.

## What exists in public

Bend2's public footprint, as of 2026-08-30, is an empty repository plus the four posted samples
in [What the syntax looks like](#what-the-syntax-looks-like). `VictorTaelin/Bend2` on GitHub
carries the description "Bend2 - WIP", zero bytes of code, and no branches. There is no
documentation, binary, package, or license text. [Bend](https://github.com/HigherOrderCO/Bend)
still receives maintenance, and [HVM4](https://github.com/HigherOrderCO/HVM4) is public. The
[2026-03-05 launch-blocker list](https://x.com/VictorTaelin/status/2029567059881857081) named
HVM4's AOT compiler, HVM4's GPU runtime, and Bend2-SupGen integration.

## Bend2 compared with eight languages

| Language  | Execution and memory                                                                                                                                  | Work discovery                                                                                                                                                                          | Shared-state contract                                                                                                                                        | Static guarantee                                                                                                       | GPU boundary                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Bend2** | Bend2 uses [HVM4 graph reduction](https://github.com/HigherOrderCO/HVM4).                                                                             | **Automatic.** [The evaluator schedules independent redexes from ordinary calls](/learn/parallelism/).                                                                                  | **No task API.** [The published sum](/learn/parallelism/) uses recursion and a tuple assignment; no locks or shared buffers appear.                          | **Proof `def`.** [A same-named `def` discharges each `assert`](/learn/proofs/).                                        | **One character.** [The GPU sample changes `sum` to `sum!`](/learn/gpu/); no grid or buffer code appears.              |
| Bend1     | [HVM2 graph reduction with Rust, C, and CUDA backends](https://github.com/HigherOrderCO/Bend)                                                         | **Automatic.** [The evaluator finds independent redexes](https://github.com/HigherOrderCO/Bend).                                                                                        | **Ordinary calls.** [Source contains no task API](https://github.com/HigherOrderCO/Bend); the CLI chooses the backend.                                       | [No theorem form in the published syntax](https://github.com/HigherOrderCO/Bend).                                      | **Whole program.** [`run-cu` or `gen-cu`](https://github.com/HigherOrderCO/Bend#running-bend-programs) selects CUDA.   |
| Lean 4    | Native functional code with [reference counting](https://lean-lang.org/doc/reference/latest/Run-Time-Code/Reference-Counting/)                        | **Explicit.** The programmer creates [`Task` values](https://lean-lang.org/doc/reference/latest/IO/Tasks-and-Threads/) for the runtime pool.                                            | Immutable values are the default; task creation, observation, and cancellation remain in source.                                                             | **Kernel-checked proofs.** [Dependent type theory checks proof terms](https://lean-lang.org/doc/reference/latest/).    | External packages or foreign code.                                                                                     |
| Haskell   | Lazy graph reduction with garbage collection                                                                                                          | **Annotated.** [Sparks, strategies, or lightweight threads mark work; the runtime work-steals sparks](https://downloads.haskell.org/ghc/latest/docs/users_guide/using-concurrent.html). | Pure values are the default; `MVar`, STM, and related primitives coordinate shared effects.                                                                  | [GADTs and type families](https://downloads.haskell.org/ghc/latest/docs/users_guide/exts/types.html); no proof kernel. | Libraries or the foreign-function interface; kernels stay separate.                                                    |
| OCaml     | Eager native or bytecode execution with a [generational garbage collector](https://ocaml.org/manual/5.5/parallelism.html#parallel-garbage-collection) | **Explicit.** [Domains map one-to-one to OS threads](https://ocaml.org/manual/5.5/parallelism.html); task libraries divide work above them.                                             | The domains share a heap; atomics and locks protect mutable state.                                                                                           | GADTs and modules; no dependent proof kernel.                                                                          | Libraries or C bindings.                                                                                               |
| Rust      | Native code with [ownership and no garbage collector](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)                                  | **Explicit.** Threads, async tasks, and data-parallel crates define the work graph.                                                                                                     | **Compiler-checked sharing.** [`Send` and `Sync`](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html) reject unsafe crossings. | Ownership, lifetimes, and traits enforce safety properties, not theorems.                                              | Host crates plus a separate kernel toolchain.                                                                          |
| Java      | JVM bytecode, JIT compilation, and garbage collection                                                                                                 | **Explicit.** [Platform or virtual threads](https://docs.oracle.com/en/java/javase/26/core/virtual-threads.html), `ForkJoinPool`, streams, and executors define work.                   | The shared heap uses locks, atomics, concurrent collections, and memory-model rules.                                                                         | Nominal static types; no theorem language.                                                                             | Libraries, JNI, or an offload runtime.                                                                                 |
| Python    | CPython bytecode and reference counting; the [free-threaded build is optional](https://docs.python.org/3/howto/free-threading-python.html)            | **Explicit.** [Thread or process executors](https://docs.python.org/3/library/concurrent.futures.html), async tasks, and native libraries define work.                                  | The default GIL serializes Python bytecode; locks or process IPC coordinate work outside it.                                                                 | Runtime checks and optional static types; no proof kernel.                                                             | Array and tensor libraries own kernels and transfers.                                                                  |
| Mojo      | Native code with [value semantics and ownership](https://docs.modular.com/mojo/manual/values/ownership/)                                              | **Explicit.** [`parallelize`](https://docs.modular.com/mojo/std/algorithm/backend/cpu/parallelize/parallelize/), SIMD, and GPU threads divide work.                                     | Ownership governs values; the programmer manages device buffers and synchronization.                                                                         | Traits and compile-time parameters; no theorem kernel.                                                                 | Explicit [kernels, grids, thread blocks, and `DeviceContext`](https://docs.modular.com/mojo/manual/gpu/fundamentals/). |