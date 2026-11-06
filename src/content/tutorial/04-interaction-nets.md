---
title: "Bend 2 tutorial 04: interaction nets"
description: "Cells, ports, active pairs, local rewrite rules, confluence, Lafont's symmetric interaction combinators, and beta-reduction as one interaction, with what the released Bend 2 runtime does instead."
updated: 2026-10-18
verified: 2026-10-18
status: docs-only
canonical: /tutorial/04-interaction-nets/
sources:
  - https://bend2.dev/notes/interaction-nets-explained/
  - https://bend2.dev/notes/bendrt-explained/
  - https://bend2.dev/notes/hvm4-explained/
  - https://bend2.dev/learn/duplication/
  - https://dl.acm.org/doi/10.1145/96709.96718
  - https://www.sciencedirect.com/science/article/pii/S0890540197926432
---

# 04: interaction nets

This chapter is about a computation model, not a Bend program. You will not run any code here. Its purpose is to explain three words you will see in Bend's documentation, *active pair*, *confluence*, and *duplication*, and why the designers started from this model.

Status: **docs-only**. The examples are pen-and-paper exercises. Chapter 05 shows what the released compiler does.

## The problem: copying is the whole game

Lambda calculus has one operation that does the work: β-reduction, which substitutes an argument into a function body. A variable used twice in the body forces you to copy the argument, and if the argument is itself an expensive computation, the copy repeats the work. Tree-shaped rewriting has no way to share that work.

Interaction nets solve this by representing a term as a graph. A shared piece of the graph is one node with several wires leaving it, so it is computed once. The price is that copying becomes an explicit operation with its own rules.

## Cells, ports, and nets

A **cell** has a symbol (its name), exactly one **principal port**, and a fixed number of **auxiliary ports**. A **net** is a collection of cells whose ports are joined pairwise by wires. A port that has no wire is free, and the free ports form the net's *interface*.

```text
        aux 1     aux 2
          |         |
        +-----------+
        |  symbol   |
        +-----+-----+
              |
           principal
```

> **Core insight.** A net is a graph, and its rules rewrite the graph. Released Bend 2 does not build that graph. Its runtime runs definitions, as the BendRT block below shows.

**Composed of: a net.**

```text
net
- cells: CON | DUP | ERA, each with one principal port
- auxiliary ports: CON 2, DUP 2, ERA 0
- wires: each joins two ports; a port with no wire is part of the interface
```

## Active pairs and rules

Two cells joined by a wire between their principal ports form an **active pair**. Only an active pair can be reduced. A **rule** replaces an active pair with another net that has the same free ports. The rule is local: it reads two cells and rewrites them, and nothing else.

Each unordered pair of symbols has at most one rule. A net with *k* symbols therefore has at most *k*(*k*+1)/2 rules. A net is in **normal form** when no active pair remains.

Two active pairs never share a cell. A cell has one principal port, so it can be part of at most one active pair. This is the property that makes local, parallel reduction safe.

## Confluence: order does not matter

Take two distinct active pairs in one net. Reducing either one leaves the other still reducible, and reducing both in either order produces the same net. This is **one-step confluence**, the diamond property:

```text
          N
        /   \
   reduce a  reduce b
        \   /
          M
```

The bend2.dev page on interaction nets states a stronger property for the same systems: if a net has a normal form, reduction order does not change that result, or the number of interaction steps needed to reach it. The same page is clear about what this does not give you. It does not guarantee that every program terminates, that every implementation of the rules is correct, or that the implementation is free of synchronization, allocation, and scheduling costs.

Read those two claims as the model's claims. Chapter 05 shows what a real runtime must still pay for.

## The symmetric interaction combinators

Lafont (1997) showed that three symbols are enough. The system is *symmetric* because its two binary symbols have the same shape, one principal and two auxiliary ports, so no special primitive is needed for lambda or copy. The bend2.dev page uses the Greek names γ, δ, ε; this chapter uses the names common in later literature:

| Symbol | Name | Auxiliary ports |
|--------|------|-----------------|
| CON | constructor (γ) | 2 |
| DUP | duplicator (δ) | 2 |
| ERA | eraser (ε) | 0 |

There are six rules, one for each unordered pair of symbols:

1. **CON–CON annihilates.** The two cells disappear, and their auxiliary ports are reconnected pairwise: first with first, second with second.
2. **DUP–DUP annihilates.** The same crosswise reconnection as rule 1.
3. **ERA–ERA annihilates.** Both cells disappear and nothing replaces them.
4. **CON–DUP commutes.** Four new cells appear: two DUP copies attached to the CON's auxiliary wires, and two CON copies attached to the DUP's auxiliary wires. Each new CON is wired to each new DUP, so the four new cells form a 2×2 crossing. The number of cells goes from two to four.
5. **CON–ERA erases.** The CON cell disappears, and two new ERA cells are attached to its two auxiliary wires.
6. **DUP–ERA erases.** The same as rule 5, for a DUP cell.

Rule 4 is the one that copies. A DUP that meets a CON is pushed through it, so each of the CON's two results gets its own DUP. Repeated application copies a structure one layer at a time, and each step is one local interaction.

Lafont proved that these six rules are universal: a translation maps any other interaction system into them and preserves its computation and its parallelism. The bend2.dev page describes this as "universal", and it does not claim that the six rules alone make programs fast.

## Labels: the Interaction Calculus

The three combinators above have one kind of DUP. Victor Taelin's Interaction Calculus (IC) keeps the same three kinds of cell, gives every DUP a **label** (a number), and adds a text notation for nets. The text is not a drawing: `!&L{x,y} = t; body` names cells and wires, the way `λx.t` names a CON. Read the text as cells:

| Text | Cell | Ports |
|---|---|---|
| `λx.t` and `(f a)` | CON | for `λx.t`, the output is principal and the aux ports hold the variable and the body; for `(f a)`, the function is principal and the aux ports hold the argument and the result |
| `!&L{x,y} = t; body` | DUP, label `L` | principal: `t`; aux: `x` and `y`; `body` is the rest of the net |
| `&L{a,b}` | DUP, label `L`, read from the other side | principal: the value; aux: the alternatives `a` and `b` |
| `*` | ERA | principal only |

Give every DUP one label, and the rule that two DUPs annihilate (rule 2 above) is the case where their labels match. Different labels commute instead. So the symmetric combinators are the special case with a single label.

So a superposition is not a new kind of cell. `&L{a,b}` is a DUP labelled `L`, read from the other side: its principal port faces the value, and its aux ports hold the alternatives. Both readings are drawn side by side:

```text
!&L{x,y} = t; body      &L{a,b}
    x         y                 │
    │         │                 s
  ┌─┴─────────┴─┐        ┌──────┴──────┐
  │  DUP   L    │        │  DUP   L    │
  └──────┬──────┘        └─┬─────────┬─┘
         │                 │         │
         t                 a         b
```

Chapter 14 runs these rules on the reference implementation, prints the interaction counts, and shows where a superposition is born.

## β-reduction as one interaction

Interaction nets encode a lambda abstraction and an application as two CON cells:

- **λx. M** is a CON whose principal port is the lambda's output, whose first auxiliary port is the variable x (a wire to every use of x), and whose second auxiliary port is the body M.
- **(F A)** is a CON whose principal port connects to the function F, whose first auxiliary port carries the argument A, and whose second auxiliary port carries the result.

When a lambda meets an application through their principal ports, that is an active pair of two CONs, and rule 1 applies. The first auxiliary wires join: the variable's wire now connects to the argument A. The second auxiliary wires join: the body M now connects to the result. β-reduction is one interaction.

If the variable is used twice, its wire must be duplicated, and each copy is a separate CON–DUP commutation. That is the duplication cost. The model does not hide it, and Chapter 04's exercises count it.

## Why this matters for Bend, and what it does not

The bend2.dev notes describe interaction nets as the model behind Bend's earlier HVM runtimes. Released Bend 2 does not run them. Its compiler emits a flat C evaluator, called BendRT, that keeps pending work explicitly and does not reduce graphs. The notes list what BendRT does instead:

- **Affine ownership.** Each ordinary value has at most one live use, so the compiler knows when memory can be freed. No tracing garbage collector is needed.
- **Counted sharing.** A `+` value keeps a reference count. A value used through `+` is shared by count, not by graph.
- **Balanced forks.** `a b = f(x) g(y)` hands each call to a core once. The programmer promises the two calls take about the same time.

> **Core insight.** BendRT is a flat evaluator of definitions. Its primitives are words, definitions, jumps and tasks, not cells and rewrites.

**Composed of: BendRT, the released runtime.**

```text
BendRT
- term: one 64-bit word; a small value is stored inline, anything else is a pointer into one heap shared by every core and the GPU
- definition: a segment of a flat state machine; a call is a jump
- parallel call: one join task, plus one task per call, dealt to CPU or GPU lanes
- memory: no garbage collector; a match frees the node it opens; only `+` values carry a reference count, which the emitted C keeps in 24 bits
```

The guide's Under the Hood section gives the first three parts and the memory rule. The 24-bit width comes from the emitted C.

So the model explains *why* Bend is affine and why copying is spelled out. It does not predict how fast a program runs. The notes quote the Asperti and Mairson result that the implementation cost of optimal reduction cannot be bounded by an elementary function of the number of reduction steps. Counting interactions is not the same as measuring time.

## Summary of properties

| Property | What it says | Where the page states it |
|----------|--------------|--------------------------|
| Locality | a rule reads and rewrites only its two cells | interaction-nets page |
| One-step confluence | two distinct active pairs commute | interaction-nets page, citing Lafont 1990 |
| Step-count invariance | any order to a normal form takes the same number of steps | interaction-nets page |
| No termination guarantee | a net can reduce forever | interaction-nets page |
| Universality | the six combinator rules can encode other systems | interaction-nets page, citing Lafont 1997 |
| Cost is not steps | allocation, scheduling, and memory still cost time | bendrt-explained and interaction-nets pages |

## Exercises (pen and paper)

**1. Erase a cell.** A CON has its principal port wired to an ERA. Its two auxiliary ports are wired to two free ports, `p` and `q`. How many interactions happen, and what is left?

*Solution.* One interaction: rule 5. The CON disappears and two new ERA cells attach to `p` and `q`. Before the step there were two cells (CON, ERA). After it there are two cells (ERA, ERA). No active pair remains, so the net is in normal form.

**2. Count the cells of a commutation.** A CON and a DUP are joined through their principal ports. Their four auxiliary ports are wired to four free ports. How many cells and how many internal wires exist after rule 4?

*Solution.* Four cells: two DUP copies and two CON copies. The copies' principal ports take the four free wires, and their auxiliary ports form four internal wires, one for each (CON copy, DUP copy) pair. The number of cells rises from two to four.

**3. Two active pairs.** Net N has two active pairs, A and B, that share no cell. Show that reducing A then B gives the same net as reducing B then A.

*Solution.* Rule A rewrites only the cells of A and creates wires only to A's free ports, which are cells or interface ports that B does not touch. The same holds for B. Both orders therefore produce the same set of cells and wires, and the diamond closes.

**4. Beta in one step.** Encode `(λx. x) y` with two CONs, where `y` is a free port. Reduce it.

*Solution.* The lambda CON's first auxiliary wire (the variable x) meets the application's first auxiliary wire (the argument y), and the lambda's body wire meets the result wire. The body of the lambda is `x`, which is the variable's wire, so the result is directly connected to `y`. One interaction; no DUP was needed because `x` is used once.

## Next

Chapter 05 shows what the released compiler does for a parallel call, and what a balanced fork looks like in code.
