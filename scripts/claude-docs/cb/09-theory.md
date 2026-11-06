
---

## 9 · Optimality and parallelism, told honestly

### 9.1 What "optimal" means

**Lévy (1978–80)** defined optimal reduction for the λ-calculus. Redexes that are "copies of the same redex" (created by duplicating one subterm) form a *family*; an evaluator is **optimal** if it reduces each family in one step, never duplicating a redex before reducing it. Lévy proved that no strategy on *terms* can do this in general: terms force you to copy before you know what will be needed.

Taelin's own statement of the guarantee *(H.53)*:

> "HVM is an optimal λ-calculus evaluator in Lévy's sense: given an admissible λ-term, it computes its normal form with the minimal number of β-reductions."

Read it word by word:

- **"in Lévy's sense"**: the measure is **β-reductions** (APP-LAM), not interactions, not time.
- **"admissible"**: terms for which the label discipline is correct (the clone-of-a-clone cases of §5.6 are excluded; see 9.3).
- **"minimal number of β-reductions"**: every family once.

### 9.2 Lamping: the abstract algorithm and the oracle

**Lamping (1990)** gave the first optimal algorithm, as a graph-rewriting system: the λ-net of Part 4, plus fans for sharing, plus **control nodes** (brackets and croissants) that track the *nesting level* of each fan so that the right fans annihilate and the others commute. Taelin's history of the field *(H.41)* separates the two halves:

> "Lamping's algorithm is actually divided into two parts: the **Abstract Algorithm** and the **Oracle**."

- The **abstract algorithm** is the fan-and-λ part: exactly the rules of Parts 3–5.
- The **oracle** is the bookkeeping that decides, for two fans that meet, whether they belong together. It is what makes the algorithm correct for *all* λ-terms, and it is expensive.

Labels (Part 5) are a **static, local oracle**: the program, not the run time, says which fans belong together. That is cheap and decidable, and it is incomplete: it fails exactly when a fan must meet a same-labelled fan that is not its partner (§5.6, §7.2).

### 9.3 Why optimal reduction was not used, and the two reasons

Taelin's first implementation of Lamping's algorithm, Optlam, surprised him *(H.41)*:

> "It was miraculously fast. Impossibly so."

His diagnosis of why the field nonetheless abandoned it, in his words:

> "1. A *negative result* that was misinterpreted by researchers back then"
>
> "2. The theoretical optimality didn't translate to real-world performance"

The negative result is **Asperti–Mairson (1998)**: for any implementation of Lévy-optimal reduction, the time needed for n parallel β-steps (n redex families) is not bounded by any elementary function of n (not by 2ⁿ, nor 2^2ⁿ, and so on). Optimality in Lévy's sense counts β-steps; the rest of the work is not counted, and it can be enormous. A later result sharpens *where* that work goes. **Asperti, Coppola and Martini (2004)** showed that the *duplication* interactions alone are already not elementary: the blow-up is not caused by the oracle's bookkeeping but by the inherent sharing of λ-terms. The same work gives the fact that matters most for HVM (as summarized in Laretto's seminar on the complexity of optimal reduction, *M.5*):

> "If a term can be given a type in EAL (for which they give a type-inference algorithm), bookkeeping is not necessary and a simple labelling of fan nodes suffices."

(EAL is Elementary Affine Logic.) This is the closest theoretical ground for HVM's choice of **labels instead of an oracle** (§5, §8B.2): there is a large, typable class of terms for which static fan labels are enough. HVM does not run an EAL checker; it leaves label correctness to the program or compiler (§5.6).

What happened when the full algorithm was engineered is recorded too *(M.5)*. The Bologna Optimal Higher-order Machine, **BOHM** (Asperti, Giovannetti and Naletto, 1996), was much faster than SML, Caml Light and Yale Haskell on pure λ-terms with heavy sharing, often turning exponential cases into polynomial ones, but about one order of magnitude slower than call-by-value languages on ordinary programs. BOHM 1.1 added **safe** fans, fans that can never pair with another fan and may therefore be collected early; that idea returns in §9.4. The second reason is engineering: graph reducers with many pointer indirections are slow on real hardware. Taelin, on what HVM changed *(H.46)*:

> "all implementations of this algorithm, until now, represented terms as graphs. This demanded a lot of pointer indirection, making it slow in practice."

HVM's answer is the term machine of Part 8: the same interactions, a compact memory format.

### 9.4 The remaining gap: the quadratic slowdown

Optimal in Lévy's sense is not the end. Taelin, after a user found a program that HVM ran slower than GHC *(H.53)*:

> "function which HVM computes quadratically slower than GHC"

> "The culprit is the accumulation of "redundant" control nodes or duplication nodes in some cases."

**Measure it on HVM4.** The essay's example is "solve X = n", with X the superposition of all naturals from §6.5. A good logic language unifies this in O(1); the best a superposition search can do is linear (it must compare n constructors). Here is the program, with the nat literal written out:

```hvm
@eq   = λ{ #Z: λ{ #Z: #T{}; #S: λbp. #F{} }; #S: λap.λ{ #Z: #F{}; #S: λbp. @eq(ap, bp) } }
@X    = &Z{#Z{}, #S{@X}}
@N    = #S{#S{#S{#S{#Z{}}}}}
@main = @eq(@X, @N)
```

Measured on HEAD `6defdfc` with `-s` (no collapse), for `@N` = n:

<!-- widget: chart table=next -->

| n | interactions | ratio to the previous row |
|---|---|---|
| 16 | 2,376 | — |
| 32 | 8,576 | 3.6 |
| 64 | 32,496 | 3.8 |
| 128 | 126,416 | 3.9 |
| 256 | 498,576 | 3.9 |

Doubling n multiplies the work by almost 4: **quadratic**. The control `@eq(@N, @N)` at n = 256, the same comparison without a superposition, costs 1,538 interactions. Counting the rule names in the `-D` trace shows where the time goes: at n = 32, **4,455** of the interactions are `DUP-NOD` (a duplicator copying a constructor), against 97 `APP-LAM`.

**The mechanism.** Every branch of X that fails still leaves its duplicator behind, so each later `#S` layer of n must pass through a longer chain of duplications before it reaches the comparison. Taelin's hand trace of `X == 4` marks those steps "WASTED" and describes them *(H.53)*:

> "the constructor has to jump between a chain of "redundant" duplications"

> "To fully copy the Peano Nat `1000`, we would need about 1 million interactions!"

**Three answers.**

1. **Safe nodes** (Asperti, BOHM 1.1, §9.3): remove a duplicator whose other side is erased. Taelin's assessment *(H.53)*: Asperti, BOHM's author, "patched" this by using "safe nodes", which "works well in practice" but is "more of a workaround that doesn't work in all cases". The rule is unsafe in general because a SUP with the same label elsewhere may still need the DUP.
2. **Unordered duplications.** The essay's key observation, in its own heading: "Thunks are Unordered DUP Nodes". If the runtime may permute a DUP's two outputs, a chain of duplications collapses into one shared value that every reader reaches in O(1): this is a Haskell thunk inside an interaction system. Taelin implemented it experimentally in HVM3 and reports, for `X + 12345 = 1000000` *(H.53)*:

   > "The program above correctly outputs `987655` in just `24m` interactions, showing it is clearly linear on the length of the Nat (which is `1m`)."

3. **The price.** Duplicating a λ with an unordered DUP can swap the bodies of the two copies, and the essay notes that unordered nodes "might break strong confluence". HVM4 at HEAD has **no** unordered superpositions (the word does not occur in its source or docs); the measurement above is what HEAD does.

### 9.4a Effects: where a confluent net meets the world

A pure net can be reduced in any order (§2.2), but printing, reading input or sending a message must happen in a fixed order. Marvin Borner's thesis *Optimal Interaction with the Real World* (Tübingen, 2025, *M.6*) is a dedicated study of this tension. Its reconstruction of HVM2's IO (from HVM2's source, §2.1 of the thesis) is the clearest description available:

1. reduce the whole net to normal form;
2. read the result back as a Church tuple carrying a tag, a magic number, the name of an effectful function, its arguments and a continuation;
3. if it is an IO call, run the named host function and apply the continuation to its result; repeat.

The thesis's assessment: this keeps the parallel reduction intact, but no effect can run in parallel with pure reduction or with another effect, and the source language must be written in continuation (monadic) style, as in Bend. The thesis then proposes token-passing semantics to sequence effects inside an otherwise unordered net. **HVM4 at HEAD has no IO at all:** none of its 45 tags is an effect, and the only file operation in `src/hvm.c` loads the program.

### 9.5 Parallelism: what locality gives and what it does not

From §2.2: all active pairs present at one moment are disjoint, so a machine can fire them all at once, in any order, with the same total count. That is a real theorem and the foundation of HVM2's parallel GPU runtime (the engine behind the first Bend). Two limits:

1. **Speedup needs many simultaneous redexes.** A program whose net exposes one active pair at a time (a sequential fold, bubble sort) gains nothing. Programs whose nets fan out (tree merges, independent recursive calls) can.
2. **HVM4 at HEAD is sequential** (`--help`: "A sequential Interaction Calculus runtime"). The March 2026 tree had a multi-threaded collapse and the CUDA experiment reported tens of billions of interactions per second on the authors' benchmarks (§8.8); neither is at HEAD.

**Trees, not lists.** Parallelism in a net is a property of its dependency shape, and the cleanest way to see it is to separate **work** (total interactions) from **span** (the longest chain of interactions that must happen one after another). Summing n ones on HVM4 HEAD, measured with `-s`:

<!-- widget: chart table=next -->

| n | list fold `@lsum` | balanced tree `@tsum` |
|---|---|---|
| 16 | 81 | 107 |
| 256 | 1,281 | 1,787 |
| 4,096 | 20,481 | 28,667 |

Both are linear (exactly 5n + 1 and 7n − 5): the tree does **more** work, not less. What differs is the span. In the list fold every addition waits for the result of the rest of the list, a chain of n dependent steps; in the tree the two halves share no wire, so the chain is only as long as the tree is deep, about log₂ n. On a sequential machine like HVM4 HEAD the tree is simply 40% more expensive; on a parallel interaction machine (HVM2, M.1) it is the version that can use many cores. That is the practical rule behind "use balanced trees, not lists" in the Bend lineage.

The locality argument is also why affinity matters. From the IC README *(H.33)*:

> "Finally, being fully affine makes its garbage collector very efficient, and greatly simplifies parallelism."

### 9.5a Where nets come from: proof nets, linear logic, the geometry of interaction

Interaction nets were not invented for evaluators. Mazza's introduction *(M.4, §1)*:

> "Based on graph-rewriting, they can be seen as a generalization of multiplicative linear logic proof-nets"

In a proof net a **cut** connects a proof of A with a proof of its dual A⊥, and cut elimination rewrites it locally: the cut is the active pair, cut elimination is interaction. Linear logic's exponential `!A`, "A may be used many times", is what a duplicator implements. Asperti made that precise for optimal reduction: his 1993 paper relates the two kinds of bracket nodes of the Gonthier–Abadi–Lévy presentation of Lamping's algorithm to the two operations of the comonad `!` *(Appendix F)*.

The third root is Girard's **geometry of interaction** (GoI), a semantics that describes the *execution* of a proof as paths through its graph rather than only its result. Interaction nets "have been shown to be the "true" syntax underlying Girard's Geometry of Interaction" *(M.4, §1)*; Gonthier, Abadi and Lévy's paper "The Geometry of Optimal Lambda-Reduction" (1992) used GoI to explain Lamping's algorithm *(M.5)*. For the combinators the link is a theorem (Lafont 1997, as stated by Mazza, *M.4* Theorem 4.7): a net is interpreted as a matrix-like operator, and the interpretation of its normal form is computed by Girard's **execution formula**, a geometric series that sums the paths through the net's active pairs. The formula is an invariant of reduction, so a net and its normal form have the same GoI meaning, which is confluence seen from the semantic side.

None of this is needed to write HVM programs. It explains two things the rest of the book uses: why the six rules are confluent and local (they come from cut elimination), and why the duplicator, `!`, is the one place where cost and correctness become hard (Parts 5 and 9).

### 9.6 A claim-class table

Use this table whenever you read a sentence about these systems:

| Claim | Class | Status |
|---|---|---|
| Interaction-net reduction is strongly confluent; counts are scheduler-independent | theorem | proved (Lafont) |
| The interaction combinators can encode any interaction system | theorem | proved (Lafont 1997) |
| HVM reduces admissible terms with the minimal number of β-steps | theorem + definition | in Lévy's sense; "admissible" carries the weight |
| n parallel β-steps of any Lévy-optimal implementation can take non-elementary time | theorem | Asperti–Mairson 1998 |
| Duplications alone are already non-elementary; EAL-typable terms need only simple fan labels | theorem | Asperti–Coppola–Martini 2004 (via M.5) |
| HVM's interactions for `X = n` by superposition grow quadratically | measurement | §9.4, HEAD `6defdfc` |
| The symmetric combinators are universal for every interaction system | **false as stated** | universal for *polarized* systems (Mazza, M.4) |
| "Sharing computations inside lambdas, which GHC can't" | mechanism + claim | the mechanism is real (§7.5); "can't" is about GHC's semantics, not every program |
| "Some computations exponentially faster" | measurement on chosen families | true for specific programs; never in general |
| HVM4 at HEAD runs N G interactions/s | measurement | HEAD is sequential; throughput claims refer to specific runtimes and benchmarks |
| Bend 2 runs on interaction nets | **false for the released compiler** | BendRT is a flat evaluator (Part 10) |

### What to remember from Part 9

- Lévy-optimal = each redex family reduced once; it counts **β-steps**, not total work.
- Lamping = abstract algorithm (Parts 3–5) + oracle (control nodes). Labels are a cheap, static, incomplete oracle.
- Two reasons optimality was abandoned: Asperti–Mairson's non-elementary bound, and slow graph implementations. Asperti–Coppola–Martini locate the blow-up in duplication itself and show that simple fan labels suffice for EAL-typable terms; HVM uses labels and a term machine.
- The quadratic slowdown is measurable on HVM4 (`X = n`: ×3.9 per doubling, dominated by DUP-NOD); safe nodes and unordered duplications are the known remedies, neither at HEAD.
- Effects need an order that a confluent net does not have; HVM2 ran them between full normalizations, HVM4 HEAD has none.
- Locality gives scheduler-independent counts and free parallelism; speedup needs many simultaneous redexes; HVM4 HEAD is sequential.

### Exercises — Part 9

**E9.1 ★** What does "optimal in Lévy's sense" measure, and what does it ignore?

<details><summary>Solution</summary>

It measures the number of β-reductions (one per redex family). It ignores the cost of duplication, erasure and oracle bookkeeping, and wall-clock time.
</details>

**E9.2 ★★** Why is the label discipline called a "static oracle", and when does it fail?

<details><summary>Solution</summary>

1. Lamping's oracle decides at run time whether two meeting fans are partners. Labels decide it ahead of time: equal labels are partners, different labels are not.
2. It fails when two fans with equal labels meet without being partners, which happens when a fan duplicates a term containing a fan of the same label (`@c2(@c2)`, §5.6).
</details>

**E9.3 ★★** Classify: (a) "HVM computes the normal form of every λ-term with the minimal number of β-steps." (b) "Interaction counts are the same under any scheduler." (c) "Superposition makes SAT polynomial."

<details><summary>Solution</summary>

1. (a) **False as stated**: only admissible terms; Lévy's measure only.
2. (b) **Theorem** (strong confluence).
3. (c) **False**: sharing can help on structured instances, but 2ⁿ distinct sub-computations still cost 2ⁿ.
</details>

**E9.4 ★★** A program's net always has exactly one active pair until normal form. How much can a parallel interaction machine speed it up?

<details><summary>Solution</summary>

Not at all: each step creates at most the next active pair; there is never more than one rewrite to do. The theorem guarantees *safety* of parallelism, not its availability.
</details>

**E9.5 ★★★** Explain how Asperti–Mairson's result and Taelin's "quadratically slower than GHC" report are related but different.

<details><summary>Solution</summary>

1. Asperti–Mairson: the total work of n parallel β-steps can be non-elementary in n for any Lévy-optimal implementation; Asperti–Coppola–Martini later showed the duplications alone already are.
2. The HVM report: a concrete program where *redundant duplication nodes* accumulate, making HVM's total interactions grow quadratically where GHC's work is linear.
3. Both say "β-optimal is not work-optimal". The first is a worst-case theorem about every optimal implementation; the second is an avoidable overhead of a particular implementation, on a specific family of programs (§9.4 measures it on HVM4).
</details>

**E9.9 ★★** In the §9.5 table the balanced tree costs 7n − 5 interactions and the list fold 5n + 1. Why can the tree still be faster on a parallel interaction machine?

<details><summary>Solution</summary>

1. Interactions measure work; wall-clock on many cores is bounded by the span, the longest chain of dependent interactions.
2. In the list fold each addition needs the sum of the rest: a chain of n steps.
3. In the tree, the two subtrees share no wire, so their active pairs can fire at the same time; the chain is about log₂ n levels.
4. With p cores the tree needs roughly work/p + span time, the list roughly n whatever p is. On HVM4 HEAD (sequential) only work counts, and the tree is slower.
</details>

**E9.10 ★★** Match each linear-logic notion to its interaction-net counterpart: cut, cut elimination, `!A`, normal form of a proof.

<details><summary>Solution</summary>

1. Cut → an active pair (two principal ports wired together).
2. Cut elimination → interaction (local rewriting of the pair).
3. `!A` (reusable resource) → what duplicators implement; copying and erasing are explicit cells.
4. Cut-free proof → cut-free net: no active pair and no vicious circle (§2.4).
</details>

**E9.6 ★★** From the §9.4 table, estimate the interactions for n = 512 and explain in one sentence why the control `@eq(@N, @N)` is linear.

<details><summary>Solution</summary>

1. The ratio is approaching 4, so about 4 × 498,576 ≈ **2.0 million**.
2. The control has no superposition: there is no duplicator chain for each `#S` layer to pass through, so each layer costs a constant number of interactions (1,538 for n = 256, about 6 per layer).
</details>

**E9.7 ★★★** Why is "delete a duplicator whose other output is erased" unsafe in general, and what does BOHM's "safe" flag certify?

<details><summary>Solution</summary>

1. A duplicator with label L may still be the partner of a superposition with label L somewhere else in the net; deleting it would make that SUP later meet the wrong DUP (or none), changing the result.
2. A safe fan is one that can never pair with another fan, so no partner exists and removing it cannot change any later interaction. BOHM 1.1 marks such fans and collects them early.
</details>

**E9.8 ★★** Strong confluence says the order of interactions is unobservable. Why does that make IO hard, and how did HVM2 avoid the problem?

<details><summary>Solution</summary>

1. Effects are observable in their order (print A then B differs from B then A); a system whose rules may fire in any order cannot express that order by itself.
2. HVM2 reduced the net to normal form, read the result back as a request (function name, arguments, continuation), ran the effect outside the net, and continued with the result: effects happen *between* normalizations, one at a time.
3. The cost: no effect runs in parallel with reduction or with another effect, and programs are written in continuation or monadic style.
</details>

---

## 10 · The lineage: HVM1 → HVM4, Bend 2, BendRT, HVM5

### 10.1 The runtimes

| Runtime | Character | Notes |
|---|---|---|
| **HVM1** (HigherOrderCO/HVM) | lazy IC runtime in Rust, Haskell-like surface language | "HVM: how it works" *(H.46)* explains its memory format |
| **HVM2** | strict, massively parallel (CPU threads, CUDA) interaction-net runtime | the backend of the first Bend (2024) |
| **HVM3** | consolidation: lazy evaluation and labels again | Haskell/C *(H.29)* |
| **HVM4** (this book's machine) | the IC with labeled DUP/SUP, numbers, constructors, matching, collapse | HEAD: one sequential C file (Part 8) |

### 10.2 Bend 2 and BendRT: the nets are not in the released compiler

This book is about interaction nets, so one paragraph settles Bend 2: **its runtime does not use them.** The BendRT paper *(M.2)* says so in its introduction, "Readers of the author's earlier runtimes may expect interaction nets [7, 13] here; there are none", and states the trade in its related-work section:

> "BendRT keeps the goals and drops the mechanism: affinity gives unique ownership directly, so the graph and its duplication machinery become unnecessary. Lost is optimal reduction of shared redexes; gained are native-speed sequential code, flat memory and a cost model a programmer can read."

(The paper discloses that it "was written by Claude Fable 5.1 from the author's code and design notes, and reviewed by the author", so treat its wording as the authors' reviewed statement, not as Taelin's own prose.) That is the clearest statement of the whole lineage's central trade-off: **optimal sharing versus predictable native speed**. HVM keeps the first; BendRT chose the second. Released Bend 2 has no `sup`, no DUP-LAM and no SupGen; the language itself (affine dependent types, laws and proofs, targets) is documented in the compendium, Part A and papers M.2–M.3, and is outside the scope of this book.

### 10.3 HVM5 in this workspace: what it is

HVM5 is a design and prototype in `bend-runtime/hvm5/`, in two versions. Its thesis, from the v2 README *(G.51)*:

> "Code is an immutable, content-addressed book of interaction-calculus terms."

and the three operations that follow from it:

> "forking a running program is one `DUP` node (O(1));"

> "testing a candidate against the live version runs both in one reduction, superposed with `&T{old, new}`, and shares every step before the first changed definition;"

> "merging is a three-way merge of definition hashes, followed by an atomic epoch swap."

### 10.4 Homoiconicity, concretely

"Code as data" here means four precise things:

1. **A program is a book**: a map `Name → DefHash`, where each definition is an IC term identified by the hash of its contents. Two books that share a definition share its hash and its storage.
2. **A running instance is `(book, state, epoch)`**: the immutable book plus a heap of live state.
3. **Fork = duplicate the state**: `!&F{live, shadow} = state`. One DUP node; copying happens lazily, only where one side rewrites — the incremental copy of Part 4, applied to a whole program.
4. **Test = superpose the book**: every definition whose hash changed becomes `@d = &T{@d_old, @d_new}`; unchanged definitions stay single. One reduction runs both versions, and everything computed before control reaches a changed definition is computed once.

The v2 review *(G.52, §C3)* insists on the precision of the sharing claim:

> "Two *independently written* code paths that happen to compute the same thing are not shared. Report the measured `sharedRatio`, never a promised one."

### 10.5 HVM5 status, honestly

From the v2 README's status table (dated 2026-10-23, *G.51*; re-read the file for later updates):

| Milestone | Status in the README |
|---|---|
| M1 IC kernel | "done (sequential)"; `tests/kernel_rules.bend` 28/28; "K2 Church c2·c2 = c4; K3 shown (same label gives 1, not 4)" |
| M2 compiler | "done for the fragment" |
| M3 code as data | "done on one island"; `tests/e2e_vault.bend` PASS |
| M4 membrane (capabilities) | "checks, untested" |
| M5 islands | in-process mesh done; "TCP not started" |

v1 is explicitly **superseded**. Its own README *(G.2)*:

> "Its reducer is a name-substitution tree evaluator (not an inet), and its fork, hashing and partition models are corrected in"

and the v2 review *(G.52)* grades v1's reducer **"F as an inet"** and lists what to stop claiming, including:

> "Bend 2 compiles to interaction nets." Upstream it does not.

> "Fork = DUP, merge = SUP collapse." Fork is `DUP` of state, test is `SUP` of books, merge is CAS.

Note K3: the HVM5 kernel reproduces the same-label accident of §5.6 as a deliberate test. Two kernels, the same lesson.

### What to remember from Part 10

- HVM1 lazy → HVM2 parallel/strict (first Bend) → HVM3 → **HVM4** (IC + labels + collapse; HEAD sequential, single file).
- **BendRT is not a net reducer**: it keeps affinity and drops the graph, trading optimal sharing for native speed; released Bend 2 has no `sup`.
- HVM5 v2: code = content-addressed book; **fork = one DUP of state; test = SUP of books; merge = 3-way merge + CAS**. Kernel done sequentially; capabilities untested; networking not started.

### Exercises — Part 10

**E10.1 ★** Which runtime ran the first Bend's programs, and is it a net reducer?

<details><summary>Solution</summary>HVM2, a strict parallel interaction-net runtime: yes. Released Bend 2 runs on BendRT, which is not.</details>

**E10.2 ★★** Why is "fork = SUP on the live root" wrong, according to the HVM5 review, and what replaces it?

<details><summary>Solution</summary>

1. Superposing the live root makes every live message run in two worlds, and the live answer then depends on a collapse policy: the program is no longer one program.
2. Replacement: fork = one **DUP** of the state (two independent instances, sharing until they diverge); testing = **SUP of books**, run deliberately on a test input.
</details>

**E10.3 ★★** In superposed testing, a request reaches a changed definition after 1,000 interactions and then runs 200 more on each side. Roughly how much work does the superposed run cost versus two separate runs?

<details><summary>Solution</summary>

1. Separate: 2 × (1000 + 200) = 2400.
2. Superposed: 1000 shared + 2 × 200 + the overhead of the superposition (APP-SUP/DUP-SUP bookkeeping) ≈ 1400 + overhead.
3. The saving is the common prefix only; report the measured shared ratio (≈ 1000/2400 here).
</details>

**E10.4 ★★** What does "content-addressed book" buy for merging, and what does it not decide?

<details><summary>Solution</summary>

1. A three-way merge compares definition *hashes*: a definition changed on one side only is taken; unchanged definitions are identical by hash; conflicts are definitions changed differently on both sides.
2. It does not decide *semantic* compatibility of the state with the new code: that is the optional `migrate` step, and conflicting definitions still need a human or an application rule.
</details>

**E10.5 ★★★** Explain why HVM5's K3 test and HVM4's `@c2(@c2)` show the same phenomenon although the two kernels are independent programs.

<details><summary>Solution</summary>

Both implement the Interaction Calculus with labels, and the phenomenon is a property of the calculus: when a duplication with label L copies a term containing a duplication with label L, the two fans annihilate instead of commuting. Any faithful implementation must reproduce it; a kernel that "fixed" it would not be implementing IC.
</details>

---

## 11 · Victor Taelin's insights, verbatim

Every quote below is copied exactly from the file named; the compendium id points to the full text. Paraphrase is marked as such.

**I-1 · Substitution is the problem.** *(H.42, `victor/hoc-optimal-computer.md`)*
> "The fundamental operation of the Lambda Calculus, substitution, may trigger an unbounded amount of copies of an unboundedly large argument."

*Meaning:* the cost of β is not a constant. *Mechanism:* the interaction rules split it into bounded steps (Part 3). *Class:* argument.

**I-2 · Two laws.** *(H.42)*
> "on which substitution is broken down into 2 fundamental laws: commutation, which creates and copies information, and annihilation, which observes and destroys information."

*Mechanism:* γδ commutation (§3.6) vs the annihilations (§3.2–3.4). *Class:* characterization of Lafont's combinators.

**I-3 · Why not SKI.** *(H.42)*
> "SKI combinators still include non-atomic operations: K may erase an unboundedly large structure, and S may copy an unboundedly large structure."

*Mechanism:* compare with erasure (one cell per interaction, §3.5) and copying (one layer per interaction, §3.6). *Class:* argument.

**I-4 · Copy incrementally.** *(H.43, `victor/hvm-10min.md`)*
> "Fortunately, it turns out there IS a proper way to do it: just **copy incrementally**."

*Mechanism:* DUP-LAM / DUP-NOD one layer at a time; the copier waits at a redex (§4.5, §7.5). *Class:* the core idea.

**I-5 · Linear like Rust, lazy clone like Haskell.** *(H.46, `victor/hvm-how.md`)*
> "HVM doesn't need a global, stop-the-world garbage collector because every "object" only exists in one place, **exactly like in Rust**; i.e., HVM is *linear*."

*Mechanism:* affine variables; a value with one reference can be freed or reused when consumed. *Class:* design claim.

**I-6 · Cloning is layer by layer.** *(H.46)*
> "This makes cloning essentially free, because the copy of any object isn't made in a single, expensive pass, but in a layer-by-layer, on-demand fashion."

*Caveat (ours):* "essentially free" means "pay only for the layers that are demanded", not zero cost (§7.5: 11 vs 8).

**I-7 · Sharing inside lambdas.** *(H.46)*
> "it is capable of **sharing computations inside lambdas, which GHC can't**."

*Mechanism:* the showpiece's single `OP2-NUM-NUM` (§7.5). *Class:* mechanism plus a comparison with GHC's semantics.

**I-8 · The bottleneck was the graph, not the idea.** *(H.46)*
> "all implementations of this algorithm, until now, represented terms as graphs. This demanded a lot of pointer indirection, making it slow in practice."

*Mechanism:* HVM's 64-bit term words and linked variables (Part 8). *Class:* engineering claim.

**I-9 · The IC in three lines.** *(H.33, Interaction-Calculus README)*
> "1. Vars are affine: they can only occur up to one time."
>
> "2. Vars are global: they can occur anywhere in the program."

*Mechanism:* global scope is what DUP-LAM's escaping variable needs (§5.3). *Class:* definition.

**I-10 · What global lambdas buy.** *(H.33)*
> "Global lambdas allow the IC to express concepts that aren't possible on the traditional λC, including continuations, linear HOAS, and mutable references."

*Mechanism:* HVM4's unscoped binders (tag UNS, the `unscoped_*` tests). *Class:* expressiveness claim.

**I-11 · Affinity and parallelism.** *(H.33)*
> "Finally, being fully affine makes its garbage collector very efficient, and greatly simplifies parallelism."

**I-12 · The day optimal reduction was miraculous.** *(H.41, `victor/hoc-history.md`)*
> "It was miraculously fast. Impossibly so."

*Context:* his first implementation of Lamping's algorithm (Optlam) and the Stack Overflow question that followed. *Class:* anecdote.

**I-13 · The two reasons.** *(H.41)*
> "1. A *negative result* that was misinterpreted by researchers back then"
>
> "2. The theoretical optimality didn't translate to real-world performance"

*Mechanism:* Part 9.3. *Class:* historical diagnosis (his reading of the literature).

**I-14 · Optimal, in Lévy's sense, and its gap.** *(H.53, `victor/hvm-unordered-sup.md`)*
> "HVM is an optimal λ-calculus evaluator in Lévy's sense: given an admissible λ-term, it computes its normal form with the minimal number of β-reductions."

> "The culprit is the accumulation of "redundant" control nodes or duplication nodes in some cases."

*Class:* theorem-backed claim, plus an acknowledged limitation.

**I-15 · Search with superpositions.** *(H.50, `victor/hvm-search1.md`)*
> "On HVM, instead of trying each candidate separately, we can create a superposition of all possible functions."

*Mechanism:* §6.4. *Class:* method; the synthesizer built on it (SupGen) is not public.

### 11.1 Where to read Taelin first

| Source | Where | Why |
|---|---|---|
| Interaction-Calculus README | `github.com/VictorTaelin/Interaction-Calculus` · *H.33* | the calculus, its rules, worked examples |
| "Towards an optimal computer" | *H.42* | the manifesto: why interaction combinators |
| "HVM: how it works" | *H.46* | memory format, lazy clone, sharing inside lambdas |
| "Optimal evaluation in 10 minutes" | *H.43* | the incremental-copy argument from first principles |
| HOC history | *H.41* | Optlam, Lamping's two halves, why the field stalled |
| "Truly optimal evaluation with unordered superpositions" | *H.53* | the limits of Lévy optimality |
| Program search posts | *H.50, H.51* | superposition as search |
| HVM4 repository | `github.com/HigherOrderCO/HVM4` · *L.1–L.8* | the current machine and its docs |
| Bend | `github.com/bendlang/bend` · *H.1–H.4* | the language today |

### Exercises — Part 11

**E11.1 ★** Which of I-1…I-15 is a theorem, which an anecdote, which a design claim? Name one of each.

<details><summary>Solution</summary>Theorem-backed: I-14 (Lévy-optimality for admissible terms). Anecdote: I-12. Design claim: I-5 or I-8.</details>

**E11.2 ★★** I-6 says cloning is "essentially free". Give a measured counterexample from this book and state the correct reading.

<details><summary>Solution</summary>

§7.5: sharing one partial application costs 11 interactions, calling twice costs 8. Correct reading: cloning costs work proportional to the layers actually demanded, never a full upfront copy; on large shared work this is a large saving, on tiny examples it is overhead.
</details>

**E11.3 ★★** Connect I-9's "Vars are global" to a specific line of an HVM4 trace in this book.

<details><summary>Solution</summary>

§4.4/§5.3: after DUP-LAM, `λa.A₀ … !A&A=@{&A{a,b}}` — the variables `a` and `b` of the two new lambdas appear *outside* their lambdas, inside a duplication elsewhere in the term. Lexical scoping cannot express that intermediate state; global variables can.
</details>
