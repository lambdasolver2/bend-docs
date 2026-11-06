---
title: "Bend 2 tutorial 14: superposition, collapse, and SupGen"
description: "The Interaction Calculus behind sup and dup, run on Victor Taelin's reference implementation: the rules and labels, collapse, search with erasure as the filter, what is public about SupGen, and whether a cheap fork is available."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/14-superposition-and-supgen/
sources:
  - https://github.com/VictorTaelin/Interaction-Calculus
  - https://gist.github.com/VictorTaelin/9061306220929f04e7e6980f23ade615
  - https://gist.github.com/VictorTaelin/d5c318348aaee7033eb3d18b0b0ace34
  - https://gist.github.com/VictorTaelin/5d42e97684ff81f7e507aa5c149b2a64
  - https://gist.github.com/VictorTaelin/7c4c69a1f07b5c668be613f1032e7d4e
  - https://bend2.dev/notes/interaction-nets-explained/
  - https://bend2.dev/notes/hvm4-explained/
---

# 14: superposition, collapse, and SupGen

This chapter is the one place in the tutorial where the code does not run on `bend`. It runs on the Interaction Calculus (IC), the calculus behind the `sup` and `dup` of chapter 06. Victor Taelin's reference implementation runs it on a CPU. Every IC program below was run with that binary, and the lines under each program are its real output.

## What is verified here, and what is quoted

- **Verified in this lab:** the rules, labels, and collapse results below, with their outputs and interaction counts (`WORK`). Reference build: `Interaction-Calculus` at commit `e9f0185`, default branch, CPU mode.
- **Quoted, not re-run:** the search results for SAT and program synthesis, the enumerator counts, and every SupGen claim. Each one names its gist or post.
- **Not verified:** wall-clock time and memory. The binary reports interaction counts and its own timing, and the timing does not compare across machines.

## Build the reference implementation

```sh
git clone https://github.com/VictorTaelin/Interaction-Calculus.git
cd Interaction-Calculus && make
IC_BIN="$PWD/bin/ic" python3 bend-docs/scripts/check-tutorial.py bend-docs/src/content/tutorial
```

The checker runs `ic` blocks only when `IC_BIN` is set, and reports them as skipped otherwise.

## The calculus in six forms

| Form | Syntax | Meaning |
|------|--------|---------|
| variable | `x` | used at most once (affine), but global: it may appear anywhere |
| erasure | `*` | a value that has been discarded |
| lambda | `λx.t` | a function |
| application | `(f a)` | apply `f` to `a` |
| superposition | `&L{a,b}` | two alternatives `a` and `b` with label `L` |
| duplication | `! &L{x,y} = t; body` | splits `t` into two uses `x` and `y` with label `L` |

Labels are numbers. The grammar is the one in the calculus's README.

## One program per rule

Each program is followed by the lines the binary prints. `WORK` is the number of interactions.

**APP-LAM: beta reduction is one interaction.**

```ic
(λx.x λy.y)
```

```contains
λ$a.$a
WORK: 1 interactions
```

**APP-SUP: applying a superposition runs both alternatives.**

```ic
(&0{λx.x,λy.y} λz.z)
```

```contains
&0{λ$a.$a,λ$b.$b}
WORK: 5 interactions
```

The argument `λz.z` is duplicated, so each alternative gets its own copy.

**DUP-SUP, same label: the duplication routes the parts.**

```ic
!&0{x,y}=&0{λa.a,λb.b}; (x y)
```

```contains
λ$a.$a
WORK: 2 interactions
```

**DUP-SUP, different labels: the two commute.**

```ic
!&0{x,y}=&1{λa.a,λb.b}; (x y)
```

```contains
&1{λ$a.$a,λ$b.$b}
WORK: 9 interactions
```

**DUP-LAM and the erasures.**

```ic
!&0{x,y}=λz.z; (x y)
```

```contains
λ$a.$a
WORK: 3 interactions
```

```ic
(* λx.x)
```

```contains
*
WORK: 1 interactions
```

```ic
!&0{x,y}=*; (x y)
```

```contains
*
WORK: 2 interactions
```

## Labels: same routes, different commute

The README says a superposition "works like a pair", and a duplication of a superposition "works exactly like a pair projection" when the labels match. The two DUP-SUP programs show both cases. With equal labels the duplication takes the pair apart, and the 2 interactions are routing and the final application. With different labels the duplication cannot route the alternatives, so it duplicates each one. The superposition comes out with label 1, at a cost of 9 interactions.

Labels also decide which alternatives are paired when two superpositions meet. The next program is the AND function applied to two boolean superpositions. True is `λt.λf.t`, False is `λt.λf.f`, and `(a b F)` computes AND. First, with different labels:

```ic-collapse
((λa.λb.(a b λt.λf.f)) &0{λt.λf.t,λt.λf.f} &1{λt.λf.t,λt.λf.f})
```

```contains
&0{&1{λa.λb.a,λc.λd.d},λe.λf.f}
WORK: 18 interactions
```

Next, with the same label on both inputs:

```ic-collapse
((λa.λb.(a b λt.λf.f)) &0{λt.λf.t,λt.λf.f} &0{λt.λf.t,λt.λf.f})
```

```contains
&0{λa.λb.a,λc.λd.d}
WORK: 12 interactions
```

Equal labels pair the alternatives: the first of one input meets the first of the other, so the result has two leaves, True and False. Different labels give every combination, and AND throws away the cases that do not matter. When the first input is False, AND never looks at the second, so the second superposition is erased in that branch. The result has three leaves. Labels and erasure, not just the function, decide the shape of the answer.

## How this sits on interaction nets

The calculus uses the same three cells as chapter 04, and gives every DUP a label. Read the text as cells:

| Text | Cell | Ports |
|---|---|---|
| `λx.t` | CON | principal: the lambda's output; aux: the variable `x` and the body `t` |
| `(f a)` | CON | principal: `f`; aux: `a` and the result |
| `!&L{x,y} = t; body` | DUP, label `L` | principal: `t`; aux: `x` and `y`; `body` is the rest of the net |
| `&L{a,b}` | DUP, label `L`, read from the other side | principal: the value; aux: the alternatives `a` and `b` |
| `*` | ERA | principal only |

The rules are chapter 04's, with labels on the DUP cells. The counts are the ones the binary printed above:

| Rule | In the net | Run | Interactions |
|---|---|---|---|
| APP-LAM | CON meets CON: β-reduction | `(λx.x λy.y)` | 1 |
| APP-SUP | CON meets a DUP: the application is copied | `(&0{λx.x,λy.y} λz.z)` | 5 |
| DUP-LAM | DUP meets CON: the lambda is copied, and its variable becomes a superposition | `!&0{x,y}=λz.z; (x y)` | 3 |
| DUP-SUP, same label | two DUPs with the same label annihilate; their aux wires join straight through | `!&0{x,y}=&0{λa.a,λb.b}; (x y)` | 2 |
| DUP-SUP, different labels | two DUPs with different labels commute | `!&0{x,y}=&1{λa.a,λb.b}; (x y)` | 9 |
| erasure | an ERA meets a CON or a DUP and erases it | `(* λx.x)`, `!&0{x,y}=*; (x y)` | 1 and 2 |

A superposition is not a new kind of cell. It obeys the rules of a DUP with its label: it commutes with an application, annihilates with a duplication of the same label, and commutes with a duplication of another label. The README says a superposition "works like a pair". That describes what the cell holds, two alternatives. The cell itself is a DUP read from the other side (chapter 04 draws both readings).

With equal labels, the two cells meet at their principal ports and annihilate. Each aux wire goes straight through, so `x` is wired to `a` and `y` to `b`:

```text
    x         y
    │         │
  ┌─┴─────────┴─┐
  │  DUP   L0   │
  └──────┬──────┘
         │          principal ports meet: annihilate
  ┌──────┴──────┐
  │  SUP   L0   │
  └─┬─────────┬─┘
    │         │
    a         b
```

A superposition is born in DUP-LAM. A duplication that meets a lambda copies the lambda, and the lambda's variable becomes `&L{X0,X1}` with the duplication's own label `L`. The two copies of the variable are the alternatives, and the body is duplicated behind them. The count fits this reading: `!&0{f,g}=λx.x; f` takes 2 interactions, one DUP-LAM and one annihilation of the body's copy with the same label. A different label would commute instead, and take more steps.

The README also notes that without labels the system cannot clone pairs, or clone a cloned lambda. The labels are what let the net copy a superposition. None of this runs in Bend 2; the reference binary runs it.

## Collapse: from superpositions to plain results

The reference binary has a collapse mode. `ic run FILE -C` rewrites a result so that no superposition or duplication remains inside its alternatives. The outermost superposition stays, and each alternative is a plain term. The first program in the previous section already shows this: its output is a tree of plain λ-terms, with the labels kept only at the top.

## Search by superposition, with erasure as the filter

A selector turns a result into a filter. The selector `λr.(r A *)` returns `A` when `r` is True, because True takes its first argument, and erases everything else when `r` is False. Applied to the AND of the two superpositions, it keeps exactly the input pairs for which AND is True:

```ic-collapse
((λa.λb.((λr.(r λx.λy.x *)) (a b λt.λf.f))) &0{λt.λf.t,λt.λf.f} &1{λt.λf.t,λt.λf.f})
```

```contains
&0{&1{λa.λb.a,*},*}
WORK: 37 interactions
```

One alternative survives: `A` for the single pair (True, True). Every other alternative is erased to `*`. This is search in its smallest form. The program is written once, the candidates are a superposition, and erasure keeps only the candidates that pass the test. The SAT note calls this "search without loops". The search does no enumeration in the program text, and the filter does the selection.

## Exercise: keep the False cases

The selector `λr.(r * A)` keeps `A` when `r` is False, because False takes its second argument. Predict how many alternatives survive, before you run the program below.

Solution: two, not three. The pairs (False, True) and (False, False) reach the same branch of AND, and that branch never uses the second input. So the second superposition is erased in that branch, and only one alternative is produced there. Counting alternatives counts the results that reach the output, not the assignments you might expect.

```ic-collapse
((λa.λb.((λr.(r * λx.λy.x)) (a b λt.λf.f))) &0{λt.λf.t,λt.λf.f} &1{λt.λf.t,λt.λf.f})
```

```contains
&0{&1{*,λa.λb.a},λc.λd.c}
WORK: 37 interactions
```

## Exercise: predict the label

Predict the label of the result of `!&0{x,y}=&1{λa.a,λb.b}; (x y)`, and the number of interactions. Then run it.

Solution: the label is 1 and the count is 9. The duplication has label 0 and the superposition has label 1, so they commute, and the result is a superposition with label 1.

```ic
!&0{x,y}=&1{λa.a,λb.b}; (x y)
```

```contains
&1{λ$a.$a,λ$b.$b}
WORK: 9 interactions
```

## Search in the published material

The author's public work applies the same idea to larger problems. These results are quoted, not re-run here.

- **Program search, add-carry** (gist `fast_dps_add_carry`, updated July 2026). A template with 16 unknown bits is written once, its candidates are superposed, two test cases are applied, and the result is collapsed. The gist reports about 36 thousand interactions for the search, against about 262 million for 65,536 separate runs of a conventional loop. It is written in HVM1 syntax. The author says the full source will not be released.
- **SAT** (gist `sat.md`, 2024). Each boolean is a superposition of True and False, a formula is applied to all assignments at once, and the result is collapsed. The gist's text reports 3 minutes in Rust against 1 second in HVM for a 32-variable instance, but the code in the gist is a 16-variable instance. The author writes that he knows little about the asymptotic behaviour.
- **Enumerating λ-terms** (gist `superposed_lambda_calculus_evaluator.c`, 2025). The enumerator builds affine λ-terms directly as a superposition of constructors such as `#Lam` and `#App`, so the candidate programs are data. The gist reports about 76 thousand interactions for an untyped search, against about 32 million for a naive enumerator, and about 3 thousand for a dependently typed version. Its header says it mirrors a file in HVM3's book. That path returned HTTP 404 when this chapter was checked, so the mirror was not confirmed.

## SupGen: what is public

SupGen is the synthesizer these techniques were built for. Its source is not public. The evidence:

- The DPS gist says: "We'll not release the full source, but, meanwhile, I can talk about the theory." It also says HOC "will soon (EOY?) launch an API for our DPS solution".
- A 2025 HOC thesis gist says: "SupGen, our program synthesizer that outperformed existing solutions by up to 1000x." That is a claim, and no code accompanies it.
- A post surfaced by web search, which I did not open, says SupGen "could only discover functions when given their type signatures" until a breakthrough. A YouTube demo is titled "SupGen: an AI-free code synthesis tool". Neither was checked against source.
- Taelin's GitHub account lists 261 public repositories, and none is named SupGen. HigherOrderCO's public repositories are Kind, HVM1 to HVM4, Bend1, and Bend2, which now lives at `bendlang/bend`. Other GitHub repositories named `supgen` are unrelated, except `BabySupGen`, a browser playground that describes itself as inspired by the research.
- The tutorial's own notes agree. The release-status note lists "Bend2–SupGen integration" among the launch blockers, and the HVM runtime note calls the integration "still private".

So the mechanism is public: the calculus, its labelled rules, collapse, and the examples above. The synthesizer is not.

## Is a cheap fork of running code available?

Partly, and only inside the calculus.

- **Yes, as alternatives inside one term.** A fork of a function can be written as a superposition of two versions. Applying it to an input runs both versions, and the input is shared through a duplication. In the program below the main version is the identity, and the branch is NOT. One run returns both answers:

```ic
(&0{λx.x,λx.(x λt.λf.f λt.λf.t)} λt.λf.t)
```

```contains
&0{λ$a.λ$b.$a,λ$c.λ$d.$d}
WORK: 8 interactions
```

The result `&0{True, False}` holds the main version's answer and the branch's answer side by side.

- **Limits.** The fork is an alternative inside one term. It is not a copy of a running process with its own memory. Its cost is counted in interactions, which is the author's metric. Memory and wall-clock time were not measured here, and the speedups quoted above are interaction counts.
- **No, in released Bend 2.** The compiler rejects `&{a, b}` (chapter 06), and BendRT does not reduce nets (chapter 04). A Bend program compiles to a fixed binary, and a branch is a second definition that you test with laws (chapter 10).
- **The homoiconic angle.** The enumerator builds programs as data, using constructors such as `#Lam`. That is the closest public thing to code that other code can build and inspect. Released Bend 2 has no such representation. Chapter 10 shows a small `Expr` interpreter in Bend, which is a limited form of it.

## What to watch for

- A Bend release that adds `sup` syntax or the SupGen integration. The search note in the tutorial's notes says to re-read it when SupGen ships.
- A published SupGen source or API. Until then, every SupGen claim in this chapter is a quoted claim.
- An HVM4 or IC release that reports wall-clock results on the programs above. The interaction counts here do not give those numbers.

## Next

Chapter 13 is the glossary. Chapter 10 applies the fork idea to Bend's laws-first workflow.
