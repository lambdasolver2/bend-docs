---
title: "Bend 2 tutorial: table of contents"
description: "A beginner's path through Bend 2 for Haskell and OCaml programmers: syntax and checker rules, ownership, interaction nets, parallel runs, laws and proofs, and what Bend 2 does not have."
updated: 2026-10-20
verified: 2026-10-20
status: runnable
canonical: /tutorial/
sources:
  - https://bend2.dev/contents/
  - https://bend2.dev/llms.txt
  - https://bend2.dev/learn/examples.json
  - https://bend2.dev/errors/diagnostics.json
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
  - https://github.com/777genius/awesome-bend
  - https://hub.bend-lang.com
---

# Bend 2 tutorial

This tutorial teaches Bend 2 to someone who already knows Haskell or OCaml. It covers the syntax and the checker's rules, how values are owned and copied, the interaction-net model behind the language's history, parallel execution, and how to state and prove properties as *laws*.

It is unofficial and not affiliated with Higher Order Company. The reference is [bend2.dev](https://bend2.dev/) and the official guide, which `bend guide` prints from your installed compiler.

## What you can do at the end

- Read a Bend 2 program, including its annotations, and predict whether the checker accepts it.
- State a law, prove it with a same-named `def`, and read the checker's messages when a proof fails.
- Say when a parallel call really runs in parallel, and how to measure it.
- Say what Bend 2 does **not** have (SupGen, `sup` syntax, copy-on-write forks of running code, homoiconic self-modification), and what to use instead.
- Open a real Bend repository, find its laws, entry point, tests, and effect boundary, and say what it proves and what it only measures.

## Table of contents

| # | Chapter | You learn | Status |
|---|---------|-----------|--------|
| 01 | [First programs](/tutorial/01-first-programs/) | installing, the four run modes, functions, `let`, `match` on `Bool`, numbers, strings, tuples, lists | runnable |
| 02 | [Data and recursion](/tutorial/02-data-and-recursion/) | algebraic data types, records, nested and multi-scrutinee matching, termination, imports, definition order | runnable |
| 03 | [Ownership and copying](/tutorial/03-ownership-and-copying/) | affine binders, `+`, `-`, `Data` versus `Type`, kinds, arrays, maps, templates, closures, folds | runnable |
| 04 | [Interaction nets](/tutorial/04-interaction-nets/) | cells, ports, active pairs, rules, confluence, the symmetric interaction combinators, labels and the text of the Interaction Calculus, β as one step | conceptual, pen and paper |
| 05 | [Parallelism and the runtime](/tutorial/05-parallelism-and-runtime/) | parallel calls, the fork shape, leaves, `!` GPU calls, `--threads`, measuring, auditing the emitted C | runnable |
| 06 | [Duplication, superposition, SupGen](/tutorial/06-duplication-superposition/) | `dup` and `sup`, labels, search by superposition, and what Bend 2 does not have | conceptual, with checked parse errors |
| 07 | [Laws and proofs](/tutorial/07-laws-and-proofs/) | laws, `{==}`, match refinement, induction, rewrites, holes, the LAWS and PROOF layout, the gate | runnable |
| 08 | [Dependent types and totality](/tutorial/08-dependent-types-and-totality/) | types computed from values, `Unit` and `Empty`, length-indexed lists, termination, `@unsafe` | runnable |
| 09 | [IO, files, and targets](/tutorial/09-io-files-and-targets/) | `do` blocks, effects, fork and join, channels, files, arguments, C, JavaScript, and native builds | runnable |
| 10 | [Branching and self-change](/tutorial/10-branching-and-self-change/) | what SupGen, copy-on-write forks, and homoiconic code would need, and what Bend 2 offers instead | runnable, design |
| 11 | [Rules and errors](/tutorial/11-rules-and-errors/) | the checker's rules, every official diagnostic with its real message, version differences | reference |
| 12 | [Syntax reference](/tutorial/12-syntax-reference/) | the model in three layers (kinds, types, values), every syntax form on one sheet, laws and proofs, evaluation, and the checker's messages for the common mistakes | runnable |
| 13 | [Glossary for Haskell and OCaml programmers](/tutorial/13-glossary/) | term-by-term mapping and definitions | reference |
| 14 | [Superposition, collapse, and SupGen](/tutorial/14-superposition-and-supgen/) | the Interaction Calculus behind `sup` and `dup`, labels, collapse, search with erasure, what is public about SupGen, and whether a cheap fork exists | runnable, needs the Interaction Calculus binary |
| 15 | [Capstone: a checked command parser](/tutorial/15-capstone/) | a job-queue parser built from constructors, `Maybe`, two proved laws, and command-line arguments | runnable |
| 16 | [Reading real Bend repositories](/tutorial/16-references/) | a curated map of community and official repositories: what each one demonstrates, which files to open first, and which composition patterns to copy | reference |

## Reading path

Read 01, 02, and 03 in order. They teach the language itself. Then read 07 and 08 (laws, proofs, dependent types), 05 (parallelism), and 09 (effects). Chapters 04 and 06 are the machine model and history: read them before 10, which applies everything to forking and testing branches. Keep 11 to 13 open as references, with 12 for every syntax form. Finish with 15, which combines the parts into one checked program. Then use 16 as a map of real repositories to read next.

## How to read the boxes

Some sections set their key points apart in three kinds of box:

> **Core insight.** The one idea that the next part depends on.

> **Definition.** What a term means in this tutorial.

**Composed of:** a `text` block lists what a thing is made of. A `-` starts each part, a `|` between names means one of them, and indentation shows nesting. So `CON | DUP | ERA` reads as one of three cells.

## Versions

- Checked with **bend 2.0.25** on 2026-10-17. Run `bend version` to confirm yours.
- The examples on bend2.dev are pinned to **2.0.36** (commit `ae1101c`). 39 of its 42 examples print the documented output on 2.0.25. The other three print `All terms check.` where the site prints `ALL PROOFS CHECK`. 8 of 9 official diagnostics produce an error on 2.0.25, with the wording differences listed in chapter 11. The ninth uses `f?` names that 2.0.25 cannot parse.
- Version differences that change what you type are listed in [chapter 11](/tutorial/11-rules-and-errors/#version-differences). The most important one: `bend PROOF.bend --verdict` does not exist in 2.0.25.

## Honest limits

1. **Bend 2 does not run on interaction nets.** Chapter 04 explains the model behind the language's history. The released compiler emits a flat C evaluator called BendRT, which has no active pairs at runtime.
2. **The released compiler has no SupGen, no `sup` syntax, and no homoiconic self-modification.** Chapter 06 shows the evidence. `&{1, 2}` is a parse error, and nothing in `bend base` or `bend guide` describes SupGen.
3. **"Cheap" and "fast" are measurements, not theorems.** A law proves a property of the values a program computes. Cost, memory, and speed come from running the program and counting what the emitted C does.

## How the examples are checked

Each ` ```bend ` block is a complete program. `scripts/check-tutorial.py` compiles and runs every one of them with the installed `bend`:

- a block followed by an ` ```output ` block must print exactly that text;
- a block followed by an ` ```error ` block must fail with those lines;
- a block followed by a ` ```contains ` block must print those lines;
- a block with no expectation must pass `bend FILE --check-only`.

`ic` and `ic-collapse` blocks run Victor Taelin's Interaction Calculus reference binary when `IC_BIN` points to it, and are reported as skipped otherwise. Fences marked `text`, `sh`, or `bend-syntax` are documentation and are not run.

```sh
python3 bend-docs/scripts/check-tutorial.py bend-docs/src/content/tutorial
```
