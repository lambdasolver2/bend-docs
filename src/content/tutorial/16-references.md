---
title: "Bend 2 tutorial 16: reading real Bend repositories"
description: "A curated map of Bend 2 repositories to read after the tutorial: small verified examples, proved libraries, games, compilers, and large applications, with the files that show how each one is composed."
updated: 2026-10-20
verified: 2026-10-20
status: docs-only
canonical: /tutorial/16-references/
sources:
  - https://github.com/bendlang/bend
  - https://github.com/AdrielSantana/metal-bending
  - https://adrielsantana.github.io/metal-bending/
  - https://github.com/aivv73/bend-voxel
  - https://github.com/costamatheus97/bend-craft
  - https://github.com/eliesgalvira/bendoom
  - https://github.com/gildrb/elpis-fast
  - https://github.com/Giulio2002/bend-collections
  - https://github.com/i2cjak/Backplane
  - https://github.com/ind-igo/bend-frontend
  - https://github.com/lilalittle/bend-packages
  - https://github.com/Lulzx/bendc
  - https://github.com/nuxyel/bend-ml
  - https://github.com/paymog/bend-kit
  - https://github.com/angerman/birc
  - https://github.com/FabianVegaA/mylsm
  - https://github.com/bendlib/bendlib
  - https://github.com/777genius/awesome-bend
  - https://hub.bend-lang.com
---

# 16: reading real Bend repositories

The tutorial teaches one idea per page. A repository teaches the next thing: how the pieces are arranged when the program is larger than one screen. The useful question is not which repository is biggest. It is where the boundary between pure code, effects, proofs, and measurement sits, and whether that boundary is visible in the file tree.

This chapter maps repositories worth reading. The list is not a ranking and it is not official. Each entry says what the repository demonstrates and which files to open first.

> **Core insight.** A Bend repository is readable when its claims, its pure code, its effects, and its evidence live in separate places. Most of the repositories below differ in size, not in that shape.

## The shape of a Bend repository

A small repository usually looks like this:

```text
repo/
  README.md          the pinned compiler, how to run it, what it proves
  LAWS.bend          the claims, written by a human
  PROOF.bend         one same-named def per law
  main.bend          the entry point
  src/               pure domain modules
  tests/             golden files, unit tests, differential tests
  bench/             measurements, with the machine and version recorded
  host/ or *.c/*.js  foreign effects, kept at the edge
```

Larger repositories repeat the pattern per package or per layer:

```text
repo/
  package-a/
    LAWS.bend
    PROOF.bend
    check.bend       runtime checks for the parts the checker cannot reach
    VERSION          the hub version, independent of its neighbours
    package-a.bend
    bench/
  package-b/
    ...
```

| Path | What it holds | Tutorial |
|------|---------------|----------|
| `LAWS.bend` | `law` declarations: the specification | [07](/tutorial/07-laws-and-proofs/) |
| `PROOF.bend` | `def` with the same name as each law | [07](/tutorial/07-laws-and-proofs/) |
| `check.bend` | ordinary tests, often for native arrays or effects | [09](/tutorial/09-io-files-and-targets/) |
| `src/` | pure functions, one concern per module | [02](/tutorial/02-data-and-recursion/) |
| `tests/` | golden output and differential comparisons | [01](/tutorial/01-first-programs/) |
| `bench/` | timing, memory, and throughput runs | [05](/tutorial/05-parallelism-and-runtime/) |
| `*.c` / `*.js` | foreign effects behind a named signature | [09](/tutorial/09-io-files-and-targets/) |

Not every repository has every row. A package with no effects has no `host/`. A teaching example may put everything in one file. What matters is that you can tell which row a file belongs to.

## How to read one

Read in this order, and stop when you can predict the next file:

1. **README.** Find the compiler version. Bend 2 changes between releases, and a repository that pins 2.0.37 may not check on 2.0.25. Find the command that runs the proof gate.
2. **`LAWS.bend`.** Read the claims before the implementation. They tell you what the author thinks the program means.
3. **`PROOF.bend`.** Look at the shape of a proof, not every line: `{==}`, a rewrite, an induction hypothesis, or a call to a lemma.
4. **The entry point.** Find `main`, the CLI, or the test driver. Trace one path from it into one leaf module.
5. **One leaf module and its test.** This is where the writing style lives: how types are annotated, how matches are ordered, how effects are avoided.
6. **The build and the benchmark.** Check whether the numbers name the compiler, the thread count, and the machine. A number without those is an anecdote.

Useful questions to carry from repository to repository:

- Does `PROOF.bend` import the adjacent `LAWS.bend`? Without that import, the laws you read are not the ones the proof file proves.
- Is `check.bend` testing the same behaviour as the laws, or something the checker cannot express?
- Are foreign effects behind a small named module, or scattered through the domain code?
- Does the benchmark compare against another implementation, or only against itself?
- Does the README say what the repository does **not** prove?

## A short reading list

| If you want to see | Read |
|--------------------|------|
| the smallest complete laws-and-proofs project | [metal-bending](#metal-bending-the-smallest-complete-project) |
| a proved, benchmarked library | [bend-collections](#bend-collections-a-library-with-specs-and-proofs) |
| the boundary between a checker and a backend | [bend-frontend](#bend-frontend-a-checker-with-a-typed-output) |
| a pure game core with a thin driver | [bend-craft](#bend-craft-a-deterministic-game-core) |
| a large, deeply modular application | [backplane](#backplane-a-large-application-in-flat-modules) |
| performance work with a proof obligation | [elpis-fast](#elpis-fast-spec-laws-proof-diff) |
| the package ecosystem | [bend-packages](#bend-packages-a-map-of-the-ecosystem) |

## The community repositories

### metal-bending: the smallest complete project

**Repository:** [AdrielSantana/metal-bending](https://github.com/AdrielSantana/metal-bending) · **Browser walkthrough:** [adrielsantana.github.io/metal-bending](https://adrielsantana.github.io/metal-bending/)

A playground on Apple Silicon with seven single-concept examples, six graphics programs, and a working proof gate. The README is in Portuguese; the code is the common language.

**Read it for:** the smallest repository that still has the full shape. Each example is one file, and each file is one idea: `01_hello.bend` for `do`, `02_types.bend` for `type ... is Data`, `03_recursion.bend` for terminating recursion, `04_parallel.bend` for the fork shape, `05_arrays.bend` for one-owner arrays, `06_io.bend` for `IO.fork` and channels, `07_monads.bend` for `do` over `Maybe`.

**Start at:** `examples/02_types.bend`, then `LAWS.bend`. The file opens with `add_zero` and `append_nil` from Base, then states `total_cons` about the repository's own `src/math.bend`. That is the progression the tutorial describes: prove a Base fact, then prove a fact about your code. `gfx/01_mandelbrot.bend` is the same language doing a GPU-shaped loop in a window.

**Composition lesson:** one concept per file, one claim per law, and a gate the README shows failing as well as passing. The `gfx/` directory is separate from `examples/` because rendering is a different concern with a different driver.

### bend-voxel: an engine, an app, and acceptance scripts

**Repository:** [aivv73/bend-voxel](https://github.com/aivv73/bend-voxel)

A voxel engine with destructible environments and a native window. The repository separates the editable body (`voxel.bend`), the renderer (`render.bend`), lighting (`lighting.bend`), materials (`material.bend`), and the DDA traversal (`dda.bend`) from the application shell (`atelier.bend`, `main.bend`).

**Read it for:** acceptance checks written in Bend rather than in a separate test framework. `scripts/reference_check.bend`, `scripts/lighting_check.bend`, `scripts/material_check.bend`, `scripts/image_check.bend`, and `scripts/ui_check.bend` are programs that compare complete outputs: cell sets, sun-depth texels, material exports, and CPU/GPU images. The `docs/` directory keeps the evidence, including the raw TSV and log files behind the DDA comparison.

**Start at:** `LAWS.bend` for the material and geometry invariants, then `voxel.bend` and `dda.bend`. Then read `scripts/reference_check.bend` to see how a test is just another Bend program with an exit condition.

**Composition lesson:** the engine is a library of pure modules, and every executable is a thin driver. The `Makefile` exposes `make test`, `make geometry`, `make lighting`, `make materials`, and `make images` so each layer of evidence can be run alone.

### bend-craft: a deterministic game core

**Repository:** [costamatheus97/bend-craft](https://github.com/costamatheus97/bend-craft)

A block world with terrain, a first-person player, and a per-pixel voxel ray tracer. The whole game is U32 fixed point, so a run is a function of its seed and input log, and every frame is the same bytes on JavaScript, native C at one or many threads, and the GPU.

**Read it for:** the cleanest small example of the pure-core pattern. `world.bend` is the world as one flat `Array<U32>` and its terrain generator. `render.bend` is the Amanatides-Woo DDA and four shading tiers. `game.bend` is a pure 60 Hz `step` plus `render(state)`. `play.bend` is the only game file that reads a clock, a window, or a device; the benchmarks read them too.

**Start at:** the README's file list, then `game.bend` and `play.bend` side by side. The gap between them is the architecture. `tests/world.bend`, `tests/render.bend`, and `tests/game.bend` test the pure side; `run_tests.sh` runs them. `bench/` holds the scripts that produced the README's numbers, and `LOG.md` and `OPTIMIZATIONS.md` record what was tried and rejected.

**Composition lesson:** determinism is a design constraint, not a test added later. Keeping time and I/O in `play.bend` is what lets the same `step` run in a benchmark, a replay, and the window.

### bendoom: a large port, decomposed

**Repository:** [eliesgalvira/bendoom](https://github.com/eliesgalvira/bendoom)

Doom's first level, E1M1, written in Bend 2. The README carries a "SLOP WARNING" and says there was no adult supervision of the code. Treat that as a warning about style, not about usefulness: the decomposition is the lesson.

**Read it for:** how to port a large C program without turning it into one file. `src/` has one module per concern: `wad.bend` for the archive, `bsp.bend` for the level tree, `render.bend`, `sim.bend`, `things.bend`, `sprites.bend`, `sfx.bend`, `opl.bend`, and `music.bend`. `doom.bend` is the game driver; `film.bend` replays a demo to video; `tests/` mirrors the module list with one test file per subject.

**Start at:** `LAWS.bend`, which states byte, WAD, key, sound, and simulation invariants, then `src/bytes.bend` and `src/sim.bend`. Read `nix/proof.nix` and `nix/tests.nix` to see how the proof gate and the test matrix are wired into CI.

**Composition lesson:** a port is a set of named modules plus a reference oracle. `tools/oracle.nu` compares frames against Chocolate Doom, so the port has an external definition of correct, not just an internal one.

### elpis-fast: spec, laws, proof, diff

**Repository:** [gildrb/elpis-fast](https://github.com/gildrb/elpis-fast)

A 4-bit quantized Qwen inference engine with decode and prefill kernels, measured on one RTX 3090. It is dense and specialized; read it for the unit of work, not for a general application layout.

**Read it for:** the spec/laws/proof/diff discipline around each optimized kernel. A kernel such as `attn_chunk` has `attn_chunk.bend`, `attn_chunk_spec.bend`, `attn_chunk_laws.bend`, `attn_chunk_proof.bend`, and `attn_chunk_diff.py`. The `.bend` file is the fast implementation, `_spec` is the reference definition, `_laws` states their relationship, `_proof` proves it, and `_diff` compares against a trusted implementation. The `*_TABLE.bend` files are decision tables for scheduling and attention shapes.

**Start at:** `LAWS.bend` and `PROOF.bend` at the root, then one kernel family from the README table. The repository's "What fast means" section is as important as the code: a speedup is kept only if the output is unchanged or passes a named quality gate, and each gate records thresholds set before the runs.

**Composition lesson:** performance work is not exempt from specification. The spec stays readable, the optimized kernel stays fast, and the proof plus the differential test connect them.

### bend-collections: a library with specs and proofs

**Repository:** [Giulio2002/bend-collections](https://github.com/Giulio2002/bend-collections)

Containers and cryptographic primitives in stock Bend, benchmarked against optimized C implementations of the same algorithms. The README has a table of containers and another for SHA-256, Keccak, BLAKE, AES-GCM, Argon2id, and the other crypto modules.

**Read it for:** how a real library separates the public module, the specification, and the proof. `src/containers/` holds the implementations (`dynamic_array.bend`, `deque.bend`, `balanced_search_tree.bend`, `hash_table.bend`, `lru.bend`). `spec/` holds reference definitions, `proofs/` holds the proof modules, and the root `laws.bend`, `laws_containers.bend`, `laws_crypto.bend`, and `laws_math.bend` group the claims by area. `benchmarks/bend/` runs the same workloads as the native C baselines.

**Start at:** `src/containers/deque.bend` and its proof under `proofs/containers/`, then `laws.bend`. The cryptographic modules show the same shape at a larger scale: a specification, a proved equality, and published test vectors.

**Composition lesson:** a container is not "done" when it works. It is done when its invariants have a specification, a proof, and a measurement against the implementation it replaces.

### backplane: a large application in flat modules

**Repository:** [i2cjak/Backplane](https://github.com/i2cjak/Backplane)

A large workspace for agentic hardware development, with deterministic KiCad and STEP viewers. It is a real product with a release process, not a sample.

**Read it for:** how a large Bend codebase stays navigable. `src/core/` is a flat set of roughly 140 small modules named after one concept each: `json.bend`, `codec.bend`, `semver.bend`, `sha256.bend`, `schematic.bend`, `pcb2d.bend`, `pcb3d.bend`, `model.bend`, `store.bend`. `src/app/` holds the view layer: `main.bend`, `layout.bend`, `render.bend`, `viewer.bend`, `theme.bend`, and one module per surface.

**Start at:** `src/app/main.bend` to see the entry point, then `src/core/json.bend` or `src/core/codec.bend` as a representative leaf. `LAWS.bend` and `PROOF.bend` sit at the root, so the proof gate covers the whole product with one command.

**Composition lesson:** flat names beat deep hierarchies when the names are specific. `src/core` is a vocabulary; `src/app` is a presentation of that vocabulary. Neither imports sideways for convenience.

### bend-frontend: a checker with a typed output

**Repository:** [ind-igo/bend-frontend](https://github.com/ind-igo/bend-frontend)

A composable frontend for full upstream Bend 2. It checks a program once and returns a typed, serializable `Core.Program` for a backend.

**Read it for:** the boundary between a language and its consumers. `src/core.bend` is the authoritative schema for the output. `src/decode.bend` turns upstream terms, patterns, declarations, and templates into that schema and rejects proof holes and missing `LAWS` imports. `src/frontend.bend` exposes `Frontend.check` and `Frontend.or_die`. `src/wire.bend` handles metadata numbers. `src/cli.bend` is a small driver. `host/adapter.js` and `host/run.js` attach the checker and I/O to the Bend process.

**Start at:** `src/core.bend`, then `src/decode.bend`, then `src/LAWS.bend`. The laws are about the output: `bare_idempotent`, `missing_laws_rejected`, `complete_accepted`, and `metadata_overflow_rejected`. That is a useful example of laws stated at an API boundary rather than about arithmetic.

**Composition lesson:** the IR is a schema, decoding is a pure step, the host adapter is the only JavaScript in the runtime path, and every backend consumes the same serializable value. `ind-igo/bend-evm` is a separate repository that does exactly that.

### bend-packages: a map of the ecosystem

**Repository:** [lilalittle/bend-packages](https://github.com/lilalittle/bend-packages)

A curated, regularly refreshed overview of [BendHub](https://hub.bend-lang.com): top packages, source repositories, publishers, and an A–Z list. The snapshot in this chapter's sources lists 703 packages on 2026-10-19.

**Read it for:** finding the next repository. The README groups picks by purpose: verified math and proofs, tensors and autodiff, web and networking, tools, games. Each row names the hub package, the version, the source repository when one is public, and the import line.

**Start at:** the "Top picks" tables, then `ALL_PACKAGES.md` when you know the name you want. The README also explains the two import forms: a name and version such as `bend-mathlib@0.7.3.0/nat.bend`, which resolves to a content hash, and the raw hash form, which always resolves to the same code.

**Composition lesson:** packages are the unit of reuse. A repository that publishes several packages, such as `bend-kit` or `bend-ml`, shows how to keep each one independently versioned and independently proved.

## Eight more repositories

These are the repositories I would open next. They are grouped by what they teach, not by stars.

### bendlang/bend: the official source

**Repository:** [bendlang/bend](https://github.com/bendlang/bend)

The compiler, the `Base` library, the guide, the official demos, and the test suite. This is the authority the rest of the tutorial cites.

**Read it for:** `guide/GUIDE.md`, which `bend guide` prints; `bend2/base.bend`, which `bend base` prints; `demos/` for complete programs; and `tests/` for the exact syntax and error behavior the checker accepts. Read the official tests when a tutorial chapter and a community repository disagree.

**Start at:** `guide/GUIDE.md`, then `bend2/base.bend`, then one demo and the tests for the feature you are using. Do not copy from `Base` without checking the version: the standard library changes between 2.0.x releases.

### Lulzx/bendc: a self-hosting compiler

**Repository:** [Lulzx/bendc](https://github.com/Lulzx/bendc)

A compiler for Bend 2, written in Bend 2, that compiles itself and reproduces its own output byte for byte. The README reports a bootstrap fixpoint and 80 tests passing under both stages.

**Read it for:** how to structure a compiler as passes. `bendc.bend` is the driver, `check.bend` the type checker, `core.bend` the shared representation, and `boot.bend` the bootstrap path. Each optimization or transformation has a matching proof file: `LIT.bend` with `LITPROOF.bend`, `SUBST.bend` with `SUBSTPROOF.bend`, `INLINE.bend` with `INLINEPROOF.bend`, `DEAD.bend` with `DEADPROOF.bend`. `rt/` is the runtime, split by concern (`bendrt.h`, `native.c`, `cc.c`, `gpu.h`, `hub.c`).

**Start at:** `bootstrap.sh`, then `bendc.bend` and `check.bend`. Then read one small pass and its proof together. `tests/` pairs its test programs with `.out` golden files, and `tests/check/` is a numbered suite of checker errors.

**Composition lesson:** a compiler pass is a module with an input language, an output language, and a proof obligation. The proof file next to the pass makes that obligation visible.

### paymog/bend-kit: packages with their own gates

**Repository:** [paymog/bend-kit](https://github.com/paymog/bend-kit)

A general-purpose library for Bend 2, split into packages such as `bytes`, `bignum`, `collections`, `concurrency`, `crypto`, `json`, `http`, and `cache`. Each package is published separately and has its own version.

**Read it for:** the package layout. The mature package directories contain `LAWS.bend`, `PROOF.bend`, `check.bend`, `VERSION`, the implementation (`bytes.bend`), and a `bench/` directory. `bytes/check.bend` is especially useful: it says in a comment that the laws run in the checker, where `Array` is a tree of defs, while `check.bend` runs the same operations on the runtime's native array at sizes the checker would not reach. That is a precise statement of what each gate covers.

**Start at:** `bytes/LAWS.bend`, `bytes/PROOF.bend`, and `bytes/check.bend`, then the README's "Same type" section. It explains why a caller must import the same package version the callee imports: a different version is a different type.

**Composition lesson:** one package equals one name, one version, one proof gate, and one benchmark. Dependencies are pinned by name and hash, not floating.

### nuxyel/bend-ml: dependent types in a library

**Repository:** [nuxyel/bend-ml](https://github.com/nuxyel/bend-ml)

Machine learning in Bend 2 with tensor shapes in the type. A mismatched matrix product does not compile; a `reshape` needs a proof that the element count is preserved. Six packages are published on BendHub, with an MNIST demo and a GPT-2 demo.

**Read it for:** how dependent types shape an API. `tensor/` uses lists with `Vec<n>` and `Mat<r,c>`; `tensor-array/` uses a flat `Array<F32>` with the same type-level sizes and a `Bands<r,c>` type for parallel matrix-vector work; `autograd/` has a typed backward pass; `bpe/` proves the tokenizer round trip; `binary-read/` keeps foreign code out of the proved packages. `demos/gpt2` and `demos/mnist` are the integration tests.

**Start at:** the README's two shape-error examples, then `tensor-array/main.bend`, then `autograd/main.bend`. Read the package README before the code: it names the package version, its laws, and its dependencies.

**Composition lesson:** put the invariant in the type when the type checker can carry it, and in a law when it cannot. The shape is checked at the boundary, and every layer after that is checked for any shape.

### angerman/birc: a pure core with a thin foreign edge

**Repository:** [angerman/birc](https://github.com/angerman/birc)

A terminal IRC client with a pure Bend core and a small C FFI for terminal rendering and POSIX sockets. The README reports more than 91% of the code in Bend, a zero-poll event loop, and a native DNS client.

**Read it for:** the actor-and-frame architecture. `src/bend/irc.bend` parses the protocol, `frame.bend` handles CRLF framing, `client.bend` and `buffer.bend` hold state, `submit.bend` builds outbound lines, `view.bend` lays out the screen, `session.bend` ties the pieces together, and `actor.bend` and `net.bend` do the I/O. `src/ffi/` is the thin C layer, and `src/ui/timui.h` is the rendering library.

**Start at:** `LAWS.bend` for the protocol and client invariants, then `src/bend/irc.bend` and `src/bend/frame.bend`. The `tests/pty/` directory is the part most projects skip: it drives the real terminal through a pseudo-terminal, including resize, paste, EOF, and UTF-8 split across reads.

**Composition lesson:** foreign code is acceptable when it is small, named, and at the edge. The domain stays testable because the protocol and state transitions are pure.

### FabianVegaA/mylsm: a systems program with per-module laws

**Repository:** [FabianVegaA/mylsm](https://github.com/FabianVegaA/mylsm)

An experimental durable LSM key-value store. It writes to a log, keeps sorted tables, recovers after a restart, and exposes byte and UTF-8 views of the same database.

**Read it for:** law files per module. `src/` holds the storage modules (`ByteWal.bend`, `Wal.bend`, `ByteMemTable.bend`, `SstFile.bend`, and the rest), `laws/` holds a matching file for each (`laws/ByteWal.bend`, `laws/ByteMemTable.bend`, and so on), and `PROOF.bend` imports them into one gate. `app/cli/` and `app/repl/` are separate applications over the same library. `bench/smoke/`, `bench/crash/`, and `bench/workload/` cover ordinary paths, fault injection, and sustained runs.

**Start at:** `laws/ByteWal.bend` and `src/ByteWal.bend` together, then `app/cli/main.bend`. The README is unusually explicit about the limits: the laws cover pure decisions, not filesystem behavior, process locking, or the C and JavaScript host effects.

**Composition lesson:** a large systems program can keep its proof surface small by stating laws per module and importing them at the root. The `app/` layer is a client of the library, not part of it.

### bendlib/bendlib: lemmas and a law checker

**Repository:** [bendlib/bendlib](https://github.com/bendlib/bendlib)

A foundation library with `bend-mathlib` (published lemmas about `Nat`, `Bool`, `List`, `String`, `Maybe`, equality, and order) and `lawcheck`, a tool that looks for counterexamples before you try to prove a law.

**Read it for:** how to publish proofs as a library. `packages/bend-mathlib/` has one module per subject (`nat.bend`, `list.bend`, `bool.bend`, `maybe.bend`, `order.bend`, `sort.bend`, `perm.bend`), an `all.bend` entry point, and a README with a lemma index. `tools/lawcheck` is the complement of the proof gate: it tests the law against the implementation and shrinks a failing input.

**Start at:** `packages/bend-mathlib/README.md` for the lemma index, then `nat.bend` for the style. Read the `lawcheck` section of the README before writing a new law; a false law is cheaper to find by testing than by attempting a proof.

**Composition lesson:** proofs are reusable when they are packaged like code. The `all.bend` facade keeps imports stable while the individual modules stay focused.

### 777genius/awesome-bend: the current index

**Repository:** [777genius/awesome-bend](https://github.com/777genius/awesome-bend)

A curated list for current Bend 2, explicitly not Bend 1. It tracks the latest release, the hub, the official compiler, packages, tools, demos, benchmarks, papers, and community links.

**Read it for:** discovery and release context. The list records the changes between 2.0.x releases and warns which packages may need a newer compiler. The catalog section links to generated indexes with search and filters, which are better than a static list when you are looking for a specific package.

**Start at:** the "Packages", "Demos", and "Benchmarks" sections. Then check the repository's "Last checked" date; a list is only as current as its snapshot.

**Composition lesson:** an index is part of the ecosystem. It tells you which repositories are maintained, which are experiments, and which compiler version each one expects.

## More to explore

| Repository | What to look at |
|------------|-----------------|
| [nuxyel/llama.bend](https://github.com/nuxyel/llama.bend) | A Llama-architecture implementation checked token for token against PyTorch. `reference/` holds the Python oracle; `tests/bad_weight.bend` and `tests/bad_cap.bend` are negative tests. |
| [rootagi/bend-json](https://github.com/rootagi/bend-json) | A JSON parser and serializer with `LAWS.bend`, `PROOF.bend`, an independent Python test suite, and four runnable examples. |
| [ind-igo/bend-evm](https://github.com/ind-igo/bend-evm) | A backend that consumes `bend-frontend`'s `Core.Program`, lowers it to Yul, and carries a certificate plus per-contract laws. |
| [CrocSwap/bendSVM](https://github.com/CrocSwap/bendSVM) | A Bend 2 to Solana SBF compiler with a shared SDK and several example contracts, each with its own `LAWS.bend` and `PROOF.bend`. |
| [MatheusBBarni/bendJVM](https://github.com/MatheusBBarni/bendJVM) | A JVM interpreter organized as parser, verifier, linker, and runtime, with a differential test harness against the reference JVM. |
| [nicolas-abril/bend2-libs](https://github.com/nicolas-abril/bend2-libs) | Many small packages in one repository (`bytes`, `deflate`, `png-decode`, `jpeg-decode`, `truetype`, `http-server`), each with its own entry and tests. |
| [OkeyAmy/bend-voxel-bench](https://github.com/OkeyAmy/bend-voxel-bench) | An honest benchmark: a Luanti terrain port, a live race against the C++ original, and a `docs/bend-notes.md` list of the traps hit along the way. |
| [jonathanperis/jonlib](https://github.com/jonathanperis/jonlib) | A raylib-compatible graphics and math library that replays upstream examples frame by frame against the native reference. |

## What to copy, and what not to

Copy these:

- **The gate.** `LAWS.bend` plus `PROOF.bend` at the root of the project, and a README command that runs it.
- **The pure core.** A domain module that takes values and returns values, with the clock, the window, the filesystem, and the network in a separate driver.
- **The named effect.** A `.c` or `.js` file behind one Bend signature, with the host boundary documented.
- **The matching test.** A `tests/` file for each domain module, and a `check.bend` for the parts the checker cannot reach.
- **The pinned version.** The compiler version in the README, and the package version or hash in the import.

Do not copy these:

- **A law that restates the implementation.** A claim such as "for every `x`, `f(x) == f(x)`" passes and says nothing. A law should name a behaviour a caller relies on.
- **A proof that hides a hole.** A `?TODO` or an `@unsafe` dependency makes the gate weaker. The tutorial's [chapter 07](/tutorial/07-laws-and-proofs/) shows the messages.
- **A benchmark without a baseline.** A time in milliseconds with no machine, thread count, compiler version, or comparison is not evidence.
- **Foreign code as a shortcut.** If a `.c` file does the work, the Bend code is a wrapper, and the laws prove the wrapper, not the work.
- **A repository wholesale.** Bend 2 is moving. A repository pinned to 2.0.22 may use syntax that 2.0.37 rejects, and the reverse. Read its version first.

## Versions and freshness

All repository links in this chapter were checked on 2026-10-20. The latest stable release named by `awesome-bend` on that date was Bend 2.0.37. The tutorial's own runnable blocks were checked with Bend 2.0.25, so a repository that requires a newer compiler may reject code that this tutorial accepts, and a repository that uses an older feature may need `bend update` or a pinned checkout.

When a repository and this tutorial disagree, the compiler in front of you decides. Run `bend version`, then run the repository's proof command. If the proof gate passes, read the code; if it fails, read the version notes before changing anything.

## Next

Go back to the [table of contents](/tutorial/), or pick one repository and read it in the order above. The most useful next step is to take `metal-bending`'s shape, add one law about your own code, and run the gate.
