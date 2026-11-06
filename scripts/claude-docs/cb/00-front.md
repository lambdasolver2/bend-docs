---
title: "Interaction nets, the Interaction Calculus, HVM4 and HVM5 — a coursebook (Claude edition)"
description: "A from-first-principles course with step galleries, verified programs and 90+ exercises with worked solutions: the six rules of the symmetric interaction combinators, λ-calculus on nets, labels and the Interaction Calculus, superposition and search, the HVM4 machine (HEAD 6defdfc, single-file src/hvm.c), optimality told honestly, Bend 2, HVM5's code-as-data design, and Victor Taelin's own insights quoted verbatim."
updated: 2026-11-06
verified: 2026-11-06
status: docs-only
canonical: /coursebook/bend-hvm-inet-coursebook-claude/
sources:
  - https://github.com/HigherOrderCO/HVM4
  - https://github.com/VictorTaelin/Interaction-Calculus
  - https://github.com/bendlang/bend
  - https://github.com/HigherOrderCO/HVM
  - https://gist.github.com/VictorTaelin
---

# Interaction nets, the Interaction Calculus, HVM4 and HVM5

*A coursebook — from "what is a port?" to reading the HVM4 runtime and the HVM5 design.*
*Claude edition, rewritten 2026-11-06. Companion sourcebook: `../compendium/bend-hvm-inet-compendium-claude.md`.*

> **This pair is the whole set.** Two documents, nothing else: the **compendium** (every source, verbatim, with section ids `A.1`…`L.n`) and this **coursebook** (one learning path with exercises and worked solutions). Whenever a lesson rests on a source, the compendium id is named — for example *(H.46)* is Taelin's "HVM: how it works", *(L.4)* is HVM4's current `interaction_calculus.md`.

> **Paper labels.** `M.1`–`M.7` name the papers the coursebook cites — M.1 the HVM2 paper, M.2 BendRT, M.3 BendTT, M.4 Mazza's *Denotational Semantics for the Symmetric Interaction Combinators*, M.5 Laretto's seminar on the complexity of optimal reduction, M.6 Borner's thesis on effects, M.7 Taelin's 2022 account of HVM's design. They are labels only: the compendium does not reproduce those texts, and a citation such as *(Mazza, M.4, §2.3)* gives the author and the section.

## 0 · How to use this book

### 0.1 Who it is for

You know a functional language (Haskell, OCaml, Lean, Scala) and the λ-calculus at the level of "β-reduction substitutes the argument for the variable". You do **not** need category theory, linear logic or any prior exposure to graph rewriting. Every concept is introduced before it is used; every exercise can be solved from the text that precedes it.

### 0.2 What changed against the first edition

The first edition (`bend-hvm-inet-coursebook.md`) was audited before this rewrite. The audit ledger is Appendix R of the compendium; the changes that matter to a reader are:

| Area | First edition | This edition |
|---|---|---|
| HVM4 version | described a March 2026 clone (`2d7f28e`) with a multi-file `clang/` tree, AOT (`--to-c`), FFI and threads | describes **HEAD `6defdfc` (2026-05-29)**: one sequential C file `src/hvm.c`, flags `-s -S -C[=N] -D -d`; the removed features are history (§8.8) |
| Build command | `cd clang && clang -O2 -o main main.c -ldl` | `clang -O2 -o src/hvm src/hvm.c` |
| Step galleries | hand-drawn only | the six combinator rules drawn port by port, **plus real `-D` traces from HVM4** for every Interaction-Calculus rule and a full annotated 14-step trace of Church 2² |
| HVM4 design | absent | Part 8B: why the machine is built this way (labels, lazy WNF stack, words not graphs, the shared DUP slot, book/ALO, memory, collapse), each decision tied to the lesson that caused it and the C code that implements it |
| Quotes | a handful | 15 insight cards with verbatim quotes and their source files (§11); 41 quoted passages, all checked word for word against the sources |
| Numerals | claimed `3n` = `#S{#S{#S{#Z{}}}}` | two numeral forms that do **not** mix (§7.4) |
| Exercises | 76 | 114, each with numbered reasoning steps |
| Outside sources checked | none | Mazza (symmetric vs Lafont combinators, vicious circles), Asperti–Coppola–Martini and BOHM via Laretto's seminar, Borner on effects, Taelin's 2022 HN account of HVM's design; plus HEAD measurements of runtime fusion (§7.7) and the quadratic slowdown (§9.4) |

### 0.3 The legend (used in every diagram)

```inet
show: legend
title: Legend (used in every diagram)
caption: aux₁ is on the left and aux₂ on the right as seen from the apex; δA carries label A (Part 5). Thick amber wire: an active pair, the only place work happens. Free ports never change during reduction.
```

Every net is drawn from a one-line **notation**, printed under each figure, and the notation is the source of truth. `γ(a, b)` is a constructor whose aux₁ goes to `a` and aux₂ to `b`; `ε` is an eraser; `t ~ u` joins two principal ports (an active pair); `x = t` wires free port `x` to the principal of `t`; a name used once is a free port and a name used twice is a wire. So `δ(a, b) ~ γ(ε, ε)` is a duplicator facing a constructor whose two aux ports are erased. Animated players replay each reduction one interaction at a time, with the notation of every intermediate net. Term-level traces use HVM4's own notation, copied from `hvm -D` output; a line `──── APP-LAM` names the interaction that produced the next line.

### 0.4 Three toolchains

Everything printed in this book was produced by one of these, on **2026-11-06**:

```sh
# 1 · HVM4 — the machine (HEAD 6defdfc, 2026-05-29)
git clone https://github.com/HigherOrderCO/HVM4 && cd HVM4
clang -O2 -o src/hvm src/hvm.c          # ~4 s; one translation unit, no other files
./devs/test/_all_.sh                     # 217 tests; all pass at HEAD (HVM_TEST_TIMEOUT_SECS=20)
./src/hvm file.hvm -s -C                 # -s stats, -C collapse, -D step trace, -S silent

# 2 · The Interaction Calculus reference — the pure calculus (commit e9f0185)
git clone https://github.com/VictorTaelin/Interaction-Calculus && cd Interaction-Calculus
make && ./bin/ic run file.ic             # add -C to collapse

# 3 · Bend 2 — the language (local compiler 2.0.39)
bend file.bend --check-only && bend file.bend
```

> **Version rule.** Every interaction count in this book says which tool produced it. HVM4's `Itrs` counts the interactions of *its* machine (including numeric and bookkeeping rules), the IC reference's `WORK` counts *its* rules, and the hand-reductions in Parts 2–4 count combinator rewrites. The three numbers measure the same idea at different granularities — never compare them across tools.

### 0.5 The first fifteen minutes

Build HVM4 (above) and type:

```sh
printf '@main = (&A{1,2} + 10)\n' > first.hvm
./src/hvm first.hvm -s -C
```

```text
11 #3
12 #4
- Itrs: 4 interactions
```

Two answers, four interactions, no loop. `&A{1,2}` is a **superposition** — two values in one place — and `+ 10` was applied to both. (`-C` "collapses" the superposition into a list of answers. The `#3`/`#4` after each answer is the **running interaction count at the moment that answer was printed** — the first world was ready after 3 interactions, the second after 4; §8.6 shows the line of C that prints it.)

Now watch work being **shared inside a lambda**, the thing ordinary lazy languages cannot do:

```sh
cat > share.hvm <<'EOF'
@f = λx.λy. !z&=x; [(z₀ + z₁), y]
@main = !F& = @f(2); [F₀(10), F₁(20)]
EOF
./src/hvm share.hvm -D
```

The trace (Part 7.6 walks through all 11 lines) contains exactly one line

```text
---------------------------------------- OP2-NUM-NUM
```

where `(2 + 2)` becomes `4` — **once** — although the function `@f(2)` was copied and both copies used the sum. That single line is the reason this whole lineage exists. The rest of the book explains how it works, what it costs, and where it does not help.

<!-- widget: trace src=traces/share.txt -->

### 0.6 Map of the book

| Part | You learn | You can then |
|---|---|---|
| 1 | why copying is the whole problem | explain why memoization fails inside lambdas |
| 2 | cells, ports, wires, active pairs, the two theorems | reduce a net by hand and check every step |
| 3 | the six rules of the symmetric interaction combinators | read any combinator net reduction |
| 4 | λ-calculus as a net: β is one interaction | translate terms to nets and back |
| 5 | labels and the Interaction Calculus | predict DUP-SUP, APP-SUP, DUP-LAM; explain the c2/k2 accident |
| 6 | superposition as a programming tool | search by erasure; enumerate; reason about collapse |
| 7 | algorithms and their counts | interpret `Itrs` honestly |
| 8 | the HVM4 machine at HEAD | read `src/hvm.c` and the 61 rule sheets |
| 8B | how HVM4 is built and why: lessons from HVM1/HVM2 turned into design | explain every major data structure and its reason |
| 9 | optimality and parallelism, honestly | classify every speed claim |
| 10 | the lineage: HVM1→4, BendRT (no nets), HVM5 | say what each system actually does |
| 11 | Taelin's insights, verbatim | trace each idea to its source |
| 12 | capstones | build and audit your own programs |

Difficulty marks: ★ direct application · ★★ needs two ideas · ★★★ needs a construction or a proof.

### 0.7 Honest limits of this book

- **Model ≠ machine.** Parts 2–5 teach interaction nets as a graph model. HVM4 does not store a port graph; it stores 64-bit term words in a heap and implements the same interactions on terms (Part 8). Both views are correct; they are different levels.
- **Counts are not time.** Interaction counts measure work in a model. Wall-clock speed depends on constants, memory and scheduling (Part 9).
- **SupGen is private.** Taelin's program synthesizer built on superpositions has no public source. This book teaches the public mechanism (labels, collapse, erasure) and quotes public claims; it never implies the tool is available.
- **HVM5 is a design in progress** in this workspace (Part 10.5); released Bend 2 runs on BendRT, which is **not** an interaction-net reducer.

---

## 1 · Why copying is the whole game

### 1.1 Substitution is not one step

β-reduction says `(λx. b) a → b[x := a]`. Written on paper it looks atomic. In a machine it is not: if `x` occurs *n* times in `b`, substitution must place *n* copies of `a`, and `a` may be arbitrarily large. Taelin states the problem in his manifesto *(H.42)*:

> "The fundamental operation of the Lambda Calculus, substitution, may trigger an unbounded amount of copies of an unboundedly large argument. Because of that, it can not be performed in a bounded amount of steps"

Every evaluation strategy is a policy for this copying:

| Strategy | Policy | Failure mode |
|---|---|---|
| call-by-value | evaluate `a` first, copy the *value* | evaluates arguments that are never used |
| call-by-name | copy `a` unevaluated | evaluates the same `a` once per use |
| call-by-need (Haskell) | copy a *pointer* to a shared thunk; evaluate once, overwrite | sharing stops at λ: a thunk *inside a function body* is re-created on every call |
| optimal (Lévy) | never duplicate a redex | needs a way to copy a *function* without copying the work inside it |

### 1.2 The case memoization cannot handle

```haskell
let f = \y -> (expensive 2) + y   -- 'expensive 2' does not depend on y
in  (f 10, f 20)
```

GHC will often float `expensive 2` out by an optimization, but the language semantics does not promise it, and it is easy to write the version where floating is impossible because the shared part is only discovered *after* the function is partially applied (`@f(2)` in §0.5 is that version). Call-by-need shares *values*; it does not share the *partially evaluated body of a lambda* between two copies of the lambda. The incremental copy of Part 4 does.

The history is older than Haskell. Wadsworth's 1971 thesis introduced **graph reduction**: a variable is a pointer to its argument's tree, so an argument is evaluated once however many times it is used, which is what call-by-need implements today. It is not optimal, and Laretto's seminar *(M.5)* gives the reason with one term, `(λf.(f a)(f b)) (λy. …)`: after one β-step the function `λy. …` is applied twice, so its body must be **unshared**, and every redex inside it is duplicated, although the two copies differ only in their argument. Lévy (1978) defined what optimal sharing would have to achieve; Lamping (1990) found the first algorithm (Part 9).

### 1.3 Copy incrementally

Taelin's ten-minute explanation *(H.43)* arrives at the answer by elimination: evaluating first wastes work on unused parts; copying first duplicates work. The resolution:

> "Fortunately, it turns out there IS a proper way to do it: just **copy incrementally**."

A copy advances **one layer at a time, only when someone looks**. If a copy reaches a redex before it is reduced, the redex is *not* copied — the copy waits, the redex is reduced once, and the copy continues with the result. That is the whole idea. The next three parts build the machinery that makes "one layer at a time" a precise, local rewrite rule.

### Exercises — Part 1

**E1.1 ★** Name the evaluation strategy that computes `expensive` zero times, one time and two times in `(λx. 7)(expensive)` and in `(λx. x + x)(expensive)`.

<details><summary>Solution</summary>

1. `(λx.7)(expensive)`: by-value evaluates it **once** (needlessly); by-name and by-need **zero** times.
2. `(λx. x + x)(expensive)`: by-value **once**; by-name **twice** (one copy per occurrence); by-need **once** (shared thunk).
3. So by-need dominates on first-order sharing — the trouble is only with sharing inside lambdas (E1.2).
</details>

**E1.2 ★★** Explain, in two sentences, why `let g = (λy. (2*2) + y) in (g 1, g 2)` computes `2*2` twice under plain call-by-need but `let h = (λy. y + 1)(2*2) in (h, h)` computes it once.

<details><summary>Solution</summary>

1. In `h` the shared object is a *value* (an application whose result is a number): the thunk is evaluated once and overwritten.
2. In `g` the shared object is a *lambda*; `2*2` sits inside its body, and each call instantiates the body afresh, creating a new thunk for `2*2` per call. Call-by-need shares closures, not the redexes inside them.
</details>

**E1.3 ★** Why is substitution "not atomic" while a rewrite that touches a bounded number of nodes is?

<details><summary>Solution</summary>

1. Substitution's cost is proportional to (#occurrences × size of argument): unbounded.
2. A rule that reads and writes a fixed number of nodes has a constant cost: it can be a single machine step, and two such steps on disjoint nodes can run in parallel.
</details>

**E1.4 ★★** "Copy incrementally": suppose we copy the list `[f(1), f(2)]` where `f(1)` is an unevaluated call. What does the incremental copy do when the first copy's consumer asks for the head, and what does the second copy see later?

<details><summary>Solution</summary>

1. The copier peels one layer: the outer cons cell becomes two cons cells whose heads are both "still being copied" from the shared `f(1)`.
2. When the first consumer demands its head, `f(1)` is reduced **in the shared position** (to, say, 7), then the copy proceeds into the result.
3. The second copy later finds the already-reduced 7: the call ran once. The tail `[f(2)]` is copied only if someone demands it.
</details>

---

## 2 · The model: cells, ports, wires

### 2.1 Definitions

An **interaction net** is a graph made of:

- **cells** (also called agents or nodes), each with a *kind* and a fixed number of ports;
- exactly one **principal port** per cell, plus `n ≥ 0` **auxiliary ports**;
- **wires**, each joining exactly two ports; every port is joined to exactly one wire;
- **free ports**: wire ends not attached to any cell — the net's interface.

An **active pair** is a wire joining two principal ports. An **interaction rule** replaces an active pair (the two cells, nothing else) by a new net with the same free ports. There is at most one rule per pair of kinds. That is Lafont's definition (1990), and it has four consequences you should keep at the front of your mind:

1. **Locality.** A rule reads exactly two cells and rewires only their auxiliary connections.
2. **Interface preservation.** The free ports before and after a rewrite are the same; the outside world cannot tell which rule fired, only that one did.
3. **No choice inside a rule.** Each active pair has exactly one rewrite.
4. **Disjointness.** A cell has one principal port, so a cell belongs to at most one active pair. Two different active pairs never share a cell.

### 2.2 The two theorems (and one non-theorem)

**Theorem (strong confluence, "one-step diamond").** If a net `N` can rewrite to `N₁` (firing pair P) and to `N₂` (firing pair Q ≠ P), then `N₁` and `N₂` both rewrite in one step to the same net `N₃` (fire Q in N₁, P in N₂).

*Why:* by consequence 4, P and Q are disjoint; each rule only touches its own two cells; so the two rewrites commute.

**Corollary.** All reduction sequences from a net to a normal form (no active pairs) have **the same length**, and the normal form is unique. The number of interactions is a property of the net, not of the scheduler.

**Corollary (free parallelism).** All active pairs present at one moment can fire simultaneously.

**Non-theorem.** Confluence does *not* say every net terminates, nor that the number of interactions equals the number of β-steps of some λ-term, nor anything about time. Those questions come back in Part 9.

### 2.3 Reading a net

```inet
net: r = γ#u(ε#v, ε#w)
title: A net with one free port r
caption: cell u of kind γ, its principal toward r; u.aux₁ – v.principal, u.aux₂ – w.principal; v and w are erasers
```

Count: 3 cells, 1 free port, 0 active pairs (u's principal touches the free port, not a principal). This net is in **normal form**.

> **Invariant check you will use 200 times.** Before and after every rewrite, count (a) the free ports — must be unchanged; (b) the ports attached to each wire — exactly two; (c) the cells touched — exactly the two of the active pair.

### 2.4 Vicious circles: when "no active pair" is not an answer

"No active pair left" does not always mean "finished". Mazza's paper on the symmetric combinators *(M.4, §2.3)* names the exception. A net can contain a cycle in which every cell waits for another, so no cell can ever interact first:

```inet
net: p = δ(q, s); q = δ(p, s)
title: A vicious circle: two δ cells, each principal wired to an aux port of the other
caption: no principal ever meets a principal, so nothing can fire; the notation p = δ(δ(p, s), s) shows the cycle through p
```

Mazza calls a path **straight** if it enters a cell through an auxiliary port and leaves through the principal port, or the reverse. A **vicious circle** is a cyclic straight path that never crosses two principal ports in a row. A net with no active pair **and** no vicious circle is **cut-free**: a true result. A net with a vicious circle is deadlocked; it is an error, not a value. A net that reduces to a cut-free net is called **total**.

The same paper states the efficiency consequence of strong confluence (§2.2) in one sentence *(M.4, §2.2)*:

> "All reductions leading from a net to its normal form have the same length and require the same work; in particular, if a net is normalizable, then it is strongly so."

So in interaction nets there is no "good" and "bad" evaluation order for the amount of work, as there is in λ-calculus. This is why HVM4's `Itrs` count is a property of the program (§7).

### Exercises — Part 2

**E2.6 ★★** A net has no active pair, but `-D`-style inspection shows two duplicator cells whose principal ports each lead into the other's auxiliary port. Is it in normal form? Is it a result?

<details><summary>Solution</summary>

1. It is in normal form in the narrow sense: no rule applies.
2. It is not cut-free: the two cells form a vicious circle (a straight cycle that never crosses two principal ports in a row).
3. So it is a deadlock, not a result. Mazza's definitions separate the two: only cut-free nets are the "true" normal forms.
</details>

**E2.1 ★** A net has cells u (γ), v (δ) with `u.principal ── v.principal`, `u.aux1 ── v.aux1`, `u.aux2 ── x`, `v.aux2 ── y`. How many free ports, wires and active pairs does it have?

<details><summary>Solution</summary>

1. Free ports: x, y → **2**.
2. Wires: u.p–v.p, u.1–v.1, u.2–x, v.2–y → **4**; ports: 3+3 cell ports + 2 free = 8 = 2×4 ✓.
3. Active pairs: u.p–v.p joins two principals → **1**.
</details>

**E2.2 ★** Why can a cell never be part of two active pairs at once?

<details><summary>Solution</summary>

A cell has exactly one principal port, and that port is attached to exactly one wire. An active pair needs the cell's principal port; so at most one pair.
</details>

**E2.3 ★★** Use the diamond property to prove: if some reduction of N reaches a normal form in k steps, every reduction of N that reaches a normal form takes exactly k steps.

<details><summary>Solution</summary>

1. Induction on k. k = 0: N has no active pairs, so every reduction is empty.
2. Step: let two reductions start with pairs P and Q. If P = Q, apply the hypothesis to the result.
3. If P ≠ Q, the diamond gives N₃ reachable from both N_P and N_Q in one step. N_P normalizes in k−1 steps (first reduction), so by the hypothesis every normalizing reduction of N_P has k−1 steps, including the one through N₃: N₃ normalizes in k−2.
4. Hence N_Q → N₃ → … normalizes in k−1 steps, and by the hypothesis applied to N_Q every normalizing reduction of N_Q has k−1 steps. Total k. ∎
</details>

**E2.4 ★★** Give a two-cell net that has an active pair but no rule, and explain why interaction systems avoid it.

<details><summary>Solution</summary>

1. In a system with kinds α and β but no α–β rule, the net `α.p ── β.p` (with their aux ports free) is stuck: an active pair without a rewrite.
2. Interaction *systems* therefore require a rule for every pair of kinds that can meet (or a type discipline that prevents the meeting). The symmetric combinators of Part 3 have rules for all six pairs.
</details>

**E2.5 ★** "All active pairs present at one moment can fire simultaneously." Why is that not true of β-redexes in a λ-term?

<details><summary>Solution</summary>

β-redexes can overlap: in `(λx. (λy. y) x) a` the inner redex lies inside the outer one; firing the outer one copies or moves the inner one. Active pairs never overlap (E2.2), so their rewrites are independent.
</details>
