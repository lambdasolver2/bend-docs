
---

## 8B · How HVM4 is built, and why

Part 8 described *what* is in `src/hvm.c`. This part explains *why* each piece is shaped the way it is. Most of the reasons are lessons learned the hard way in earlier runtimes, and the authors wrote them down: in Taelin's "HVM: how it works" *(H.46)*, in the HVM2 paper *(M.1)*, in HVM4's own memory and theory docs *(L.4, L.6)*, and in the git history. Every design decision below is paired with the source that motivates it and the code that implements it (`src/hvm.c` at `6defdfc`).

### 8B.0 The journey, in Taelin's words

When HVM was first announced (February 2022), a Hacker News reader asked why the authors of the optimal-reduction book never made it fast, and what led to HVM's memory layout. Taelin (account `LightMachine`) answered with the shortest account of how HVM was designed that exists *(M.7)*:

> "A naive implementation just stores graphs/edges on memory, but most of these edges are redundant. For example, a lambda doesn't need to point to its parent."

> "By trying to turn the graph in a tree, I've ended up with SIC"

> "Doing so was tricky, specially because 1. the missing edges complicated the transversal; 2. some upward edges can't disappear (variables); 3. DUP nodes aren't part of expressions, they just "float", which was counter intuitive to get right. Finally, I learned to appreciate the fact that global rewrite rules are better than case-trees for recursive functions, since they greatly reduce the total rewrite count."

> "1. Learn the abstract algorithm"
>
> "2. Implement it naively as a graph"
>
> "3. Optimize it by making trees whenever possible"
>
> "4. Favor rewrite equations over case-trees"
>
> "These steps lead to the design of HVM, which does fairly well in practice."

Each of the three "tricky" points is still visible in HVM4 at HEAD, and the rest of this part explains them:

| Taelin's 2022 point | HVM4 at HEAD |
|---|---|
| remove redundant edges; a λ needs no parent pointer | nodes are headerless words, pointers go one way (§8B.4) |
| variables are the upward edges that cannot disappear | a VAR points at its binder's slot; β writes there with the SUB bit (§8B.4) |
| DUP nodes "float", outside the expression tree | a DUP node is a shared slot with no parent, read by DP0/DP1 (§8B.5) |
| global rewrite equations over case trees | definitions live in an immutable book and are instantiated lazily (§8B.6) |

### 8B.1 The problem: clones

Taelin frames the whole design around one word *(H.46)*:

> "By clones, I mean when a value is copied, shared, replicated, or whatever else you call it."

Strict evaluation wastes work on unused arguments; lazy evaluation wastes work by cloning unevaluated expressions. Every mainstream language answers with **references**: Haskell's thunks, Rust's borrows, mutexes in parallel code. His diagnosis:

> "References. **They** ruin everything."

> "They're the reason Haskell isn't optimal, since thunks can't share computations that have free variables (i.e., any expression inside lambdas)."

and his answer, the design principle of HVM1 through HVM4:

> "Clones aren't bad. They just need to relax."

> "**HVM's runtime has no references. Instead, it features a `.clone()` primitive that has zero cost, until the cloned value needs to be read."

That primitive is the DUP of Part 5. Everything else in the machine exists to make it cheap.

### 8B.2 Lesson 1 (HVM2): one kind of duplicator is not enough

HVM2 was a faithful, massively parallel implementation of interaction combinators with **one** duplicator kind. Its paper *(M.1, §13.1)* records what that cost:

> "A higher-order lambda that clones its variable can not be cloned."

Church 2² (`(λf.λx.(f (f x)) λf.λx.(f (f x)))`) "can not be soundly reduced by HVM2": exactly the clone-of-a-clone failure of §4.6. The paper lists two fixes. More duplicator kinds, or Lamping's bookkeeping nodes, and explains why the second was rejected:

> "Adding bookkeeping to HVM should be easy. Sadly, this has the consequence of bringing a constant-time overhead, decreasing performance by about 10x."

**Design consequence in HVM4: labels.** Every DUP and SUP carries a label in the EXT field of its word (24 bits, §8.2), so there are 2²⁴ duplicator kinds instead of one, and DUP-SUP compares two integers to decide between projection and commutation:

```c
fn Term wnf_dup_sup(u32 lab, u64 loc, u8 side, Term sup) {   // src/hvm.c:3923
  ITRS_INC("DUP-SUP");
  u64 sup_loc = term_val(sup);
  u32 sup_lab = term_ext(sup);
  if (lab == sup_lab) {                         // same label: projection
    Term tm0 = heap_read(sup_loc + 0);
    Term tm1 = heap_read(sup_loc + 1);
    return heap_subst_cop(side, loc, tm0, tm1);
  } else {                                      // different labels: commute
    u64 base = heap_alloc(4);
    u64 at   = base;
    Copy A  = term_clone_at(sup_loc + 0, lab);
    Copy B  = term_clone_at(sup_loc + 1, lab);
    Term s0 = term_new_sup_at(at + 0, sup_lab, A.k0, B.k0);
    Term s1 = term_new_sup_at(at + 2, sup_lab, A.k1, B.k1);
    return heap_subst_cop(side, loc, s0, s1);
  }
}
```

That `if` is the whole "oracle" of HVM4: a constant-time comparison instead of Lamping's run-time bookkeeping. Its price is the incompleteness of §5.6: labels are only correct if the program (or the compiler, or the auto-dup sugar with fresh labels) assigns them correctly. The **dynamic labels** of HEAD (tags DSU/DDU, `&(lab){…}`, `!x&(lab) = …`) go one step further: the label is computed at run time, so a program can generate as many independent duplicator kinds as it needs, e.g. one per recursion depth.

### 8B.3 Lesson 2 (HVM2): eager evaluation cannot be lazy

HVM2 reduced every active pair it could find, in parallel. Its paper *(M.1, §13.2)*:

> "In our first implementation, HVM1, we used a lazy evaluation model. This not only ensured that no unnecessary work was done, but also allowed one to compute with infinite structures, like lists."

> "And if you do have an infinite structure, HVM2 will never halt (because the redex bag will never be empty)."

Laziness is not optional for this lineage. Collapse (§6.5's infinite `@X`), search by erasure and incremental copying all rely on reducing **only what is demanded**. The paper also names the obstacle to laziness on a parallel machine: it would require "uplinks" and "make the task scheduler way more complex to implement efficiently, specially in the GPU version."

**Design consequence in HVM4: a lazy, sequential, explicit-stack WNF machine.** `wnf` (`src/hvm.c:4722`) has two phases, written as labels with `goto`:

```c
__attribute__((hot)) fn Term wnf(Term term) {
  ...
  enter: {                                   // walk down to the head
    switch (term_tag(next)) {
      case VAR: {                            // a variable: substituted yet?
        u64 loc = term_val(next);
        Term cell = heap_read(loc);
        if (term_sub_get(cell)) { next = term_sub_set(cell, 0); goto enter; }
        whnf = next; goto apply;
      }
      case APP: {                            // an application: remember it, evaluate the function
        u64  loc = term_val(next);
        Term fun = heap_read(loc);
        stack[s_pos++] = next;
        next = fun;
        goto enter;
      }
      ...
  apply: {                                   // pop frames, fire the interaction
    while (s_pos > base) {
      Term frame = stack[--s_pos];
      switch (term_tag(frame)) {
        case APP: {
          ...
          switch (term_tag(whnf)) {
            case LAM: { next = wnf_app_lam(whnf, arg); goto enter; }
            ...
```

- **enter** walks to the head of the term, pushing every eliminator it passes (APP, the side of a DUP, MAT, OP2, …) on an explicit stack. Nothing below the head is touched: that is laziness.
- **apply** pops a frame and dispatches on the pair *(frame tag, value tag)*. This is the active pair of the net model: the eliminator on the stack and the value it now faces. Each pair calls one `wnf_*` function and returns into `enter` with the result.

The explicit stack (not C recursion) means deep terms do not overflow the C stack, and the loop can stop at any interaction (`STEPS_ITRS_LIM`, used by `-D`) and **rebuild** the partially reduced term (`wnf_rebuild`) for printing. That is how `-D` can print the whole term after every step.

What the lazy machine gives up: parallelism. HEAD's `--help` says "A sequential Interaction Calculus runtime". The net model's free parallelism (§2.2) is still true of the calculus, but this machine does not exploit it.

### 8B.4 Lesson 3: graphs are slow; words are fast

From the start of the lineage *(H.46)*:

> "all implementations of this algorithm, until now, represented terms as graphs. This demanded a lot of pointer indirection, making it slow in practice."

**Design consequence: nodes are consecutive heap words, and pointers go one way.** The memory table *(L.6)*: an APP node is two words `[func, arg]`, a LAM node one word `[body]`, a SUP two words `[tm0, tm1]`, a DUP term `[expr, body]`. The term word pointing at a node carries the tag and label; the node itself carries no header. A port graph needs back-pointers for every wire; HVM4 needs none, because each variable occurs at most once (affinity) and points **to its binder**.

**Linked variables and the SUB bit.** A VAR's VAL is the location of its lambda's body slot. β is then a single write *(L.6)*:

> "When a linked binder interacts (APP-LAM, DUP-*), its body or expr slot is replaced by a substitution term with the SUB bit set. Any VAR/DP0/DP1 that points to that heap location must read the substitution instead of the original binder. This is how linked variables resolve their binders without extra maps."

```c
fn Term wnf_app_lam(Term lam, Term arg) {     // src/hvm.c:3732
  ITRS_INC("APP-LAM");
  u64  loc     = term_val(lam);
  u32  lam_ext = term_ext(lam);
  Term body    = heap_read(loc);              // the body is the result
  if (lam_ext & LAM_ERA_MASK) {
    return body;                              // unused variable: drop the argument
  }
  heap_subst_var(loc, arg);                   // the variable will now find the argument here
  return body;
}

fn void heap_subst_var(u64 loc, Term val) {   // src/hvm.c:704
  heap_set(loc, term_sub_set(val, 1));
}
```

Read it against §4.1: "var↔arg" is `heap_subst_var(loc, arg)` (the binder's slot now holds the argument, flagged SUB); "body↔result" is `return body`. Constant work, no traversal of the body, no environment, no map from names to values. An unused variable is a flag on the lambda (`LAM_ERA_MASK`), so the ε cell of §4.2 costs nothing at all, which is why the C2 capstone found no erasure step.

### 8B.5 A duplication is one shared slot

A DUP node is the most delicate structure in the machine *(L.6)*:

> "A DUP node is the shared expr slot that DP0/DP1 point to; it has no body and no parent, and it is substituted when a duplication interaction occurs."

Both sides of a duplication (`x₀` = DP0, `x₁` = DP1) point at the **same** heap word. Whichever side is forced first runs the interaction and gets its copy; the other copy is parked in the shared slot with the SUB bit, waiting:

```c
fn Term heap_subst_cop(u8 side, u64 loc, Term r0, Term r1) {   // src/hvm.c:712
  heap_set(loc, term_sub_set(side == 0 ? r1 : r0, 1));        // park the twin's copy
  return side == 0 ? r0 : r1;                                  // hand back mine
}
```

and the WNF machine, meeting a DP0/DP1, first checks whether its twin already left the copy there:

```c
      case DP0:
      case DP1: {
        u64 loc = term_val(next);
        Term cell = heap_take(loc);
        if (term_sub_get(cell)) {            // the twin already duplicated: take the parked copy
          next = term_sub_set(cell, 0);
          goto enter;
        }
        stack[s_pos++] = next;               // otherwise: evaluate the shared value first
        next = cell;
        goto enter;
      }
```

This is "copy incrementally" in its final form. One shared word, two readers; the first reader does one layer of copying (DUP-LAM, DUP-SUP, DUP-NOD) and leaves the other reader's layer behind; the children of that layer get new duplications with the same label (`term_clone_at(…, lab)`), which will be forced only if someone reads them. Notice the line `stack[s_pos++] = next; next = cell;`: when a copier finds a redex in the shared slot, it **evaluates the redex first**, in place, and only then copies the result. That is §4.5 and the single `OP2-NUM-NUM` of §7.5, in two lines of C.

### 8B.6 The book: immutable definitions, lazy instances

A definition `@f = …` is parsed once into the **book**, an immutable array indexed by name (`BOOK[nam]`, at most 2²⁴ names), with variables as de Bruijn levels. Calling `@f` never copies the whole definition:

```c
      case REF: {
        u32 nam = term_ext(next);
        if (BOOK[nam] != 0) {
          next = term_new_alo(0, 0, BOOK[nam]);   // a lazy instance with an empty bind list
          goto enter;
        }
        ...
```

An **ALO** term points at the book term plus a list of bindings, and is expanded **one layer** each time the evaluator looks at it (sheets `alo_lam`, `alo_dup`, `alo_nod`, `alo_var`, …). The memory doc states the reason *(L.6)*:

> "This keeps static definitions compact while still allowing dynamic sharing during execution."

Why have references at all, if the combinators are Turing-complete? Not because pure combinators cannot express recursion: the HVM2 paper says commutation "can be used to clone data and to perform loops and recursion, although these are preferably done via calls" *(M.1, §4.5)*. The reason is cost: expanding a REF copies a whole definition in one pass, whereas duplicator nodes would copy it one layer per interaction *(M.1, §4.2)*. It also fixes an HVM2 problem: HVM2's eager unfolding of recursive definitions forced programmers to split functions so that a REF would stop the recursion *(M.1, §13.2)*. With ALO, a recursive call is just a lazy instance; it unfolds only if its value is demanded.

### 8B.7 Memory: a bump allocator and no collector

```c
fn u64 heap_alloc(u64 size) {                 // src/hvm.c:317
  u64 at   = HEAP_NEXT;
  u64 next = at + size;
  if (__builtin_expect(next <= HEAP_CAP && next >= at, 1)) {
    HEAP_NEXT = next;
    return at;
  }
  fprintf(stderr, "Out of heap memory (need %llu words)\n", (unsigned long long)size);
  exit(1);
}
```

The heap is one anonymous `mmap` of `HEAP_CAP = 2³²` words (the VAL field's range), allocated by bumping a pointer; at HEAD nothing is ever freed. The history shows the trade-off being explored: a semi-space copying GC was added "for bounded memory on tail recursion" (`224670d`) and then removed from the pure runtime (`be02279`). Affinity is what makes this coherent: every node has exactly one reader, so there is no question of *when* it may be reclaimed; the current runtime simply chooses the fastest possible allocator and lets very long runs exhaust the heap. (BendRT, the Bend 2 runtime, uses the same ownership fact to emit explicit frees instead; that is the subject of its own paper, *M.2*, and not an interaction-net design.)

### 8B.8 Collapse: answers live inside terms

A superposition can sit anywhere inside a result, even under a lambda (§6.1). To print plain answers, CNF lifts the first SUP of a WNF term to the root, turning `C[&L{a,b}]` into `&L{C[a], C[b]}`, and the evaluator enumerates the branches with a priority queue *(L.8)*. Two design choices matter:

- **Breadth-first with priorities, not depth-first.** An infinite superposition (`@X`, §6.5) would trap a depth-first enumerator in its first infinite branch. A queue ordered by key, where SUP increases the key and INC lowers it, explores shallow alternatives first and lets programs steer the search. The newest commit (`6defdfc`) generalizes this ordering for search programs ("filter-credit scheduler").
- **Readback is work.** Converting the net-shaped normal form into a λ-term costs interactions (§8B.9). That is why `-C` counts can exceed the plain counts.

### 8B.9 A full machine trace: Church 2² in 14 interactions

`@c2 = λs. !S&C=s; λx. S₀(S₁(x))`, `@k2` the same with label K, `@main = @c2(@k2)`. Without `-C`, HVM4 reduces to normal form in **14 interactions**, the count HVM4's theory doc calls optimal *(L.4, §Church 2²)*. The rule sequence from `-D`, annotated:

| # | Rule | What happens |
|---|---|---|
| 1 | APP-LAM | `@c2` receives `@k2` as `s`; the outer duplication `!A&C = @k2` now holds the inner numeral |
| 2 | DUP-LAM | the C-copier meets `@k2`'s λ: two λ-copies, the inner variable becomes `&C{b,c}` |
| 3 | APP-LAM | the outer numeral's inner application fires: copy 1 is applied to `x` |
| 4 | DUP-LAM | the C-copier meets the inner numeral's second λ (`λx`) |
| 5 | DUP-SUP | C-copier meets a **K** superposition: different labels, **commute** (this is where `c2(c2)` would project and break) |
| 6 | APP-SUP | an application meets a C-superposition: distribute, duplicate the argument |
| 7 | DUP-SUP | C meets C: **project** |
| 8 | APP-LAM | β inside the copied numeral |
| 9 | DUP-LAM | K-copier copies a λ |
| 10 | APP-LAM | β |
| 11 | APP-SUP | distribute over a C-superposition |
| 12 | DUP-SUP | C meets C: project |
| 13 | DUP-SUP | C meets C: project |
| 14 | APP-LAM | the last β |

The result printed after step 14 is **not** a λ-term:

```text
λa.λb.A₀;!A&K=B₀(B₁(&K{A₁,b}));!B&K=a;
- Itrs: 14 interactions
```

It is the normal form *as a net*: two live K-duplications sharing `a` (the successor function) between four uses. That is what optimal sharing looks like when it is finished: the four applications of `a` in `4 = λa.λb.a(a(a(a b)))` are represented by **two** duplications, not four copies. Only `-C` reads it back to the λ-term, spending 6 more interactions (total 20). Normal forms in this calculus are graphs; λ-terms are their unfolding.

<!-- widget: trace src=traces/c2k2.txt -->

### 8B.10 One file, one thread

At HEAD the runtime is a single translation unit with no threads, no FFI and no AOT compiler (§8.8). The commit that made it so is titled "Refactor HVM runtime into pure single source" and carries no further rationale; this book does not invent one. The observable consequences:

1. The whole runtime can be read top to bottom in one file of about 6,400 lines, with the interaction rules and their sequent comments side by side.
2. `Itrs` is deterministic and identical across runs, and `-D` can print every step.
3. The net model's parallelism is a property of the calculus that this implementation does not use. The parallel engines of the lineage are HVM2 (interaction combinators on CPU and GPU, *M.1*) and the CUDA experiment that preceded the refactor (§8.8).

### What to remember from Part 8B

- **The problem is clones; the answer is a lazy clone primitive**, not references.
- **HVM2's lessons became HVM4's design:** one duplicator kind is unsound for higher-order sharing → **labels** (an integer compare instead of a 10× oracle); eager reduction cannot be lazy → a **lazy explicit-stack WNF machine**.
- **Words, not graphs:** nodes are consecutive heap words; variables point to their binder; β is one write with the SUB bit.
- **A DUP is one shared slot:** the first reader copies one layer and parks the twin's copy; a redex in the slot is evaluated before it is copied.
- **Book + ALO:** immutable definitions, lazily instantiated one layer at a time.
- **Memory:** a 2³²-word bump allocator, no collector at HEAD.
- **Normal forms are nets:** 2² finishes in 14 interactions with two live duplications; readback costs 6 more.

### Exercises — Part 8B

**E8B.9 ★★** Taelin's 2022 comment lists "some upward edges can't disappear (variables)". In HVM4's memory format, which pointer is that upward edge, and which interaction writes through it?

<details><summary>Solution</summary>

1. A linked VAR's VAL field is the heap location of its λ's body slot: a pointer from a leaf of the expression back up to its binder.
2. APP-LAM (`wnf_app_lam`) writes the argument into that slot with the SUB bit (`heap_subst_var`), so the variable finds its value by following its one upward pointer.
3. All other edges point downward and need no back-pointer, which is the "turn the graph into a tree" step.
</details>

**E8B.1 ★** Which single line of `wnf_dup_sup` decides between projection and commutation, and what does it cost?

<details><summary>Solution</summary>`if (lab == sup_lab)`: one integer comparison of two EXT fields. Lamping's oracle would need run-time bookkeeping nodes, estimated in the HVM2 paper at about a 10× slowdown.</details>

**E8B.2 ★★** Trace `heap_subst_cop` for `!x&A = &A{1,2}; [x₁, x₀]` when the list forces `x₁` first. What is written where, and what does `x₀` find later?

<details><summary>Solution</summary>

1. Forcing `x₁` (DP1, side 1) finds the shared slot holding `&A{1,2}`, not yet substituted: it pushes itself and evaluates the slot to a SUP; DUP-SUP with equal labels projects.
2. `heap_subst_cop(1, loc, 1, 2)` writes the **twin's** result `r0 = 1` into the slot with SUB, and returns `r1 = 2` to side 1.
3. Later `x₀` (DP0) reads the slot, sees the SUB bit, and takes `1` without any interaction.
4. Result `[2, 1]`, 1 interaction.
</details>

**E8B.3 ★★** Why can HVM4 store an unused λ-variable as a flag instead of an eraser node, and where is the flag tested?

<details><summary>Solution</summary>

1. An unused variable has no occurrence, so nobody will ever read the binder's slot; there is nothing to erase *to*.
2. The flag `LAM_ERA_MASK` in the lambda's EXT is tested in `wnf_app_lam`: if set, the argument is dropped (`return body`) without a substitution.
3. The argument itself is simply never referenced again; with a bump allocator there is no free either.
</details>

**E8B.4 ★★** HVM2's paper says a function written `foo = x => x == 0 ? 0 : 1 + foo(x-1)` hangs. Why, and why does the same function terminate on HVM4?

<details><summary>Solution</summary>

1. HVM2 reduces all redexes eagerly: the recursive call `foo(x-1)` is unfolded even in the branch that will be discarded, forever.
2. HVM4's WNF machine only reduces the head; a REF becomes a lazy ALO instance that is expanded only when its value is demanded, and the discarded branch is never demanded.
</details>

**E8B.5 ★★** In §8B.9, which step is the one where `@c2(@c2)` goes wrong, and what does it do instead?

<details><summary>Solution</summary>Step 5: the C-copier meets the inner numeral's superposition. With `@k2` its label is K, so they commute. With `@c2` it is C, so DUP-SUP takes the `lab == sup_lab` branch and **projects**, wiring the outer copies to the inner numeral's two uses. The rest of the reduction then computes the degenerate `λa.λb.a`.</details>

**E8B.6 ★★★** The 2² normal form `λa.λb.A₀;!A&K=B₀(B₁(&K{A₁,b}));!B&K=a;` contains two duplications. Read it back by hand to `λa.λb.a(a(a(a(b))))`.

<details><summary>Solution</summary>

1. The body is `A₀`, side 0 of `!A&K = B₀(B₁(&K{A₁,b}))`.
2. Side 0 of a duplication of an application is that application with its parts' side-0 copies: `B₀'(B₁'(&K{A₁,b})₀)` with B duplicated under K again. `B` duplicates `a`, so each `Bᵢ` reads as `a`.
3. `(&K{A₁,b})₀` under label K projects to `A₁`; `A₁` unfolds the same expression on side 1: `a(a(&K{A₁,b}₁))`, and `&K{A₁,b}₁` projects to `b`.
4. Altogether `A₀ = a(a(a(a(b))))`: four uses of `a` from two duplications. The collapser does exactly this, in 6 interactions.
</details>

**E8B.7 ★★** Why does a breadth-first, prioritized collapse matter for `@X = &Z{#Z{}, #S{@X}}` but not for `&A{1,2}`?

<details><summary>Solution</summary>`&A{1,2}` has two finite branches; any order prints both. `@X` has an infinite branch (`#S{@X}` unfolds forever); a depth-first enumerator could descend into it without end and never print the finite answer, while a priority queue that increases the key at each SUP visits shallow branches first.</details>

**E8B.8 ★★★** The HEAD allocator never frees. Name one property of the calculus that makes freeing *easy* in principle and one reason a runtime might still choose not to.

<details><summary>Solution</summary>

1. Affinity: every node is read by exactly one consumer, so a node can be freed (or reused) the moment its interaction consumes it — no reachability analysis is needed.
2. Freeing costs work on every interaction (free lists, fragmentation, cache effects); a bump allocator is the cheapest possible allocator. The repository tried a copying GC and removed it, choosing simplicity and speed at the cost of bounded runs.
</details>
