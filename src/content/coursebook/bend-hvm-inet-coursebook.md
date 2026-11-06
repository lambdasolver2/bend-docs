---
title: "Interaction nets, step by step — a course through HVM4, HVM5, BendRT and Bend 2"
description: "A hands-on course on how interaction nets reduce: cells and active pairs, the six symmetric rules, labels, the Interaction Calculus, superpositions and collapse, Church-numeral algorithms, the HVM4 machine, optimality, and the road to HVM5/BendRT/Bend 2 — with exercises and worked solutions; every runnable program was verified against the local HVM4 and ic toolchains."
updated: 2026-11-06
verified: 2026-11-06
status: runnable
canonical: /coursebook/interaction-nets-step-by-step/
sources:
  - https://github.com/HigherOrderCO/HVM4
  - https://github.com/VictorTaelin/Interaction-Calculus
  - https://github.com/bendlang/bend
  - https://bend2.dev/notes/interaction-nets-explained/
  - https://bend2.dev/notes/hvm4-explained/
---

# Interaction nets, step by step

**A working course on how nets reduce — from the first active pair to HVM4, HVM5, BendRT and Bend 2 — with exercises and full solutions at every step.**

> **What this is.** A course written to be *worked through*, not skimmed. It teaches the thing the rest of the Bend 2 stack sits on: how a computation reduces when the computation *is a graph*. You will fire rewrite rules by hand, count interactions, watch a superposition split an answer into branches, run real programs on the real HVM4 runtime and on the reference Interaction Calculus, and only then read what BendRT and Bend 2 keep of all this. Every runnable program in this document was checked — the HVM4 programs against a local build of `HigherOrderCO/HVM4`, the Interaction Calculus programs against a local build of `VictorTaelin/Interaction-Calculus`, and the Bend programs against `bend 2.0.39` (see the verification ledger in Appendix F).
>
> **This pair is the whole set by design.** Two documents, nothing more: **(1)** `src/content/compendium/bend-hvm-inet-compendium.md` — **one document that combines every existing source** (verbatim, section-numbered `A.1`…`K.5`); **(2)** this course — **one learning document**, a tutorial with exercises and worked solutions. Wherever a lesson rests on a source, its section id (like `A.5`, `I.4`, `G.53`) is named so you can go read the original.

---

## 0 · How to use this course

### Who it is for

You can read a typed functional language (any of Haskell, OCaml, Rust, or Lean) and you are curious how "interaction nets" actually compute. No prior knowledge of HVM, Bend, or nets is assumed. Some exercises are pen-and-paper; some are programs you run; a few are "predict, then check".

### The three languages you will meet

| Language | What it is | Where it runs here | Fence |
|---|---|---|---|
| **HVM4** | A single-file C runtime for the Interaction Calculus: terms with lambdas, superpositions `&L{a,b}`, duplications `!x&L = v; body`, numbers, constructors, pattern matching | build it from `HigherOrderCO/HVM4` (§ Appendix A) | `hvm` |
| **IC** | Victor Taelin's reference Interaction Calculus — the clean, minimal calculus (variables, `λ`, application, `&L{a,b}`, `!&L{x,y} = t; body`, `*`) | build it from `VictorTaelin/Interaction-Calculus` | `ic` |
| **Bend 2** | The high-level language whose runtimes (HVM-era, and now BendRT) this whole lineage exists for | `bend` 2.0.39 (`bend guide`) | `bend` |

A warning that saves confusion later: **Bend 2's released compiler does not reduce nets.** BendRT — the runtime the released compiler emits for — is a flat evaluator of definitions that *keeps some interaction-net ideas* (linearity, no GC, parallel forks) but has no cells, ports or active pairs. HVM4 is where nets actually run today; HVM5 is the project that puts nets back under a contract runtime. The course keeps these three layers carefully apart, and Part 10 says exactly which layer owns what.

### How the lessons are shaped

Each part follows the same rhythm:

1. **Idea** — the concept, with the smallest possible example.
2. **Run it** — a program you can paste into the tool, with its real, verified output.
3. **Exercises** — marked `Exercise i.j`, each with a full **Solution** in numbered steps directly underneath. Cover the solution, try, then compare.

Conventions used throughout:

- `▶` marks something to run; `✓` marks a verified answer.
- Interaction counts ("itrs") are HVM4's own statistic (`-s` flag). They are a *work metric*, not a time metric — why is explained in Part 9.
- `&L{...}` reads "superposition with label L". `!x&L = v; body` reads "duplication with label L". Labels are the one idea that makes this whole calculus work; Part 5 is devoted to them.
- Outputs are shown exactly as printed (minus ANSI colour), including the little `#N` branch tag collapse mode appends.

### The map

| Part | What you learn | Exercises |
|---|---|---|
| 1 | Why copying is the whole game; what problem nets solve | — |
| 2 | Cells, ports, wires, active pairs, rules, confluence | 6 |
| 3 | The six rules of the symmetric interaction combinators, worked by hand | 9 |
| 4 | λ-calculus on nets: β as one interaction, and the cost of copying | 6 |
| 5 | Labels and the Interaction Calculus: the four rules, traced | 9 |
| 6 | Superposition as a tool: collapse, enumeration, search by erasure | 8 |
| 7 | Algorithms: Church numerals, add/mul, lists, Peano, the optimal 2² | 9 |
| 8 | The HVM4 machine: one 64-bit word, WNF, the rule families, collapse | 8 |
| 9 | Why this is parallel: locality → optimality → honest costs | 5 |
| 10 | The lineage: HVM1→4, BendRT (not nets!), Bend 2, HVM5, and where GoI sits | 6 |
| 11 | Capstone: ten mixed problems | 10 |
| A–F | Appendices: tools, the full rule inventory, the verified-program table, glossary, links, verification ledger | — |

That is **76 exercises** with worked solutions.

### A 30-second preview, so the rest has a target

```
(λx.x λy.y)          one interaction: a lambda meets an application (APP-LAM)
────────────
λy.y

(&A{1,2} + 10)       one cell holding two values meets an operation (OP2-SUP)
────────────
11                   and, because the superposition travels, also:
12                   the answer is both, at the price of one
```

The second example is the one that changes how you think. There is no `if`, no search loop, no branch predictor: the result *is* a superposition of both answers, and the runtime pays for the shared work once. By Part 6 you will write a program that tests every assignment of a small boolean formula at once and keeps only the satisfying ones — search without a loop.

### First 15 minutes: run something now

The fastest way to make all of Part 2 click is to get an HVM4 binary and watch a net reduce. If you only ever do one exercise in this course, do this one.

```sh
# 1 · the machine (Linux/macOS with clang)
git clone https://github.com/HigherOrderCO/HVM4 && cd HVM4/clang
clang -O2 -o main main.c -ldl

# 2 · your first superposition
printf '@main = (&A{1,2} + 10)\n' > /tmp/first.hvm
./main /tmp/first.hvm -s -C
```

You should see exactly:

```text
11 #3
12 #4
- Itrs: 4 interactions
```

Two answers, four interactions, no loop. (`-C` is "collapse" — it enumerates the alternatives; `-s` prints the interaction count; the little `#3`/`#4` are collapse-queue keys that Part 6 tells you to ignore.)

Now watch a computation be *shared* instead of repeated — write `@f` from Part 7.6 and run it with `-D`, which prints every interaction with its rule name:

```sh
cat > /tmp/share.hvm <<'EOF'
@f = λx.λy. !z&=x; [(z₀ + z₁), y]
@main = !F& = @f(2); [F₀(10), F₁(20)]
EOF
./main /tmp/share.hvm -D | head -20
```

Output `[[4,10],[4,20]]` appears at the end of the trace, and one line in the middle — labelled `OP2-NUM-NUM` — shows `(2 + 2)` becoming `4` **exactly once**, with the result flowing to both copies of the lambda. That single line is the reason this whole lineage exists; everything else in this course explains how it works, what it costs, and what it can't do.

Want the pure calculus too? `git clone https://github.com/VictorTaelin/Interaction-Calculus && cd Interaction-Calculus && make`, then `echo '(λx.x λy.y)' > /tmp/p.ic && ./bin/ic run /tmp/p.ic` prints `λ$a.$a` and `WORK: 1 interactions`. Fifteen minutes, two toolchains, three ideas (superposition, sharing inside a lambda, β-as-one-step) — now start at Part 2.

### Honest limits of this course

- **Nets are the model, not (always) the machine.** HVM4's *semantics* is the Interaction Calculus, but its heap is a term encoding with substitution cells, not a literal port graph (HVM5's own spec makes this correction: § 01a of the HVM5 v1 spec, compendium G.5). Diagrams here describe the model; Part 8 describes what the C code actually does.
- **Interaction counts are not speed.** The literature result quoted in Part 9 (Asperti–Mairson) says the bookkeeping for full optimality cannot be bounded elementarily; HVM picks a pragmatic fragment. Where a claim is only a claim, it is marked as such.
- **SupGen is not public.** The synthesis engine that motivated superpositions has no public source; Part 6 reports only what is verifiable and says so (compendium A.15, H.53).
- **Versions drift.** The Bend material is checked against `bend 2.0.25` (tutorial) and `2.0.39` (this build); HVM4 and IC here are the repository states noted in Appendix F. Re-run Appendix A's commands to reproduce everything below on your machine.

---

## 1 · Why copying is the whole game

### 1.1 β-reduction has one hard operation

Every functional programmer knows β-reduction: `(λx. body) arg` becomes `body` with `x` replaced by `arg`. For a *linear* use — one occurrence of `x` — this is a wire: connect the argument to the use.

The trouble starts with two occurrences. Substitute into `(λx. (x, x)) arg` and the argument is now in two places. If the argument is the literal `5`, copying is trivial. If the argument is `(fib 30)`, you have just written "compute fib 30 twice" into the program — unless something stops you.

Strict languages stop it by computing once and copying the *value*. Lazy languages stop it with a thunk and memoization: compute once, overwrite the thunk with the result, share. This works famously well for data — and breaks down the moment the shared thing sits **inside a lambda**:

```text
dup f = λx. (2 + 2) ...   -- share (2+2) between two uses of f?
```

A thunk is a heap cell; two copies of a *function value* cannot share one cell, because each copy's body may be applied to a different argument. Haskell's own story: memoization shares at the level of data, not inside function bodies. Duplicate a function and its body's work is duplicated too.

### 1.2 Sharing as a structural primitive

Interaction nets take the radical option: make *copying itself* a first-class reduction step with local rules, so that a shared subgraph is one object with several wires, and duplication happens **on demand, layer by layer**, only for what is actually needed.

The machinery comes in two dual pieces (Lafont's *fan nodes*, 1997):

- a **duplication** node that makes one value feed two uses — pulling one layer off at a time;
- a **superposition** node that lets one hole hold two values — the two alternatives coexist until something forces a choice.

Two consequences that the rest of this course develops:

1. **Confluence gives free parallelism.** A step rewrites two cells and nothing else. Two steps that touch disjoint cells cannot disturb one another. Run them in either order, on any number of cores — same result. (Part 2 proves the shape of this; Part 9 explains why the industry didn't just do it anyway.)
2. **Optimality is reachable — at a price.** Lévy defined "optimal" reduction as: never duplicate work that could be shared, never do work twice. Lamping showed nets can implement it; the bookkeeping is famously expensive, and every real runtime (including HVM) chooses a fragment. (Part 9.)

### 1.3 The two-language history, so nothing surprises you later

The names you will meet:

| Name | What it was | Net-based? |
|---|---|---|
| **Lamping (1990), Lafont (1997)** | Theory: optimal λ-reduction via interactions; three combinators suffice for universality | paper |
| **HVM1 (2022, Rust)** | First Taelin runtime; lazy; interaction combinators; "bookkeeping-free" optimal fragment | yes |
| **HVM2 (2023–24, C + CUDA)** | Strict, fast, massively parallel; Bend 1's engine; 24-bit numbers | yes |
| **HVM3 (early 2026)** | Merge of strengths; compiler `run`/`-c` | yes |
| **HVM4 (2026)** | Single-file C runtime of the **Interaction Calculus**; superpositions, labels, numbers, constructors; the machine this course runs on | yes |
| **BendRT (2026)** | Released Bend 2's runtime: flat evaluator, affine ownership, no GC, balanced forks — **not** a net reducer | no |
| **HVM5 (in progress)** | Contract runtime over compiled IC packages; code as data; fork/merge as DUP/merge3 | yes |
| **Bend 2** | The language: dependent types, laws/proofs, affine values; composable parallelism; targets C/CUDA/Metal/JS | compiles to BendRT (and in HVM5's plan, to IC) |

(Compendium F.1–F.4, H.10–H.22, G.1–G.2, and the tutorial's chapter 04. Part 10 fills in the story with sources.)

### 1.4 What you will be able to do after this course

- Read any of the 61 HVM4 interaction sheets and say what the rule does and when it fires (Part 8, Appendix B).
- Reduce net diagrams and IC terms by hand, and predict the result of small HVM4 programs before running them (Parts 2–7).
- Explain labels, collapse, and search-by-superposition, and write a one-line program that searches without a loop (Part 6).
- Say, for any claim about parallel speedups or optimal sharing, which part is theorem, which part is engineering trade-off, and which part is marketing (Parts 9–10).
- Know exactly where BendRT differs from HVM4, and what HVM5 restores (Part 10).
---

## 2 · The model: cells, ports, wires, active pairs

> Sources for this part: tutorial chapter 04 (compendium A.5), knowledge-base `03-hvm-inet-theory/01` and `/02` (F.18, F.19). The historical papers are Lafont, *Interaction Nets* (POPL 1990) and *Interaction Combinators* (1997).

### 2.1 Cells

A computation net is built from **cells** (also called agents). A cell has:

- one **name** (its symbol — `CON`, `DUP`, `ERA`, later `NUM`, `MAT`, …),
- exactly one **principal port**: the only place where the cell is willing to interact,
- a fixed number of **auxiliary ports**: the places where its contents connect.

```
        aux 1     aux 2
          |         |
        +-----------+
        |  symbol   |
        +-----+-----+
              |
           principal
```

A **wire** joins exactly two ports. A port with no wire is **free**; the free ports of a net form its **interface** — the way the net connects to the rest of the world. Two nets are considered the same net up to renaming of wires and cells.

The three cells you will use for the first half of this course (Lafont's *symmetric interaction combinators*):

| Cell | Arity (aux ports) | Role in the analogy | Later name |
|---|---|---|---|
| **CON** (γ) | 2 | builds a node — application/lambda/pair/constructor | LAM, APP, CTR |
| **DUP** (δ) | 2 | copies a resource | SUP, DUP (with a **label**) |
| **ERA** (ε) | 0 | deletes a resource | `&{}` / `*` |

### 2.2 Active pairs

Two cells whose **principal ports** are wired directly to each other form an **active pair** (a redex). Only an active pair can be reduced. Everything else sits still, no matter how the rest of the net looks.

```
      x    y                        a    b
       \  /                          \  /
      +-----+                      +-----+
      | CON |                      | DUP |
      +--+--+                      +--+--+
         |          <- active ->     |
      +--+--+       pair           +--+--+
      | DUP |                      | CON |
      +-----+                      +-----+
```

Because a cell has exactly **one** principal port, it can be in **at most one** active pair. A step therefore consumes exactly two cells, and no two active pairs can ever share a cell. Keep this sentence in mind — it is the entire reason parallelism is free, and it comes back in every part.

### 2.3 Rules

Each **rule** replaces an active pair by a new net that has **the same free ports** as the pair it replaced. A rule reads two cells and a fixed number of wires, and writes a fixed shape. It is *local*: it never looks anywhere else in the net.

Each unordered pair of cell names gets **at most one** rule. So a net with *k* symbols has at most `k(k+1)/2` rules. With three cells there are six rules — Part 3 lists all of them, and that is the whole language of the system.

A net with no active pairs is in **normal form**: nothing can happen; whatever answer exists, this is it.

### 2.4 The two theorems (and one anti-theorem)

Take two *different* active pairs in one net. They are disjoint (previous section). Reduce either one: it rewrites its two cells and the wires between the pair's free ports; the other pair is untouched, and all wires the first step creates go to the first pair's free ports. Hence:

- **(One-step confluence, the diamond property.)** If a net `N` can step to `N₁` and to `N₂`, then both `N₁` and `N₂` can step to a common net `M` — each in at most one step.

```
        N
      /   \
   N1      N2
      \   /
        M
```

- **(Step-count invariance.)** For the systems in this course: if a net has a normal form, every reduction order reaches it, and *up to permutation of independent steps, in the same number of interactions.* This makes "the number of interactions" a property of the program — which is why every claim in this course can be phrased as an interaction count.

- **(No termination guarantee.)** Nothing here says a normal form exists. A finite net can reduce forever. Part 3 has the classic self-loop; it is the net analogue of `Ω = (λx. x x)(λx. x x)`. Terminating is the *language's* job (Bend 2 enforces it separately), never the net's.

> **Work is a program property; time is not.** Confluence says every scheduler computes the same net with the same number of interactions. It says nothing about wall-clock: allocation, cache, contention and scheduling still cost real time. The literature's sharpest version of this warning is the Asperti–Mairson result quoted in Part 9.

### 2.5 Exercise format

From here on, nets in exercises are written in a **linear notation** that leaves nothing to the imagination:

```
cells : CON#1, DUP#2, ERA#3
wires : CON#1.p — DUP#2.p
        CON#1.a1 — x        (free)
        CON#1.a2 — y        (free)
        DUP#2.a1 — z        (free)
        DUP#2.a2 — w        (free)
free  : x, y, z, w
```

- `#1`, `#2` are cell ids; `.p` is the principal port; `.a1`, `.a2` the auxiliary ports (ERA has only `.p`).
- A wire `A — B` connects two ports; `— x` (lower-case) connects to a free port of the interface.
- A rule application is described by: the cells consumed, the wires reconnected, the cells created. **The free ports must come out identical** — that is how you check yourself.

---

**Exercise 2.1 — cells, ports, interface.** In this net:

```
cells : CON#1, CON#2, ERA#3
wires : CON#1.p — CON#2.p
        CON#1.a1 — ERA#3.p
        CON#1.a2 — x
        CON#2.a1 — y
        CON#2.a2 — z
free  : x, y, z
```

(a) How many cells, ports, and wires? (b) Which ports are free? (c) Where is the active pair?

**Solution (steps).**
1. Cells: 3 (two CON, one ERA). Ports: each CON has 3 (1 principal + 2 aux) = 6; ERA has 1; total **7 ports**.
2. Wires join two ports each; the wires are: `CON#1.p—CON#2.p`, `CON#1.a1—ERA#3.p`, and `CON#1.a2—x`, `CON#2.a1—y`, `CON#2.a2—z`. The last three end in free ports, but they are still wires: **5 wires total**.
3. Free ports: `x`, `y`, `z` — the ports `CON#1.a2`, `CON#2.a1`, `CON#2.a2` on the near side, and the three loose ends labelled `x`, `y`, `z` on the far side. The interface is `{x, y, z}`.
4. Active pair: `CON#1` and `CON#2`, connected principal-to-principal by the first wire. The ERA is *not* in an active pair (it is wired to an auxiliary port, and active pairs need both principal ports).

---

**Exercise 2.2 — one cell, one pair.** In Exercise 2.1, could the ERA also be part of an active pair right now? Rewire minimally so that it *is*.

**Solution (steps).**
1. No: `ERA#3.p` is currently wired to `CON#1.a1`, an *auxiliary* port. An active pair needs both endpoints to be principal ports.
2. Rewire one wire: `CON#1.p — ERA#3.p` instead of `CON#1.p — CON#2.p`. (Then reconnect `CON#2.p` to... something; for a minimal fix, also move `CON#1.a1` onto `x` to keep the net well-formed: `CON#1.a1 — x`.)
3. Now `CON#1.p` meets `ERA#3.p`: one active pair, ready for the CON–ERA rule you will learn in Part 3.

---

**Exercise 2.3 — locality, stated precisely.** Why can a rule never need to look at more than its two cells?

**Solution (steps).**
1. By definition, a rule consumes an active pair and installs a fixed net on the *same free ports*.
2. The pair's wires are: the principal-to-principal wire (consumed with the cells) and the auxiliary wires, which leave the pair through its free ports.
3. Everything beyond a free port is just "an endpoint" to the rewiring — the rule reconnects to it, never reads it.
4. So a step's effect is fully determined by (cell names, ports, wire endpoints), a constant-size description. That is "locality", and it is why the diagram of a rule is the complete definition of the rule.

---

**Exercise 2.4 — the diamond, on two concrete pairs.** Net: `CON#1.p—CON#2.p`, `ERA#3.p—ERA#4.p`, and all four aux ports free (a1/a2 of #1, #2 — name them `x`,y`,… as needed). The two active pairs are (`#1`,`#2`) and (`#3`,`#4`). Argue both reduction orders give the same net.

**Solution (steps).**
1. The pairs are disjoint in cells, so each step only touches its own two cells and their wires.
2. Order A: fire pair 1. Cells #1,#2 are replaced by a fixed net on `CON#1.a1, CON#1.a2, CON#2.a1, CON#2.a2` (Part 3 will say exactly which; the *shape* is what matters now). Pair 2 is untouched.
3. Fire pair 2 next: `#3,#4` vanish with their own fixed shape. Pair 1's replacement is untouched.
4. Order B: identical, with the two steps swapped. The final nets have the same cells, the same wires, and the same free ports — because each step only ever added wires to *its own* free ports, which the other step never touched.
5. Both orders reach the common net in exactly 2 steps: the diamond closed with `M` one step after each branch.

---

**Exercise 2.5 — no rule for a three-way overlap.** Explain why you never need a rule like "CON meets CON meets CON", even though three cells could be mutually wired.

**Solution (steps).**
1. A cell has exactly one principal port. A principal port holds exactly one wire end.
2. For three cells to face each other "simultaneously" they would need pairwise principal-to-principal wires, i.e. each cell's single principal port would have to hold more than one wire — impossible in the port model.
3. Principal-to-principal wiring pairs cells up: the active pairs form a *matching* on cells. Overlaps cannot exist, so no critical pairs exist, so the diamond property has an elementary proof (this is the sketch behind the one-step confluence theorem of Exercise 2.4).

---

**Exercise 2.6 — the net that never stops (reading).** Below is the standard non-terminating net from the knowledge base (`03/02` §4, quoting Wikipedia): a DUP wired around two cells so that after the commutations and erasures it rebuilds itself. Read the equation, fire it once on paper, and explain why the system is Turing-complete but not terminating.

```
cells : DUP#1, ERA#2, CON#3
wires : DUP#1.p — ERA#2.p ??? 
```
The published form is `δ(ε, x) = γ(x, ε)`: the DUP's two aux ports are wired to `ERA.p` and `CON.a?`, and the CON's principal port is wired back so the shape closes.

**Solution (steps).**
1. The published trace (knowledge F.19 §4): `⟨∅ | δ(ε,x) = γ(x,ε)⟩ → (commutation) → (erasures) → ⟨∅ | δ(ε,x) = γ(x,ε)⟩` — the net returns to itself after a fixed number of steps.
2. So: the net has an infinite reduction and no normal form. Locality and confluence still hold — every scheduler loops, perfectly consistently. "Confluent" and "terminating" are independent properties.
3. Turing-completeness: with three combinators you can encode any other interaction system (Lafont's universality theorem), including systems that encode machine computations; a model that can encode everything and also contains an infinite loop is Turing-complete by construction.
4. Consequence for language design: termination can never come from the net model. Bend 2 enforces termination itself (structural recursion, `@unsafe` opt-out); the model, left alone, happily loops forever.

---

### What to remember from Part 2

- A **cell** has one principal port; an **active pair** is two principal ports wired together; a **rule** rewrites it locally to a fixed shape with the same free ports.
- Cells pair up **at most one active pair per cell** ⇒ no critical pairs ⇒ **one-step confluence** ⇒ any scheduler, same result, same interaction count.
- **Confluence ≠ termination**: the self-loop exists and is fine.
- From now on every problem will be stated in the linear net notation of §2.5 so that answers can be checked mechanically: consume cells, reconnect wires, preserve free ports.
---

## 3 · The three cells and their six rules

> Sources: tutorial chapter 04 (A.5), knowledge `03/02` (F.19). Every rule below is the tutorial's statement, restated in the course's linear notation and worked until you can fire it in your sleep.

This part is the whole system. Six rules. Everything else in the course — labels, numbers, pattern matching, Bend — is an extension installed on top of these six.

### 3.1 Setting the convention (read once, keep forever)

For two cells facing each other, we name their auxiliary ports `a1` and `a2` and adopt the convention of the tutorial:

- **annihilation** (same kind meets same kind): `a1` pairs with `a1`, `a2` with `a2`.
- **commutation** (CON meets DUP): the crossing described in rule 4.

Some sources draw the γ–γ pairing *crossed* (`γ[x,y] ⋈ γ[y,x]`, F.19 §2.3). The difference is which auxiliary port you decide to call "first". **What matters is consistency**: pick one spelling, and β-reduction, erasure and copying all work out. This course fixes the convention above; HVM4's own rules (Part 8) are written cell-by-cell and are compatible with it in the cases we use.

### 3.2 The six rules

**Rule 1 — CON–CON annihilates (β!).**

```
   x1      x2                 y1      y2
    |       |                  |       |
  +-----------+              +-----------+
  |   CON     |    ----      |   CON     |
  +-----+-----+   ANNIHILATE +-----+-----+
        |                          |
   (the two cells vanish; x1 pairs with y1, x2 with y2)
```

Result: both cells disappear; wire `a1–a1`, wire `a2–a2`. Free ports preserved: `{x1, x2, y1, y2}` before and after. Zero cells remain, two wires cross over.

**Rule 2 — DUP–DUP annihilates.** Same shape, same pairing, for two DUPs of **the same label** (labels arrive in Part 5; for now, all DUPs can be thought of as having the same label).

**Rule 3 — ERA–ERA annihilates.** Two ERAs facing each other disappear. Nothing replaces them.

**Rule 4 — CON–DUP commutes (the copying rule).**

```
   x1      x2                   y1      y2
    |       |                    |       |
  +-----------+   COMMUTATION +-----------+
  |   CON     |   ----------> |   DUP  L  |
  +-----+-----+               +-----+-----+
        |                           |
  +-----+-----+               +-----+-----+
  |   DUP  L  |               |   CON     |
  +-----+-----+               +-----+-----+
        |                           |
       y1,y2                      x1,x2
```

Precisely: the CON's two auxiliary wires each receive a **DUP copy** (`D1`, `D2` — principal ports on `x1`, `x2`), the DUP's two auxiliary wires each receive a **CON copy** (`C1`, `C2` — principal ports on `y1`, `y2`), and the four new cells are wired **each DUP copy to each CON copy** — a 2×2 crossing. Cell count: 2 → 4. Free ports: `{x1, x2, y1, y2}` before and after — unchanged, as the rules demand.

**Rule 5 — CON–ERA erases.** The CON disappears and **two new ERAs** attach to its two auxiliary wires: erasure descends one level. (Confirm the free-port rule: `{x1, x2}` preserved, one cell → two cells.)

**Rule 6 — DUP–ERA erases.** Same as rule 5, for a DUP.

That is the full rule table of the system `Σ = {ε, δ, γ}`. For a net with `k` cell kinds there are at most `k(k+1)/2` rules; with three kinds, six.

### 3.3 Why these six suffice (and what that means)

Lafont proved (1997) that these combinators are **universal**: any other interaction system can be translated into them, preserving its computation and its parallelism. Read the fine print: universality is a statement about *encodability*, not about the encoding being efficient, natural, or how any real machine should be built. HVM's designers used the same triad but added numbers, operators and switches as first-class cells precisely because encoding arithmetic through raw γ/δ/ε would be slow and unreadable (F.19 §1, and Part 8).

### 3.4 Worked example A — erasing a tree

Net:

```
cells : CON#1, CON#2, ERA#3
wires : CON#1.p — ERA#3.p          (active pair 1: rules 5)
        CON#1.a1 — x
        CON#1.a2 — CON#2.p
        CON#2.a1 — y
        CON#2.a2 — z
```

Step 1 — rule 5 on (1,3): CON#1 vanishes, ERAs appear on its aux wires:

```
cells : ERA#4, ERA#5, CON#2
wires : ERA#4.p — x
        ERA#5.p — CON#2.p          (active pair 2: rule 5)
        CON#2.a1 — y
        CON#2.a2 — z
```

Step 2 — rule 5 on (5,2): CON#2 vanishes, ERAs on `y` and `z`:

```
cells : ERA#4, ERA#6, ERA#7
wires : ERA#4.p — x,  ERA#6.p — y,  ERA#7.p — z
```

Normal form: three ERAs, one per leaf of the original tree. **Two interactions for two CONs.** Erasure descends the tree vertex by vertex and costs exactly one interaction per CON cell. Note also that the two steps were independent in a weaker sense — but here the second depended on the first (the ERA that arrived on `CON#2.p` came from step 1), which is exactly the sequential path a scheduler has to follow.

### 3.5 Worked example B — β-reduction

Encode `(λx. (x f) g)`:

- Lambda cell `L`: `L.p` is its output/value side; `L.a1` is the variable `x`; `L.a2` is the body term `(x f)`.
- Body term `(x f)` is an application cell `B`: `B.p` faces its function (`x`); `B.a1` is the argument `f`; `B.a2` is its result.
- Application cell `A` for `(L g)`: `A.p` faces its function (`L`); `A.a1` is `g`; `A.a2` is the final result `r`.

Wires: `A.p — L.p` (active pair), `L.a1 — B.p`, `L.a2 — B.a2`, `B.a1 — f`, `A.a1 — g`, `A.a2 — r`.

Step 1 — rule 1 on (L, A): `a1↔a1` and `a2↔a2`:

- `L.a1 — B.p` joins `A.a1 — g` ⇒ **the variable wire now carries `g`**: `B.p` is connected to `g`.
- `L.a2 — B.a2` joins `A.a2 — r` ⇒ **the body's result is the final result**: `B.a2` connects to `r`.

Result: `B` (function `g`, argument `f`) facing the result wire `r`.

Step 2 — if `g` is a lambda cell `G` (`G.p`, var `G.a1`, body `G.a2`), then `G.p` meets `B.p` through the wire — an active pair — and rule 1 fires again: `G.a1` (its variable) joins `B.a1` (the argument `f`); `G.a2` (its body) joins `B.a2` (the result `r`).

Net result for `g = λy.y`: the final result `r` is wired to `f`. **`(λx. (x f) g) → f` in two interactions.** β-reduction is literally rule 1 firing; everything else in the net is wiring.

### 3.6 Worked example C — commutation, in slow motion

Net: `CON#1.p — DUP#2.p`, with `CON#1.a1 — p`, `CON#1.a2 — q`, `DUP#2.a1 — s`, `DUP#2.a2 — t` (all four free). Fire rule 4 with the following crossing (one consistent spelling of the 2×2):

```
D1.p — p        D1.a1 — C1.a1     D1.a2 — C2.a1
D2.p — q        D2.a1 — C1.a2     D2.a2 — C2.a2
C1.p — s
C2.p — t
```

Check yourself the way you always should:

- **Free ports** before `{p, q, s, t}`; after — read the wiring: `D1.p→p`, `D2.p→q`, `C1.p→s`, `C2.p→t` ✓.
- **Cell count** 2 → 4 ✓ (two DUP copies, two CON copies).
- **Internal wires** = 4 (each DUP copy wired to each CON copy). Counting auxiliary ports is the fast way: after the step there are `2×2 + 2×2 = 8` auxiliary ports, of which exactly 4 are external (`p,q,s,t`), leaving 4 internal wire ends = 4 wires ✓.

Why "the copying rule"? Because this is how δ descends into a structure: every CON that the DUP meets is rebuilt twice — once inside each copy — and the DUP is pushed one level deeper. Repeat down a tree and you have duplicated it, one constant-time interaction per cell. No global copy pass, no walk of unknown length: locality is preserved, so the layers could in principle be copied in parallel, and a layer that is later erased is never copied at all.

### 3.7 The counting identities (memorise three)

For one interaction, with the six rules above (labels ignored, all DUPs equal):

| Rule | Cells before → after | Free ports |
|---|---|---|
| CON–CON / DUP–DUP / ERA–ERA | 2 → 0 | unchanged |
| CON–DUP / DUP–CON | 2 → 4 | unchanged |
| CON–ERA / DUP–ERA | 1 → 2 | unchanged |

Two invariants to check every solution against: **free ports unchanged**, and **rules read only two cells**. If both hold, the step is legal.

---

**Exercise 3.1 — fire rule 5.** Net: `CON#1.p — ERA#2.p`, `CON#1.a1 — x`, `CON#1.a2 — y`; free `{x, y}`. Give the net after one step.

**Solution (steps).**
1. Active pair: CON#1 with ERA#2 (principal–principal). Rule: CON–ERA.
2. CON#1 disappears; two ERAs appear, principals on its auxiliary wires: `ERA#3.p — x`, `ERA#4.p — y`.
3. Cells after: `ERA#3, ERA#4`. Free ports after: `{x, y}` ✓ (unchanged). One interaction.

---

**Exercise 3.2 — erase a three-leaf tree.** Net: `CON#1.p — ERA#4.p`; `CON#1.a1 — x`; `CON#1.a2 — CON#2.p`; `CON#2.a1 — CON#3.p`; `CON#2.a2 — z`; `CON#3.a1 — y`; `CON#3.a2 — w`. Reduce to normal form. State the number of interactions and the final cells.

**Solution (steps).**
1. Step 1: CON–ERA on (1,4): `CON#1` → ERAs on `x` and on `CON#2.p`.
2. Step 2: CON–ERA on (2, new): `CON#2` → ERAs on `CON#3.p` and `z`.
3. Step 3: CON–ERA on (3, new): `CON#3` → ERAs on `y` and `w`.
4. Normal form: five ERAs, one per free port `{x, y, z, w}` — wait, count them: `x`, `z`, `y`, `w` = four leaves. Steps: one per CON = **3 interactions**; final cells: **4 ERAs**. (General rule: erasing a tree with `n` CON cells takes `n` interactions and leaves one ERA per leaf, `n+1` leaves when the tree is binary — here 3 CONs, 4 leaves ✓.)

---

**Exercise 3.3 — β by hand, two steps.** Using §3.5's encoding, reduce `(λx. (x c) (λy. y))` where `c` is a free port. How many interactions, and what is the result?

**Solution (steps).**
1. Cells: `L` = λx.(x c) with `L.a1 — B.p` (var `x` to function position of body), `L.a2 — B.a2` (body result); `B.a1 — c`; `A` for `(L (λy.y))` with `A.p — L.p`, `A.a1 — G.p`? — no: `A.a1` carries the argument, the lambda `G`; but careful: an argument that is a lambda is a cell whose *principal* is its value side, so the argument wire connects `A.a1` directly to `G` — and since `G` is a cell, `G.p — A.a1`. Similarly the function side of `B` connects to `G` only *after* step 1.
2. Step 1: rule 1 on (L, A). Then `B.p` carries `G` (the λy.y cell), `B.a1 — c`, `B.a2 — r` (result).
3. Step 2: rule 1 fires on the new active pair (G, B) — `G.p` meets `B.p`. Wiring: `G.a1` (its `y`) joins `B.a1` (the argument `c`); `G.a2` (its body) joins `B.a2` (the result `r`).
4. λy.y's body is `y` itself: `G.a2` is wired to `G.a1`. So `r` ends up wired to `c`.
5. **Result: `c`. Two interactions.** (`(λx.(x c) (λy.y)) → c`.)

---

**Exercise 3.4 — counts for rule 4.** A CON meets a DUP; before the step, all four auxiliary wires end at free ports. After one commutation, state: (a) how many cells, (b) how many wires total, (c) how many of those wires are internal, (d) the free ports.

**Solution (steps).**
1. Cells: four — two CON copies, two DUP copies. (Rule 4 is the only rule that grows the net.)
2. Outside view: still four free ports (`x1,x2,y1,y2`), so the net has grown by exactly two cells and some internal wiring.
3. Port count: each of the four cells has 3 ports = 12 port ends. External ends: the four free ports contribute 4 (one end each). Internal ends: 12 − 4 = 8, i.e. **4 wires**.
4. Structurally those 4 wires are "each DUP copy to each CON copy" (2×2 = 4 pairs), the crossing of §3.6.
5. Free ports: unchanged, `{x1, x2, y1, y2}`.

---

**Exercise 3.5 — why copying is lazy.** The rule table has no "copy the whole structure in one step" rule. Give the two costs such a rule would break, and what buys the system in exchange.

**Solution (steps).**
1. **Locality**: a rule may read exactly two cells and their wires. A deep-copy rule would have to walk an unknown-length structure — the step's description would stop being constant-size, and the diamond property's proof (disjointness of active pairs) dies: two copies into overlapping regions could conflict.
2. **Step-count/parallelism**: gating the whole structure at once makes the copy a sequential bottleneck. Layer-by-layer, every commutation is an independent constant-time interaction; layer k can fire while layer k+1 waits, across as many workers as there are cells.
3. **What is bought in exchange: laziness and erasure wins.** A layer that is never needed is never copied; a branch that is erased (rule 6, era propagation) costs one interaction per cell regardless of size. Deep copying would pay for the whole structure up front.
4. This is also why "copy cost = number of cells actually visited", the honest formula you will meet again in Part 9 when optimality is discussed.

---

**Exercise 3.6 — erase a DUP.** Net: `DUP#1.p — ERA#2.p`, `DUP#1.a1 — s`, `DUP#1.a2 — t`. One step; state the result.

**Solution (steps).**
1. Rule 6 (DUP–ERA): the DUP disappears, two ERAs attach to `s` and `t`.
2. After: `ERA#3.p — s`, `ERA#4.p — t`. Free ports `{s,t}` unchanged. One interaction.

---

**Exercise 3.7 — universality, precisely.** State what "the six rules are universal" means, and name two things it does not mean.

**Solution (steps).**
1. What it means: every other interaction system (any set of cells and local rules) can be *translated* into a net over `{CON, DUP, ERA}` such that the translation commutes with reduction — same computation, same parallel behaviour, all interactions being rule 1–6 firings (Lafont 1997; tutorial A.5; F.19 §1).
2. It does **not** mean every program is efficient in raw `γ/δ/ε`: an encoding of arithmetic in bare combinators is possible but slow and opaque — hence HVM's extra cells (`NUM`, operators, switches) as practical extensions (F.19 §1).
3. It does **not** mean the system terminates or is deterministic in a scheduling sense: the self-loop of Exercise 2.6 still diverges, and "confluent" never implied "terminating".

---

**Exercise 3.8 — three pairs, how many orders?** A net has three pairwise disjoint active pairs, one of type CON–CON, one type CON–ERA, one type CON–DUP. (a) How many distinct orders are there? (b) How many interactions does each order take? (c) What can you say about the final net?

**Solution (steps).**
1. Orders: 3! = **6** (each pair fires exactly once, independently).
2. Interactions: 6 orders × 3 steps = every order takes exactly **3 interactions** — one per pair. Step-count invariance in action.
3. The final net is the same in all six cases: apply each rule's fixed rewiring to disjoint cells; no rule can observe another pair's wires (locality), so the union of the three rewrites is order-free. One-step confluence trivially lifts to three steps here.

---

**Exercise 3.9 — mixed net, full analysis.** Net:

```
cells : CON#1, DUP#2, ERA#3, CON#4
wires : CON#1.p — DUP#2.p
        CON#1.a1 — ERA#3.p
        CON#1.a2 — CON#4.p
        DUP#2.a1 — s
        DUP#2.a2 — t
        CON#4.a1 — y
        CON#4.a2 — z
free  : s, t, y, z
```

(a) List every active pair. (b) Fire one step of the *leftmost* pair (CON–DUP) and list all active pairs in the result. (c) Could you instead fire the CON#1–ERA pair? What happens to the net, and does the final result change?

**Solution (steps).**
1. (a) Active pairs: the pairs of cells whose principal ports are wired together. Principals: `CON#1.p—DUP#2.p` → pair (1,2), type CON–DUP. `CON#1.a1` is *auxiliary* — the ERA there is not paired. `CON#1.a2 — CON#4.p`: `CON#4.p` is principal, but its partner is `CON#1.a2`, an auxiliary port — not a pair. So: **exactly one active pair, (1,2)**. (One cell, one pair — the rest of the net is just waiting.)
2. (b) Fire CON–DUP on (1,2): copies `D1,D2` land on `CON#1.a1`, `CON#1.a2`; copies `C1,C2` land on `DUP#2.a1`, `DUP#2.a2` (`s`, `t`), crossing as in §3.6. Now `D1` sits on `CON#1.a1` — which carries `ERA#3` — so `ERA#3.p` now faces `D1.p`: **active pair (3, D1), type ERA–DUP.** Similarly `D2` sits on `CON#1.a2`, which carries `CON#4` — `CON#4.p` faces `D2.p`: **active pair (4, D2), type CON–DUP.** Two active pairs, disjoint — they may fire in any order or concurrently.
3. (c) Directly erasing the ERA is *not* available: it sits on an auxiliary port, and the net had exactly one move (that was the point of (a)). But the erasure becomes available one step later, and the continuation is fully determined. Fire both ready pairs:
   - **(ERA#3, D1)** — rule 6: two ERAs land on D1's auxiliary wires, which cross to `C1.a1` and `C2.a1`.
   - **(CON#4, D2)** — rule 4 again: DUP copies `E1`,`E2` land on `y`,`z`; CON copies `F1`,`F2` land on D2's auxiliary wires (inside `C1`,`C2`), with the crossing.
4. After three interactions (commutation, erasure, commutation) no active pair remains — normal form. Final cells: `C1` (principal on `s`), `C2` (on `t`), `ERA-a`, `ERA-b` (inside C1/C2's `a1` ports), `F1`, `F2` (inside their `a2` ports), `E1`, `E2` (waiting on the free ports `y`, `z`): **8 cells, 3 interactions**.
5. The shape is the lesson: the copy descended exactly as far as there were cells to meet; DUP copies that reach a free port simply wait there until the outside connects a cell (then a rule fires); and the erased branch costs one interaction per cell it held.

*Comment.* This small net has the texture of real reductions: only a few cells are ready at any moment, each firing exposes its neighbours, and erasure/duplication decisions appear as ERAs and DUP copies spreading through the graph. The same net in HVM4 would run with the same counts under names `APP…/DUP…` — that mapping is Part 8.

### What to remember from Part 3

- Six rules, one convention: aux1 pairs with aux1. Check every step against the two invariants — **free ports unchanged**, **exactly two cells read**.
- Annihilation (CON–CON, DUP–DUP, ERA–ERA) deletes cells — and CON–CON is **β-reduction**.
- Commutation (CON–DUP) grows the net 2 → 4 and is how copying descends **one layer per interaction**; erasure (CON/DUP–ERA) costs **one interaction per cell**.
- Universality (the six rules can encode any interaction system) is about *encodability*; it says nothing about efficiency — that is why real machines add cells (Part 8).
---

## 4 · λ-calculus on nets: β as one interaction

> Sources: tutorial chapter 04 (A.5, especially its Exercises section), knowledge `03/02` §2 and §5 (F.19), and the HVM4 primer (I.3) for the machine's version of the same encoding.

### 4.1 The encoding

Fix the following two shapes (they were used informally in §3.5; here they are on the record):

```
   λx. M                     (F A)

  var   body                arg   result

  L.a1   L.a2               A.a1   A.a2
    \     /                   \     /
   +--------+                +--------+
   |  LAM   |                |  APP   |
   +---+----+                +---+----+
       |                         |
   L.p (value)               A.p (function)
```

- **Lambda** `λx.M`: principal port `L.p` is the lambda's *value*; `L.a1` is a wire to every use of `x`; `L.a2` is the body's value wire.
- **Application** `(F A)`: principal port `A.p` is the *function* side (this is the port that must meet a lambda's `L.p`); `A.a1` carries the argument; `A.a2` is the result wire.

A **variable used once** is just a wire: `x` in `M` *is* the continuation of `L.a1`. A **variable used twice** gets a DUP on its wire: `L.a1 — DUP.p`, with `DUP.a1`, `DUP.a2` going to the two uses. Used zero times: the wire gets an ERA. Used *n* times: *n−1* DUPs, nested (Exercise 4.5).

### 4.2 β-reduction = rule 1

Put `L.p` against `A.p`. Rule 1 (CON–CON annihilation) fires:

- `a1–a1`: the variable's wire now carries the argument — **substitution done by wiring**.
- `a2–a2`: the body's value now flows to the application's result — **return done by wiring**.

No traversal, no substitution pass over a syntax tree, no scope bookkeeping at this level: one interaction. This is the tutorial's headline claim ("β-reduction is one interaction") made mechanical.

What about copying? A variable used twice sums up as: the argument wire meets a DUP instead of a single use. The DUP doesn't copy at that moment — it sits on the wire and copies **whatever comes down the wire, one layer per interaction**, using rule 4 (and rule 6 for erasure). The costs are visible and countable; §4.4 shows one mid-flight state.

### 4.3 Worked example: the identity, and an unused binder

**Identity.** `(λx. x) y`:

```
cells : L, A
wires : L.p — A.p            (active pair: rule 1)
        L.a1 — L.a2          (x's only use is the body itself)
        A.a1 — y             (argument, free)
        A.a2 — r             (result, free)
```

Fire rule 1: `a1–a1` joins `L.a1` (which is wired to `L.a2`) with `A.a1` (`y`); `a2–a2` joins `L.a2` with `A.a2` (`r`). The result wire `r` is therefore wired, through `x`'s wire, straight to `y`. **1 interaction; result `y`.**

**Unused binder.** `(λx. λy. x) a b`, written `((L₁ a) b)` with `L₁ = λx. M`, `M = λy. x`:

- `M` is the lambda cell `L₂`; its variable `y` is unused ⇒ an ERA on `L₂.a1`; its body is the wire of `x`.
- `L₁.a2` (body value) connects to `L₂.p` (the body *is* a lambda, whose value is `L₂.p`).
- `A₁ = (L₁ a)`: `A₁.p — L₁.p`, `A₁.a1 — a`, `A₁.a2 — A₂.p` (the intermediate result is the next application's function side).
- `A₂ = ((A₁) b)`: `A₂.a1 — b`, `A₂.a2 — r`.

Fire rule 1 on `(L₁, A₁)`: `L₁.a1` (`x`) joins `a`; `L₁.a2` joins `A₁.a2` ⇒ `L₂.p` meets `A₂.p` — a new active pair. Fire rule 1 on `(L₂, A₂)`: `L₂.a1` (the ERA) joins `b` — so `ERA.p — b`; `L₂.a2` (the body, i.e. `x`'s wire) joins `r`.

Reading the wiring: `r` is connected through `x`'s wire to `a`. **Result: `r = a`; an ERA is parked on `b`; 2 interactions.** If `b` is later connected to a cell, the ERA descends into it (rules 5–6); if not, `b` was simply discarded.

### 4.4 Worked example: a two-use variable, mid-copy

`(λx. (x, x)) y`, where the pair is a CON cell `P` and `y` is a CON cell `Y` with free leaves `p`, `q`:

```
cells : L, A, DUP, P, Y
wires : L.p — A.p                 (active: rule 1)
        L.a1 — DUP.p              (x used twice → one DUP)
        DUP.a1 — P.a1             (first slot)
        DUP.a2 — P.a2             (second slot)
        L.a2 — P.p                (body value = the pair)
        A.a1 — Y.p                (argument)
        A.a2 — r                  (result, free)
        Y.a1 — p, Y.a2 — q        (leaves, free)
```

Step 1, rule 1 on `(L, A)`: the variable wire (`DUP.p`) joins the argument wire (`Y.p`) ⇒ `DUP.p — Y.p`, a new active pair; and `P.p — r` (the pair flows to the result).

Step 2, rule 4 on `(DUP, Y)`:

- DUP copies `D1`,`D2` land on `Y`'s auxiliary wires ⇒ `D1.p — p`, `D2.p — q`.
- CON copies `C1`,`C2` land on the DUP's auxiliary wires ⇒ `C1.p — P.a1`, `C2.p — P.a2` (principals on the *slot* wires).
- Crossed: `D1.a1—C1.a1`, `D1.a2—C2.a1`, `D2.a1—C1.a2`, `D2.a2—C2.a2`.

State now: **5 cells** (`P`, `D1`, `D2`, `C1`, `C2`), **2 interactions so far**, and *no active pairs*: the copies are one level down; `D1`,`D2` wait on the leaves `p`,`q` until something cell-shaped arrives, and `C1`,`C2` wait inside the pair's slots. This "parked at the frontier" state is normal: the copy is only as deep as the structure it has met. Any cell that later connects to `p`, `q`, or traverses the slots fires the next rule on demand.

> **The one thing to take away.** *Substitution is wiring; copying is a graph process that happens on demand, one interaction per cell visited.* Every performance claim about this lineage — and every hazard — grows out of those two sentences.

### 4.5 What plain combinator nets cannot do

The three cells work beautifully as long as every DUP copies exactly "the thing". They fall apart on **nested duplication** — a DUP that has to copy a structure which itself contains DUPs, or two DUPs that must pair up the right alternatives. The knowledge base states the failure concretely (F.19 §5):

- plain combinators "cannot distinguish *which* duplicator should annihilate with *which* copy — nested dups collapse incorrectly";
- the fix, in the Interaction Calculus, is **labels**: every DUP and every SUP carries one, "same label annihilates, different labels commute";
- the fully-general machinery for this in the literature is Lamping's "oracle" (brackets/croissants, safe pointers — the *TOIOFPL* book), and it costs roughly an order of magnitude; the calculus's labels are the lightweight, local alternative;
- HVM1's own docs describe the pathological case (`let g = λf. λx. (f (f x)) in (g g)` — a clone cloning its own clone) as out of the bookkeeping-free fragment; eta-expansion or EAL-style analysis were the workarounds.

So Part 5's labels are not a decorative feature. They are the smallest known device that makes one DUP per copy, nesting-safe, **locally decidable**. Everything labeled in the rest of this course — including `&A{1,2}`, `!x&A = …`, and every HVM4 program — is that device doing its job.

---

**Exercise 4.1 — encode and reduce the identity.** Write the net for `(λx. x) y` in the linear notation (cells, wires, free), reduce, and state the result and interaction count.

**Solution (steps).**
1. Cells: `L` (LAM), `A` (APP). `L.p — A.p` (the only active pair).
2. `L.a1 — L.a2` (x's use is the body); `A.a1 — y`; `A.a2 — r`.
3. Rule 1: `a1–a1` joins `L.a1` (`= L.a2`) with `A.a1` (`y`); `a2–a2` joins `L.a2` with `A.a2` (`r`).
4. The result wire `r` is connected to `y`. **1 interaction.**
5. Sanity: free ports `{y, r}` before and after ✓.

---

**Exercise 4.2 — the erased binder.** For `(λx. λy. x) a b` as in §4.3: (a) how many interactions to normal form; (b) where does the ERA end up; (c) what is the result?

**Solution (steps).**
1. Active pairs fire in order: `(L₁, A₁)` then `(L₂, A₂)`: **2 interactions**.
2. The ERA sits on `L₂.a1` (the unused `y`); rule 1's `a1–a1` link joins it to the argument `b`: **the ERA ends parked on `b`**.
3. `r` is wired through `x`'s wire to `a`: **result `= a`**.
4. If `b` is a free port, no further interaction happens (an ERA on a leaf port is already normal). If `b` is a cell, rules 5–6 will erase that cell's structure next — one interaction per cell.

---

**Exercise 4.3 — inserting the DUP.** Write the variable-wire wiring for `λx. (x, x)` (x used twice) versus `λx. x` (once). How many cells does the DUP add at λ-time?

**Solution (steps).**
1. Once: no extra cell — `L.a1` is a plain wire that becomes the single use.
2. Twice: `L.a1 — DUP.p`; `DUP.a1` → first use, `DUP.a2` → second use. **One extra cell.**
3. General rule: **n uses ⇒ n−1 DUPs**; zero uses ⇒ one ERA. These are the only three cases the net layer needs; the language layer (Bend 2) will make you write the intent (`+x` or `λ&x`) and check it.

---

**Exercise 4.4 — count the mid-copy state.** After §4.4's two steps, how many cells are there, and how many interactions have fired? Predict what happens next if the free leaves `p`, `q` are connected to two number-ish CON cells.

**Solution (steps).**
1. Before: `L, A, DUP, P, Y` = 5 cells. Step 1 consumes `L, A` → 3 cells. Step 2 (rule 4) consumes `DUP, Y` → 4 created ⇒ `3 − 2 + 4 = 5` cells: `P, D1, D2, C1, C2`.
2. Interactions: **2**. No active pair remains (all principals face auxiliary ports or free leaves).
3. If `p`/`q` receive CON cells: each `D1`/`D2` meets one — two commutations (rule 4), each growing the net by 2 cells and pushing the copy one level further into those cells. One level per interaction, always.
4. If instead a leaf is erased later, its DUP copy meets an ERA and vanishes (rule 6) — the copy was never materialized deeper. That is the laziness dividend.

---

**Exercise 4.5 — three and four uses.** HVM4's parser expands a cloned binder mechanically. For three uses it documents:

```text
body[x, x, x]  ⇒  !d0&=x; !d1&=d0₁; body[d0₀, d1₀, d1₁]
```

(compendium I.5, "Cloned binders"). (a) Rewrite the expansion for **four** uses. (b) How many DUP nodes for n uses? (c) The runtime reports `(λ&x.[x,x,x,x])(7)` as `[7,7,7,7]` in 4 interactions — explain the count in terms of your expansion.

**Solution (steps).**
1. (a) Four uses — nest one more dup and split the last tail:
   `!d0&=x; !d1&=d0₁; !d2&=d1₁; body[d0₀, d1₀, d2₀, d2₁]`
   (each new dup copies the remaining tail; verify: the uses are `d0₀`, `d1₀`, `d2₀`, `d2₁` — four wires, affine ✓).
2. (b) n uses ⇒ **n−1 DUPs** (the tree of dups has n leaves): 3 uses → 2 DUPs; 4 → 3.
3. (c) The program duplicates the literal `7` three times (3 DUPs, each meeting the number = one interaction per copy) and the last application wires up: total **4 interactions** for 4 uses — consistent with the runtime's `Itrs: 4`. (The verified run is in Appendix C.)

---

**Exercise 4.6 — why labels (reading).** In your own words: why does "same label annihilates, different labels commute" solve the nested-duplication problem, and what did the literature need before labels existed?

**Solution (steps).**
1. Without labels all DUPs are interchangeable, so when a DUP meets a SUP (the "two values in one place" cell) there is no fact of the matter about *which* pairings are intended: every match collapses all nests at once — wrong for clones of clones (F.19 §5).
2. With labels, the pairing is **local data**: a DUP with label `L` annihilates against a SUP with label `L` (pair projection), and merely commutes against any other label (delaying, duplicating one level). Every decision reads the two cells' labels and nothing else — no global stack, no oracle.
3. Before labels, full optimal reduction needed Lamping's oracle: brackets, croissants, safe pointers (TOIOFPL); it matched fans correctly but cost ~10× on β-reduction (HVM1 docs, F.19 §4).
4. Labels are therefore the lightweight, local approximation that keeps the useful fragment fast — and they are exactly what Part 5 writes down formally.

### What to remember from Part 4

- Two shapes do all the work: the **lambda cell** (principal = its value; aux = variable wire, body) and the **application cell** (principal = function; aux = argument, result). β fires when the two principals meet — **one interaction, substitution by wiring**.
- Variable accounting: used once → a wire; **n uses → n−1 DUPs**; zero uses → an ERA. HVM4 automates this (`λ&x`, `λx&L`, `*`/`&{}`); the semantics stays affine.
- Copying is **on demand**: a DUP rides the wire and fires per cell it actually meets; mid-copy states (copies parked at leaves) are normal.
- Plain combinator nets cannot do **nested duplication** correctly ("clone of a clone") — that failure is the reason Part 5's labels exist.
---

## 5 · Labels and the Interaction Calculus

> Primary sources: `docs/theory/interaction_calculus.md` of HVM4 (I.4) — the "four core interactions" and the label semantics; the tutorial's chapter 14 (A.15) — which ran the reference implementation and recorded outputs and interaction counts; the knowledge base `03/02` §5–§6 (F.19). Every `ic` program below was re-run for this course on a fresh build of the reference implementation (Appendix F records the build).

### 5.1 From pictures to text — and two dialects

The Interaction Calculus (IC) is the λ-calculus *completed* with two dual primitives:

- **Duplication** `!&L{x,y} = t; body` — one value in two locations.
- **Superposition** `&L{a,b}` — two values in one location.

Both carry a **label** `L`. The calculus has six forms:

| Form | IC (reference dialect) | HVM4 dialect | Meaning |
|---|---|---|---|
| variable | `x` | `x` | used at most once (affine), but **global** — it may appear anywhere |
| erasure | `*` | `&{}` | a discarded value |
| lambda | `λx.t` | `λx.t` | a function |
| application | `(f a)` | `f(a)` | apply `f` to `a` |
| superposition | `&L{a,b}` | `&L{a,b}` | two alternatives |
| duplication | `!&L{x,y} = t; body` | `!x&L = t; body`, uses `x₀`,`x₁` | split `t` into two uses |

Two notational traps to burn in now:

- **`*` means ERA in IC, but "wildcard; duplicates itself, equals anything" in HVM4** (`Any`, I.6). The HVM4 erasure is `&{}`. Never mix them up.
- IC names the two copies (`{x,y}`); HVM4 names the *value* (`x`) and exposes the copies as `x₀`/`x₁`.

Everything else is shared. A superposition is not a new kind of cell: it is a DUP **read from the other side** — its principal port faces the value, its aux ports hold the alternatives (tutorial A.15 draw both readings side by side, and so does the table below, §5.5).

### 5.2 The four core interactions (plus erasure)

The minimal calculus has four rules — two that **create** computation and two that **propagate** it:

**APP-LAM** — application eliminates lambda (β):

```ic
(λx.x λy.y)
```

```text
λ$a.$a

WORK: 1 interactions
```

The `$a` is a *global* (unscoped) variable in the readback: after β the binding scopes no longer matter, exactly as the net model says. One interaction, one wiring.

**DUP-SUP (same label)** — duplication eliminates superposition: pair projection.

```ic
!&0{x,y}=&0{λa.a,λb.b}; (x y)
```

```text
λ$a.$a

WORK: 2 interactions
```

Read it as: the two alternatives of the superposition are *routed* to the two uses — first to first, second to second — then the application fires. Total 2.

**DUP-SUP (different labels)** — commute instead of annihilate.

```ic
!&0{x,y}=&1{λa.a,λb.b}; (x y)
```

```text
&1{λ$a.$a,λ$b.$b}

WORK: 9 interactions
```

Different labels cannot route: the duplication must *copy the alternatives*, so the superposition survives (with label 1 — the sup's own label) and both branches compute the same result. The price jumps from 2 to 9 because copying through two lambdas takes the long way (each lambda must be duplicated: DUP-LAM fires per lambda, each copy costs its own sub-interactions).

**APP-SUP** — application distributes over superposition:

```ic
(&0{λx.x,λy.y} λz.z)
```

```text
&0{λ$a.$a,λ$b.$b}

WORK: 5 interactions
```

Rule shape: `(&L{a,b} c)` ⇒ `!&L{x,y} = c; &L{(a x),(b y)}` — the *argument* gets duplicated so each alternative can consume its own copy. The count: 1 for APP-SUP, then the duplication of `λz.z` runs through DUP-LAM and its cleanups.

**DUP-LAM** — duplication propagates through lambda. This is the deep one:

```ic
!&0{x,y}=λz.z; (x y)
```

```text
λ$a.$a

WORK: 3 interactions
```

Rule shape: `!&L{x,y} = λz.f; t` ⇒ the two copies become `λ$z0.G₀` and `λ$z1.G₁`; the bound variable `z` becomes the **superposition** `&L{$z0,$z1}`; the body `f` is duplicated behind a fresh dup `G`. The bound variable *escapes its scope* — the `$z0`, `$z1` are global names — and that escape is precisely what allows sharing to extend **inside lambdas**. The body is computed once; the copies read it through the shared `G`.

**Erasure.** `*` meets anything and deletes it (propagating `*` into the structure):

```ic
(* λx.x)
```

```text
*

WORK: 1 interactions
```

```ic
!&0{x,y}=*; (x y)
```

```text
*

WORK: 2 interactions
```

### 5.3 Labels: the rule that makes it all work

Read the two DUP-SUP programs again — they differ only in one digit, and the outcome flips from "pair projection" (2 interactions) to "cross product preserved" (9 interactions):

- `!&0{x,y} = &0{…}` — same label `0` on both fans: the fans **annihilate**. The two cells were computed as a pair; projecting them is the natural reading.
- `!&0{x,y} = &1{…}` — different labels: the fans **commute**. Neither cell was "meant" for the other; the duplication copies the superposition and lets both branches survive.

The README of the calculus calls a superposition "a pair" and the same-label rule "exactly like a pair projection". The formal statement (I.4):

```text
! x &L= &R{a, b}; t
-------------------- DUP-SUP
if L == R:   x₀ ← a;  x₁ ← b;  t
else:        ! A &L= a;  ! B &L= b;
             x₀ ← &R{A₀, B₀};  x₁ ← &R{A₁, B₁};  t
```

One glance tells you why labels are the whole game: the rule is **local** (it reads two labels and nothing else), **deterministic**, and it gives every nested-sharing situation a decidable answer. No oracle, no global bookkeeping — the lightweight solution to the problem Part 4 ended on.

Labels proliferate exactly the way the docs promise: the parser gives each *auto*-duplication a fresh label. That is why, in HVM4, `(λx&.[x₀,x₁])(&A{1,2})` produces **two** outcomes (the auto label differs from `A`, so the fans commute):

```hvm
@main = (λx&.[x₀,x₁])(&A{1,2})
```

```text
[1,1]
[2,2]

Itrs: 6
```

while choosing the *same* label makes it a projection:

```hvm
@main = !x&A = &A{1,2}; [x₀,x₁]
```

```text
[1,2]

Itrs: 1
```

Both runs are real (Appendix C). Change one label, change the meaning — and the runtime counts it.

### 5.4 What the calculus fixed, and why variables went global

For the record, the two design moves that make IC work as a *calculus* (I.4, F.19 §5):

1. **Affine variables, global scope.** Each variable is used at most once — cheap GC, simple parallelism — but a variable may occur *outside its binder's lexical scope*. DUP-LAM is exactly such a case: `z` gets superposed and exported. A conventional language designer's nightmare; the reason continuations, linear HOAS and mutable refs fall out of this calculus naturally.
2. **Labels on fans.** The completion of λ-calculus: applying a pair (APP-SUP) and projecting a lambda (DUP-LAM) were previously undefined; labels give them a meaning, and they make "which copy" a local fact.

The two moves are not separable: global variables are how sharing reaches inside lambdas; labels are how the resulting clones stay distinguishable.

### 5.5 The cell reading (and one honest caveat)

| Text | Cell | Principal port | Auxiliary ports |
|---|---|---|---|
| `λx.t` | CON | the lambda's value | the variable wire `x`, the body `t` |
| `(f a)` | CON | the function `f` | the argument `a`, the result |
| `!&L{x,y} = t; body` | DUP label `L` | `t` | `x` and `y`; `body` continues the net |
| `&L{a,b}` | DUP label `L`, read from the other side | the value | the alternatives `a`, `b` |
| `*` / `&{}` | ERA | — | none |

**Caveat (stated by HVM5's own spec, compendium G.5).** This table is the *semantic model*. HVM4's C implementation does **not** keep a port/wire graph — it keeps a term encoding with 64-bit words, linked variables and substitution cells (Part 8). The model is what makes the rules correct; the encoding is what makes them fast. Keep both pictures; don't confuse them.

---

**Exercise 5.1 — predict, then check (six programs).** For each IC program, predict (a) the shape of the result and (b) whether its WORK is small (single digits) or large, then compare with the solutions. Use the rule shapes from §5.2.

1. `(λx.x λy.y)`
2. `!&0{x,y}=λz.z; (x y)`
3. `!&0{x,y}=&0{λa.a,λb.b}; (x y)`
4. `!&0{x,y}=&1{λa.a,λb.b}; (x y)`
5. `(&0{λx.x,λy.y} λz.z)`
6. `(* λx.x)`

**Solution (steps).** (All six were run; outputs verbatim.)
1. APP-LAM — `λ$a.$a`, **1** interaction.
2. DUP-LAM — both copies are the identity composed with itself: `λ$a.$a`, **3** interactions.
3. Same-label projection: `λ$a.$a`, **2** interactions (route, then apply).
4. Different labels: the sup survives and both branches reduce to the identity: `&1{λ$a.$a,λ$b.$b}`, **9** interactions.
5. APP-SUP: the argument is duplicated for both alternatives: `&0{λ$a.$a,λ$b.$b}`, **5** interactions.
6. Erasure: `*`, **1** interaction.

---

**Exercise 5.2 — file the notation.** Translate both directions. (a) IC → HVM4: `!&A{x,y} = &A{1,2}; [x, y]`-ish programs do not translate literally (IC has no lists in its core) — translate instead the *core* duplication `!&0{x,y}=&0{a,b}; (x y)` to HVM4 form, and state what `(x y)` becomes. (b) HVM4 → IC: `!x&A = &B{1,2}; [x₀,x₁]`.

**Solution (steps).**
1. (a) HVM4 binds the *value*: `!x&A = &A{...}; ...` with uses `x₀`, `x₁`. So: `!x&0 = &0{a,b}; (x₀ x₁)` — wait: `(x y)` in IC means "apply x to y"; the HVM4 spelling is `x₀(x₁)`. Result: `x₀(x₁)`.
2. The distinction that matters: IC writes the two copies as separate names (`x`,`y`); HVM4 writes one name and subscripts (`x₀`,`x₁`). Same rule, same labels, same counts.
3. (b) IC form: `!&A{x,y} = &B{1,2}; [x, y]` → but IC lacks list cells; in pure-λ form the body would be `(x y)` etc. The *labels* stay identical: the dup's label is `A`, the sup's label is `B`, they differ, so the fans commute and each branch keeps the sup — outputs `[1,1]` and `[2,2]` in HVM4 (verified; Appendix C), matching the `&1{…}` pattern of Exercise 5.1.4.
4. The translation rule of thumb: **labels and cell kinds translate 1:1; only the naming of uses differs.**

---

**Exercise 5.3 — fire DUP-SUP by hand.** Using the formal rule of §5.3, rewrite (a) `!&7{u,v}=&7{p,q}; (u v)` and (b) `!&7{u,v}=&8{p,q}; (u v)` to their next states, as text.

**Solution (steps).**
1. (a) Labels equal (7 = 7): annihilation branch — `u ← p`, `v ← q`, body `(u v)` becomes `(p q)`. One rule firing; then the application `(p q)` fires if `p` is a lambda (APP-LAM).
2. (b) Labels differ (7 ≠ 8): commute branch —
   - `!A&7 = p; !B&7 = q;`
   - `u ← &8{A₀, B₀}; v ← &8{A₁, B₁};` and the body continues as `(u v)`.
3. In (b) note *where* the new duplications went: they took label 7 (the **duplication's** label), and the new superpositions kept label 8 (the **superposition's** label). The rule always preserves each fan's own label while re-nesting the pairing. That invariant is what keeps a third fan later able to decide its pairing correctly — the nesting problem solved locally.

---

**Exercise 5.4 — apply a superposition by hand.** Rewrite `(&L{r,s} m)` one step using APP-SUP, then identify which of the three remaining computations is a duplication and which is an application.

**Solution (steps).**
1. APP-SUP: `(&L{r,s} m)` ⇒ `!&L{x,y} = m; &L{(r x),(s y)}`.
2. Inside the `&L{…}`: two applications `(r x)` and `(s y)` — each fires when `r`/`s` meets a lambda (APP-LAM) or another sup (APP-SUP, again).
3. The `!&L{x,y} = m` part: a duplication of the argument `m`, which fires by whichever rule its shape matches (DUP-LAM for a lambda, DUP-SUP for a sup, `*`-erasure, etc.).
4. So one APP-SUP spawns **one duplication + two applications** — the exact shape verified in Exercise 5.1.5 ("5 interactions" for the λ-typed instance).

---

**Exercise 5.5 — "works like a pair".** The calculus README says a superposition works like a pair, and the same-label rule is exactly pair projection. Make that precise for `&L{a,b}` with a same-label dup: which value reaches `x₀`, which reaches `x₁`, and what would a *pair cell* have done differently?

**Solution (steps).**
1. Same-label DUP-SUP: `x₀ ← a`, `x₁ ← b` — **first component to first use, second to second**. Exactly `fst`/`snd` of a pair `(a,b)`.
2. A genuine pair cell (a CONS-like constructor) would also have to be *opened*: a match cell meets it, extracts the fields. The superposition needs no constructor at all — it *is* the two-value cell; the dup meeting it is the projection.
3. Difference in behaviour: a pair cell holds its two fields *simultaneously regardless of labels*; a superposition is label-aware — a differently-labelled dup refuses to project and copies instead (Exercise 5.1.4). Grabbing "the pair's" components is only available to a fan with the matching label.
4. That is why §5.1 warns: `&L{…}` is a DUP read from the other side — the cell kind is the same; the *label correspondence* decides projection vs copy.

---

**Exercise 5.6 — explain a count.** Same-label DUP-SUP costs 2 interactions; the different-label version costs 9. Explain the jump in terms of rule firings (name which rules are needed by the second and not the first).

**Solution (steps).**
1. The same-label path needs: DUP-SUP (route) + one application step per branch to reach the final form; the routing is a single annihilation. Total 2.
2. The different-label path must *copy both lambdas*: DUP-LAM fires per copied lambda (each copy: does the dup-lambda interaction plus, inside, the duplication of the body); then the application steps in each branch (APP-LAM twice), then the collapse cleanup that reconnects the superposed variables. Each of those is a separate interaction; the 9 counts all of them.
3. General lesson: **routing (same label) is cheap; copying (different labels) costs one DUP-LAM per lambda visited.** Cross-product behaviour is powerful and proportionate: you pay per structure you actually duplicate.

---

**Exercise 5.7 — the escaping variable, traced.** For `!&0{x,y}=λz.z; (x y)`: execute DUP-LAM on paper (use the rule shape from §5.2), then the same-label DUP-SUP, and say where the `$z0`/`$z1` names come from.

**Solution (steps).**
1. DUP-LAM: `x ← λ$z0.G₀`, `y ← λ$z1.G₁`, `z ← &0{$z0,$z1}`, `!&0{G₀,G₁} = z-body`. The two copies of the lambda refer to *global* names `$z0`,`$z1` — the bound variable `z` could not stay bound: two copies of one binder need two variables, and neither copy owns them.
2. The body `z` (a use of the variable) is now the superposition `&0{$z0,$z1}`.
3. Same-label DUP-SUP: the fresh body-dup meets that sup ⇒ `G₀ ← $z0`, `G₁ ← $z1` — the first copy's body reads the first variable, the second copy's body the second.
4. Applications fire: `(λ$z0.$z0 λ$z1.$z1)…` reduces to the identity; the readback prints `λ$a.$a`, WORK 3 (DUP-LAM + DUP-SUP + the final application). Global variables are the price of sharing inside lambdas; the labels make the bills payable.

---

**Exercise 5.8 — same computation, two dialects.** Write the HVM4 spelling of Exercise 5.1.3's behavior (same-label projection) *as a pair of results*, and the HVM4 spelling of different labels; give the outputs.

**Solution (steps).**
1. Same label (projection): `!x&A = &A{1,2}; [x₀,x₁]` → `[1,2]`, 1 interaction (verified: Appendix C).
2. Different label: `!x&A = &B{1,2}; [x₀,x₁]` → `[1,1]` and `[2,2]`, 5 interactions (verified). The sup commuted: each branch kept the whole superposition, and the dup copied it.
3. Cross-check against IC: the lambda-typed versions are `!&0{x,y}=&0{λa.a,λb.b}; (x y)` (2) and `!&0{x,y}=&1{…}` (9). Same labels, same shape of behaviour, different counts for different payloads — the payload's duplication cost drives the count.

---

**Exercise 5.9 — the two readings of `&L{a,b}`.** Draw (as text) `&L{a,b}` and `!&L{x,y} = t; body` as cells, label principal vs auxiliary ports in both, and state in one sentence why they are "the same cell read from two sides".

**Solution (steps).**
1. `!&L{x,y} = t; body`: principal at `t` (the value flows in), auxiliaries `x`,`y` (the copies flow out); the rest of the net (`body`) continues from the auxiliaries.
2. `&L{a,b}`: principal at the **value side** (whatever consumes this term connects there), auxiliaries `a`,`b` (the alternatives).
3. "Same cell, two sides": in both cases the cell has one principal and two auxiliary ports; one reading is the producer of two copies, the other is the consumer of two alternatives — which side you call which is just the direction the wire is drawn. Part 6 turns the second reading into a programming tool.

### What to remember from Part 5

- The Interaction Calculus = λ + **labeled duplications and superpositions**; affine variables, but **global** scope (that is what lets sharing reach inside lambdas).
- The four rules: **APP-LAM** (β), **APP-SUP** (distribute, dup the argument), **DUP-LAM** (copies + superposed bound variable — the deep one), **DUP-SUP** (**same label**: project; **different labels**: commute), plus erasure.
- Counts worth memorising (all verified): β = 1; same-label projection = 2; different-label copying of λ² = 9; APP-SUP = 5; DUP-LAM = 3; erasures = 1–2. Cheap = routing; expensive = copying.
- Two dialects, one calculus: IC writes copies `{x,y}` and erases with `*`; HVM4 writes the value `x` with sides `x₀`,`x₁`, erases with `&{}`, and spells application `f(a)`.
- The cell reading (a SUP is a DUP read from the other side) is **semantics**; the machine's encoding is Part 8.
---

## 6 · Superposition as a tool: collapse, enumeration, search

> Sources: HVM4's collapser notes (I.7), the interaction-calculus theory's superposition section (I.4), the tutorial's chapter 14 with its verified `ic` runs (A.15), and the primer's superposition/label examples (I.3). HVM4 outputs below were re-verified for this course; `ic` outputs match the tutorial's recorded runs.

### 6.1 Two values in one place

A superposition `&L{a,b}` is not a tuple, not a `Maybe`, and not a lazy value. It is one term that **is** both `a` and `b` at once, and the runtime keeps it that way until either a same-label duplication projects it (Part 5) or the output stage *enumerates* the branches.

```hvm
@main = (&A{1,2} + 10)
```

```text
11
12
```

One program, one term, two answers. `(&A{1,2} + 10)` was computed in 4 interactions total — the addition fired once per alternative, the `10` was duplicated where needed, and nothing enumerated assignments in a loop. This is the "one hole, two values" reading from the end of Part 5.

### 6.2 Collapse: turning superpositions into answers

Reduction has three destinations (I.3, I.7):

- **WNF** — weak normal form: only the head is reduced.
- **SNF** — strong normal form: fully reduced, superpositions and duplications still in the term. Proofs about programs are stated against SNF.
- **CNF** — *collapsed* normal form: the term is rewritten into a stream of ordinary λ-terms — one per alternative — by cleanup interactions (`DUP-VAR`, `DUP-APP`) and by lifting superpositions to the top. The `-C` flag selects this.

The collapse algorithm's behaviour is exactly the label story of Part 5, read at the output stage (I.7):

- **different labels commute → cross product**: `[&A{1,2}, &B{3,4}]` gives the four pairings `[1,3] [1,4] [2,3] [2,4]`;
- **same labels annihilate pairwise**: `[&A{1,2}, &A{3,4}]` gives just `[1,3] [2,4]`.

Both were re-run for this course:

```text
[&A{1,2}, &B{3,4}]        ->  [1,3] [1,4] [2,3] [2,4]        (10 itrs)
[&A{1,2}, &A{3,4}]        ->  [1,3] [2,4]                     ( 2 itrs)
[&A{1,2}, &B{3,4}, &C{5,6}] -> 8 lines, all combinations      (37 itrs)
[&A{1,2}, &A{3,4}, &A{5,6}] ->  [1,3,5] [2,4,6]               ( 3 itrs)
```

Everything the collapse prints is *derived from the term's own labels*. No rule ever guesses.

Each output line in HVM4's collapse mode carries a numeric tag (`#6`, `#9`, …) — a scheduling key from the collapse queue, not part of the answer. Ignore it when reading results; it is not stable across versions.

### 6.3 Arithmetic across a superposition

```hvm
@main = (&A{1,2} * &B{10,20})
```

```text
10
20
20
40

Itrs: 10
```

Every combination of alternatives flows through the multiplication: `1*10=10`, `1*20=20`, `2*10=20`, `2*20=40`. With the **same** label it is pairwise instead:

```hvm
@main = (&A{1,2} * &A{10,20})
```

```text
10
40

Itrs: 4
```

The claim to take away from the docs (site note, `notes/hvm-runtime`): work that does not depend on the choice is **shared** — the operation and its argument plumbing do not restart from scratch per assignment. Two independent superpositions of 2 alternatives cost 4 evaluations' *worth of answers* at a fraction of 4 evaluations' *worth of interactions* (10 vs. what a naive unroll of four programs would cost — and at 3 sups, 37 interactions for 8 branches; the counts scale gently because nothing is duplicated except what the branches actually need).

### 6.4 Reading a whole truth table at once

Give True and False their standard λ-encodings and look at AND of two boolean superpositions. First with **different** labels (`ic`, verified; whole program is the AND function applied to the two sups):

```ic
((λa.λb.(a b λt.λf.f)) &0{λt.λf.t,λt.λf.f} &1{λt.λf.t,λt.λf.f})
```

```text
&0{&1{λa.λb.a,λc.λd.d},λe.λf.f}

WORK: 18 interactions
```

The result is a nested superposition with **three** leaves: `(T,T)→T`, `(T,F)→F` and `(F,_)→F`. Three, not four: when the first input is False, AND never looks at the second, so the second superposition is **erased** in that branch. With **same** labels it pairs alternatives instead:

```ic
((λa.λb.(a b λt.λf.f)) &0{λt.λf.t,λt.λf.f} &0{λt.λf.t,λt.λf.f})
```

```text
&0{λa.λb.a,λc.λd.d}

WORK: 12 interactions
```

Two leaves: `(T,T)→T`, `(F,F)→F`. The lesson (tutorial A.15): labels and erasure — not just the function — decide the *shape* of an answer. A superposition that is never consumed is not a wrong answer; it is not an answer at all. That is the behaviour that makes the next section possible.

### 6.5 Search by erasure — the selector trick

A **selector** is a function that keeps its argument only when a test passes, and erases it (`*`) when it fails. For a boolean `r`, the selector "keep when True" is:

```text
λr. (r A *)      -- True takes first argument (A), False takes second (erases)
```

Apply the selector to the AND-yes/no question over two superposed booleans:

```ic
((λa.λb.((λr.(r λx.λy.x *)) (a b λt.λf.f))) &0{λt.λf.t,λt.λf.f} &1{λt.λf.t,λt.λf.f})
```

```text
&0{&1{λa.λb.a,*},*}

WORK: 37 interactions
```

Read the answer: every branch where AND was False is now `*` (erased); the single surviving branch `λa.λb.a` is the input pair **(True, True)**. The program was written **once**, the candidates were a superposition, and the filter did the selection. The tutorial calls this "search without loops": no enumeration ever appears in the program text.

The mirror-image selector (`λr.(r * A)`, "keep when False") keeps the falsifying cases — and here the erasure insight bites: you get the *two* branches `(F,T)` and `(F,F)` merged into one leaf, because in the False branch AND never inspected the second input (verified, 37 interactions — tutorial A.15's own exercise).

### 6.6 Enumeration and infinite superpositions

Superpositions can enumerate **data** as easily as booleans. This program builds all 3-bit strings, one branch per string, by recursion — the recursion is written once, the branching is the superposition (verified; `@bits` from the HVM4 test suite):

```hvm
@bits = λ{ #Z: #E{} ; #S: λp.!P&L=p ; &L{ #O{@bits(P₀)}, #I{@bits(P₁)} } }
@main = @bits(#S{#S{#S{#Z{}}}})
```

```text
#O{#O{#O{#E{}}}}
#O{#O{#I{#E{}}}}
#O{#I{#O{#E{}}}}
#O{#I{#I{#E{}}}}
#I{#O{#O{#E{}}}}
#I{#O{#I{#E{}}}}
#I{#I{#O{#E{}}}}
#I{#I{#I{#E{}}}}

Itrs: 40
```

Eight strings — the whole space — in 40 interactions. And a superposition can even be **infinite**, because it is only demanded lazily:

```hvm
@if = λ{ #T: λt.λf.t ; #F: λt.λf.f }
@add = λ{ #Z: λb.b ; #S: λp.λb.#S{@add(p, b)}; }
@eq = λ{ #Z: λ{ #Z: #T{}; #S: λbp. #F{} }; #S: λap.λ{ #Z: #F{}; #S: λbp. @eq(ap, bp) } }
@X = &Z{#Z{}, #S{@X}}          // the superposition of all naturals
@two = #S{#S{#Z{}}}
@four = #S{#S{#S{#S{#Z{}}}}}
@main = @if(@eq(@add(@X, @two), @four), @X, &{})
```

```text
#S{#S{#Z{}}}

Itrs: 536
```

`@X` is "0 or 1+@X" — an infinite fan of every natural. The equation solver applies a predicate to it; every candidate that fails is erased (`&{}`), and the demanded one comes out. The runtime never enumerated 10,000 candidates; it unfolded exactly as far as the test needed. (Both runs re-verified for this course — Appendix C quotes the full program and its 536 interactions.)

### 6.7 The fork: two versions of one program, one run

`&Lλx,y{A;B}` (fork sugar) superposes two branches that share their inputs through a duplication (I.3, I.5):

```hvm
@main = (&Lλx,y{(x+y);(x*y)})(&L{2,100},&L{3,100})
```

```text
5
10000

Itrs: 6
```

Main version added, branch version multiplied — both answers out of one term. The tutorial's small fork example (verified `ic`, 8 interactions) runs the identity and a NOT side by side:

```ic
(&0{λx.x,λx.(x λt.λf.f λt.λf.t)} λt.λf.t)
```

```text
&0{λ$a.λ$b.$a,λ$c.λ$d.$d}
```

### 6.8 What this is — and what it is not

- **It is**: alternatives inside one term, evaluated together, sharing everything before the first divergence, filtered by erasure. "Cheap fork" in the sense that a fork is a term, not a process copy.
- **It is not**: a copy of a running program with independent memory. There are no two heaps; there is one net with a superposition in it. (Tutorial A.15, "Limits".)
- **Wall clock is unknown.** Every number in this part is an interaction count, the calculus's own work metric. The published speedups (e.g. the DPS search gist: ~36k interactions against ~262M for 65,536 separate runs) are interaction counts for the search itself; memory and wall time were not measured. Treat them as promises of the *mechanism*, not benchmark results (A.15).
- **SupGen is not public.** The synthesizer these techniques were built for has no published source; the mechanism above is public and reproducible, the synthesizer is not. Claims about it in secondary material should be read as claims (A.15, H.53).
- **Released Bend 2 does not have any of this.** `&{a, b}` is a parse error in the compiler, BendRT does not reduce nets, and there is no `sup` syntax outside the HVM/IC tools. This is the strongest motivation for the HVM5 project (Part 10) — putting the calculus back under the language.

---

**Exercise 6.1 — pairwise or cross?** Predict the outputs of (a) `[&A{1,2}, &B{3,4}]` and (b) `[&A{1,2}, &A{3,4}]` under collapse, with rough interaction counts, then check.

**Solution (steps).**
1. (a) Labels differ ⇒ commute ⇒ cross product: `[1,3]`, `[1,4]`, `[2,3]`, `[2,4]`. Count: the runtime reports **10 interactions**.
2. (b) Labels equal ⇒ annihilate pairwise: `[1,3]`, `[2,4]`. Count: **2 interactions** — routing only, nothing copied.
3. Rule of thumb: *n* independent sups of *k* alternatives ⇒ `kⁿ` lines and no copying; same-label sups collapse pairwise ⇒ *k* lines, cheap.

---

**Exercise 6.2 — multiply the branches.** For `(&A{1,2} * &B{10,20})` list the four answers; then say what `(&A{1,2} * &A{10,20})` gives and why the interaction count drops from 10 to 4.

**Solution (steps).**
1. Cross product: `1*10=10`, `1*20=20`, `2*10=20`, `2*20=40` — output order `10,20,20,40` (verified).
2. Same label: pairwise projection first ⇒ `(1*10, 2*20)` = `10, 40`, two answers (verified).
3. Count drop: the same-label case routes the alternatives to their partners (one cheap annihilation) and multiplies twice; the cross case must duplicate one sup so every branch keeps a copy, then multiply four times plus cleanups. Copies cost interactions; projections do not.

---

**Exercise 6.3 — keep the falses.** Using the selector pattern of §6.5, write the program that keeps the input pairs for which AND is **False**, predict how many alternatives survive, then check against the verified answer.

**Solution (steps).**
1. Selector: `λr. (r * A)` — False takes its second argument (the keep value), True takes `*` (erase). (This is tutorial A.15's exercise.)
2. Program: `((λa.λb.((λr.(r * λx.λy.x)) (a b λt.λf.f))) &0{…T,F…} &1{…T,F…})`.
3. Prediction trap: naive counting says three pairs have AND False — `(T,F)`, `(F,T)`, `(F,F)` — so you might predict three leaves. But `(F,T)` and `(F,F)` reach the same branch of AND, and that branch never consumes the second sup: they *merge* into one leaf. Answer: **two** alternatives:
   `&0{&1{*,λa.λb.a},λc.λd.c}` (verified, 37 interactions).
4. Moral: count the results that *reach the output*, not the assignments you imagine — erasure makes the two notions differ.

---

**Exercise 6.4 — bigger tables.** How many output lines does `[&A{1,2}, &B{3,4}, &C{5,6}]` have, and which? How many with `&A` on all three? Verify counts.

**Solution (steps).**
1. Three independent labels ⇒ `2³ = 8` combinations: `[1,3,5] … [2,4,6]` lexicographically (verified, 8 lines, 37 interactions).
2. All `&A` ⇒ pairwise across all three at once: `[1,3,5]` and `[2,4,6]` — **2** lines (verified, 3 interactions).
3. Note the base-2 structure: each sup contributes one binary choice; labels decide whether choices multiply (cross) or align (pair). `n` independent sups are literally an *n*-bit search space — this is the seed of §6.5's "search".

---

**Exercise 6.5 — where do the extra interactions go?** Exercise 6.2: same-label 4 interactions, cross-label 10. Name the extra work in the cross-label case.

**Solution (steps).**
1. Same label: DUP-SUP annihilation routes `(1→left uses, 2→right uses)`, then two `OP2`-style operations on numbers: ~1 routing + 2 ops + overhead = 4.
2. Cross label: the duplication cannot route; it must copy the second superposition (the `&B` values) into each branch (duplication interactions), then each of the four combinations performs its own operation, then the collapse cleans the nested sups up.
3. Extra interactions = **copying the sup into every branch + four operation firings instead of two + cleanup**. General principle: cross-product behaviour is proportional to the number of *distinct* pieces of work, and same-label alignment turns two pieces into one.

---

**Exercise 6.6 — predict the bit enumerator.** Before running: how many lines does `@bits` produce for the Peano numeral 3? In what order? Then run it and compare.

**Solution (steps).**
1. The recursion `&L{#O{bits(P₀)}, #I{bits(P₁)}}` branches at each `#S` level: 3 bits ⇒ `2³ = 8` strings.
2. Order: the collapse enumerates left alternative first, depth-first: `OOO, OOI, OIO, OII, IOO, IOI, IIO, III` — matching the verified output `#O{#O{#O{#E{}}}} … #I{#I{#I{#E{}}}}`.
3. Count: 40 interactions (verified) — linear in the output size, no exponential blowup in *work*, because the enumeration shares the prefix computations.

---

**Exercise 6.7 — an infinite candidate set.** Explain how `@X = &Z{#Z{}, #S{@X}}` can stand for "all naturals" and why querying it (as the equation solver does) terminates.

**Solution (steps).**
1. `@X` is a read-once function: unfold it and you get `#Z{}` in one branch and `#S{@X}` in the other — a superposition that is one level deeper on the second branch. Demand more, get more; nothing is materialized beyond what a consumer walks into.
2. The consumer here is a predicate: `@eq(@add(@X, 2n), 4n)` forces just enough unfolding to decide each branch. Failing branches are erased (`&{}` fall-through), and erased structure is never unfolded: the eraser prunes the infinite tree.
3. Termination: the demanded depth is finite (the equation's solution exists at depth 2); everything deeper is either erased lazily or never touched. The verified run: result `#S{#S{#Z{}}}`, 536 interactions.
4. This is exactly the "enumerate candidates, keep the survivors" pattern of §6.5, just with data instead of booleans.

---

**Exercise 6.8 — claims and evidence.** For each statement, say whether the course's sources support it, and where. (a) "A fork of a running program gives you a copy with its own memory." (b) "Interaction counts are wall-clock times." (c) "SupGen's source is public." (d) "Released Bend 2 accepts `&{1,2}`."

**Solution (steps).**
1. (a) **No** — a fork is alternatives inside one term (one net), not a process/heap copy (tutorial A.15 "Limits").
2. (b) **No** — counts are the calculus's work metric; the tutorial explicitly refuses to claim wall-clock results (A.15; Part 9's Asperti–Mairson point).
3. (c) **No** — no public source; only quoted claims exist (A.15, H.53).
4. (d) **No** — `&{1,2}` is a parse error in the released compiler; no `sup` syntax outside HVM/IC tools (A.15, A.6).

### What to remember from Part 6

- `&L{a,b}` is two values in one place; `-C` (collapse) turns superpositions into a stream of plain answers.
- **Different labels ⇒ cross product** (all combinations); **same labels ⇒ pairwise** (projection). Counts follow: 10 interactions for 4 branches vs 2 for 2.
- **Search by erasure**: superpose the candidates, apply a predicate whose failing branches erase themselves (`*`), keep the survivors. "Search without loops."
- Erasure **shapes** answers: AND over two booleans yields three leaves, not four, because the false branch never consumes the second input — count results that reach the output.
- The fork is alternatives inside **one term** (not a process copy); every speed number here is an interaction count, not wall clock; SupGen has no public source; released Bend 2 does not have any of it.
---

## 7 · Algorithms in the calculus: Church numerals, lists, and the optimal 2²

> Sources: the HVM4 primer's examples (I.3), the test suite's `_book_.hvm` (I — the suite is cited in Appendix C by name), the interaction-calculus theory's sharing section (I.4), and the knowledge base's optimality notes (F.20). All programs below were re-run for this course; counts are the runtime's own.

### 7.1 The cast: booleans and Church numerals

Booleans are the classic λ-encodings; HVM4's `_book_.hvm` ships them (and everything else in this part) as book definitions:

```hvm
@ctru = λt. λf. t          // True  = take the first
@cfal = λt. λf. f          // False = take the second
@cnot = λb. λt. λf. b(f, t)  // NOT: swap
```

Church numerals encode "apply a function n times":

```hvm
@c1   = λs. λx. s(x)                 // one application
@c2   = λs. !S0&C=s; λx0. S0₀(S0₁(x0))   // two, with a *duplication* of s
@c4   = λs. !S0&C=s; !S1&C=λx0.S0₀(S0₁(x0)); λx1. S1₀(S1₁(x1))
@k2   = λs. !S0&K=s; λx0. S0₀(S0₁(x0))   // identical to c2 but label K
```

Notice what "2" costs in this calculus: an affine λ can use `s` once, so *two* uses need an explicit duplication `!S0&C=s`. The numeral is not a syntax tree that "contains" its successor twice; it is a graph with a fan in it. That fan's **label** will matter in Exercise 7.4.

Run the smallest sanity checks (verified):

```text
@cnot(@cnot(@ctru))     ->  λa.λb.a              (True)          6 itrs
@cadd(@c1, @c2)         ->  λa.λb.a(a(a(b)))     (3, see §7.2)   8 itrs
```

### 7.2 Addition: `cadd` and the label that keeps copies apart

```hvm
@cadd = λa. λb. λs. λz. !S&B=s; a(S₀, b(S₁, z))
```

Read it aloud: to add `a` and `b`, give me successor `s` and zero `z`; duplicate `s` (label `B`); apply `a` to one copy of `s`, and the result of `b` (on the other copy) to the final `z`. Both numerals compose their applications through *their own* copies of `s`.

Verified runs (Appendix C):

```text
@cadd(@c1, @c2)   ->  λa.λb.a(a(a(b)))            = 3      8 itrs
@cadd(@c2, @c2)   ->  λa.λb.a(a(a(a(b))))         = 4      9 itrs
@cadd(@c4, @c4)   ->  λa.λb.a(a(a(a(a(a(a(a(b)))))))) = 8  25 itrs
```

The count grows with the *structure*: 8 applications need eight-digit ceremony (eight lambdas chained, each with its clone machinery), not 8 interactions — the duplications and their annihilations are extra firings. That proportionality is the norm in this calculus: **interactions ≈ the number of cells the answer touches**, not the number you would count in a Python trace.

### 7.3 Multiplication and exponentiation — and a famous label accident

```hvm
@cmul = λa. λb. λs. λz. a(b(s), z)
```

`a`-times `b` means: hand `a` the function "b-times s". Verified:

```text
@cmul(@c2, @c2)   ->  4     14 itrs
@cmul(@c2, @c4)   ->  8     26 itrs
```

Exponentiation is composition — and here the label saga begins:

```hvm
@cexp = λa. λb. b(a)
```

```text
@cexp(@c2, @c2)   ->  λa.λb.a                 (!!)   11 itrs
@c2(@k2)          ->  λa.λb.a(a(a(a(b))))     = 4    20 itrs
```

Two runs, two morally identical programs, two different answers: 2² should be 4, and with the same label on the fans it is **not** — it collapses to `λa.λb.a`. The engine's own spec records this exact phenomenon ("Church c2·c2 = c4" for the different-label case; "same label gives 1, not 4", HVM5 v2 README, compendium G.53), and the test suite ships both `c2` (label `C`) and `k2` (label `K`) precisely so both cases can be exercised. This is Part 4.5's clone-of-a-clone problem, wearing arithmetic: **when the value being duplicated contains fans with the same label as the duplicating fan, the fans correlate (annihilate) instead of copying.** Fresh labels on your duplications (and a matching discipline when you *want* correlation) is the whole craft.

### 7.4 Peano naturals: the machine's own numerals

HVM4 has two closely related ways to write naturals — and they do **not** mix:

- **n-literals**: `3n` is its own literal form (it prints as `3n`), matched by the `0n:` / `1n+:` pattern family (the `Nat` switches of the primer);
- **constructor chains**: `#S{#S{#S{#Z{}}}}` with any constructor names you like, matched by `#Z:` / `#S:` patterns.

Feed a `3n` literal to a `#Z:`/`#S:`-patterned function and the runtime stops with `cannot apply a number` — a mistake worth making once on purpose. The classics below are the test suite's `#Z`/`#S` versions, all re-verified:

```hvm
@add = λ{ #Z: λb.b ; #S: λp.λb.#S{@add(p, b)}; }
@mul = λ{ #Z: λb.#Z{} ; #S: λp.λb. !B&A=b ; @add(B₀, @mul(p, B₁)); }
@fac = λ{ #Z: #S{#Z{}} ; #S: λp. !P&A=p ; @mul(#S{P₀}, @fac(P₁)); }
@fib = λ{ #Z:#Z{}; λ{#S:λ{#Z:#S{#Z{}}; λ{#S:λn.!F&=@fib; !N&=n; @add(F₀(N₀), F₁(#S{N₁})); &{}}}; &{}}}
```

```text
@fac(#S{#S{#S{#Z{}}}})          -> #S{#S{#S{#S{#S{#S{#Z{}}}}}}}   = 6      109 itrs
@fib(#S{#S{#S{#S{#S{#Z{}}}}}})  -> #S{#S{#S{#S{#S{#Z{}}}}}}       = 5      274 itrs
@sum(#S{#S{#S{#S{#Z{}}}}})      -> 10                                       55 itrs
```

The test-suite `factorial` file builds its `3` as `@add(@two,@one)` first, which is why it reports 119 interactions for the same `6` — counts measure the graph, including how the argument was built (109 + the construction).

And the honest scare-quote benchmark — the **machine-int** variant of the same recursion (`λ{0:…;1:…;λ&n.…}`, the `fib_small` test) at `n = 34`:

```text
@fib(34)     -> 5702887          79,522,600 itrs   ≈ 5 s
```

The lesson is not "HVM is slow"; it is **counts are structural**. `fib` written this way makes two *independent* recursive calls per level: sharing can't help (there is no duplicated shared value — the predecessor `p` is shared via `!P&L=p`, but the two subcomputations are distinct calls). Where a program offers a sharing opportunity, this calculus takes it; where it doesn't, the counts are what the syntax says.

### 7.5 Lists and strings

Lists are constructor chains; sugar and pattern matching work as expected:

```hvm
@len = λ{ []: 0; <>: λh.λt. (1 + @len(t)) }
@map = λ&f. λ{ []: []; <>: λh.λt. (f(h) <> @map(f, t)) }
@main = @map(λx.(x*2), [1,2,3])
```

```text
@len("hello")              -> 5         26 itrs
@map(λx.(x*2), [1,2,3])    -> [2,4,6]   35 itrs
@main with len/sum mixes   -> [0,3,0,5] 39 itrs   (test suite "match_1")
```

Two structural facts worth counting: a string is a **list of `#Chr` cells** (one cell per character — text is not cheap here; the docs say so plainly), and `map` duplicates `f` per recursive step (`!F&L=f` in the tail call) — that is the copy cost of the closure being reused, paid per cons cell.

### 7.6 The showpiece: sharing that memoization cannot do

Here is the theory doc's minimal sharing example, transliterated to HVM4 and run for this course. `f` builds a lambda whose body *contains the work* `(z₀ + z₁)`; we duplicate the result and apply the copies to different arguments:

```hvm
@f = λx.λy. !z&=x; [(z₀ + z₁), y]
@main = !F& = @f(2); [F₀(10), F₁(20)]
```

Output: `[[4,10],[4,20]]` — and the runtime's `-D` step trace shows why the interesting number is 4. Excerpt (each line is one interaction, rule names as in Part 8):

```text
@main
---------------------------------------- APP-LAM
...
---------------------------------------- DUP-LAM     (the lambda is duplicated; body shared behind A)
...
---------------------------------------- OP2-NUM-NUM   (2 + 2 fires exactly ONCE)
...
---------------------------------------- DUP-SUP
...
[4,10]<>4<>@{20}<>[]<>@{[]}
```

The addition fired **once**; the result `4` flowed to both copies of the lambda through the shared body. A memoizing lazy runtime cannot do this: the shared work sits *inside a duplicated function body*, where thunks are not shared. This is the entire point of the calculus (and of its labels): optimal-ish sharing that reaches inside lambdas.

The honest counter-caveat, measured on the same examples:

- On this *tiny* program, the sharing machinery costs bookkeeping: 11 interactions for the shared version versus 8 for the trivial "just call `f` twice" version (`[@f(2,10), @f(2,20)]`, also verified). Sharing pays when the shared work is big or would be exponential — not automatically, and never for free.
- The canonical benchmark where it pays is Church 2² (below), and the knowledge base's composition example, where repeated `λ`-encoded multiplication is *exponentially* faster than GHC because `map f . map g → map (f . g)`-style fusion happens at runtime even when the functions are unknown statically (F.20 §3).
- The theory of exactly when and why is Lévy's optimality; the price of doing it perfectly is Lamping's oracle and its ~10× overhead; the calculus's answer is labels (F.19 §4–5, Part 9).

### 7.7 The 2² everyone benchmarks

Applying Church-2 to itself is the literature's standard sharing stress test. The theory doc walks the full trace (compendium I.4): through APP-SUP, DUP-LAM, and both modes of DUP-SUP, with bound variables visibly escaping scope mid-computation — and it completes in **14 interactions**, "which is optimal". The result, after collapse's cleanup interactions (`DUP-VAR`, `DUP-APP`):

```text
λx.λy0.(x (x (x (x y0))))      -- Church 4, from 2²
```

Our machine-checked counterparts from §7.3 tell the same story with different labels in play: `@c2(@k2)` reaches Church 4 in 20 interactions (the honest arithmetic), while `@c2(@c2)` degenerates via label correlation. The optimality claim is about *sharing families of work*, not about every program: for a first-order loop with no shared subgraphs, an ordinary compiler is fine (F.20 §4's warnings).

---

**Exercise 7.1 — predict the sum.** What does `@cadd(@c1, @c2)` print, and roughly how many interactions? Then check.

**Solution (steps).**
1. `cadd a b` composes `a`'s and `b`'s applications: 1 + 2 = 3 applications ⇒ `λa.λb.a(a(a(b)))`.
2. Verified: exactly that, in **8 interactions**.
3. Compare with `c2+c2=4` (9) and `c4+c4=8` (25): each extra application costs a chain of λ cells and clone machinery, so counts grow faster than `n`.

---

**Exercise 7.2 — why `!S&B=s`?** In `cadd`, `s` is used once by `a` and once by `b`. (a) What would happen if the duplication were omitted? (b) What is the role of the label `B`?

**Solution (steps).**
1. (a) Variables are affine: two uses of the same wire is a type error (HVM4 reports `variable used 2 times`). The terms must say "here is a copy point": `!S&B=s`.
2. (b) `B` is the fan's identity. The two copies `S₀`,`S₁` are correlated with this specific duplication; anything that arrives via `S` carries the label's pairing rules (Part 5). A *fresh* label keeps this duplication from accidentally annihilating against some superposition that happens to pass through — the general hygiene rule of §7.3.
3. Contrast: when you *want* correlation (e.g. selecting matching components from two superposed inputs), you deliberately reuse a label — that is the same-label DUP-SUP of Part 5.

---

**Exercise 7.3 — multiplication for free?** Compute `@cmul(@c2, @c2)` by hand (as composition), predict the output and a rough count, then check.

**Solution (steps).**
1. `cmul a b = λs.λz. a(b(s), z)`: here `a` = 2 applied to `b(s)` = `s` applied 2× composed with itself ⇒ 4 applications.
2. Output: `λa.λb.a(a(a(a(b))))` = 4. Verified count: **14 interactions**.
3. Comparison: same answer as `cadd(c2,c2)` (9) but more interactions — the composition threads two numerals' clone machinery instead of concatenating simple chains. Structure, not arithmetic, drives the count.

---

**Exercise 7.4 — the label accident (headline).** Run `@c2(@c2)` and `@c2(@k2)` (definitions in §7.1). Explain the difference using Part 5's DUP-SUP rule, and state the moral.

**Solution (steps).**
1. `@c2(@c2)`: applying `c2` to itself duplicates it with label `C`... but `c2`'s *own* internal duplication is also `C`. Wherever the duplicating fan meets the internal fan with the **same** label, they annihilate (correlated projection), so the second copy never gets an independent `s`; the computation collapses. Verified output: `λa.λb.a` (the spec's phrase: "same label gives 1, not 4"), 9 interactions.
2. `@c2(@k2)`: the value's internal fan is `K`, the duplicating fan is `C` — different labels ⇒ commute ⇒ true copying. Verified output: `λa.λb.a(a(a(a(b))))` = 4, 20 interactions.
3. Moral: **labels are semantics.** Two programs that print identically in most languages differ here. When you duplicate a value that itself contains fans, choose labels deliberately (fresh for copying, matching for correlation) — `_book_.hvm` ships both `c2`/`k2` for exactly this reason.
4. Cross-check source: HVM5 v2's own test notes record "c2·c2 = c4" (different labels) and "same label gives 1, not 4" (G.53).

---

**Exercise 7.5 — where do 119 interactions go?** `@fac(3n)` = 6 in 119 interactions. Sketch why the count is two orders of magnitude above the 6 in the answer.

**Solution (steps).**
1. Peano operations are cell-by-cell: `mul` walks `#S` layers, firing a match/constructor interaction per layer; `fac` recurses three times, each with a `mul` over a growing numeral.
2. Each `!B&A=b` duplication copies the running numeral structurally (per-constructor duplications), and each `add` walks its argument — the counts sum over every cell visited.
3. Also every match `λ{…}` and constructor build is a cell interaction. The count reflects the *work graph*, not the mathematical operation count: 119 is "small" precisely because 3 is small; scale `n` and the interaction count grows like the structure (quadratically-ish here), not like `n!`.
4. This is why real languages (and HVM's practical extensions: `NUM`, `OP2`, `MAT`) exist on top: machine integers and operators collapse rounds of Peano ceremony into single cells.

---

**Exercise 7.6 — why fib explodes, and why sharing doesn't stop it.** Two verified data points: `@fib(5n)` = 5 with 274 interactions; `@fib(34)` = 5702887 with ~79.5M interactions (≈5 s). (a) Explain the growth. (b) The program *does* share something (`!P&L=p`). What, and why doesn't it collapse the tree?

**Solution (steps).**
1. (a) The recursion makes **two independent calls** per level (`@fib(#S{P₀})` and `@fib(P₁)`); that is a binary tree of calls, exponential in `n` — no sharing rule can merge two calls the program never duplicated from one shared value, because they are separate computations (and the runtime cannot prove two calls equal).
2. (b) `!P&L=p` duplicates the *predecessor numeral* so both branches can consume it — cell-level sharing of data, not of computations. The two `@fib` results are different subproblems (`fib(n−1)` vs `fib(n−2)`); nothing in the program creates a shared subgraph for them.
3. The fix, in any language, is algorithmic (memoize/pair-carry), not runtime magic. Optimal sharing helps when the program *does* duplicate a shared value — e.g., when a function is applied twice to the same argument, or a big structure is reused — the showpiece of §7.6.
4. Bonus honesty: ~79.5M interactions in ~5 s ≈ 16M interactions/s on this machine — an interaction count that large is a *statement about syntax*, not a verdict on speed.

---

**Exercise 7.7 — the price of `map`.** `@map(λx.(x*2), [1,2,3])` = `[2,4,6]` in 35 interactions. Explain where the count comes from, and predict how it scales with list length.

**Solution (steps).**
1. Per element: one pattern-match on the cons, one application of the function (a small program of its own: a λ, a `*`, a number), one duplication of the function for the recursive tail (`!F&L=f`), one constructor of the new list.
2. So roughly ~10 interactions per element: 3 elements → 35. **Linear in list length**, with a meaningful constant.
3. If the function is bigger (does more per call), the constant grows with its body; the function value itself is never copied wholesale — the duplication is structural, one layer at a time.
4. Predict: 10 elements ≈ ~100+ interactions; measure if you like. (The exact constant is what benchmarks are for.)

---

**Exercise 7.8 — count a string.** `@len("hello")` = 5 in 26 interactions. Where does the cost come from, and what does this predict for text processing in HVM4?

**Solution (steps).**
1. A string is `#Chr` cells chained by `#Cons`-style lists (sugar `#Con`): "hello" = 5 chars + the list spine = about 10 cells; `len` walks them with one match and one addition per cell: 26 total.
2. Predicts: text work is cell-heavy; string algorithms cost interactions proportional to characters times structure. This is a known, stated trade-off of the calculus's minimal cell set.
3. Practical runtimes add packed formats when text matters; HVM4's own docs treat strings as list sugar, and Bend 2's guide lists this among the language's honest limitations.

---

**Exercise 7.9 — read a share (trace analysis).** In §7.6's trace, find the line where the addition fires and state exactly how many times it fires for the whole program. Then answer: is the *interaction count* of the shared version necessarily lower than the naive version? What did we measure?

**Solution (steps).**
1. The line labelled `OP2-NUM-NUM` shows `(2 + @{2})` becoming `4` — it appears **once**. Both branches later read `4` (through the shared body `F_a`), as the final line `[4,10]<>4<>@{20}…` shows.
2. No: measured on this toy, the shared version costs **11** interactions and the naive two-call version **8**. The saving is in *work not re-done*, not in a lower count, because the sharing machinery (DUP-LAM, cleanup reconnections, allocation nodes `@{…}`) has overhead.
3. The theorem-shaped statement: optimal sharing wins asymptotically, when the shared computation is large or would be replicated over and over (F.20 §3's repeated composition; the 2² benchmark). On micro-examples, measure, don't assume.
4. This is the definitive cure for "so it's always faster?" — the sources themselves insist on the caveat (F.20, A.15), and this course will keep insisting in Part 9.

### What to remember from Part 7

- Church numerals are graphs with fans: `c2` is one duplication plus two applications, and its fan's **label is semantics**. Fresh label = honest copy; matching label = correlation. The engine ships `c2` (label `C`) and `k2` (label `K`) so both cases have names: `@c2(@c2)` → degenerate `λa.λb.a`, `@c2(@k2)` → 4.
- Peano naturals come in two surface forms — `n`-literals and `#S`/`#Z` chains — with separate pattern families; don't mix them.
- Counts are **structural**: `cadd(c4,c4)` = 25, `fac(3)` = 109, `fib(5)` = 274, `fib(34)` = 79.5M interactions. Sharing helps only where the program creates a shared value (the showpiece; the 2² benchmark at 14 interactions, optimal) — never where it makes independent calls (naive `fib`).
- On tiny sharing examples the bookkeeping can cost more interactions than not sharing (11 vs 8, measured). Optimality's wins are asymptotic, and the sources insist on saying so.
---

## 8 · Inside HVM4: the machine view

> Sources: `docs/hvm/memory.md`, `docs/hvm/core.md`, `docs/hvm/syntax.md`, the 61 files of `docs/hvm/interactions/` (all quoted in Part I of the compendium; one line each in Appendix B), and HVM5 v1's "what HVM4 actually is" correction (compendium G.5). Every trace below is from the local build.

### 8.1 The correction that keeps you honest

HVM5's own specification says it plainly (G.5, §1a): HVM4 is **not** an explicit graph store with Agent/Port/Wire records. Its *semantics* is the Interaction Calculus — the model of Parts 2–5 — but its *representation* is a **term encoding** with a book, a heap, linked variables and substitution cells. The spec draws the consequence: "an HVM5 term machine that compiles to BendRT is a legitimate inet representation if it preserves the IC interactions, labels, sharing and observable normal forms."

So keep two pictures:

- **Model** (Parts 2–5): cells, ports, wires, active pairs, rewiring rules.
- **Machine** (this part): 64-bit words, a static book, a mutable heap, a work loop firing one of ~61 rule sheets.

Every exercise in this course works in the model; every measurement comes from the machine.

### 8.2 One term = one 64-bit word

```text
SUB (1 bit) | TAG (7 bits) | EXT (16 bits) | VAL (40 bits)
```

- `TAG` — the term kind (`APP`, `LAM`, `SUP`, `NUM`, `MAT`, …).
- `EXT` — metadata: the dup **label**, a constructor/ref name id, a binder **level**, an operator code.
- `VAL` — payload: a heap location, an immediate (a `u32` number rides here unboxed), or 0.
- `SUB` — set when a binder's slot has been overwritten by a **substitution cell** (next section).

(The same layout is used for the immutable **book** terms and for the mutable **heap** terms. One caveat: some older summaries in the workspace print the split as `TAG(8) | EXT(24) | VAL(32)`; the repository's `memory.md` documents `1+7/16/40`, and that is what this course uses.)

### 8.3 The tag families (the cast, complete)

| Family | Tags | Role |
|---|---|---|
| application / lambda | `APP`, `LAM` | β's two actors; `LAM` carries its binder level in `EXT` |
| variables | `VAR`, `DP0`, `DP1` | *linked* variables follow their binder; `DP0/DP1` are the two sides of a dup |
| quoted variables | `BJV`, `BJ0`, `BJ1` | *quoted* (collapse-time) variables using de Bruijn levels |
| sharing | `SUP`, `DUP` (+ `DSU`, `DDU` for dynamic labels) | one value two places / two values one place |
| literals | `NUM`, `NAM`, `DRY`, `ANY` | numbers; stuck names `^n`; stuck applications `^(f x)`; the wildcard `*` |
| constructors | `C00`…`C16` | tag encodes arity; `EXT` holds the constructor's name id |
| matching | `MAT`, `SWI`, `USE` | constructor match / numeric switch / strict unbox |
| arithmetic | `OP2`, `EQL`, `AND`, `OR` | operators; structural equality; short-circuit logic |
| plumbing | `INC`, `ALO`, `UNS`, `PRI`, `REF` | collapse priority `↑`; book allocation/substitution; unscoped binders; primitives; book refs |

### 8.4 Book, heap, substitutions, and the `@{…}` you keep seeing

An HVM4 program is a **book**: immutable static terms for `@name` definitions. Evaluation instantiates terms into a **heap**:

- A `LAM` cell's body slot holds its body; a `VAR` points at the binder. When the binder fires (APP-LAM), its slot is overwritten with a **substitution cell** (`SUB` bit set); every linked variable reads the substitution instead of chasing a map. No environments, no substitution pass.
- A `ALO` node carries a static book term plus a **bind list**; it expands **one layer at a time** — the `@{…}` tokens in the traces below are those nodes doing their lazy book-instantiation work.
- `UNS` supports "unscoped bindings" — the machine-side plumbing for the global-variable escapes of Part 5.

You saw `@{…}` in Part 7's trace; now you know what it is: the runtime materializing definitions lazily, one interaction per layer, preserving sharing exactly like everything else.

### 8.5 The work loop and the rule sheets

The evaluator repeatedly finds an active pair (in the model's language) and fires the matching sheet (in the machine's language). The sheets live in `docs/hvm/interactions/`, one file per rule, each mirroring a C module's sequent-calculus comment. The complete inventory by family (Appendix B lists all 61 with one line each):

| Family | Sheets | What the family does |
|---|---|---|
| **Application** | `app_lam`, `app_sup`, `app_era`, `app_inc`, `app_nam`, `app_dry`, `app_ctr`, `app_mat_{ctr,num,sup}` | β (`APP-LAM` is the model's rule 1); distributing an application over a superposition; erasing it; pushing `↑` through; sticking on names/constructors; and MAT cases (a match applied to… — the pattern-matching sub-language) |
| **Duplication** | `dup_sup`, `dup_lam`, `dup_nod`, `dup_nam`, `dup_dry` | the label-annihilate/commute rule; lambda duplication with superposed bound vars; **`dup_nod` duplicates any node — one layer per interaction, including plain numbers**; stuck terms |
| **Dynamic sharing** | `dsu_{era,inc,num,sup}`, `ddu_{era,inc,num,sup}` | same shapes when the *label is itself a term* (`&(x){a,b}`, `!y&(x)=v; t`) — labels computed at runtime |
| **Numbers & ops** | `op2_num_num`, `op2_sup`, `op2_era`, `op2_inc`, `op2_num_sup`, `op2_num_era` | arithmetic: fold two NUMs; distribute through a sup; erase; priority; mixed cases |
| **Logic & equality** | `and_{num,sup,era,inc}`, `or_{num,sup,era,inc}`, `eql_{num,ctr,lam,sup,use,mat,era,inc,dry,any}` | short-circuit `&`/`|`, and structural `===` with a rule per shape (equal lambdas, equal constructors field-wise, sups distributing, …) |
| **Match/unbox** | `mat_inc`, `use_val`, `use_sup`, `use_era`, `use_inc` | pattern matches and the strict unbox `λ{t}` |
| **Book plumbing** | `alo_{lam,dup,nod,var,cop,nam,dry}`, `uns` | allocation/instantiation of static terms; the unscoped binder |

Three properties are worth naming explicitly, because they are what makes the count reproducible:

1. **Exactly one sheet per (cell-kind, cell-kind) situation** — the dispatch is a rule table, in the spirit of Part 2's `k(k+1)/2` bound, extended with typed sub-cases for numbers/constructors.
2. **Every rule is local** — it reads the two cells' tags, `EXT`/`VAL` fields and the wires between them; nothing else.
3. **The scheduler may pick any ready pair.** Confluence (Part 2) is exactly the licence for that; the final normal form and the *number* of firings are order-independent.

### 8.6 Traces: reading `-D`

`-D` prints one line per interaction, with the rule name and the current net in the machine's readback syntax (`<>` is the list-cons sugar; `@{…}` the allocation nodes; `A₀`,`A₁` are dup sides). Two real traces, both run for this course:

`@main = (&A{1,2} + 10)`:

```text
@main
---------------------------------------- OP2-SUP
&A{(@{1} + A₀),(@{2} + A₁)};!A&A=@{10};
---------------------------------------- DUP-NOD
&A{(1 + 10),(@{2} + 10)}
---------------------------------------- OP2-NUM-NUM
&A{11,(@{2} + 10)}
---------------------------------------- OP2-NUM-NUM
&A{11,12}

(4 interactions; collapse prints 11, 12)
```

Read it as the model: `OP2-SUP` duplicated the operand into both branches; `DUP-NOD` copied the number; then each branch folded. Note the `DUP-NOD` — **numbers are copied by the generic node rule, one interaction**, which is why `!x& = 5; [x₀, x₁]` prints `[5,5]` in exactly **1** interaction.

`@main = !x&A = 3; [x₀ + 1, x₁ + 2]`:

```text
---------------------------------------- DUP-NOD
(3 + @{1})<>@{[(3 + 2)]}
---------------------------------------- OP2-NUM-NUM
4<>@{[(3 + 2)]}
---------------------------------------- OP2-NUM-NUM
4<>5<>@{[]}

(3 interactions; result [4,5])
```

The dup copies `3` into both uses in one step; the two distinct additions then fire independently. Compare the counts: two *different* operations cost two firings; the sharing was of the data, not the operations.

### 8.7 Collapse, from the machine's side

Under `-C`, a breadth-first collapse queue lifts superpositions to the top and prints one line per alternative (I.7). The queue is keyed — `SUP` raises the key, `INC` (`↑`) lowers it — and work-stealing keeps workers busy; single-threaded runs pop FIFO within a key bucket, which is what makes output order deterministic in practice. The `#N` tag on each printed line is that key, and it is **not part of the answer** (do not compare it across runs or versions).

### 8.8 Running it yourself

```sh
cd HVM4/clang && clang -O2 -o main main.c -ldl   # Linux
./main file.hvm -s          # stats (interactions, heap nodes, time)
./main file.hvm -s -C       # collapse; -C10 bounds the lines
./main file.hvm -D          # step trace (without -C)
./main file.hvm --to-c      # emit a standalone AOT C program
```

`-s` gives the two numbers this course quotes: **Itrs** (interactions — the model's step count) and **Heap** (live nodes — the memory's shape). Appendix A repeats this with the exact build used here.

---

**Exercise 8.1 — tag a program.** Give the tag of each subterm of `@add = λa.λb.(a + b); @main = @add(1,2)`'s evaluation: what does the runtime represent for `λa.λb.(a+b)`? For `@add` at the call site? For `1`, `2`, and their sum's node?

**Solution (steps).**
1. `λa.λb.(a+b)` — two `LAM` cells (nested), whose body is an `OP2` node (op code for `+` in `EXT`).
2. `@add` at the call site — a `REF` (book reference) that an `ALO` node resolves lazily into the definition's terms.
3. `1`, `2` — `NUM` terms with the values unboxed in `VAL`.
4. The running sum — after `OP2-NUM-NUM` fires, a single `NUM` (the trace in §8.6 shows `(1 + 10)` → `11`).
5. Sanity: none of these are "cells with ports" — that is the model's vocabulary. The machine's vocabulary is exactly these tags (§8.3).

---

**Exercise 8.2 — read three sheets.** Restate in one sentence each, and name which Part-5 rule each implements: `app_lam`, `dup_sup`, `op2_num_num`.

**Solution (steps).**
1. `app_lam`: `(λx.f a)` ⇒ substitute `a` for `x` into `f` — the model's **APP-LAM** (rule 1 of Part 3).
2. `dup_sup`: `!X&L = &R{a,b}; …` ⇒ same label: `X₀←a, X₁←b`; different: commute with nested dups — the model's **DUP-SUP**, both modes (Part 5.3).
3. `op2_num_num`: `(#a op #b)` ⇒ `#(a op b)` — an *extension*: no counterpart in the pure six rules; this is the practical arithmetic cell family (Part 3.3's point about universality vs practicality).

---

**Exercise 8.3 — the correction, applied.** State HVM5's "important correction" about HVM4 and one consequence for judging HVM5 implementations.

**Solution (steps).**
1. Correction: HVM4's heap is *not* an Agent/Port/Wire graph; it is a term encoding (book + heap + linked vars + substitution cells) whose **semantics** is the IC (G.5 §1–2).
2. Consequence: an HVM5 machine does not have to be a literal port-graph engine either — it is legitimate if it **preserves the IC interactions, labels, sharing and observable normal forms**, however it encodes terms.
3. The checkable criteria are therefore semantic: same enabled rules, same label behaviour, same readback — not "does it allocate wire objects". (This mirrors Part 2's model/machine split.)

---

**Exercise 8.4 — trace analysis.** In §8.6's first trace: (a) name the four rule firings in order; (b) why did `DUP-NOD` fire exactly once, not once per branch; (c) what would the count be for `(&A{1,2} + &B{10,20})` (Part 6)?

**Solution (steps).**
1. (a) `OP2-SUP` (duplicate the operand into both sup branches), `DUP-NOD` (copy the number `10`), `OP2-NUM-NUM`, `OP2-NUM-NUM` — four interactions.
2. (b) One duplication node was created; it met one number and copied it in one interaction, producing both copies. (A duplication is one cell; copying a leaf is one firing — this is the whole "one layer per interaction" principle at its smallest.)
3. (c) That program was run in Part 6: **10 interactions** — two sups interacting through the op requires cross-copying plus four folds and cleanup. More structure, more firings; always countable.

---

**Exercise 8.5 — why a number copies in one step but a list does not.** Account for `!x& = 5; [x₀,x₁]` = `[5,5]` in 1 interaction, versus the Part 4 chain-copying behaviour for a list.

**Solution (steps).**
1. A `NUM` is an immediate: its whole content is in `VAL`; `dup_nod`/its family fires once and writes both copies — one layer, and the layer is everything.
2. A list is a chain of `#Con` cells: a dup meets the first cell, copies it, and pushes a fresh dup onto the tail — one interaction per cell visited (Part 4.4's mid-copy state; Part 7.8's costs).
3. General rule: duplication cost = number of *cells* in the copied structure, where "cells" counts leaves too, but immediates are a single leaf. (Erased branches never pay at all.)

---

**Exercise 8.6 — the SUB bit.** Explain in a few lines what a substitution cell is and why it exists, using the chain `APP-LAM` → body evaluation.

**Solution (steps).**
1. When `(λx.f a)` fires, the lambda's body slot must record that `x` now means `a`. Instead of walking the body, the runtime overwrites the binder's slot with a substitution cell (`SUB` bit set, payload = the argument).
2. Every linked `VAR` (the uses of `x`) points at that cell; reading it follows the substitution. Lookups are pointer-chases, not environment maps.
3. It exists because substitution must be O(1) and local (Part 2's locality); a global substitution pass would break the constant-time step model. (DUP binders use the same trick for `DP0/DP1`.)

---

**Exercise 8.7 — scheduling freedom.** Two active pairs are ready. The runtime picks one. What is guaranteed identical regardless of the pick, and what is not?

**Solution (steps).**
1. Guaranteed: the final normal form, and the **number of interactions** (up to permutation of independent steps) — one-step confluence (Part 2.4), which is why every count in this course is reproducible.
2. Not guaranteed: the *order* of outputs in collapse mode (the `#N` keys show it), and any wall-clock quantity (allocation, cache, contention — Part 9).
3. This split — order-free counts vs order-sensitive time — is exactly why the sources write all performance claims as interaction counts.

---

**Exercise 8.8 — why 61 sheets and not 6.** The pure system has six rules; HVM4 has ~61 sheets. Give the honest reason, and say which subset corresponds to the pure model.

**Solution (steps).**
1. The extra sheets are *practical extensions*: numbers and arithmetic (`OP2`/`AND`/`OR`/`EQL`), constructors and pattern matching (`CTR`/`MAT`/`SWI`), unboxing (`USE`), priority plumbing (`INC`), dynamic labels (`DSU`/`DDU`), book instantiation (`ALO`), unscoped binders (`UNS`). Each kind of cell must define its meeting with every other kind — the `k(k+1)/2` growth of Part 2, with typed sub-cases.
2. The pure-model core is the set you already know: `APP-LAM`, `APP-SUP`, `DUP-LAM`, `DUP-SUP`, plus erasure behaviour — the "four core interactions" of Part 5.
3. Universality (Part 3.3) says the six suffice in principle; practicality says you do not want to encode a `+` as a graph of γ/δ/ε. The extra sheets are the difference (F.19 §1).

### What to remember from Part 8

- **Model ≠ machine**: the semantics is the IC (cells, labels, rules); the representation is 64-bit words, a static **book**, a mutable **heap**, linked variables and **substitution cells**. HVM5's own spec says a term machine is a legitimate inet implementation if it preserves the interactions, labels, sharing and readback.
- Tags come in families: application/lambda, linked and quoted variables, sharing (`SUP`/`DUP`/`DSU`/`DDU`), literals, constructors (`C00–C16`), matching (`MAT`/`SWI`/`USE`), arithmetic (`OP2`/`EQL`/`AND`/`OR`), plumbing (`INC`/`ALO`/`UNS`/`PRI`/`REF`).
- The 61 rule sheets = the four core rules + erasure behaviour + practical extensions (numbers, matching, priority, dynamic labels, book allocation). Appendix B is the index.
- `-D` shows the truth: numbers copy in **one** interaction (`dup_nod`); chains copy per cell; `@{…}` are lazily expanded book terms. Schedulers may fire ready pairs in any order — **counts stay identical**.
---

## 9 · Why this is parallel — and what it honestly costs

> Sources: knowledge `03/03` "Confluence, Optimal Reduction, and Parallelism" (F.20, quoting Wikipedia, Lafont, HVM1's HOW.md, HVM2's `hvm.rs`, and the Asperti–Guerrini book), the tutorial's chapter 04 summary table (A.5), and the HVM4 notes (site note `notes/hvm-runtime`, compendium B).

### 9.1 The parallelism is not an optimization — it is a property

Everything so far has one structural cause: **every rule fires on exactly two cells that face each other, and no cell can be in two pairs** (Part 2). Hence:

- two ready pairs are always disjoint, in cells and in the wires they touch;
- firing one cannot disturb the other;
- so any idle worker may fire any ready pair, with no coordination for *correctness* (F.20 §2: "no synchronisation is needed" — the model-level statement).

The diamond property (Part 2.4) is the licence: an "oracle scheduler" (always pick the right pair first) and a "worst scheduler" (any pair) reach the same normal form in the same number of interactions. A real machine's job is therefore pure engineering: find ready pairs cheaply, hand disjoint ones to workers, and get the constants right.

Two documented data points for how far this goes in practice:

- **HVM1 benchmarks** (F.20 §2): Bubble Sort — inherently sequential — shows *no* speedup; Radix Sort — tree merge, inherently parallel — runs ~2.5× faster than GHC on 8 cores **with zero annotations**. The programmer never says "parallel"; the runtime just feeds disjoint redexes out.
- **HVM2's engineering** (F.20 §2): a global `RBag` of pairs, striped allocators per worker, atomics only around allocation and variable exchanges. The named hazard: **COMM storms** — bursts of commutation rules allocate 4+4 cells each, and can contend on the allocator. Mitigations include keeping hot paths linear and definitions dup-free (`safe`) so the fast `CALL→ERAS` path is taken.

Honest footnote in the same sources: parallelism is free in *correctness*, not in *hardware*. Shared-memory atomics, memory bandwidth, and NUMA effects still exist; the model just removes the *logical* need for coordination.

### 9.2 Optimality, in one paragraph and one picture

**Lévy's optimality criterion**: never duplicate a redex that will later be shared; never reduce the same family of work twice. Naive β-reduction copies lambdas wholesale and re-runs what was inside them. Lamping (1990) showed interaction nets with fan nodes can implement λ-reduction that satisfies the criterion — *optimal* sharing, including inside lambdas.

The canonical picture (F.20 §3, from HVM1's HOW.md):

```text
dup f g = ((λx. λy. (Pair (+ x x) y)) 2)
(Pair (f 10) (g 20))
→* (Pair (Pair 4 10) (Pair 4 20))
```

`(+ 2 2)` fires **once**, though it sits under two copied binders. Haskell's thunks cannot share here (free variables break memoisation), so GHC computes it twice. Repeated composition turns this constant-factor win into an *exponential* win: HVM multiplies λ-encoded numbers exponentially faster than GHC, because `map f . map g → map (f . g)`-style fusion happens *at runtime*, even when the functions are unknown statically (F.20 §3, HOW.md "Abusing Beta-Optimality").

We reproduced the core mechanism in Part 7.6 — with the honest caveat that the bookkeeping shows up in tiny interaction counts (11 vs 8) and only pays asymptotically.

### 9.3 The price list (why the world didn't just switch to nets)

| Mechanism | Cost / caveat | Source |
|---|---|---|
| Full optimality needs Lamping's **oracle** (brackets, croissants, safe pointers) | ~**10×** overhead on β-reduction in HVM1's account | F.20 §4 |
| The **bookkeeping-free fragment** (what HVM1 actually shipped) | rejects the pathological "clone cloning its own clone" (`let g = λf. λx. (f (f x)) in (g g)`); fixes: eta-expansion, or EAL-style (light λ) analysis | F.20 §4 |
| **Labels** (what IC/HVM2/4 use instead of an oracle) | the lightweight, *local* approximation: same label annihilates, different commutes (Part 5) — not full optimality, but decidable per pair | F.20 §4, F.19 §5 |
| Some first-order loops are **quadratic on HVM but linear on GHC** (HVM issue #60, cited in its FAQ) | "optimality is about shared higher-order families, not every first-order loop" | F.20 §4 |
| The implementation cost of optimal reduction **cannot be bounded by an elementary function** of the number of reduction steps (Asperti–Mairson) | counting interactions ≠ measuring time; the tutorial quotes this explicitly as the reason not to over-read step counts | A.5 ("Summary of properties"), F.20 |

Three sentences that together are the honest summary: *Confluence is a theorem. Optimal-sharing wins are real and asymptotically large on sharing-heavy code. The engineering between "the model" and "your laptop" is where all the numbers that matter live.*

### 9.4 What "counts" mean, and what they don't

Every count in this course is the runtime's `Itrs` — firings of local rules. Reproducible (confluence), comparable across machines, and **not** wall-clock. The runtime also reports its own throughput (`Perf: … M interactions/s`), e.g. our `fib(34)` run: 79,522,600 interactions in ≈5 s ≈ 16 M interactions/s, single-threaded and interpreted. The site note's louder claims (CUDA ≈10× parallel C on RTX hardware; the CUDA port produced overnight from the Metal implementation as executable spec) are quoted claims from the HVM4 project's material — treat them as claims, not measurements of this course (B, `notes/hvm-runtime`).

### 9.5 Where Geometry of Interaction sits

The deep theoretical ancestry of all of this is Girard's **Geometry of Interaction** (1989) — computation as feedback through a dynamic proof structure, later given interaction-net readings and a linear-logic surface. The workspace's materials reference the Girard/Lafont lineage for the combinator story itself (F.1: "Interaction nets/combinators (Girard/Lafont: CON/DUP/SUP/ERA, annihilate vs commute)") but do not develop GoI further; this course follows suit:

- **What you now have** is the operative core: Lafont's combinators, labeled fans, confluence, and the engineering trade-offs — enough to read HVM4's code and see why each choice exists.
- **If you want GoI itself**, the canonical entry points are Girard's original (Geometry of Interaction I, 1989), Abramsky's "Geometry of Interaction" survey treatments, and the *TOIOFPL* book's oracle chapters — the same literature Part 4.5 pointed at for the brackets/croissants machinery.
- The bridge sentence, for orientation: Lagrangian *fans with labels* are, in practice, the local, decidable fragment of the game-of-tokens that GoI formalizes; HVM's engineered answer ("labels instead of brackets") is this course's running example of a theory being negotiated with a machine.

---

**Exercise 9.1 — equal counts, different times.** Two programs both report `Itrs: 1,000,000`. List three reasons their wall-clock times can differ anyway.

**Solution (steps).**
1. **Work per interaction differs per rule** — a commutation allocates 4 cells, an annihilation allocates none. Same count, different memory traffic.
2. **Scheduling and contention** — parallel runs contend on allocators (the COMM-storm hazard); a single-threaded AOT run avoids the dispatch overhead; GC/era timing differs. (The model fixes counts, not costs.)
3. **Representation** — interpreted vs AOT-compiled (specialized memory access), 64-bit words vs arrays, cache locality of the heap, and the host machine itself.
4. Bonus (the theorem-level reason): Asperti–Mairson — the bookkeeping for full optimality is not bounded elementarily in the number of steps, so "number of steps" was never going to be a time proxy in general.

---

**Exercise 9.2 — which loop parallelizes?** Explain, in redex terms, why Bubble Sort gains nothing on 8 cores while Radix Sort runs ~2.5× faster — with zero annotations in both cases.

**Solution (steps).**
1. Bubble Sort's data dependencies chain: each compare-swap depends on the previous one. At most a constant number of redexes are ready at once — the machine's ready queue stays nearly empty, workers idle.
2. Tree merge (Radix Sort's shape) splits into independent subtrees: after the split, an entire level of compare-merges is *disjoint* — many ready pairs at once; the scheduler hands them to different cores. No coordination beyond fetching pairs (F.20 §2).
3. The rule that generalizes: **parallelism = number of simultaneously ready disjoint redexes**. Write code whose graph branches (divide-and-conquer, tree recursion, map-like shapes) and it parallelizes; write chains and it doesn't — regardless of the language's promises.

---

**Exercise 9.3 — does optimality rescue naive `fib`?** No (Part 7.6). Say precisely what would have to be true of the computation for sharing to fire, and name the classic fix.

**Solution (steps).**
1. Sharing fires only when the *program* duplicates a value/function whose computation is shared: one graph node reached twice. In naive `fib`, `fib(n-1)` and `fib(n-2)` are **two separate subgraphs** — no rule can merge them without proving equal results (which is not a local rule; the runtime does not).
2. So the count stays exponential (binary call tree), by construction of the program.
3. The fix is algorithmic: memoize, or carry the pair `(fib n, fib n+1)`; the classic linear-time fib. Interaction nets optimize *given* sharing, not invent it.
4. This is consistent with the sources' warning: optimality "is about shared higher-order families, not every first-order loop" (F.20 §4).

---

**Exercise 9.4 — the forbidden clone.** (a) Why is `let g = λf. λx. (f (f x)) in (g g)` the pathological case? (b) Name the two documented fixes and the third, local one that the Interaction Calculus brings.

**Solution (steps).**
1. (a) `g` duplicates `f` inside its body; applying `g` to itself duplicates a function whose own duplication is the operation in progress — a fan meeting a clone of itself, where the correct pairing requires global information ("clone cloning its own clone"; out of the bookkeeping-free fragment, F.20 §4).
2. (b) Fixes from the literature/engineering: **eta-expansion** (turn the self-clone into applications of a fresh identifier: `(g h)` with `g`,`h` extensionally equal) and **EAL / light-λ typing** (restrict lambdas so fan bookkeeping never needs the oracle).
3. The third: **labels**. A fan meeting a fan is decided locally by comparing labels — same annihilates, different commutes (Part 5.3). Not full optimality; a decidable, local approximation (F.19 §5).
4. Exercise 7.4's `@c2(@c2)` vs `@c2(@k2)` was precisely this decision visible in arithmetic output — the pathology tamed, but *as semantics*, not as magic.

---

**Exercise 9.5 — claims audit.** Classify each: theorem, engineering measurement, or quoted benchmark claim. (a) "Two disjoint active pairs may be reduced in either order to the same net." (b) "Full optimality's oracle costs ~10× on β-reduction." (c) "No synchronisation is needed." (d) "CUDA is roughly 10× parallel C on RTX." (e) "Implementation cost of optimal reduction is non-elementary in steps."

**Solution (steps).**
1. (a) **Theorem** — one-step confluence (Lafont 1990; Part 2.4).
2. (b) **Engineering measurement/claim** — HVM1's own account (their FAQ/notes); true of their implementation or at least their experience, not a theorem.
3. (c) **Model-level statement with an engineering rider** — correct for correctness (redexes don't conflict), but real machines still need atomics for allocation/pointer exchange (F.20 §2). Say "no *logical* synchronisation".
4. (d) **Quoted benchmark claim** — from the HVM4 project's material; not re-measured in this workspace; treat as a claim until reproduced on your hardware.
5. (e) **Theorem-adjacent result** (Asperti–Mairson) — a negative complexity result about optimal-reduction bookkeeping; quoted by the tutorial as the reason step counts ≠ time.
6. The skill being trained: every performance sentence in this field comes with a source class; keep them apart and you will never be surprised by the next release's numbers.

### What to remember from Part 9

- Locality + one-step diamond ⇒ **any scheduler, same result, same count**; the machine's job is engineering the constants (work queues, striped allocation, avoiding COMM storms).
- Parallel speedup = **how many disjoint redexes are ready** (Bubble Sort: none; Radix tree-merge: many).
- Lévy optimality: never duplicate shared work. Full optimality pays Lamping's oracle (~10×); HVM ships a bookkeeping-free fragment plus **labels** as the local, decidable approximation.
- **Counts are not time**: Asperti–Mairson bound optimal-reduction bookkeeping non-elementarily in steps; first-order loops can even be slower than GHC. Every performance claim deserves its class (theorem / measurement / quote).
- GoI (Girard 1989) is the deep ancestry; labels are its engineered, local fragment — entry points in §9.5.
---

## 10 · The lineage: HVM1→4, BendRT (not nets!), Bend 2, and HVM5

> Sources: the ecosystem notes (compendium F.1, F.3, F.4), the repo READMEs and concept map (H.7, H.10–H.22), the tutorial's chapter 04 runtime block (A.5), the Bend 2 docs fetched fresh from `bendlang/bend` (H.1–H.4), and the HVM5 spec tree (G.1–G.66, especially v1's `01a` and v2's README/REVIEW). Read this part as the *map room*: after it, every document in the ecosystem has a home.

### 10.1 The generations

| Generation | Period (per sources) | What it was | Net-based? |
|---|---|---|---|
| **HVM1** | 2022, Rust | Lazy runtime for the Interaction Calculus; combinators, fans, the bookkeeping-free optimal fragment | yes |
| **HVM2** | 2023–2024, C + CUDA | Strict, massively parallel; the 8-tag rule table era (`LINK/CALL/VOID/ERAS/ANNI/COMM/OPER/SWIT`); the engine under Bend 1's launch | yes |
| **HVM3** | early 2026 | Consolidation of the strengths; compiled/interpreted paths | yes |
| **HVM4** | 2026, single-file C | The Interaction Calculus machine of this course: superpositions, labels, numbers, constructors, ~61 rule sheets, Metal/CUDA backends, AOT path | **yes — the one you have been running** |

The lineage in one line (F.19 §6): HVM2's rule names are HVM1's, generalized to eight tags; HVM4's extensions (numbers/ops/match) are HVM2's `OPER`/`SWIT` specialized into readable per-shape sheets. Nothing in this course was invented for the course — it is the actual genealogy.

### 10.2 Bend 1, for contrast

Bend 1 (Python-flavored, ADTs, recursion, zero parallelism annotations; backends `run`, `run-c`, `run-cu`, `gen-c`, `gen-cu`) sat directly on HVM2's net runtime and proved the pitch: sequential vs parallel is a *dataflow property* (`start + Sum(start+1, …)` chains; tree recursion fans out). Its costs were the net model's: 24-bit numbers packed into node words, a low-GB memory ceiling from fixed-width arenas, scarce IO, strict-only evaluation, and a large constant per rewrite (graph surgery in memory) — the reasons a tuned CPU core could beat GPU throughput on many workloads (H.7, F.1).

Everything in *this* course — cells, fans, labels, counts — is what a Bend-1-era runtime did between a line of source and a result.

### 10.3 Bend 2: the language this lineage serves

Bend 2 (live at `bendlang/bend`; the fresh fetch is H.1–H.4; the tutorial A.1–A.17 teaches it) keeps *the ideas* and changes the runtime:

- **Affine values**: a binder may be used at most once; `+` marks duplicable `Data`; arrays and closures are single-owner types. Copying is explicit and measured (tutorial ch. 03).
- **Laws and proofs**: `LAWS.bend` states properties; `PROOF.bend` proves them; `bend PROOF.bend` is the gate; `--verdict` rechecks through a Lean-formalized kernel (`BendTT`). "LAWS.bend is AGENTS.md backed by proof" (H.1).
- **Parallelism by structure**: `a b = f(x) g(y)` forks and joins; `f!(…)` targets the GPU; no threads written by hand.
- **Targets**: C, Metal, CUDA, JavaScript (and planned others). The hub serves hash-pinned packages.
- **Honest limits**: no `sup` syntax, no SupGen, strings as char lists, `Nat/U32/F32` only, no `if`, annotations everywhere (H.1's limitations list).

The missing piece, for this course's purposes, is deliberate: **the released compiler does not compile to nets** (H.1: "Bend 1 programs and HVM do not carry over"; A.5: released Bend 2's runtime is BendRT).

### 10.4 BendRT: what survived the crossing

BendRT — the released runtime — keeps the *consequences* of the net model without the model (A.5's block, H.4's runtime sections):

| Net-model idea | What BendRT kept |
|---|---|
| affine/linear use | affine ownership: a value with one live use is freed statically — **no tracing GC** |
| explicit sharing | counted sharing: a `+` value carries a reference count (24 bits wide, per the emitted C); a snapshot of state is a flat heap shared by all cores |
| locality of steps | a *flat state machine of definitions*: a term is one 64-bit word; a call is a jump; memory is one heap |
| free parallelism | **balanced forks**: `a b = f(x) g(y)` becomes one join task plus two tasks, dealt to CPU or GPU lanes — the programmer promises the calls take similar time |

What it does **not** keep: cells, ports, active pairs, rewrites, superpositions. BendRT is "a flat evaluator of definitions. Its primitives are words, definitions, jumps and tasks, not cells and rewrites" (A.5). If a course ever tells you "Bend runs on interaction nets", correct it: *Bend's lineage* runs on nets (HVM1–HVM4); *released Bend 2's compiler* runs on BendRT; and the project to bring nets back under the language is called HVM5.

### 10.5 HVM5: putting the calculus back under the contracts

The HVM5 spec tree (G.1–G.66) states the goal in the owner's own words (compendium F.27, `ALL-COMBINED-RUNTIME-SPEC.md` §0):

> "Bend2 → HVM5 → compiled to INETs → runs on BendRT. Consensus is an application part, not part of HVM5. All side effects / IO inputs should live in a DAG … synced as an append-only INET … and pruned after some time. … since INETs are fully confluent, all reach the same result."

The pieces, as specified:

- **v1** (normative, October 2026): a *contract runtime* — Bend 2 contracts compiled to inet **packages**, deployed into *subspaces* (partitioned nets) with capability-based access; a ten-node simulation; fuel-bounded sends; deploy/fork/test/merge lifecycle; the reducer is Bend 2 compiled by BendRT (G.1; spec list at G.3–G.22). HVM4 is the explicit *execution reference*: v1's `01a` adopts HVM4's book/heap/substitution model and its core rules, and — the correction from Part 8 — frees HVM5 from having to be a literal port/wire graph (G.5).
- **v2** (the in-flight rewrite, G.51–G.61): *code as an immutable, content-addressed book of IC terms*, where "forking a running program is one `DUP` node (O(1))"; testing a candidate runs both versions superposed (`&T{old,new}`) sharing every step before the first changed definition; merging is a three-way merge of definition hashes plus an atomic epoch swap; the cluster is **islands** (local heaps, no leader, capability ports). The v2 status table reports milestones M0–M3 done with named evidence, M4–M6 partial — and the tree ships a `REVIEW.md` whose job is to list v1's corrections, "every correction, what not to claim": read it before believing any HVM5 headline (G.52).
- **The reference port** (`reference/hvm5-mini`): an early pure-HVM5 evaluator written *in Bend 2*, kept as history and as proof evidence (G.64).

### 10.6 One picture, four layers

```
        what you write          what runs it                     this course
  ┌────────────────────┐   ┌──────────────────────────┐
  │ Bend 2 (contracts, │   │ BendRT: flat evaluator,  │   Part 10.4 (the crossing)
  │ laws, affinity)    │   │ affine, no GC, forks     │
  └─────────┬──────────┘   └──────────────────────────┘
            │ compiled to inet packages (HVM5)
            ▼
  ┌────────────────────┐   ┌──────────────────────────┐
  │ the interaction    │   │ HVM4: book+heap term     │   Parts 2–8 (the model and
  │ calculus           │   │ machine, ~61 sheets      │   the machine)
  └─────────┬──────────┘   └──────────────────────────┘
            │ your hands-on tools
            ▼
  ┌────────────────────┐
  │ cells, fans, labels│   Parts 2–7 (reduce it yourself)
  └────────────────────┘
```

Every document in the compendium now has a drawer: Parts 2–9 exercised the bottom two boxes; 10.3–10.5 placed the upper ones; and the exercises below check that you can *route* questions between them.

---

**Exercise 10.1 — which layer?** Assign each task to the layer that owns it: (a) reduce `(&A{1,2} + 10)`; (b) run `fib(34)` written in Bend 2 today; (c) deploy a counter contract that a stranger may call exactly once; (d) fork a running book and test a modified definition against the live one.

**Solution (steps).**
1. (a) **HVM4 / IC** — superposition and arithmetic are calculus-level rules (`OP2-SUP`, …); Part 6 did it.
2. (b) **BendRT** — the released Bend 2 compiler emits BendRT; no nets involved (10.4).
3. (c) **HVM5 v1** — contract packages, capability wires, fuel-bounded sends; the ten-node simulation is the v1 artifact (10.5).
4. (d) **HVM5 v2** — code-as-data books; fork = one DUP; superposed testing; merge3 + epoch swap (10.5).
5. Note the pattern: same lineage, four ownership boundaries — model, released runtime, contract runtime, code-as-data runtime.

---

**Exercise 10.2 — fix the sentence.** "Bend 2 runs on interaction nets." Make it true twice, once historically and once today, and once in the future tense.

**Solution (steps).**
1. *Historically*: "Bend 1 ran on HVM2, an interaction-net runtime" (10.2).
2. *Today*: "Bend 2's released compiler targets BendRT, a flat evaluator that keeps the affine/no-GC/parallel ideas but does **not** reduce nets" (10.4).
3. *Future*: "HVM5 compiles Bend 2 contracts to interaction-net packages and reduces them with a Bend kernel — nets return under the language" (10.5).
4. This three-sentence habit is the entire reason Part 10 exists: the phrase "Bend runs on nets" is true, false, and planned, depending on which Bend and which year.

---

**Exercise 10.3 — why affinity is non-negotiable here.** Connect three facts: values are used at most once; the runtime keeps no tracing GC; duplicated functions share work. State the direction of explanation.

**Solution (steps).**
1. In the net model, a value with two live uses must be *explicitly* duplicated by a fan; that is how sharing and copying stay visible, local, and countable (Parts 3–5).
2. Affinity (≤ 1 use) is exactly the condition that makes "freed when consumed" sound: `match frees the node it opens`, and nothing dangles — so **no tracing GC** is needed (10.4; tutorial ch. 04).
3. In the other direction: the sharing wins of optimal reduction are *inside lambdas* (DUP-LAM), which only exist because duplication is a graph operation rather than an implicit copy — again the same design point seen from the other side.
4. Direction of explanation: it is not "affinity because no GC"; it is **one design**: make copies explicit and local, and both the memory story and the sharing story fall out.

---

**Exercise 10.4 — the fork claim, precisely.** Explain why "fork = one DUP node, O(1)" is plausible in v2's world, and name two things it does *not* claim.

**Solution (steps).**
1. Plausible because: the book of definitions is immutable and content-addressed (hashing happens at compile/deploy, not at fork); the *state* is an IC graph; forking a running instance is inserting a duplication node so the state is shared from the fork point — a constant-size graph edit, not a heap copy (G.51, thesis section of v2 README).
2. It does **not** claim process-level isolation: it is one local IC heap; islands and capabilities are the (in-progress) answer for distribution (v2 status: M5 partially done, TCP not started).
3. It does **not** claim "no risks": the tree ships `REVIEW.md` and a trust spec (`07-trust.md`) precisely to bound what proofs cover; milestone M6 (benchmarks) is not started, and v1's numbers are to be re-earned in v2 (G.52, G.61).
4. Treatment: a *specified mechanism with partial evidence* — the same class of claim as everything in Part 9's audit exercise.

---

**Exercise 10.5 — navigate the v1 spec.** The read order names `00-system`, `01-calculus`, `02-homoiconic-code`, `03-types-isolation`, `04-subspaces`, `06-lifecycle`. For each of these three questions, name the document you would open first: (a) "how does a caller get an answer from a contract?" (b) "can a contract see or touch another contract's net?" (c) "what happens at deploy/fork/test/merge time?"

**Solution (steps).**
1. (a) The calculus/contract interface: `01-calculus` (net calculus, wires, sends) with `08-api-cli` for the outward surface; the goal's owner statement frames it as "the deployer receives wires: shared invoke wire, linear update wire" (G.36 lattice goal, and v1 `00-system`).
2. (b) Isolation and authority: `03-types-isolation` (capability types) + `04-subspaces` (partitioned nets — "no wire implies no interaction", demonstrated adversarially).
3. (c) `06-lifecycle` (deploy, fork, test, merge) — with `02-homoiconic-code` for why fork/merge are graph operations.
4. The skill: every one of the 66 spec docs answers a question; find the question first, then the doc (the maps in `maps/*` are the index).

---

**Exercise 10.6 — parse the pipeline.** Unfold "Bend2 → HVM5 → compiled to INETs → runs on BendRT" into four layers, and say where your hands-on HVM4 knowledge sits.

**Solution (steps).**
1. Layer 1 — **Bend 2 source** (contracts, laws; checked by the official frontend).
2. Layer 2 — **HVM5**: the lowering/contract machinery (books, packages, capability adds) — the semantics layer being specified in `hvm5/version1|2`.
3. Layer 3 — **compiled inet packages**: the term/cell representation actually reduced; here HVM4's execution model is the *reference* (`01a` adopts its book/heap/labels/rules), which is why this course's Parts 2–8 are load-bearing for reading HVM5.
4. Layer 4 — **BendRT**: the substrate every layer ultimately runs on ("the reducer is Bend 2 compiled by BendRT"); BendRT itself stays flat — the nets exist in layers 2–3, not in the executor.
5. Summary sentence for your notes: *the nets return, but they return as data and semantics, executed by a flat runtime* — the exact shape of the design that HVM5's correction section formalizes.

### What to remember from Part 10

- The generations: HVM1 (lazy IC runtime) → HVM2 (strict, parallel, Bend 1's engine) → HVM3 (consolidation) → **HVM4** (this course's machine).
- **BendRT is not a net reducer.** Released Bend 2 compiles to a flat evaluator that kept the consequences — affine ownership, no tracing GC, counted sharing, balanced forks — but not cells, ports or rewrites.
- Bend 2 adds the language layer: laws/proofs, affinity, structural parallelism, C/CUDA/Metal/JS targets; `sup`/SupGen are not in it.
- **HVM5 returns nets as data and semantics**: v1 = contracts as compiled inet packages in partitioned subspaces; v2 = code-as-data books whose fork is one DUP and whose test is a superposed reduction; both run on a Bend kernel executed by BendRT.
- One sentence to carry: *the nets return, executed by a flat runtime* — and you now know both sides of that sentence first-hand.
---

## 11 · Capstone: ten problems, everything mixed

No new ideas here — every problem combines earlier parts. Cover the solutions; check yourself against the steps; run the programs to confirm. (Where a program is given, the fence tells you the tool.)

**C1 (nets + counts).** Reduce this net to normal form. How many interactions fire, and what is the final cell list?

```
cells : CON#1, DUP#2, CON#3
wires : CON#1.p — DUP#2.p
        CON#1.a1 — CON#3.p
        CON#1.a2 — c        (free)
        DUP#2.a1 — A        (free)
        DUP#2.a2 — B        (free)
        CON#3.a1 — D        (free)
        CON#3.a2 — E        (free)
free  : A, B, c, D, E
```

**Solution (steps).**
1. Only one active pair exists: `(CON#1, DUP#2)` — CON–DUP commutation. Fire it (rule 4, crossing as in §3.6): DUP copies `D1` (principal on `CON#1.a1` — the wire carrying `CON#3`), `D2` (principal on `CON#1.a2` — the wire to `c`); CON copies `C1` (principal on `A`), `C2` (principal on `B`), with the four crossing wires.
2. New ready pair: `D1.p — CON#3.p` (CON–DUP again). Fire: DUP copies on `D` and `E`; CON copies inside `C1`,`C2` (their aux wires, crossed).
3. `D2` sits on the free port `c` — waiting (no rule fires on a leaf); the CON copies `C1`,`C2` sit with principals on `A`,`B` — waiting.
4. Normal form: cells `C1, C2` (principal on `A`,`B`), `D1a, D1b` (principals on `D`,`E`), plus two more CON copies from step 2 (inside `C1`,`C2`'s aux ports) — six cells total from the two commutations, each grown by +2. **2 interactions.**
5. Free ports `A, B, c, D, E` unchanged throughout ✓. Lesson: a reduction exposes its next move; copies park at leaves until something cell-shaped arrives.

**C2 (Church arithmetic).** Predict the output and a rough interaction count for `@cmul(@c2, @c4)`, then explain why it is not simply "8 applications = 8 interactions".

**Solution (steps).**
1. `cmul a b = λs.λz. a(b(s), z)`: `c2` applied to `c4(s)` composes: 4 + 4 = 8 applications.
2. Verified output: `λa.λb.a(a(a(a(a(a(a(a(b))))))))`, **26 interactions** (and `cmul(c2,c2)` = 4 in **14**).
3. Why counts exceed applications: each numeral is a graph with clone machinery (dups with labels), its duplication copies one layer per interaction, the products thread lambdas, and every application is itself a firing. The count tracks *cells visited*, not mathematical operations (Part 7.2–7.3).
4. Cross-check: same arithmetic via `cadd(c4,c4)` = 8 in 25 — adding and multiplying land in the same order of magnitude for these tiny structures; the answer is structural, not arithmetic.

**C3 (the label accident).** Your colleague writes `@cexp(@c2, @c2)` expecting 4 and gets `λa.λb.a`. Explain what happened, what to change, and where the engine documents this behaviour.

**Solution (steps).**
1. `c2`'s internal fan carries label `C`; applying `c2` to itself makes a duplicating fan whose label also matches `C` — same-label fans **annihilate** (correlate) instead of copying; the two copies stop being independent (Part 5.3, Part 4.5).
2. Verified outputs: `@c2(@c2)` → `λa.λb.a` (9 itrs); `@c2(@k2)` → `λa.λb.a(a(a(a(b))))` = 4 (20 itrs). `k2` is `c2` with label `K` — shipped precisely so the honest-copy case can be written.
3. Change: duplicate with a fresh label (or use the k-variant when the value's own fans must not correlate).
4. Documentation: HVM5 v2's status notes record both outcomes ("Church c2·c2 = c4"; "same label gives 1, not 4", compendium G.53); the mechanism is DUP-SUP's two branches (I.4).

**C4 (ownership).** `(λ&x.[x, x, x, x])(7)` — how many copies does the parser insert, what does it print, and in how many interactions? Then fix the program `(λx&.[x₀, x₁, x₀, x₁])(7)` which fails to parse.

**Solution (steps).**
1. Four uses ⇒ `n−1 = 3` dup nodes, nested (Part 4.5's expansion): `!d0&=x; !d1&=d0₁; !d2&=d1₁; [d0₀, d1₀, d2₀, d2₁]`.
2. Verified output `[7,7,7,7]` in **4 interactions** — three dups copying the immediate `7` (one firing each: `DUP-NOD` on a number) plus the final wiring.
3. The broken program: `x₀` and `x₁` each appear twice — a dup variable may itself be used only once per side; the runtime reports `variable 'x₀' used 2 times / hint: declare variable as '&x'`. Fix: clone the sides (`λ&x&.` combining forms) or expand as in step 1.
4. Principle (Part 4): every extra use is an explicit fan; the parser automates the bookkeeping, the semantics stays affine.

**C5 (search).** Write the program that keeps the input pairs for which AND is true (the §6.5 selector), state the final collapsed form, the interaction count, and *why* exactly one pair survives.

**Solution (steps).**
1. Program (verified): `((λa.λb.((λr.(r λx.λy.x *)) (a b λt.λf.f))) &0{T,F} &1{T,F})` — note AND = `a b False`.
2. Final form: `&0{&1{λa.λb.a,*},*}` in **37 interactions** (ic): the only surviving leaf is the pair `(True, True)`; everything else erased to `*`.
3. Why exactly one: with different labels the two sups enumerate all four pairs; the selector consumes the AND-result per pair: True → keep the pair, False → erase. Only `(T,T)` yields True *and* keeps its pair.
4. The same pattern with erasure doing the counting turns any predicate into a filter — "search without loops" (Part 6.5, A.15).

**C6 (machine trace).** `@main = !x&A = 3; [x₀ + 1, x₁ + 2]` — predict the result, then read its trace and name every rule fired.

**Solution (steps).**
1. Result `[4,5]` in **3 interactions** (verified).
2. Trace: `DUP-NOD` — the dup meets the number `3` and copies it into both uses in one step (`(3 + 1)` and `(3 + 2)` ready); then two `OP2-NUM-NUM` firings, one per distinct addition: `4` and `5`.
3. Note: one duplication, two *different* operations — sharing copied the data, not the work; the count is 1 + 2 (Part 8.6).

**C7 (enumeration).** `@bits` of Peano 2 — how many lines, which ones, roughly how many interactions? State what would change with all branches merged to one label.

**Solution (steps).**
1. 2 bits ⇒ `2² = 4` lines: `OO, OI, IO, II` as `#O{#O{#E{}}}, #O{#I{#E{}}}, #I{#O{#E{}}}, #I{#I{#E{}}}`; verified **17 interactions** for `@bits(2n)`.
2. The recursion branches per `#S` level by `&L{#O{…}, #I{…}}`; prefixes are shared, so work is linear-ish in output.
3. Same label everywhere ⇒ pairwise alignment would collapse alternatives per level (compare Part 6.1's `&A`-everywhere experiments); different labels (fresh `L` per level is the natural reading) ⇒ full cross product — the whole space.

**C8 (theory).** State the one-step diamond property precisely, prove its key step (disjointness), and give one consequence *and* one non-consequence.

**Solution (steps).**
1. Statement: if `N → N₁` and `N → N₂` then there is `M` with `N₁ → M` and `N₂ → M` (each in at most one step).
2. Key step: two distinct active pairs cannot share a cell, because a cell has exactly one principal port and pairs join principal ports (a matching on cells). Hence the two rewrites touch disjoint cells/wires and rewire only their own free ports; each survives the other untouched.
3. Consequence: any scheduler computes the same normal form in the same number of interactions — free parallelism, deterministic counts (Parts 2.4, 9.1).
4. Non-consequence: **termination** — the self-loop (Exercise 2.6) is confluent and infinite; also nothing here bounds *time* (Part 9's Asperti–Mairson note).

**C9 (machine inventory).** Name the sheets implementing the four core rules and the model's rule 3 (ERA–ERA), then name three sheets that are *extensions* with no pure-model counterpart.

**Solution (steps).**
1. Core rules: `app_lam` (APP-LAM), `app_sup` (APP-SUP), `dup_lam` (DUP-LAM), `dup_sup` (DUP-SUP, both label modes). Erasure: the model's rules 5–6 appear as the erasure cases inside each family (`app_era`, `op2_era`, `and_era`, … — an ERA meeting any cell propagates exactly as the model says).
2. Extensions (examples): `op2_num_num` (arithmetic on immediates), `mat_inc`/`app_mat_*` (pattern matching), `alo_*` (book allocation/substitution), `use_*` (strict unbox), `ddu_*`/`dsu_*` (dynamic labels). Any three suffice.
3. Why extensions: universality (Part 3.3) says encoding is possible; engineering says arithmetic and matching as single cells is what makes programs fast (Part 8.8).

**C10 (cost reasoning).** Two programs compute the same pair of answers: (a) `!F& = @f(2); [F₀(10), F₁(20)]` (sharing) — 11 interactions; (b) `[@f(2, 10), @f(2, 20)]` (naive) — 8 interactions; both print `[[4,10],[4,20]]`. Explain how sharing can *lose* on interactions here, and when it wins big.

**Solution (steps).**
1. The shared version pays DUP-LAM and cleanup plumbing to share a body whose only "work" is a tiny addition; the naive version just does two tiny additions. Bookkeeping outweighs the saved work (Part 7.6 — measured, honest).
2. Sharing wins when the shared body's work is large relative to the fan overhead, or when the sharing prevents *explosive* replication: the 2² benchmark (14 interactions, "optimal", I.4), `map f . map g` fusion on unknown functions (exponential wins, F.20 §3), and search-by-superposition where alternatives multiply (Part 6).
3. The rule to remember: **sharing is a work-avoidance mechanism with fixed costs**; count both sides. This is the most practical lesson of the whole course — and the reason every serious treatment of this technique, including the sources, ends with a caution (F.20, A.5, A.15).
---

## Appendix A · Reproduce everything

Three toolchains, all public, all used to produce this course's outputs. (The workspace where the course was written also used a fresh clone of `Operation`... just kidding — names below are the real ones.)

### A.1 HVM4 (the machine)

```sh
git clone https://github.com/HigherOrderCO/HVM4     # public, no license text — study, not a grant
cd HVM4/clang
clang -O2 -o main main.c -ldl                       # Linux; macOS: no -ldl, use clang as shipped
./main ../test/autodup_1.hvm -s                     # a first run: [5], stats
```

| Flag | Effect |
|---|---|
| `-s` | stats: interactions (`Itrs`), heap nodes, time, throughput |
| `-C` | collapse mode (enumerate superpositions); `-C10` limits output lines |
| `-D` | print each interaction with its rule name (not combinable with `-C`) |
| `--to-c` | emit a standalone AOT C program to stdout |
| `--as-c`, `-o PATH` | emit+compile+run / emit an executable |
| `--ffi PATH`, `--ffi-dir PATH` | load native FFI libraries |

Run the whole bundled test suite (interpreted):

```sh
cd HVM4 && ./test/_all_.sh -i
```

In this course's environment: **223/224 pass** interpreted. The one "failure" is `fib_small` — a 2-second suite timeout; run directly it takes ≈4.9 s and prints `5702887` after 79,522,600 interactions (that number is quoted in Part 7.4). The suite's own conventions: each `test/*.hvm` ends with its expected output as `//` comment lines; `_book_.hvm` is the shared library of definitions (`c1`…`c8`, `k2`…`k8`, booleans, list helpers) that tests `#include`.

The rule sheets quoted throughout live in `HVM4/docs/hvm/interactions/*.md` (one per rule — Appendix B), with the theory in `docs/theory/interaction_calculus.md`, the surface grammar in `docs/hvm/core.md` and `docs/hvm/syntax.md`, and the memory story in `docs/hvm/memory.md` and `docs/hvm/collapser.md`.

### A.2 The IC reference (the calculus itself)

```sh
git clone https://github.com/VictorTaelin/Interaction-Calculus    # the reference implementation
cd Interaction-Calculus && make                                   # builds bin/ic
./bin/ic run prog.ic            # reduce; prints result + WORK: N interactions
./bin/ic run prog.ic -C         # collapse (enumerate labels); used for all &-results here
```

The tutorial's checker convention (`bend-docs/scripts/check-tutorial.py`) reads `ic` blocks only when `IC_BIN` is set — the same pattern this course's examples follow, so a future checker can pick them up.

### A.3 Bend 2 (the language)

```sh
curl -fsSL https://bend-lang.com/install.sh | sh    # official install (read scripts before piping them)
bend version                                        # this course used 2.0.39
bend guide                                          # the language guide; also: bend guide effects, bend guide shaders
bend base                                           # the base library surface
```

Useful gates:

```sh
bend file.bend --check-only        # pure modules: checks (exit 1 on any foreign effect — by design)
bend file.bend                     # run (interpreter lane)
bend PROOF.bend                    # the proof gate; prints ALL PROOFS CHECK + the --verdict hint
bend PROOF.bend --verdict          # the kernel gate (needs Lean v4.34.0 or $BENDTT)
```

Version notes: the tutorial (compendium A) was checked against **2.0.25**; this course's Bend outputs were produced with the locally installed **2.0.39**. Where wording differs between versions, the course quotes what was verified here and points at the tutorial for the older messages.

### A.4 Date and environment of this course's runs

All HVM4 and IC runs: **2026-11-06**, Linux (WSL2), gcc/clang from the local toolchains; HVM4 at the clone's HEAD commit `2d7f28e` ("Fix two memory reuse bugs…"), IC at default branch of the same date. The verified outputs are tabulated in Appendix C. Where this document quotes a source instead of a local run, the source id (e.g. A.15, G.53) is named in the text.

---

## Appendix B · The full HVM4 rule inventory (61 sheets, one line each)

Naming: `FAMILY-A` / `FAMILY-B` = "a cell of family A meets a cell of family B". All sheets live in `HVM4/docs/hvm/interactions/`. The four core rules of the model are marked ★; erasure behaviour appears inside every family (an ERA/`&{}` meeting a cell propagates the erasure one level).

### Application family (10)

| Sheet | Fires on | Result |
|---|---|---|
| `app_lam` ★ | `(λx.f a)` | substitute `a` for `x` in `f` — **β**, the model's rule 1 |
| `app_sup` ★ | `(&L{f,g} a)` | `!A&L = a; &L{(f A₀),(g A₁)}` — dup the argument, distribute (APP-SUP) |
| `app_era` | `(&{} a)` | `&{}` — erasure eats the application |
| `app_inc` | `(↑f x)` | `↑(f x)` — priority passes through |
| `app_nam` | `(name a)` | `^(name a)` — stuck |
| `app_dry` | `(^(f x) a)` | `^(^(f x) a)` — stuck |
| `app_ctr` | `(ctr a)` | `^(ctr a)` — constructors are not callable; stuck |
| `app_mat_ctr` | `(λ{#K:h;m} #K{a…})` | hit: `(h a …)`; miss: `(m #L{a…})` — constructors match |
| `app_mat_num` | `(λ{#a:h;m} #a)` | hit: `h`; miss: `(m #b)` — numeric switch |
| `app_mat_sup` | `(λ{…:h;m} &L{a,b})` | dup `h,m`; distribute the match over both alternatives |

### Duplication family (5)

| Sheet | Fires on | Result |
|---|---|---|
| `dup_sup` ★ | `!X&L = &R{a,b}; t` | `L=R`: `X₀←a, X₁←b` (projection); `L≠R`: commute with nested dups (copy) |
| `dup_lam` ★ | `!F&L = λx.f; t` | copies `λ$x0.G₀`, `λ$x1.G₁`; `x ← &L{$x0,$x1}`; body shared behind `G` — the deep rule |
| `dup_nod` | `!X&L = T{a,b,…}` | generic one-layer copy: dup each field, rebuild `T` twice (`X₀,X₁`) — **this is what copies numbers** (one firing per node) |
| `dup_nam` | `!X&L = name` | both copies are the name |
| `dup_dry` | `!X&L = ^(f x)` | dup `f` and `x`; both dry-apps rebuilt |

### Dynamic-label sharing (8)

| Sheet | Fires on | Result |
|---|---|---|
| `dsu_era` / `ddu_era` | label reduces to `&{}` | `&{}` — the choice is erased |
| `dsu_inc` / `ddu_inc` | label is `↑x` | priority passes through |
| `dsu_num` / `ddu_num` | label is a number | becomes the static rule with that label |
| `dsu_sup` / `ddu_sup` | label is itself a superposition | distribute; the label becomes superposed too |

(Dynamic labels: `&(x){a,b}` and `!y&(x)=v;t` — labels computed at runtime; the machinery behind v2's "test against the live version" ideas.)

### Arithmetic, logic, equality (25)

| Sheet | Fires on | Result |
|---|---|---|
| `op2_num_num` | `(#a op #b)` | `#(a op b)` — fold immediates |
| `op2_sup` | `(&L{a,b} op y)` | dup `y`; distribute over both alternatives |
| `op2_num_sup` | `(#n op &L{a,b})` | dup the number; distribute |
| `op2_era` / `op2_num_era` | era operand(s) | `&{}` |
| `op2_inc` | `↑` operand | priority passes through |
| `and_num` / `or_num` | short-circuit on `#0`/`#n` | `#0 .&. b → #0`; `#n .&. b → b`; mirrored for `.|.` |
| `and_sup` / `or_sup` | sup operand | dup other side; distribute |
| `and_era` / `or_era` / `and_inc` / `or_inc` | era / priority operands | erase / pass through |
| `eql_num` | `(#a === #b)` | `#(a == b)` |
| `eql_ctr` | two constructors | same tag: field-wise `===` (special chains for `SUC`/`CON`); different tag: `#0` |
| `eql_lam` | two lambdas | bind both to a fresh name; compare bodies |
| `eql_sup` | sup on either side | dup other side; distribute |
| `eql_mat` | two matches | same tag: compare arms; different: `#0` |
| `eql_use` | two unboxes | compare payloads |
| `eql_any` | `* === b` / `a === *` | `1` — the wildcard equals anything |
| `eql_era` / `eql_inc` / `eql_dry` | era / priority / dry | erase / pass through / structural on parts |
| `eql_nam` | names | (the sheet ships with an empty body in the current tree — no special rule) |

### Matching, unboxing, plumbing (6 + 7)

| Sheet | Fires on | Result |
|---|---|---|
| `mat_inc` | match applied to `↑x` | push `↑` out |
| `use_val` | `(λ{f} x)` | `(f x)` — force then apply |
| `use_sup` | `(λ{f} &L{a,b})` | dup `f`; distribute over both alternatives |
| `use_era` / `use_inc` | era / priority argument | `&{}` / pass through |
| `uns` | `!${f,v}; t` | `t(λy.λ$x.y, $x)` — unscoped binding unfolds |

ALO (book allocation/substitution) family — the machine's lazy instantiation of static definitions, one layer per firing:

| Sheet | Fires on | Result |
|---|---|---|
| `alo_var` | `@{s} n` | `s[n]` (substitution lookup by de Bruijn level; `n` if absent) |
| `alo_lam` | `@{s} λx.f` | bind fresh `x'`; recurse into body under `{x',s}` |
| `alo_dup` | `@{s} !x&L=v;t` | fresh `x'`; dup of `@{s}v`; body under `{x',s}` |
| `alo_nod` | `@{s} T{a,…}` | `T{@{s}a,…}` |
| `alo_nam` / `alo_dry` | stuck name / dry app | pass / distribute over parts |
| `alo_cop` | `@{s} n₀` or `n₁` | the dup var's substitution (level-based) |

**Count check:** application 10 + duplication 5 + dynamic 8 + arithmetic/logic/equality 25 + matching/unboxing 6 + ALO 7 = **61** — every sheet, no leftovers. The four ★ rules are the model's core; everything else is extension or plumbing, and the extensions exist for the engineering reasons of Part 8.8.
---

## Appendix C · The verified-program ledger

Every runnable example in this course, with the tool, the exact output (collapse mode where relevant), and the interaction count. "Test-suite" means the file ships in `HVM4/test/`; "course" means it was written for this document and run on the same builds. Re-run any row with the commands of Appendix A.

### C.1 The Interaction Calculus (reference `ic`, this build, 2026-11-06)

| # | Program | Output | WORK |
|---|---|---|---|
| 1 | `(λx.x λy.y)` | `λ$a.$a` | 1 |
| 2 | `!&0{x,y}=λz.z; (x y)` | `λ$a.$a` | 3 |
| 3 | `!&0{x,y}=&0{λa.a,λb.b}; (x y)` | `λ$a.$a` | 2 |
| 4 | `!&0{x,y}=&1{λa.a,λb.b}; (x y)` | `&1{λ$a.$a,λ$b.$b}` | 9 |
| 5 | `(&0{λx.x,λy.y} λz.z)` | `&0{λ$a.$a,λ$b.$b}` | 5 |
| 6 | `(* λx.x)` | `*` | 1 |
| 7 | `!&0{x,y}=*; (x y)` | `*` | 2 |
| 8 | AND of two sups, different labels | `&0{&1{λa.λb.a,λc.λd.d},λe.λf.f}` | 18 |
| 9 | AND of two sups, same labels | `&0{λa.λb.a,λc.λd.d}` | 12 |
| 10 | selector keep-True (search) | `&0{&1{λa.λb.a,*},*}` | 37 |
| 11 | selector keep-False (search) | `&0{&1{*,λa.λb.a},λc.λd.c}` | 37 |
| 12 | fork example (`&0{λx.x, λx.(x F T)} True`) | `&0{λ$a.λ$b.$a,λ$c.λ$d.$d}` | 8 |

(Rows 8–12 are tutorial-chapter-14 programs; this build reproduces the tutorial's recorded outputs exactly.)

### C.2 HVM4 (local build, this build, 2026-11-06)

| # | Program (short) | Output (collapse) | Itrs | Source |
|---|---|---|---|---|
| 1 | `@foo = λx.λy.λz.y; @foo(1,2,3)` | `2` | 3 | test-suite (`app_lam`) |
| 2 | `(λ&x.[x])(5)` | `[5]` | 1 | test-suite (`autodup_1`) |
| 3 | `(λ&x.[x,x,x,x])(7)` | `[7,7,7,7]` | 4 | course |
| 4 | `(λx&.[x₀,x₁])(7)` | `[7,7]` | 2 | test-suite (`lam_dup_auto`) |
| 5 | `(λx&.[x₀,x₁])(&A{1,2})` | `[1,1]` / `[2,2]` | 6 | course |
| 6 | `!x&A = &A{1,2}; [x₀,x₁]` | `[1,2]` | 1 | course |
| 7 | `!x&A = &B{1,2}; [x₀,x₁]` | `[1,1]` / `[2,2]` | 5 | course |
| 8 | `!x& = 5; [x₀,x₁]` | `[5,5]` | 1 | course |
| 9 | `!x&A = 3; [x₀+1, x₁+2]` | `[4,5]` | 3 | course |
| 10 | `(&A{1,2} + 10)` | `11` / `12` | 4 | course |
| 11 | `(&A{1,2} + &B{10,20})` | `11 / 21 / 12 / 22` | 10 | course |
| 12 | `(&A{1,2} + &A{10,20})` | `11` / `22` | 4 | course |
| 13 | `(&A{1,2} * &B{10,20})` | `10 / 20 / 20 / 40` | 10 | course |
| 14 | `(&A{1,2} * &A{10,20})` | `10` / `40` | 4 | course |
| 15 | `[&A{1,2}, &B{3,4}]` | 4 pairings | 10 | course |
| 16 | `[&A{1,2}, &A{3,4}]` | `[1,3]` / `[2,4]` | 2 | course |
| 17 | `[&A{1,2},&B{3,4},&C{5,6}]` | 8 triples | 37 | course |
| 18 | `[&A{1,2},&A{3,4},&A{5,6}]` | `[1,3,5]` / `[2,4,6]` | 3 | course |
| 19 | `@double = λ&x.(x+x); @double(&A{1,2})` | `2` / `4` | 8 | course |
| 20 | sharing showpiece (`!F& = @f(2); …`) | `[[4,10],[4,20]]` | 11 | course (Part 7.6) |
| 21 | same, unshared (`[@f(2,10),@f(2,20)]`) | `[[4,10],[4,20]]` | 8 | course |
| 22 | `@cadd(@c1,@c2)` | `λa.λb.a(a(a(b)))` = 3 | 8 | course |
| 23 | `@cadd(@c2,@c2)` | 4 | 9 | course |
| 24 | `@cadd(@c4,@c4)` | `λa.λb.a(a(a(a(a(a(a(a(b))))))))` = 8 | 25 | test-suite |
| 25 | `@cadd(@c1,@c1,@cnot)` | `λa.λb.λc.a(b,c)` | 19 | test-suite |
| 26 | `@cmul(@c2,@c2)` | 4 | 14 | course |
| 27 | `@cmul(@c2,@c4)` | 8 | 26 | course |
| 28 | `@cmul(@c4,@c2,@cnot,@ctru)` | `λa.λb.a` | 43 | test-suite |
| 29 | `@c2(@c2)` (same label) | `λa.λb.a` | 9 | course |
| 30 | `@c2(@k2)` (different label) | 4 | 20 | course / test-suite (`snf_c2_k2`) |
| 31 | `@cexp(@c2,@c2)` (= `c2(c2)` via wrapper) | `λa.λb.a` | 11 | course |
| 32 | `@cnot(@cnot(@ctru))` | `λa.λb.a` (True) | 6 | test-suite |
| 33 | `@fac(3n)` | `#S{…}` = 6 | 119 | test-suite |
| 34 | `@fib(5n)` | 5 | 274 | test-suite (`fib`) |
| 35 | `@fib(34)` (machine ints) | `5702887` | 79,522,600 (≈4.9 s) | test-suite (`fib_small`) |
| 36 | `@sum(4n)` | 10 | 55 | test-suite |
| 37 | `@len("hello")` | 5 | 26 | course |
| 38 | `@map(λx.(x*2), [1,2,3])` | `[2,4,6]` | 35 | course |
| 39 | `@map(@inc, <nat list>)` | `#Cons{…}` | 20 | test-suite |
| 40 | `@bits(2n)` | 4 strings | 17 | test-suite |
| 41 | `@bits(3n)` | 8 strings | 40 | course |
| 42 | equation `x+2=4` over `@X` | `2n` | 536 | test-suite (`enum_nat`) |
| 43 | `(λx.x) === (λy.y)` | `1` | 2 | test-suite |
| 44 | `(λx.x) === (λy.0)` | `0` | 2 | test-suite |
| 45 | `"hello" === "hello"` | `1` | 21 | test-suite |
| 46 | `λ{x.x}(&a{1,2})` (unbox over sup) | `1` / `2` | 7 | test-suite (`use_sup_id`) |
| 47 | fork sugar static | `5` / `10000` | 6 | test-suite |
| 48 | `@c8(@c2, @tog, @t)` benchmark | `λa.λb.a` | 1,897 | test-suite (`lambda_eval`) |
| 49 | call/cc via unscoped binders | `52` | 25 | test-suite (`unscoped_callcc`) |
| 50 | dynamic dup/sup `&(1)` | `[10,20]` | 5 | test-suite (`dyn_dup_sup`) |

(The suite itself: **223/224** interpreted; the only non-pass is the 2-second-timeout on `fib_small`, row 35 — run directly it completes in ≈4.9 s.)

### C.3 Cross-checks

- IC rows reproduce the tutorial's chapter-14 recorded outputs **exactly** (which were themselves produced on commit `e9f0185` of the reference, per A.15) — independent confirmation across builds and dates.
- HVM4 rows marked test-suite reproduce the suite's own `//` expectations; rows marked course are the programs this document teaches.
- The earlier archived hands-on table (compendium H.6) matches rows 6–8 and 10 as well: `[1,2]` (1 itr), `[1,1]/[2,2]` (5 itrs), `&A+10 → 11,12` (4 itrs), `@add(1,2) → 3` (3 itrs).

---

## Appendix D · Glossary

| Term | Meaning here |
|---|---|
| **cell / agent** | A node with one principal port and k auxiliary ports (`CON`, `DUP`, `ERA`, `NUM`, …) |
| **principal port** | The one port where a cell interacts; a cell can be in at most one active pair |
| **wire** | Joins two ports; free ports form the net's interface |
| **active pair / redex** | Two cells facing principal-to-principal; the only reducible configuration |
| **rule / interaction** | A local rewrite of one active pair to a fixed shape on the same free ports |
| **normal form** | A net with no active pair; WNF/SNF/CNF are the reduction destinations (head / full / collapsed) |
| **confluence (one-step, diamond)** | Disjoint rewrites commute; any order reaches the same net and count |
| **CON / DUP / ERA (γ/δ/ε)** | The symmetric interaction combinators: build, duplicate, erase |
| **label** | A fan's identity; same labels annihilate, different labels commute |
| **superposition `&L{a,b}`** | Two values in one place; a DUP read from the other side |
| **duplication `!x&L = v; body`** | One value in two places (`x₀`,`x₁`); incremental, one layer per interaction |
| **APP-LAM / APP-SUP / DUP-LAM / DUP-SUP** | The four core interactions of the Interaction Calculus |
| **Interaction Calculus (IC)** | The λ-calculus completed with labeled dups and sups; the calculus HVM implements |
| **optimal reduction (Lévy)** | Never duplicate shared work; never reduce a family twice |
| **Lamping's oracle** | Bracket/croissant bookkeeping for full optimality; ~10× overhead; replaced locally by labels |
| **EAL / light λ** | Elementary Affine Logic: a typing discipline that avoids the oracle's hard cases |
| **Asperti–Mairson** | Result: optimal-reduction bookkeeping is non-elementary in steps; step counts ≠ time |
| **collapse (CNF)** | Readback that lifts superpositions and prints one pure λ-term per alternative |
| **search by erasure** | Superpose candidates, apply a predicate, let `*`-erasure keep the survivors |
| **SupGen** | The (still private) synthesizer motivating superpositions; mechanism public, source not |
| **HVM1–HVM4** | Generations of the Taelin net runtimes; HVM4 is this course's machine (single-file C) |
| **BendRT** | Released Bend 2's runtime: flat evaluator, affine, no GC, balanced forks — **not** a net reducer |
| **HVM5** | The in-progress runtime putting IC nets under Bend 2 contracts (v1) and code-as-data books (v2) |
| **BGB** | "Bend GME Blob" — the companion project's binary format; not needed for this course |
| **`-s` / `-C` / `-D`** | HVM4's stats / collapse / step-trace flags (Appendix A) |
| **Itrs** | Interaction count — the reproducible work metric used throughout |
| **`@{…}`** | ALO node: lazy book allocation/substitution in traces |
| **`#N`** | Collapse queue key appended to output lines; scheduling detail, not part of answers |
| **GoI** | Girard's Geometry of Interaction — the deep theory behind "computation as wire-flow"; see §9.5 |
---

## Appendix E · Maps and navigation

### E.1 How this course maps onto the source compendium

This document is the *learning edition* of `src/content/compendium/bend-hvm-inet-compendium.md` (the verbatim sourcebook; section ids like `A.5`). Where to go for depth:

| Course part | Compendium sections |
|---|---|
| §0–1 (start, why copying matters) | A.1 (tutorial index), B (`notes/interaction-nets`, `notes/optimal-computer`), F.20 §3–4 |
| §2 (cells, ports, confluence) | A.5 (tutorial ch. 04), F.18 (foundations), F.19 §1–3 |
| §3 (the six rules) | A.5, F.19 §2 |
| §4 (λ encoding, DUP insertion) | A.5, F.19 §2.2, I.3, I.5 (cloned binders) |
| §5 (labels, IC) | I.4 (theory), A.15 (tutorial ch. 14), F.19 §5–6, I.5 (syntax) |
| §6 (superposition, collapse, search) | I.4, I.7 (collapser), A.15, I.3 (primer examples) |
| §7 (algorithms) | I.3, I (test suite), F.20 §3, G.53 (the c2/k2 note) |
| §8 (HVM4 machine) | I.6 (memory), I.5 (syntax), I.2 (core), I.9 (61 sheets), G.5 (the correction) |
| §9 (parallelism, optimality) | F.20 (whole), A.5 (summary table) |
| §10 (lineage, HVM5) | F.1, F.3–4, H.7, H.10–22, G.1–66, A.6 |
| Appendices | I (sheet texts), H.1–H.4 (fresh upstream docs), F (knowledge base) |

### E.2 Mapping onto the site's planned `/course/` chapters

The repository's course scaffold (`src/pages/course/index.astro`) plans nine chapters. Two of this document's parts cover the same ground as several of them; two planned chapters (dependent types, laws/proofs) are *not* in this course and are covered by the tutorial (compendium A):

| Planned chapter (slug) | Material in this document | Elsewhere |
|---|---|---|
| 00-overview | §0, §1, §10 | A.1 |
| 01-first-programs | §0.2 (the three tools) | A.2–A.4, H.2 |
| 02-ownership-copy | §4 (wiring, DUPs, copy costs) | A.4, C (`bend2-ownership`) |
| 03-interaction-nets | §2–3 | A.5, F.18–19 |
| 04-dup-sup-labels | §5–6 | A.14–A.15, C (`bend2-superposition`) |
| 05-parallel-runtime | §8–9 | A.6, F.20 |
| 06-dependent-types | — (out of scope here) | A.9, C (`bend2-proofs`) |
| 07-laws-proofs | — (out of scope here) | A.8, A.13; Bend README H.1 |
| 08-checker-rules | §8.5 (rule inventory as a model) | A.12–A.13 |

If the course pages are to be written from this document, Parts 2–7 serve chapters 03–04 (expanded), Parts 8–9 serve 05, and the language chapters (01–02, 06–08) come from the tutorial.

### E.3 Links (curated; the full index lives in the compendium)

- **HVM4** — https://github.com/HigherOrderCO/HVM4 (docs, 61 rule sheets, the test suite this course runs)
- **Interaction Calculus** — https://github.com/VictorTaelin/Interaction-Calculus (the reference `ic`)
- **Bend 2** — https://github.com/bendlang/bend · https://bend-lang.com · hub: https://hub.bend-lang.com · community: https://bend2.dev
- **HVM lineage** — https://github.com/HigherOrderCO/HVM3 · /HVM2 · /HVM1 · Kind: https://github.com/HigherOrderCO/Kind
- **Theory** — Lafont, *Interaction Nets* (POPL 1990): https://dl.acm.org/doi/10.1145/96709.96718 · Lafont, *Interaction Combinators* (1997): https://www.sciencedirect.com/science/article/pii/S0890540197926432 · background: https://en.wikipedia.org/wiki/Interaction_nets
- **Taelin's writing** — profile and posts: compendium part H (`victor/*`), including `hvm-10min`, `hvm-unordered-sup`, `hoc-history`

### E.4 Splitting and reusing this document

The document is one file on purpose ("one learning edition"); its parts are `## N ·` headings:

```sh
grep -n '^## ' bend-hvm-inet-coursebook.md      # all parts at a glance
awk '/^## 3 /,/^## 4 /' bend-hvm-inet-coursebook.md > part-3.md   # extract one part
```

Exercise blocks are `**Exercise i.j …**` followed by `**Solution (steps).**`; fenced programs are labeled `hvm`, `ic`, or `bend` and can be re-run with Appendix A's commands. If a future checker is pointed at this file, the fences already carry the tool name.

### E.5 What this course deliberately does not cover

- **Bend 2 language details** (syntax, ownership, dependent types, laws/proofs, effects): the tutorial (compendium A) + fresh guide (H.2) own those; this course references them only where the net story requires.
- **HVM5 spec internals**: summarized in §10.5; the 66-document spec tree (compendium G) is the place to go.
- **GoI proper**: §9.5 gives the orientation and the entry points; the literature is out of this workspace's scope.
- **SupGen**: not public; §6.8 and A.15 state exactly what is and is not known.

---

## Appendix F · Verification ledger

### F.1 Toolchains used for this document (2026-11-06)

| Tool | Source | Build | Notes |
|---|---|---|---|
| HVM4 | `github.com/HigherOrderCO/HVM4` (clone in the workspace, HEAD `2d7f28e`) | `clang -O2 -o main main.c -ldl` | full test suite run: 223/224 interpreted (see note) |
| IC reference | `github.com/VictorTaelin/Interaction-Calculus` (fresh clone) | `make` (gcc) | outputs match the tutorial's records on `e9f0185` |
| Bend 2 | local install at `~/.bend/bin/bend` | preinstalled | **2.0.39**; tutorial material is 2.0.25 |
| this document | written and assembled with the workspace's tools | — | all course-generated programs listed in Appendix C |

Suite note: the one non-pass, `fib_small`, is the suite's 2-second per-test timeout; the program needs ≈4.9 s, and run individually it completes and prints the expected `5702887` (Appendix C row 35).

### F.2 What "verified" means for each claim class

| Claim class | How it was verified |
|---|---|
| IC outputs and WORK counts (Part 5, §6.5, C.1) | run on the local `ic` build; matched against the tutorial's independently recorded runs (A.15) |
| HVM4 outputs and `Itrs` (Parts 4–8, C.2) | run on the local HVM4 build; test-suite rows match the suite's own expectations |
| Step traces (§7.6, §8.6) | copied from real `-D` runs of the programs shown |
| Bend messages (§4.3 of the course, b-cases) | run on local bend 2.0.39; tutorial versions noted where wording differs |
| Structural claims (six rules, label mechanics, confluence) | restated from the primary documents (A.5, F.19, I.4); the exercises are the proof-by-doing |
| HVM5, HVM lineage, BendRT, SupGen status | quoted from spec/repo documents with section ids; **not** independently executed |
| Benchmarks/throughput claims (GPU, wall-clock) | quoted as claims, explicitly marked as such (Parts 7.4, 9.4; Exercise 9.5) |

### F.3 Reproduce-in-minutes checklist

```sh
# 1 · machine
git clone https://github.com/HigherOrderCO/HVM4 && cd HVM4/clang
clang -O2 -o main main.c -ldl
cd .. && ./test/_all_.sh -i          # expect: all pass except fib_small's timeout

# 2 · calculus
git clone https://github.com/VictorTaelin/Interaction-Calculus && cd Interaction-Calculus && make
echo '(&0{λx.x,λy.y} λz.z)' > /tmp/p.ic && ./bin/ic run /tmp/p.ic -C    # &0{…} in 5 interactions

# 3 · language
bend version        # 2.0.39 here; any recent version works for the checks in Part 4/10
bend guide          # the canonical syntax for your version
```

### F.4 Where to go next, in reading order

1. **This document's compendium**: `bend-hvm-inet-compendium.md`, Parts I (HVM4, all rules + tests) and A (the Bend tutorial) — the two shelves behind this course.
2. **HVM5 v1 read order** (compendium G.3–G.22): `00-system` → `01-calculus` → `02-homoiconic-code` → `03-types-isolation` → `04-subspaces` → `06-lifecycle` — with `01a-hvm4-execution` (G.5) as the bridge from what you now know to what HVM5 adopts.
3. **HVM5 v2 README + REVIEW** (G.51–G.52) — the forkable-books rewrite, with its self-audit; then `07-trust` (G.61) for what proofs cover.
4. **The upstream repo** (`bendlang/bend`, H.1–H.4): README + `guide/GUIDE.md` + `guide/EFFECTS.md` — the language as it stands today.
5. **The literature**, armed with the machine: Lafont 1990/1997 for the model; Lamping 1990 and *TOIOFPL* for the oracle; Lévy 1978 for optimality; Girard 1989 for GoI; Asperti–Mairson for why the perfect has never been practical.

*Course ends. Every number in it is reproducible with Appendix A; every claim is typed (theorem / measurement / quote) somewhere in the text; every exercise has its steps. If something disagrees with a source you trust more — re-run it and fix this document: that is what the ledger is for.*
