# Interaction nets, explained

Last updated 2026-08-21. Canonical: https://bend2.dev/notes/interaction-nets-explained/

Interaction nets are a model of computation published by Yves Lafont at
[POPL 1990](https://dl.acm.org/doi/10.1145/96709.96718): a program is a graph of cells, and
every step of execution rewrites exactly two cells that face each other. They are the substrate
under [HVM4](https://github.com/HigherOrderCO/HVM4) and therefore under Bend2.

## The problem they solve

Interaction nets answer a scheduling question: how can ten thousand workers rewrite one program
without coordinating? Take (λx. x + x) E for an expensive E. Substitute textually and you
evaluate E twice; share E as a graph node and every worker that reaches it must agree on who
computes it, which in a conventional runtime means a lock, a tag word, or a compare-and-swap,
with a garbage collector underneath. The standard designs put coordination in the runtime and
tune it. Lafont instead constrained the model itself, making a single step so narrow that no
interleaving of steps can go wrong.

The shape came from logic. Girard's linear logic ("Linear logic", Theoretical Computer Science
50, 1987) treats propositions as resources consumed exactly once, and its proofs are nets
rather than trees. Lafont distilled the computational core into a freestanding machine model,
fourteen pages in the same
[POPL 1990 proceedings](https://dl.acm.org/doi/10.1145/96709.96718) that carried Lamping's
optimal-reduction algorithm.

## The model

An interaction net is a graph of cells. A cell is one constructor or one operation of the
program: a number, a +, a list node, a λ. Its symbol says which of these it is, its auxiliary
ports are where its arguments and results wire in, and its single principal port, drawn at the
apex, is the one place it can react.

<Diagram
  of="cell"
  caption="A cell: symbol α, one principal port at the apex, auxiliary ports x₁ … xₙ."
/>

A net is any graph built by wiring ports together in pairs; ports left unwired are the net's
interface. Computation happens in exactly one configuration, two cells wired principal port to
principal port, an active pair. For each unordered pair of symbols the system declares at most
one rule,

<p class="math">α(x₁, …, xₘ) ⋈ β(y₁, …, yₙ) ⟶ N</p>

where N is a fixed net exposing the same free ports x₁ … xₘ, y₁ … yₙ. A system over _k_
symbols therefore has at most _k_(_k_+1)/2 rules, and a firing consumes the two cells and
writes N in their place.

<Diagram
  of="rule"
  caption="An interaction rule fires only where two principal ports meet, and replaces the pair with a fixed net N on the same free ports."
/>

A cell has one principal port, so it faces at most one other cell, so it belongs to at most
one active pair, so two active pairs can never share a cell. Redexes in an interaction net are
disjoint by construction, before any analysis runs, and nothing about a step requires seeing
the rest of the graph.

## The two theorems

Interaction nets rest on two theorems: one-step confluence, from the
[1990 paper](https://dl.acm.org/doi/10.1145/96709.96718), and universality from three symbols,
from its [1997 sequel](https://www.sciencedirect.com/science/article/pii/S0890540197926432).

Fire two different active pairs of a net N in either order and the results close in one step.

<p class="math">N ⟶ N₁, N ⟶ N₂ ⟹ ∃M: N₁ ⟶ M ⟵ N₂</p>

The proof is one sentence. The two active pairs share no cell, so firing one leaves the other
intact, and the two orders write the same graph.

<Diagram
  of="diamond"
  caption="One-step confluence: firing a then b, or b then a, lands on the same net M."
/>

Every reduction order reaches the same normal form, so no scheduler can produce a wrong
answer. Every reduction to normal form takes the same number of steps, so the work in a
program is a property of the program, and a profiler's count means something independent of
core count. And any idle worker may fire any active pair it finds, because nothing it does can
invalidate a redex elsewhere. This theorem is why
[hvm4-explained](/notes/hvm4-explained/) can say parallelism stops being a language feature and
becomes a scheduling decision.

The second theorem is about how little suffices. Lafont's
[interaction combinators](https://www.sciencedirect.com/science/article/pii/S0890540197926432)
(Information and Computation 137, 1997) cut the alphabet to three symbols, γ, δ, ε, under six
rules, and prove the system universal. Theorem 1 translates any interaction system into it
while preserving the structure of the computation, degree of parallelism included. The rules
come in two families. A symbol meeting itself annihilates, leaving wires. Distinct symbols
commute, each passing through the other and copying it.

<Diagram
  of="commute"
  caption="Commutation of δ against γ: each passes through and copies the other, one cell per step, interleaved with every other rewrite in the net."
/>

That commutation square is what sharing looks like here. A δ does not copy a subgraph in one
gulp; it copies one cell per interaction and moves on, so duplication is incremental and
interleaves with the computation consuming the copies. Erasure is the same trick run by ε,
garbage collection as local rewriting, with no collector thread to pause anything.

## The λ-calculus arrives, with fine print

Interaction nets run the λ-calculus with β-reduction as a single constant-time rule, and the
fine print on duplication is where three decades of research live. Encode abstraction and
application as cells and a β-redex is exactly an active pair:

<Diagram
  of="beta"
  caption="β-reduction as one interaction. Application meets abstraction, the argument wire becomes the variable, the result wire becomes the body."
/>

β becomes cheap; duplication carries the real difficulty, because a variable used twice needs a
δ, and how much a δ should copy, and when, is the whole question. Lamping's
[POPL 1990 algorithm](https://dl.acm.org/doi/10.1145/96709.96711) answered it in the strongest
sense, with reduction optimal in Lévy's 1978 definition, never contracting two members of the
same redex family separately. The fine print arrived in 1998, when Asperti and Mairson
[proved](https://dl.acm.org/doi/10.1145/268946.268971) that the bookkeeping full optimality
requires is not bounded by any elementary function of the number of optimal steps. Optimal
counts β-steps; it does not promise the accounting is cheap. The HVM line draws the
engineering conclusion. Duplication stays bookkeeping-free, defined by
[HVM4's interaction calculus](https://github.com/HigherOrderCO/HVM4/blob/main/docs/theory/interaction_calculus.md)
as a primitive of its own rather than a transparent implementation of substitution, and
Lamping's completeness is traded for constant factors.

## In the machine

In HVM4 a cell is a tagged machine word, an active pair is an entry in a queue, and an
interaction is a handful of loads and stores against
[a documented memory layout](https://github.com/HigherOrderCO/HVM4/blob/main/docs/hvm/memory.md).
None of it needs a lock, because disjointness lets any core or warp pull pending pairs from a
queue while confluence keeps the answer independent of who pulled what. The cost is the
constant factor. Every step is graph surgery against real memory, and grinding that factor
down is what the [runtime generations](/notes/hvm4-explained/) are for. Numbers meet the same
wall. A pure net would encode 1000 as a chain of a thousand cells, so practical runtimes store
machine integers inside the node word, where the width left over after ports and tags sets the
range; [Bend1 had 24 bits left](/notes/bend2-vs-bend1/). Duplication surfaces to the programmer
as HVM4's superpositions, covered in [hvm4-explained](/notes/hvm4-explained/). The warrant for
building a language on all this is Lafont's translation theorem, which Taelin
[cited directly in April 2024](https://x.com/VictorTaelin/status/1779203515098845626).
Compilation into combinators preserves the degree of parallelism, so a program lowered onto
nets inherits the diamond, and the scheduler inherits its freedom.

## Where to read

Interaction nets have a short canonical shelf. [Lafont 1990](https://dl.acm.org/doi/10.1145/96709.96718),
pages 95–108 of the POPL proceedings, has the definition, the type discipline, and the
deadlock-freedom argument. [Lafont 1997](https://www.sciencedirect.com/science/article/pii/S0890540197926432)
has the combinators, three symbols under six rules, and the universality translation.
[Lamping 1990](https://dl.acm.org/doi/10.1145/96709.96711) and
[Asperti–Mairson 1998](https://dl.acm.org/doi/10.1145/268946.268971) are the optimality arc,
the promise and its price, and Asperti and Guerrini's _The Optimal Implementation of Functional
Programming Languages_ (Cambridge University Press, 1998) is the book-length account. The
[HVM4 repository](https://github.com/HigherOrderCO/HVM4) keeps the calculus and the memory
layout as documentation next to the code, which is where theory stops being the right word.