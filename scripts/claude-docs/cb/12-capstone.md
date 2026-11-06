
---

## 12 · Drills and capstones

### 12.1 Drill set (short, mixed)

Answers are one or two lines; check yourself before opening.

**D1 ★** Which rule fires for `@`meets`λ`? <details><summary>Answer</summary>APP-LAM, a γγ annihilation: var↔arg, body↔result.</details>

**D2 ★** Which rule grows a net? <details><summary>Answer</summary>Commutation (γδ, and δδ with different labels): 2 cells → 4.</details>

**D3 ★** A λ binds a variable used 5 times. How many duplicators? <details><summary>Answer</summary>4 (n − 1).</details>

**D4 ★** Which HVM4 term erases? `*`, `&{}` or `ε`? <details><summary>Answer</summary>`&{}`. `*` is the wildcard ANY; `ε` is the net-level name.</details>

**D5 ★** What does `#N` after a collapsed answer mean? <details><summary>Answer</summary>The running interaction count when that answer was printed (`src/hvm.c:6193`).</details>

**D6 ★** `!x&A = &A{a,b}` — project or copy? <details><summary>Answer</summary>Project (same label): x₀ = a, x₁ = b.</details>

**D7 ★** `!x&A = &B{a,b}` — project or copy? <details><summary>Answer</summary>Copy the choice (different labels): x₀ = x₁ = &B{…} with a and b duplicated.</details>

**D8 ★** Build command at HVM4 HEAD? <details><summary>Answer</summary>`clang -O2 -o src/hvm src/hvm.c`.</details>

**D9 ★★** Why can `-D` traces be compared line by line with the net rules? <details><summary>Answer</summary>Each traced line is one interaction, named by `ITRS_INC(name)`; the core names map to the net rules (APP-LAM = γγ, DUP-SUP = δδ, DUP-LAM/APP-SUP = γδ).</details>

**D10 ★★** In 64-bit HVM4 words, where is a duplication's label? <details><summary>Answer</summary>EXT (bits 32–55).</details>

**D11 ★★** `&A{1,2} + &A{10,20} + &B{100,200}`: how many worlds? <details><summary>Answer</summary>4: the two A-superpositions pair (2 worlds), the B one crosses them (×2).</details>

**D12 ★★** What is the label of `λx&.`'s duplication? <details><summary>Answer</summary>A fresh label chosen by the parser, different from every user label (§5.6).</details>

**D13 ★★** (Debug) `@main = !x&A = 5; x₀ + x₀`. What does HVM4 say, and why? <details><summary>Answer</summary>A parse error: `x₀` used twice. Each side of a duplication is affine; duplicate again or use `!&x`.</details>

**D14 ★★** Is `fib(34)` in 79.5 M interactions a failure of optimal reduction? <details><summary>Answer</summary>No: the recursive calls are independent work; optimality only avoids duplicating the *same* work.</details>

**D15 ★★** What does "admissible" protect in Lévy-optimality claims for HVM? <details><summary>Answer</summary>That the label discipline is correct for the term (no same-label fans meeting without being partners).</details>

**D16 ★★** Is BendRT an interaction-net reducer? <details><summary>Answer</summary>No. It keeps affinity, refcounted sharing and fork parallelism, but not cells/ports/rewrites.</details>

**D17 ★★** HVM5 v2: fork = ?, test = ?, merge = ? <details><summary>Answer</summary>Fork = one DUP of state; test = SUP of books (`&T{old,new}`); merge = 3-way merge of definition hashes + CAS epoch swap.</details>

**D18 ★★★** Why must the superposed variable in DUP-LAM carry the duplication's own label? <details><summary>Answer</summary>So that the later duplication of the shared body *projects* it (same label), giving each copy its own variable.</details>

**D19 ★★★** Why does the same-label accident not raise an error? <details><summary>Answer</summary>The result is a valid IC term; no rule is missing. It is a semantic mismatch with the intended λ-term, not a runtime fault.</details>

**D20 ★★★** Give the one-sentence reason HVM is a term machine rather than a graph machine (Part 8B.4). <details><summary>Answer</summary>Graph implementations of optimal reduction were slow because of pointer indirection (I-8); 64-bit term words with linked variables implement the same interactions compactly.</details>

### 12.2 Capstones

**C1 ★★ — Hand reduction to the end.** Translate `(λf. λx. f (f x)) (λy. y) z` to a net (z free) and reduce it by hand to normal form, drawing every step. State the count and compare with HVM4 on `@main = (λf&. λx. f₀(f₁(x)))(λy.y)` applied to a free-standing argument of your choice.

<details><summary>Solution outline</summary>

1. Net: Church 2 (§E4.3, 5 cells) applied to the identity, then to z.
2. β (f ↔ id); the δ on f meets the identity's λ: DUP-LAM + δδ on the loop (2) → two identities.
3. β (x ↔ z); the inner application `id z` → β; the outer `id (z)` → β.
4. Count: 1 + 2 + 1 + 1 + 1 = **6** net interactions; result `z`.
5. On HVM4, `@main = (λf&. λx. f₀(f₁(x)))(λy.y)(7)` prints `7` with **6** interactions; the `-D` rule sequence is APP-LAM, APP-LAM, DUP-LAM, APP-LAM, DUP-SUP, APP-LAM. The machine interleaves the steps lazily (it applies the second argument before copying `f`), but the multiset of rules matches the hand reduction: 4 β, 1 DUP-LAM, 1 DUP-SUP.
</details>

**C2 ★★ — Commutation by hand, then by machine.** Draw a δ meeting the net of `λx. λy. x`. Reduce until no active pair remains. Then run `@main = !f&A = λx.λy.x; [f₀, f₁]` with `-D` and match every line to your drawing.

<details><summary>Solution outline</summary>

1. DUP-LAM copies the outer λ; its variable x becomes `&A{x0,x1}` and the body `λy.x` sits behind `!G&A`.
2. DUP-LAM again for the inner λ (the copier meets `λy`); y becomes a superposition too.
3. The copier reaches `&A{x0,x1}`: DUP-SUP, same label → projection.
4. The unused y is bound to an eraser in the net picture, which must eventually meet y's superposition.
5. HVM4 HEAD: `[λa.λb.a,λa.λb.a]` in **3** interactions, trace DUP-LAM, DUP-LAM, DUP-SUP. It records no erasure interaction for the unused y: compare that with your drawing and explain the difference (the term machine never materializes a variable nobody reads).
</details>

**C3 ★★ — Labels as semantics.** Write two programs that differ only in one label and produce different answers (other than c2/k2). Explain the difference with DUP-SUP.

<details><summary>Solution outline</summary>

1. `@main = !x&A = &A{3,4}; x₀ + x₁` → 7 (projection).
2. `@main = !x&A = &B{3,4}; x₀ + x₁` → 6, 8 (copy the choice).
3. Explanation: §5.3; the label decides whether the duplication is the pair's partner.
</details>

**C4 ★★ — Search by erasure.** Find all pairs `(x, y)` in 0..7 × 0..7 with `x*y == 12` using superpositions. Predict the number of answers before running.

<details><summary>Solution outline</summary>

1. Candidates: two 3-bit superpositions with six distinct labels (§6.6 pattern).
2. Test with `@keep([x,y], (x*y) == 12)`.
3. Prediction: (2,6), (3,4), (4,3), (6,2) → **4 answers**. HEAD prints exactly these, after 849 interactions.
</details>

**C5 ★★ — Two numeral forms.** Write `@double` for constructor chains and `@double'` for n-literals; show the runtime error when you swap their inputs.

<details><summary>Solution outline</summary>

1. `@double = λ{ #Z: #Z{} ; #S: λp. #S{#S{@double(p)}} }`.
2. The n-literal version uses `0n:` / `1n+:` patterns (see `docs/hvm/syntax.md`).
3. Swapping inputs gives `RUNTIME_ERROR: cannot apply a number` (n-literal into a `#Z/#S` match).
</details>

**C6 ★★★ — Sharing crossover.** Build the §7.7 experiment: a shared partial application versus two calls, with a shared computation of tunable cost. Find the cost at which sharing starts to win, and plot interactions against cost.

<details><summary>Solution outline</summary>

1. Shared: `@f = λx.λy. !z&=x; [@work(z₀, z₁), y]`; unshared: call `@f` twice.
2. Shared ≈ cost + overhead (≈ 3–10); unshared ≈ 2 × cost. Crossover at cost ≈ overhead.
3. Report the measured counts; the curve is the honest form of "sharing inside lambdas".
</details>

**C7 ★★★ — Reading the C.** Pick three sheets (one APP-*, one DUP-*, one OP2-*). For each, find the implementing `wnf_*` function in `src/hvm.c`, the `ITRS_INC` name, and a one-line program whose `-D` trace shows it.

<details><summary>Solution outline</summary>

1. `grep -n "ITRS_INC(\"APP-SUP\")" src/hvm.c` → its function (`wnf_app_sup`).
2. Program: `@main = (&A{λx.x, λy.10})(7)` (§5.3).
3. Repeat for DUP-NOD (`!x&A = [1,2]; [x₀, x₁]`) and OP2-NUM-NUM (`@main = 2 + 2`).
</details>

**C8 ★★★ — Collapse order.** Write a superposition of four values whose collapse order you change only by wrapping one branch in the priority-lowering `INC` form. Predict the new order using §8.6.

<details><summary>Solution outline</summary>

1. Baseline: `&A{&B{1,2},&B{3,4}}` collapses in queue order.
2. Lower one branch's priority with the INC syntax from `docs/hvm/syntax.md`; lower-key branches are popped first, so a priority-lowered branch comes later.
3. Run both and compare the order and the `#N` counters.
</details>

**C9 ★★★ — Claim audit.** Take any public sentence about HVM or Bend (a README line, a post) and classify each clause with the table of §9.6. Rewrite it so every clause is true as stated.

<details><summary>Solution outline</summary>

Example: "Bend runs on interaction nets and is exponentially faster than Haskell." → (1) false for released Bend 2 (BendRT); (2) true only for chosen program families on HVM. Rewrite: "HVM, an interaction-calculus runtime, can be exponentially faster than GHC on programs that share work inside lambdas; released Bend 2 runs on a separate flat runtime."
</details>

**C10 ★★★ — Design: superposed testing.** A book has definitions `@a`, `@b`, `@c`; `@b` changes. Write the superposed book and estimate the shared ratio for a request that spends 70% of its old-version time before calling `@b`.

<details><summary>Solution outline</summary>

1. Superposed book: `@a` and `@c` unchanged; `@b = &T{@b_old, @b_new}`.
2. If the old run costs W and the new one about the same, the superposed run ≈ 0.7W + 2 × 0.3W = 1.3W versus 2W separately.
3. Shared ratio ≈ 0.7W / 2W = 35% of the combined work saved. Report the measured value.
</details>

**C11 ★★★ — Proof.** Prove that firing the two erasures of §3.8 step 1 in either order yields the same net (a concrete instance of the diamond).

<details><summary>Solution outline</summary>

1. The two active pairs δ₁–ε₁ and δ₂–ε₂ share no cell.
2. Each erasure removes its two cells and adds two erasers on the removed δ's aux wires, which lead to γ₁/γ₂ aux ports, disjoint from the other pair.
3. After both, the same six cells remain with the same wires, whichever fired first. ∎
</details>

**C12 ★★★ — Write a chapter.** Choose one rule sheet from Appendix B that this book did not explain (for example `app_mat_sup`), explain it in the style of §5.3 with a tested program and its `-D` trace, and add two exercises.

<details><summary>Solution outline</summary>

1. `app_mat_sup`: a pattern match applied to a superposition distributes over both alternatives (the match analogue of APP-SUP).
2. Program: `@main = λ{#T: 1; #F: 0}(&A{#T{}, #F{}})` → `1`, `0` in 8 interactions at HEAD; read its `-D` trace.
3. Exercises: predict the worlds; change the label of the argument and predict again.
</details>

---

## Appendix A · Reproduce everything in ten minutes

```sh
mkdir -p ~/inet && cd ~/inet
git clone https://github.com/HigherOrderCO/HVM4 && (cd HVM4 && git checkout 6defdfc && clang -O2 -o src/hvm src/hvm.c)
git clone https://github.com/VictorTaelin/Interaction-Calculus && (cd Interaction-Calculus && git checkout e9f0185 && make)
export H=~/inet/HVM4/src/hvm IC=~/inet/Interaction-Calculus/bin/ic
(cd HVM4 && HVM_TEST_TIMEOUT_SECS=20 ./devs/test/_all_.sh | tail -1)     # All tests passed!
printf '@main = (&A{1,2} + 10)\n' > a.hvm && $H a.hvm -s -C               # 11 #3 / 12 #4 / Itrs 4
echo '(λx.x λy.y)' > a.ic && $IC run a.ic                                   # λ$a.$a · WORK: 1
```

Every program in this book can be pasted into a file and run with `$H file.hvm -s -C` (or `-D` for the trace).
