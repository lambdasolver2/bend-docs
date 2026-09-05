# Bend2 vs Bend1: what changed

Last updated 2026-08-30. Canonical: https://bend2.dev/notes/bend2-vs-bend1/

Bend2 is the unreleased successor to [Bend](https://github.com/HigherOrderCO/Bend), called Bend1
here; Bend1 is public and installable. Bend2 keeps the execution model, replaces the runtime
generation, adds a type system, and is [expected around
2026-09-02](/notes/bend2-release-date/).

## What Bend1 proved

Bend1, [launched May 2024](https://news.ycombinator.com/item?id=40390287), demonstrated that
recursion and algebraic data types written in a Python-flavored syntax, with no annotations of
any kind, could saturate a GPU. The [HVM2 runtime](https://github.com/HigherOrderCO/HVM2)
evaluates programs as interaction nets, graphs reduced two adjacent nodes at a time, and
rewrites that touch different pairs cannot conflict, so parallelism is a scheduling decision
rather than a language feature.

## Where the costs were

Bend1's limits were mostly consequences of one design decision: represent everything as
interaction-net nodes compact enough to move through memory fast. Numbers were 24-bit (`u24`,
`i24`, `f24`) because the node encoding budgets its bits for tags and ports first, and
immediates get what remains. Graph memory was capped in the low gigabytes by fixed-width arena
addressing. IO stayed minimal because pure graph reduction has no natural place for effects, and
the effect boundary had not been built. Evaluation was strict only: HVM1 had been the lazy,
optimal-reduction line, and HVM2 traded that away for a model that mapped onto GPUs. On top of
all this sat a large constant factor, so a single tuned CPU core could beat impressive-sounding
GPU throughput on many workloads.

## What Bend2 keeps

Bend2 keeps automatic parallelism on the interaction-net substrate, now four runtime
generations in, with [HVM4](https://github.com/HigherOrderCO/HVM4) public and pushed into
mid-2026. Bend2 has Metal and CUDA backends. The
[CUDA port report](https://x.com/VictorTaelin/status/2078471338755232193) records a one-night
port by a coding model working against the Metal implementation as executable spec and test
oracle. Its benchmark puts CUDA ahead of Metal on RTX and at roughly 10x parallel C for most
programs.

## What Bend2 adds

Bend2 adds dependent types in the tradition of Higher Order Company's
[Kind](https://github.com/HigherOrderCO/Kind): types that can mention values, so "a sorted list"
or "a parser that round-trips with this printer" is a type, and the checker rejects
implementations that do not satisfy it. Proofs can replace whole categories of tests, and types
precise enough to pin down behavior make generated code checkable. SupGen synthesizes those
implementations and appears in the
[launch-blocker list](https://x.com/VictorTaelin/status/2029567059881857081).
The checker moved to TypeScript running under Bun in July 2026. Bun supplies its runtime.

The August 2026 samples lift two of Bend1's three limits. The
[parallel sum](/learn/parallelism/) types its arguments `U32`, lifting numbers from 24 bits to
32, and [hello world](/learn/hello/) reads input and prints inside a
`do` block typed `IO<Unit>`, which is more IO surface than Bend1 ever showed. The memory
ceiling stays unknown. The public compiler is not available, so all three remain release-day
checks.

## Which to use today

Bend1 is the only Bend that runs as of 2026-08-30, and for workloads that fit inside 24-bit
numbers and minimal IO it remains a working demonstration of automatic parallelism:
[the Bend repository](https://github.com/HigherOrderCO/Bend). Bend2 has no public compiler yet.