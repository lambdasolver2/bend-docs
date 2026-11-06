
---

## 7 · Algorithms and their counts

Every count in this part was produced by HVM4 HEAD on 2026-11-06 (`-s -C`). Counts are properties of the program's graph (§2.2), so they reproduce exactly; heap sizes and times do not, and are never quoted.

### 7.1 Booleans

```hvm
@ctru = λt. λf. t              // True  = take the first
@cfal = λt. λf. f              // False = take the second
@cnot = λb. λt. λf. b(f, t)    // NOT   = swap the arguments
@main = @cnot(@cnot(@ctru))
```

```text
λa.λb.a      Itrs: 6
```

Two NOTs, each one β to receive `b` and the applications inside: 6 interactions, no duplication (every variable is used once).

### 7.2 Church numerals and addition

```hvm
@c1   = λs. λx. s(x)
@c2   = λs. !S0&C=s; λx0. S0₀(S0₁(x0))
@k2   = λs. !S0&K=s; λx0. S0₀(S0₁(x0))
@c4   = λs. !S0&C=s; !S1&C=λx0.S0₀(S0₁(x0)); λx1. S1₀(S1₁(x1))
@cadd = λa. λb. λs. λz. !S&B=s; a(S₀, b(S₁, z))
@cmul = λa. λb. λs. λz. a(b(s), z)
```

A Church numeral *n* is a function that applies `s` *n* times; as a net it is a fan of *n − 1* duplicators on `s` (§4.2). `c4` is built as "duplicate the doubling function", so it has two duplications, both labelled C.

| Program | Result | Itrs |
|---|---|---|
| `@cadd(@c1, @c2)` | `λa.λb.a(a(a(b)))` = 3 | 8 |
| `@cadd(@c4, @c4)` | `λa.λb.a(a(a(a(a(a(a(a(b))))))))` = 8 | 25 |
| `@cmul(@c2, @k2)` | `λa.λb.a(a(a(a(b))))` = 4 | 14 |
| `@cmul(@c2, @c2)` | `λa.λb.a(a(a(a(b))))` = 4 | 14 |
| `@c2(@k2)` (exponentiation 2²) | `λa.λb.a(a(a(a(b))))` = 4 | 20 |
| `@c2(@c2)` | `λa.λb.a` (degenerate) | 9 |

The last four rows are the most instructive in the book:

- `cmul(c2, c2)` is correct **even with equal labels**. Multiplication *composes* `b(s)` into `a` without making `a`'s fan copy `b`'s fan: no C-fan ever meets another C-fan.
- `c2(c2)` (exponentiation) is wrong with equal labels because the outer numeral's fan **copies** the inner numeral, and its copier meets the inner fan (§5.6).

So the rule is not "never reuse a label". It is: **a fan must not meet a same-labelled fan unless they are two halves of one duplication.**

### 7.3 Peano naturals: two numeral forms that do not mix

HVM4 offers two ways to write naturals, matched by two different pattern families:

| Form | Example | Matched by | Prints as |
|---|---|---|---|
| n-literals | `3n` | `0n:` / `1n+:` | `3n` |
| constructor chains | `#S{#S{#S{#Z{}}}}` | `#Z:` / `#S:` | `#S{#S{#S{#Z{}}}}` |

Feeding a `3n` literal to a function written with `#Z:`/`#S:` patterns stops the run with `RUNTIME_ERROR: cannot apply a number`. The classics, written with constructor chains:

```hvm
@add = λ{ #Z: λb.b ; #S: λp.λb.#S{@add(p, b)}; }
@mul = λ{ #Z: λb.#Z{} ; #S: λp.λb. !B&A=b ; @add(B₀, @mul(p, B₁)); }
@fac = λ{ #Z: #S{#Z{}} ; #S: λp. !P&A=p ; @mul(#S{P₀}, @fac(P₁)); }
@fib = λ{ #Z:#Z{}; λ{#S:λ{#Z:#S{#Z{}}; λ{#S:λn.!F&=@fib; !N&=n; @add(F₀(N₀), F₁(#S{N₁})); &{}}}; &{}}}
@sum = λ{ #Z:#Z{}; λ{#S:λp.!P&S=p;#S{@add(P₀, @sum(P₁))}; &{}}}
```

| Program | Result | Itrs |
|---|---|---|
| `@fac(#S{#S{#S{#Z{}}}})` | `#S` × 6 → 6 | 109 |
| `@fib(#S{#S{#S{#S{#S{#Z{}}}}}})` | `#S` × 5 → 5 | 274 |
| `@sum(#S{#S{#S{#S{#Z{}}}}})` | 10 | 55 |

(The test suite's own factorial builds its 3 as `@add(@two, @one)` first and reports 119 = 109 + the 10 interactions that build the argument. Counts measure the graph you hand the machine, including how its inputs were built.)

### 7.4 Lists

```hvm
@map = λ&f. λ{ []: []; <>: λh.λt. (f(h) <> @map(f, t)) }
@main = @map(λx.(x*2), [1,2,3])
```

```text
[2,4,6]      Itrs: 35
```

`λ&f.` asks the parser to insert duplicators for every use of `f` (two here: `f(h)` and the recursive `@map(f, t)`). Each recursion step copies the function **one layer at a time** (DUP-LAM), applies one copy, and passes the other on.

### 7.5 The showpiece: sharing inside a lambda

```hvm
@f = λx.λy. !z&=x; [(z₀ + z₁), y]
@main = !F& = @f(2); [F₀(10), F₁(20)]
```

```text
[[4,10],[4,20]]      Itrs: 11
```

The full `-D` trace at HEAD (abridged to rule names, every line is one interaction):

```text
 1  APP-LAM       @f receives 2; the partially applied function is now λy. … (2 + 2) …
 2  DUP-LAM       the copier F reaches λy: two lambda copies, y becomes &F{a,b}
 3  APP-LAM       copy 0 receives 10
 4  DUP-NOD       the shared body is duplicated one node (the list) at a time …
 5  DUP-NOD       … the copy reaches the sum and must wait: (2 + 2) is a redex
 6  OP2-NUM-NUM   (2 + 2) → 4   ← computed ONCE, in the shared position
 7  DUP-NOD       the number 4 is duplicated (one interaction for a number)
 8  DUP-NOD       the copier continues into the list
 9  DUP-SUP       &F{10, a} projected: copy 0 gets 10
10  DUP-NOD       the tail [] is duplicated
11  APP-LAM       copy 1 receives 20
```

Line 6 is the point of the whole book: the copier stopped at a redex (§4.5), the redex fired once, and both copies received its result. Call-by-need would have evaluated `2 + 2` once **per call** (§1.2).

> **Honesty about this example.** Calling the function twice instead of sharing one partial application (`@main = [@f(2,10), @f(2,20)]`) takes **8** interactions, fewer than 11, and its `-D` trace contains `OP2-NUM-NUM` **twice**. On a tiny example, the bookkeeping of sharing costs more than the work it saves. The win is *asymptotic*: replace `2 + 2` with an expensive computation and the shared version does it once while the unshared one does it twice. Optimal evaluation is a claim about families of programs, not about every program.

### 7.6 Where sharing does not help: naive Fibonacci

The machine-integer Fibonacci in the test suite (`fib_small`, a `λ{0:…;1:…;λ&n.…}` switch) computes `fib(34) = 5702887` in **79,522,600 interactions**, about 5 seconds on this machine. That is exponential, exactly as in any language: the two recursive calls `fib(n-1)` and `fib(n-2)` are *distinct* computations, not two uses of one shared value. There is nothing for a duplicator to share. Sharing helps when a program *creates* a shared value; it never turns independent work into shared work.

### 7.7 Runtime fusion: applying a function 2²⁵⁶ times

The showpiece (§7.5) shares a redex between two copies. The same mechanism does something more surprising when a function is **composed with itself**: the composition is reduced once, under the λ, and both later uses get the reduced result. Taelin's essay on the abstract algorithm's speed *(H.48)* calls this runtime fusion and uses `not` as the example: `not ∘ not` is the identity, so composing by repeated squaring reaches `not^(2^k)` in k compositions, provided the evaluator actually normalizes each composition before copying it.

The program (Church-style booleans, so `not` is a λ-term the runtime can fuse):

```hvm
@not  = λb.λt.λf.b(f,t)
@T    = λt.λf.t
@pow  = λ{0: λf.f; λ&p. λf. !F&A=f; @pow(p - 1, λx.F₀(F₁(x)))}
@main = @pow(16, @not)(@T)
```

`@pow(k, f)` returns `f` composed with itself 2ᵏ times: each level duplicates the current function and composes the two copies. (A numeric switch passes the number itself to the default branch, hence `p - 1`.) Measured on HEAD `6defdfc` with `-s -C`; every run returns `λa.λb.a`, which is `@T`, correct because 2ᵏ is even:

<!-- widget: chart table=next -->

| k | applications of `not` | interactions |
|---|---|---|
| 1 | 2 | 21 |
| 4 | 16 | 66 |
| 16 | 65,536 | 246 |
| 64 | 1.8 × 10¹⁹ | 966 |
| 256 | 1.2 × 10⁷⁷ | 3,846 |

The count is exactly **15k + 6**: linear in k, so logarithmic in the number of applications. For comparison, applying `not` one call at a time (`@rep = λ{0: λx.x; λ&n. λx. @rep(n - 1, @not(x))}`) costs exactly **7n + 2**: 458,754 interactions for n = 65,536, against 246 for the fused version of the same 65,536 applications.

Why it works, in the terms of this book:

1. `!F&A=f; λx.F₀(F₁(x))` duplicates `f` once and composes the copies. When the composition is later duplicated at the next level, the copier meets a redex inside the λ and **evaluates it first** (§4.5, §8B.5).
2. That redex is `not(not(x))`, which reduces to a λ-term of constant size (`λt.λf.x(t,f)`). So every level copies a small normal form, not a growing chain of `not`s.
3. A strict or call-by-need evaluator cannot do step 1: the redex is under a λ that has not been applied yet (§1.2).

Two honest limits. First, fusion depends on the composed function having a **small normal form**; `inc` on unary naturals does not shrink when composed with itself, and repeated squaring gains nothing there. Second, this program uses one static label `A` at every level and gives the right answer for every k tested (1–256); the principled form uses one label per level, a dynamic label `!F&(p)=f` (§8.9), and costs exactly 19k + 6 (4,870 interactions at k = 256). Labels decide correctness (§5.6); they must be argued, not assumed.

### What to remember from Part 7

- Counts are structural and reproducible; heap sizes and times are not evidence.
- Church numerals are fans; a fan's label decides copy vs projection. `cmul(c2,c2)` is safe, `c2(c2)` is not.
- Peano naturals have two surface forms with separate pattern families: do not mix them.
- The showpiece shows the mechanism (one `OP2-NUM-NUM` for two copies) and its overhead (11 vs 8).
- Sharing helps only where the program shares; naive Fibonacci is exponential everywhere.
- **Runtime fusion:** self-composition by squaring reaches `not^(2^256)` in 3,846 interactions, because each composition is normalized under its λ before it is copied. It works only when the composition has a small normal form.

### Exercises — Part 7

**E7.1 ★** Run `@main = (λ&x. x(x))(λy.y)` and explain each of its interactions (compare E4.4).

<details><summary>Solution</summary>

1. Output `λa.a`, `Itrs: 4`.
2. APP-LAM (the argument enters), DUP-LAM (the identity is copied), DUP-SUP (the copied variable is projected), APP-LAM (`id id`).
3. Same count as the hand net of E4.4: the machine and the model agree.
</details>

**E7.2 ★** Predict `@cadd(@c2, @c2)`: result and a rough count; then run it.

<details><summary>Solution</summary>

1. 2 + 2 = 4 applications: `λa.λb.a(a(a(a(b))))`.
2. More than `cadd(c1,c2)` (8), less than `cadd(c4,c4)` (25). HEAD reports **9** interactions.
</details>

**E7.3 ★★** Why does `@cmul(@c2, @c2)` give 4 while `@c2(@c2)` does not? Point to the exact place where fans meet.

<details><summary>Solution</summary>

1. `cmul a b s z = a(b(s), z)`: `b(s)` builds "apply s twice" (the inner C-fan duplicates `s`), and `a` receives that function and duplicates it with *its* C-fan.
2. The outer C-fan copies `b(s)` = `λx0. S0₀(S0₁(x0))`, whose free variables `S0₀`, `S0₁` are the *sides* of the inner fan, not the fan itself. Copying passes over variables, so the two fans never meet principal to principal.
3. In `c2(c2)` the outer fan duplicates the inner *numeral* `λs. !S0&C=s; …`, and copying the λ brings the outer copier to the inner fan's principal: same label → projection → wrong result.
</details>

**E7.4 ★★** (Debug) A student writes `@add = λ{ #Z: λb.b ; #S: λp.λb.#S{@add(p, b)}; }` and `@main = @add(1n, 2n)`. What happens and how do you fix it?

<details><summary>Solution</summary>

1. `RUNTIME_ERROR: cannot apply a number`: `1n` is an n-literal, but the function matches constructor tags `#Z`/`#S`.
2. Fix A: write the inputs as chains, `@add(#S{#Z{}}, #S{#S{#Z{}}})`.
3. Fix B: rewrite the patterns with the n-literal family, `λ{ 0n: λb.b ; 1n+: λp.λb. … }`.
</details>

**E7.5 ★★** Why does the test suite's factorial of 3 report 119 interactions when §7.3 reports 109?

<details><summary>Solution</summary>

1. The suite computes its argument as `@add(@two, @one)` inside `@main`; those 10 interactions are part of the run.
2. Interaction counts measure everything the machine does from `@main`, including building inputs. Compare programs only when their inputs are built the same way.
</details>

**E7.6 ★★** In §7.5, which line of the trace would be missing if `@f` were written `λx.λy. [(x + x), y]` with `λ&x`? Would the sum still be shared?

<details><summary>Solution</summary>

1. With `λ&x`, the parser inserts the duplication of `x` inside the body, so the structure is the same: `(x₀ + x₁)` sits inside the λy body, behind the copier.
2. The copier still meets the `+` redex after `x` is known and waits; `OP2-NUM-NUM` fires once.
3. Yes, still shared: auto-dup inserts the same duplicator a manual `!z&=x` would. The count may differ by the shape of the inserted fan.
</details>

**E7.7 ★★★** Construct a variant of §7.5 where the unshared version costs **more** interactions than the shared one, and state your prediction before running.

<details><summary>Solution</summary>

1. Make the shared work expensive: put a call that takes many interactions in the shared position, e.g. `@f = λx.λy. !z&=x; [@sum(z₀ … ), y]` with `@sum` over a chain of length 20, versus writing the call twice.
2. Prediction: shared ≈ cost(call) + overhead (≈ 10), unshared ≈ 2 × cost(call). For a call of ~250 interactions: ~260 vs ~500.
3. Run both; the crossover point (where overhead equals the saved call) is the honest summary of "sharing pays".
</details>

**E7.9 ★★** In §7.7, why must `not` be a λ-term (Church boolean) rather than a pattern match on constructors `#T{}`/`#F{}` for fusion to happen?

<details><summary>Solution</summary>

1. Fusion needs `not ∘ not` to reduce **before** it receives its argument, under the λ of the composition.
2. With Church booleans, `not(not(x))` is β-reducible with `x` unknown: it normalizes to `λt.λf.x(t,f)`, a constant-size term.
3. A constructor match on `x` cannot fire until `x` is a constructor; under the λ, `x` is a variable, so the match is stuck and each level would copy a growing chain of pending matches.
</details>

**E7.10 ★★★** Predict the interaction count of `@pow(32, @not)(@T)` from the table, and say what result it prints.

<details><summary>Solution</summary>

1. The measured counts fit 15k + 6 exactly (21, 66, 246, 966, 3,846 for k = 1, 4, 16, 64, 256).
2. k = 32 → 15 · 32 + 6 = **486** interactions.
3. 2³² is even, so the result is `@T` = `λa.λb.a`. (Measured: 486.)
</details>

**E7.8 ★** Why is `fib(34)` exponential on HVM4 too?

<details><summary>Solution</summary>

The two recursive calls are different computations (different arguments); no value is used twice, so no duplicator ever reaches a redex that another copy also needs. Optimal reduction never shares work that is not the same work.
</details>

---

## 8 · Inside HVM4 (HEAD `6defdfc`)

Parts 2–7 used nets as the *model*. This part opens the *machine*. Everything below refers to `src/hvm.c` at commit `6defdfc` (2026-05-29), the only source file of the runtime; line numbers are for that commit.

### 8.1 One file, eleven sections

At HEAD, HVM4 is a single translation unit: `clang -O2 -o src/hvm src/hvm.c`. The repository's `AGENTS.md` *(L.2)* lists its sections:

> "`src/hvm.c` is the only C runtime source. It is organized as broad sections, inspired by Bend's `Core.ts`"

| Section | Contents |
|---|---|
| Types | scalar aliases, term tags, parser/runtime structs, globals |
| Term | term packing, tag/ext/val helpers, constructors, clone helpers, OP2 |
| Heap | allocation, heap access, substitutions |
| Nick, System, Table, Print | names, file helpers, intern table, pretty-printing |
| Runtime | process setup, program preparation, entry lookup, `@main` evaluation |
| Parse | lexer, bindings, syntax sugar, includes, definitions |
| WNF | the stack evaluator and the interaction rules |
| Data | small data structures used by evaluation |
| CNF | one-step collapsed normal form readback and SUP lifting |
| Eval | SNF traversal and CNF branch enumeration |
| CLI | option parsing and the entry point |

The `--help` text calls it *"A sequential Interaction Calculus runtime."* There is no thread pool, no AOT compiler and no FFI at HEAD (§8.8).

### 8.2 The term word

Every term, static or dynamic, is one 64-bit word *(L.6, `src/hvm.c:123–133`)*:

```text
 63  62     56 55                   32 31                                  0
┌───┬─────────┬───────────────────────┬─────────────────────────────────────┐
│SUB│   TAG   │          EXT          │                 VAL                 │
│ 1 │  7 bits │        24 bits        │               32 bits               │
└───┴─────────┴───────────────────────┴─────────────────────────────────────┘
  substitution  constructor  metadata: dup label,    payload: heap location,
  flag (high    variant      ctor/ref name, level,   immediate number, or 0
  bit of TAG)                op code, flags
```

```c
#define TAG_BITS 8
#define EXT_BITS 24
#define VAL_BITS 32
#define TAG_SHIFT 56
#define EXT_SHIFT 32
#define TAG_SUB_MASK (1u << (TAG_BITS - 1))   // the high bit of the tag byte
#define TAG_MASK     (TAG_SUB_MASK - 1u)
```

The label of a duplication or superposition lives in **EXT** (24 bits): labels are not names at run time, they are numbers in the word.

### 8.3 The 45 tags

```text
 0 APP   1 VAR   2 LAM   3 DP0   4 DP1   5 SUP   6 DUP   7 ALO      ← "hot tags first (0-7)"
 8 REF   9 NAM  10 DRY  11 ERA  12 MAT  13–29 C00…C16 (constructors by arity)
30 NUM  31 SWI  32 USE  33 OP2  34 DSU  35 DDU  36 EQL  37 AND  38 OR
39 UNS  40 ANY  41 INC  42 BJV  43 BJ0  44 BJ1
```

Grouped by role:

| Family | Tags | Role |
|---|---|---|
| λ-calculus | APP, VAR, LAM | application, linked variable, lambda |
| sharing | SUP, DUP, DP0, DP1 | superposition; duplication; the two *sides* of a duplication (`x₀`, `x₁`) |
| dynamic labels | DSU, DDU | superposition/duplication whose label is computed at run time (strict on the label) |
| data | C00–C16, NUM, NAM, ERA, ANY | constructors by arity, unboxed u32, names, erasure, wildcard |
| elimination | MAT, SWI, USE | constructor match, numeric switch, unboxing |
| operators | OP2, EQL, AND, OR | arithmetic, structural equality, short-circuit logic |
| plumbing | ALO, REF, DRY, UNS, INC | lazy book allocation, book reference, "dry" (stuck) application, unscoped binders, collapse priority |
| quoted variables | BJV, BJ0, BJ1 | de Bruijn-level variables in static (book) terms |

### 8.4 Book and heap

HVM4 keeps two kinds of terms *(L.6)*:

- **Static (book) terms** — the definitions `@name = …`, parsed once and stored immutably, with variables as **de Bruijn levels** (BJV/BJ0/BJ1).
- **Dynamic (heap) terms** — the mutable graph being reduced, with **linked** variables: a VAR points to its lambda's body slot; DP0/DP1 point to their DUP node.

A reference `@f` is not copied eagerly. **ALO** ("allocate") is a lazy wrapper around a book term: it is expanded into heap nodes one layer at a time, only when the evaluator looks at it — the same incremental principle as copying. That is the `@{…}` notation in `-D` traces: `@{λa.a}` is a book term that has not yet been allocated. The `ALO-*` interaction sheets (`alo_lam`, `alo_var`, `alo_dup`, …) describe each expansion step.

**Substitution.** When β connects a variable to its argument, HVM4 writes the argument into the variable's slot and sets the **SUB** bit, so the next reader of that slot knows it holds a substitution, not a binder. That is the term-machine encoding of "wire the variable to the argument" (§4.1).

### 8.5 The evaluator: WNF, SNF, CNF

- **WNF** (weak normal form) — a stack machine walks to the head of the term. When the head is an eliminator (APP, DUP side, MAT, OP2, …) whose scrutinee is in WNF, the pair of their tags selects an interaction function: `wnf_app_lam`, `wnf_dup_sup`, `wnf_app_sup`, `wnf_dup_lam`, `wnf_op2_num_num`, …. HEAD has **69 `wnf_*` functions** implementing the 61 documented sheets plus helpers.
- **SNF** (strong normal form) — reduce to WNF, then recurse into sub-terms (the full readback of a normal form).
- **CNF** (collapsed normal form) — reduce to WNF, then lift the first SUP to the top, so the term becomes `&L{left, right}` and the two worlds can be enumerated *(L.8)*.

Every interaction increments one global counter through a macro:

```c
static u64 ITRS = 0;                          // src/hvm.c:171
#define ITRS_INC(name) ...  ITRS++; ...       // src/hvm.c:175–181
```

`ITRS_INC("APP-LAM")` and its 59 siblings are the 60 call sites; the `name` is what `-D` prints above each step.

### 8.6 Collapse, and the number after each answer

With `-C`, `eval_collapse` *(L.8)* enumerates worlds with a sequential priority queue:

> "breadth-first traversal with a sequential priority queue. Lower numeric keys are popped first; SUP increases key, INC decreases key. Branches with the same key are popped FIFO for deterministic ordering. When a branch has no SUP, it prints `cnf(term)`."

The number printed after each answer is **not** that key. It is the running interaction counter:

```c
printf(" \033[2m#%llu\033[0m", (unsigned long long)wnf_itrs_total());   // src/hvm.c:6193
```

So `11 #3` / `12 #4` means: the first world was complete after 3 interactions, the second after 4. In §6.5, the answer appeared at `#306` and the run ended at `Itrs: 536` — the collapser kept exploring (and erasing) the remaining branches after printing it. `INC` is the programmer's lever on the order: wrapping a branch in `↑` lowers its priority (the `INC-*` sheets). The newest commit (`6defdfc`, "general filter-credit scheduler for -C search ordering") refines that ordering for search programs.

### 8.7 The CLI at HEAD

```text
-s, --stats              Show statistics after evaluation
-S, --silent             Suppress result output
-C, --collapse[=N]       Collapse superpositions (limit N)
-D, --step-by-step       Trace each reduction step
-d, --debug              Enable debug mode
-v, --version            Print version
```

`-C10` limits collapse to 10 lines (the README's example). `-D` prints the whole term after each interaction, with the rule name as a separator line (every trace in this book).

### 8.8 What changed since March 2026

The first edition described commit `2d7f28e` (2026-03-20). Seventeen commits later, HEAD differs substantially *(L.1, git log)*:

| Commit | Change |
|---|---|
| `1369e3b` … `e2d1f59` | a CUDA runtime experiment (`cuda/`), reported 4 → 23.6 G interactions/s on the authors' benchmarks |
| `224670d` | a semi-space copying GC for bounded memory on tail recursion |
| `14a3eea`, `4b4676d`, `2e57823` | new syntax: sup-fork `&L[x,y,&z]{A;B}`, auto-fork `&L!{A;B}`, dup destructuring `! &L{x,y} = v; body` |
| `4bc2336` | **"Refactor HVM runtime into pure single source"**: the `clang/` tree (AOT emitter, FFI loader, threads, work-stealing queues) is deleted; `src/hvm.c` replaces it |
| `be02279` | "Remove GC from pure runtime" |
| `6defdfc` | collapse: general filter-credit scheduler |

The CUDA directory does not exist at HEAD. When you read older material that mentions `--to-c`, `-T` threads or FFI, it describes the March runtime, which survives only in git history.

### 8.9 New syntax at HEAD, tested

```text
@main = ! &L{x,y} = 7; [x, y]                → [7,7]            Itrs: 1
@main = ! &L{x,y} = &L{1,2}; [x, y]          → [1,2]            Itrs: 1
@main = ! &A{x,y} = &B{1,2}; [x, y]          → [1,1], [2,2]     Itrs: 5
@main = (λa. &L!{(a + 1); (a * 10)})(5)      → 6, 50            Itrs: 4
```

Dup destructuring names the two sides as plain variables (`x`, `y` instead of `v₀`, `v₁`); the rules are unchanged.

### 8.10 The 61 rule sheets

`docs/hvm/interactions/` has one file per interaction, each a sequent-style rule (*L.9*–*L.69*). The full list with one line each is Appendix B. Two findings at HEAD:

- `eql_nam.md` is **empty** (20 bytes, a title and an empty code block), although `wnf_eql_nam` exists in the C file. Read the code for that rule.
- The sheets describe the term machine. The four from Part 5 are `app_lam`, `dup_sup`, `app_sup`, `dup_lam`; `dup_nod` copies one data node and re-duplicates its children under the same label: the data analogue of DUP-LAM, one layer per interaction.

### What to remember from Part 8

- HEAD = one file, sequential; build with `clang -O2 -o src/hvm src/hvm.c`.
- Term word = SUB(1) | TAG(7) | EXT(24) | VAL(32); labels live in EXT.
- 45 tags; 61 sheets; 69 `wnf_*` functions; one counter `ITRS`, incremented by `ITRS_INC(name)`.
- Book terms are allocated lazily (ALO); variables are linked; substitution sets the SUB bit.
- `#N` after a collapsed answer = interactions so far, not a queue key.

### Exercises — Part 8

**E8.1 ★** Decode the term word `0x05000003_00000010`: which tag, label and value?

<details><summary>Solution</summary>

1. Top byte `0x05`: SUB bit 0, TAG = 5 = **SUP**.
2. Bytes 6–4: `0x000003` = EXT = **label 3**.
3. Low 32 bits `0x00000010` = VAL = heap location **16** (a SUP node: `[tm0, tm1]` stored at 16 and 17).
</details>

**E8.2 ★** Where does HVM4 store the label of `&A{1,2}` at run time, and what limits the number of distinct labels?

<details><summary>Solution</summary>

In the EXT field of the SUP word: 24 bits, so at most 2²⁴ ≈ 16.7 million distinct static labels. Dynamic labels (DSU/DDU) are computed values stored the same way.
</details>

**E8.3 ★★** In `src/hvm.c`, find the function implementing DUP-LAM and the line that names it for `-D`.

<details><summary>Solution</summary>

1. `grep -n "fn .*wnf_dup_lam" src/hvm.c` finds the function.
2. Inside it, `ITRS_INC("DUP-LAM")` both counts and names the step; `-D` prints that name.
</details>

**E8.4 ★★** A program prints `5 #117` and then `- Itrs: 134 interactions`. What happened in the last 17 interactions?

<details><summary>Solution</summary>

The answer was complete after 117 interactions. The collapser then continued with the remaining branches; each was reduced until its `@keep` test erased it (`&{}`) or it produced no further answer. Those interactions count, but print nothing.
</details>

**E8.5 ★** Why does the `-D` trace show `@{λa.a}` instead of `λa.a`?

<details><summary>Solution</summary>

`@{…}` marks a book term not yet allocated on the heap (ALO). The evaluator expands it lazily, one layer at a time, when it is needed; the result is the same term.
</details>

**E8.6 ★★** Predict the rule names in `-D` for `@main = !x&A = 5; [x₀, x₁]`, then run it.

<details><summary>Solution</summary>

1. The duplicated value is a number: one **DUP-NOD** gives both sides 5.
2. Result `[5,5]`, 1 interaction.
</details>

**E8.7 ★★** Old notes say "run with `-T4` to use four threads" and "`--to-c` compiles to C". What happens at HEAD, and why?

<details><summary>Solution</summary>

Both flags are gone: HEAD's CLI accepts only `-s -S -C[=N] -D -d -v -h`. The threaded runtime and the AOT emitter lived in the `clang/` tree that commit `4bc2336` removed in favour of a pure sequential single file.
</details>

**E8.8 ★★★** Explain how a term machine with linked variables and SUB-flagged slots can implement "β is one interaction, by wiring" without a port graph.

<details><summary>Solution</summary>

1. In a net, β connects the variable's wire to the argument. In the term machine, the λ's variable has exactly one occurrence (affinity), so "the variable's wire" is one heap slot.
2. APP-LAM writes the argument into that slot and marks it with SUB. Any reader arriving at the variable sees SUB and reads the argument: the wire is spliced.
3. The body becomes the application's result in place. Constant work, no traversal of the body: the same one-interaction β as the net, in a different representation.
</details>
