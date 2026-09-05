# HVM4, explained

Last updated 2026-08-21. Canonical: https://bend2.dev/notes/hvm4-explained/

HVM4 is Higher Order Company's fourth-generation runtime and the substrate Bend2 is built on.
It is [public on GitHub](https://github.com/HigherOrderCO/HVM4): a C implementation of what its
documentation calls the
[Interaction Calculus](https://github.com/HigherOrderCO/HVM4/blob/main/docs/theory/interaction_calculus.md),
created in November 2025 and pushed through mid-2026, with a README that opens "you're here
before launch. Use at your own risk."

## The model of computation

HVM4 evaluates a program as a graph and computes by rewriting: each rule consumes one adjacent
pair of nodes and writes a bounded replacement in its place, consulting nothing else. Two
guarantees follow from that narrowness. A rewrite owns exactly the memory of its two nodes, so
rewrites on disjoint pairs proceed with no locks; and the rules are confluent, so every order
of rewrites reaches the same result, which lets any idle core take any pending pair.
Parallelism stops being a language feature and becomes a scheduling decision. What locality
does not buy is a small constant: every step is graph surgery against real memory, and closing
that gap is what the runtime generations have been about.

## Superpositions

HVM4's calculus has a primitive most runtimes lack: a term can be a superposition of two
values. From the README:

```
@main = (&{1, 2} + 10)
//11
//12
```

One expression, two results, because `&{1, 2}` flows both values through the addition, sharing
all the work that does not depend on the choice. The dual primitive, duplication, lets one
value feed two uses without copying. Superpositions are how an evaluator explores many branches
of a search space while paying for the common structure once.

## Four generations

HVM4 closes a lineage that has been public since 2022. [HVM1](https://github.com/HigherOrderCO/HVM1)
was the lazy, optimal-reduction evaluator that showed interaction combinators could be fast in
practice on CPUs. [HVM2](https://github.com/HigherOrderCO/HVM2) went strict, compiled to C and
CUDA, and carried the original Bend at its
[May 2024 launch](https://news.ycombinator.com/item?id=40390287), along with Bend1's documented
limits: 24-bit numbers from the compact node encoding, a memory ceiling from fixed-width arena
addressing. [HVM3](https://github.com/HigherOrderCO/HVM3) iterated through early 2026. HVM4
consolidates the line into a strikingly small artifact: the whole runtime builds with one
command, `clang -O2 -o src/hvm src/hvm.c`, and ships its
[memory layout](https://github.com/HigherOrderCO/HVM4/blob/main/docs/hvm/memory.md) and
[interaction rules](https://github.com/HigherOrderCO/HVM4/tree/main/docs/hvm/interactions) as
documentation next to the code.

## What the AOT compiler changes

HVM4's ahead-of-time compiler was one of three items on the
[2026-03-05 launch-blocker list](https://x.com/VictorTaelin/status/2029567059881857081), and it
targets the lineage's known weakness. An interpreted evaluator pays dispatch overhead on every
rewrite: fetch the node, branch on its kind, mutate the graph. Compiling a program's rewrite
rules ahead of time to native C removes the dispatch and lets the compiler specialize memory
access per rule, which attacks exactly the constant factor that made a tuned CPU core
competitive with Bend1's GPU throughput. The second blocker, the GPU runtime, resolved in July:
[a coding model ported the Metal backend to CUDA in a night](https://x.com/VictorTaelin/status/2078471338755232193),
and the port outran its reference on RTX.

## What HVM4 means for Bend2

HVM4 is the half of Bend2 you can read today. The language, the type checker, and SupGen remain
private, but the runtime's calculus, memory layout, and interaction rules are inspectable, and
they constrain what the language above them can be: parallel by default, superposition-capable,
compiled rather than interpreted. The repository carries no license text as of 2026-08-04, so
there is no grant to build on it yet.