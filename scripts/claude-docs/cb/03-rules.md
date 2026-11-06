
---

## 3 · The six rules of the symmetric interaction combinators

Lafont (1997) introduced two closely related systems with three cells each, and both matter here:

| | Lafont's **interaction combinators** | the **symmetric interaction combinators** |
|---|---|---|
| cells | γ (constructor), δ (duplicator), ε (eraser) | the same three (Mazza writes the constructor as ζ) |
| γ–γ annihilation | **crossed**: each γ's left port is wired to the other's right port | **straight**: left to left, right to right |
| δ–δ annihilation | straight | straight |
| all other rules | identical | identical |
| universality | every interaction system can be translated into them | every **polarized** interaction system can be translated into them |

Mazza, who gave the symmetric combinators a denotational semantics, summarizes the difference *(M.4, abstract)*:

> "They enjoy a weaker universality property with respect to interaction nets, but are equally expressive."

"Polarized" is not a serious restriction in practice: Mazza lists Turing machines, cellular automata, the SK combinators, linear-logic proof nets and the λ-calculus as polarized systems *(M.4, §2.4)*. Interaction nets themselves began as a generalization of linear logic's proof nets *(M.4, §1)*. This book uses the symmetric convention throughout, because it is what the Interaction Calculus and HVM implement:

> **The one convention.** In every annihilation, **aux1 connects to aux1 and aux2 to aux2.**

### 3.1 The three cells

```inet
show: cells
title: The three cells
```

- **γ**, the *constructor*. Two γ cells annihilate; in Part 4, γ plays both **λ** and **application**, and this annihilation is **β-reduction**.
- **δ**, the *duplicator*. Meeting a different kind, it **copies** that cell; meeting another δ, it annihilates.
- **ε**, the *eraser*. It deletes whatever it meets, one cell at a time.

Six unordered pairs of kinds can meet: γγ, δδ, εε, γδ, γε, δε. Three rules annihilate, two erase, one commutes.

### 3.2 Annihilation: γ–γ

```inet
net: γ(x₁, x₂) ~ γ(y₁, y₂)
show: rule
title: γ–γ annihilation
caption: aux₁–aux₁, aux₂–aux₂: cells 2 → 0, free ports 4 → 4
expect: 1
animate
```



Both cells are drawn with *their own* aux1 on the left as seen from *their own* apex. The lower cell is upside down, so its aux1 appears below x₁. The rule is "aux1–aux1", not "left–left on paper".

### 3.3 Annihilation: δ–δ

```inet
net: δ(x₁, x₂) ~ δ(y₁, y₂)
show: rule
title: δ–δ annihilation
caption: same shape as γ–γ; δ–δ annihilate only when their labels are equal
expect: 1
animate
```



Same shape. Two duplicators facing each other cancel: a duplication meets the pair it would have built and hands the two halves through. In Part 5 this becomes **DUP-SUP with equal labels: projection**.

### 3.4 Annihilation: ε–ε

```inet
net: ε ~ ε
show: rule
title: ε–ε annihilation
caption: both cells vanish: cells 2 → 0, free ports 0 → 0
expect: 1
animate
```



### 3.5 Erasure: γ–ε and δ–ε

```inet
net: γ(x₁, x₂) ~ ε
show: rule
title: γ–ε erasure
caption: one cell deleted, two fresh erasers sent down its aux wires: cells 2 → 2
expect: 1
animate
```

```inet
net: δ(x₁, x₂) ~ ε
show: rule
title: δ–ε erasure
caption: the same shape with δ in place of γ
expect: 1
animate
```




The eraser does not delete the whole subnet at once. It deletes **one** cell and sends **two** fresh erasers down that cell's auxiliary wires. Erasing a structure of *n* cells costs *n* interactions: the "K erases an unboundedly large structure" of SKI is split into bounded steps. The δ–ε rule has the same shape with δ in place of γ.

### 3.6 Commutation: γ–δ, the copying rule

```inet
net: γ(x₁, x₂) ~ δ(y₁, y₂)
show: rule
title: γ–δ commutation, the copying rule
caption: δ-copies face x₁, x₂; γ-copies face y₁, y₂; δᵢ.auxⱼ – γⱼ.auxᵢ (two straight wires, two crossing): cells 2 → 4
expect: 1
animate
```



Read it as: *the δ slides through the γ, and on the way each copies the other.*

- Each wire that left **γ** (x₁, x₂) now leads into the principal of a **copy of δ**.
- Each wire that left **δ** (y₁, y₂) now leads into the principal of a **copy of γ**.
- Cross-wiring: δ-copy *i*'s aux *j* goes to γ-copy *j*'s aux *i*. In the picture δ₁.aux1–γ₁.aux1 and δ₂.aux2–γ₂.aux2 go straight down; δ₁.aux2–γ₂.aux1 and δ₂.aux1–γ₁.aux2 cross.

The new δ principals face x₁ and x₂: if those lead to further γ cells, copying continues one layer further. That is **"copy incrementally"** (§1.3) as a local rule. It is the only rule that grows a net (2 → 4).



### 3.7 The rule table

| Meeting | Name | Cells | Effect |
|---|---|---|---|
| γ–γ | annihilation | 2 → 0 | aux1–aux1, aux2–aux2 (β in Part 4) |
| δ–δ | annihilation | 2 → 0 | aux1–aux1, aux2–aux2 (projection in Part 5) |
| ε–ε | annihilation | 2 → 0 | both vanish |
| γ–ε, δ–ε | erasure | 2 → 2 | two erasers move outward |
| γ–δ | commutation | 2 → 4 | copy each other, cross-wire |

> **Two groups, or three?** The literature sorts the six rules into exactly **two** groups by one test: same kind → **annihilation**, different kinds → **commutation** (Mazza, *M.4*, §2.1). In that convention the erasures γ–ε and δ–ε *are* commutations: ε has no auxiliary ports, so "copying" it across the other cell leaves two erasers. This book lists erasure as its own row because its effect is so different. Two shortcuts that circulate, and are wrong: annihilation is **not** erasure (γ–γ reconnects four wires; it is β), and commutation is **not** only duplication (γ–ε and δ–ε are commutations that erase). The correct functional reading: γ–γ is application, δ–δ is a copier meeting its partner (the end of a sharing), γ–δ is copying, and anything meeting ε is erasure.

### 3.8 A complete hand reduction

A duplicator copies a constructor whose aux ports are erased:


```inet
net: δ(a, b) ~ γ(ε, ε)
show: steps
title: δ(a, b) ~ γ(ε, ε) to normal form
caption: step 1 is the commutation; steps 2–3 are the two δ–ε erasures (in either order, by the diamond); free ports a, b never move
expect: 3
animate
```

**Step 1, γ–δ commutation.** γ-copies take the δ's aux wires (toward a, b); δ-copies take the γ's aux wires (toward the two ε). The notation reads `a = γ(p, q) ; b = γ(s, t) ; δ(p, s) ~ ε ; δ(q, t) ~ ε`: two new active pairs, both δ–ε.


**Steps 2–3, two δ–ε erasures** (in either order, by the diamond). Each δ-copy dies and sends two erasers up into the γ-copies' aux ports, ending at `a = γ(ε, ε) ; b = γ(ε, ε)`.


Normal form: two copies of "γ with both aux ports erased". **3 interactions; free ports a, b preserved at every step.** The duplicator has finished copying and disappeared; nothing was copied that was not there.


> **The classic hand-drawing error.** In commutation, **γ-copies go to the δ's side and δ-copies to the γ's side**. If you draw the copies on their own side, the new active pairs come out as γ–ε instead of δ–ε and every later count is wrong. Always re-count cells and active pairs after a commutation.

### 3.9 Why three cells are enough, and why that is not the point

Lafont's universality theorem: every interaction system can be *encoded* in his interaction combinators; for the symmetric combinators used here, every *polarized* system can (Mazza's Theorem 2.2, citing Lafont, *M.4*):

> "Any polarized interaction net system can be translated into the symmetric combinators."

It is a statement about expressiveness, like Turing completeness, and says nothing about how many interactions the encoding takes. Practical machines add cell kinds (numbers, constructors, matches, arithmetic). HVM4 has 45 tags and 61 documented interaction rules (Part 8). The six rules above are their core; the rest is engineering.

### What to remember from Part 3

- One convention: **aux1 pairs with aux1**. Check free ports and touched cells at every step.
- Annihilation (γγ, δδ, εε) deletes; γγ will be β.
- Commutation (γδ) copies **one layer per interaction**, and is the only rule that grows the net.
- Erasure costs **one interaction per cell**.
- Universality is about *encodability*, not efficiency. Lafont's combinators (crossed γγ) are universal for all interaction systems; the symmetric ones (straight γγ) for all polarized systems, which includes the λ-calculus.

### Exercises — Part 3

**E3.8 ★★** Draw the γ–γ annihilation once in Lafont's convention and once in the symmetric convention, for two γ cells with auxiliary ports a, b (top cell) and c, d (bottom cell). Which wires differ?

<details><summary>Solution</summary>

1. Symmetric: a–c and b–d (left to left, right to right).
2. Lafont's interaction combinators: a–d and b–c (the auxiliary ports are exchanged).
3. Only γ–γ differs; δ–δ is straight in both, and every other rule is identical. Mixing the two conventions in one hand reduction gives wrong wiring after the first β.
</details>

**E3.1 ★** Draw the result of a δ–δ annihilation where the upper δ has aux ports p (aux1), q (aux2) and the lower one r (aux1), s (aux2).

<details><summary>Solution</summary>

1. Rule: aux1–aux1, aux2–aux2.
2. Result: two wires **p–r** and **q–s**, no cells. Free ports p, q, r, s unchanged.
</details>

**E3.2 ★** How many interactions does it take to erase a balanced binary tree of 7 γ cells (depth 3) whose 8 leaf wires end in ε cells, starting from an ε touching the root's principal?

<details><summary>Solution</summary>

1. Each γ–ε deletes one γ and sends two erasers to its children: 7 interactions.
2. The 8 erasers sent to the leaves meet the 8 leaf erasers: 8 ε–ε annihilations.
3. Total **15**, linear in the size of the tree.
</details>

**E3.3 ★★** Redo step 1 of §3.8 from the rule of §3.6 alone, naming the new cells δ₁, δ₂, γ₁, γ₂ and listing all wires.

<details><summary>Solution</summary>

1. Old: γ.aux1–ε₁, γ.aux2–ε₂, δ.aux1–a, δ.aux2–b.
2. δ-copies take γ's aux wires: δ₁.p–ε₁.p, δ₂.p–ε₂.p.
3. γ-copies take δ's aux wires: γ₁.p–a, γ₂.p–b.
4. Cross-wiring δᵢ.auxⱼ–γⱼ.auxᵢ: δ₁.1–γ₁.1, δ₁.2–γ₂.1, δ₂.1–γ₁.2, δ₂.2–γ₂.2.
5. 8 wires; cells γ₁, γ₂, δ₁, δ₂, ε₁, ε₂ = **6**; ports 4·3 + 2·1 + 2 free = 16 = 2·8 ✓. Active pairs: δ₁–ε₁, δ₂–ε₂.
</details>

**E3.4 ★** Which rules make a net larger, which smaller, which keep the size?

<details><summary>Solution</summary>

1. Larger: γδ commutation (2 → 4).
2. Smaller: the three annihilations (2 → 0).
3. Same: the two erasures (2 → 2), which push erasers toward cells that will be deleted.
</details>

**E3.5 ★★** A δ meets a γ whose two aux ports are joined to *each other* by one wire (a loop). What does commutation produce, and what happens next?

<details><summary>Solution</summary>

1. The δ-copies take γ's aux wires; since those wires are one loop, δ₁.p is joined to **δ₂.p**: a new active pair.
2. The γ-copies face the δ's old aux wires; cross-wiring gives γ₁.1–δ₁.1, γ₁.2–δ₂.1, γ₂.1–δ₁.2, γ₂.2–δ₂.2.
3. δ₁–δ₂ annihilate (aux1–aux1, aux2–aux2): γ₁.1–γ₁.2 and γ₂.1–γ₂.2.
4. Result: **two copies of the loop γ**, in 2 interactions. In Part 4 this is "duplicate the identity function λx.x", and HVM4's trace agrees: DUP-LAM then DUP-SUP (§4.4).
</details>

**E3.6 ★★★** Prove that erasure terminates on a finite region that is a tree of γ/δ cells with ε leaves (no commutation possible).

<details><summary>Solution</summary>

1. Measure: the number of γ/δ cells in the region.
2. Each γε/δε interaction removes one γ/δ cell and creates only ε cells: the measure strictly decreases.
3. εε annihilations remove cells and create none.
4. A strictly decreasing natural number cannot decrease forever. ∎ Commutation is excluded because it is the only rule that creates γ/δ cells.
</details>

**E3.7 ★** Is γ–δ commutation the same rule as δ–γ commutation?

<details><summary>Solution</summary>

Yes. An active pair is an unordered wire between two principal ports; the rule is defined on the unordered pair of kinds. One rule per unordered pair is what makes the system deterministic.
</details>

---

## 4 · λ-calculus on nets: β is one interaction

### 4.1 Two shapes from one cell

Both λ-abstraction and application are **γ cells**, used with different port roles:

```inet
net: value = λ(var, body); function = @(argument, result)
title: λ and @ are both γ cells
under: λ cell · principal = the value | @ cell · principal faces the function
caption: λ: aux₁ = the variable, aux₂ = the body. @: aux₁ = the argument, aux₂ = the result
```

When a λ is applied, the @ cell's principal (facing the function) touches the λ's principal: **an active γ–γ pair**. Annihilation connects aux1–aux1 (**variable ↔ argument**) and aux2–aux2 (**body ↔ result**). That is β-reduction: substitution by wiring, **one interaction, regardless of the size of the argument**.

### 4.2 Variables: wires, duplicators, erasers

A variable is a wire from the λ's aux1 to its occurrence. The number of occurrences decides the plumbing:

| Uses of `x` | Plumbing at the λ's aux1 |
|---|---|
| 1 | a single wire (linear) |
| 0 | an **ε** cell (the argument will be erased, one cell at a time) |
| n > 1 | **n − 1 δ cells** in a fan, principal toward the λ, aux ports toward the occurrences |

The δ's principal faces the binder. Nothing happens until β connects that binder to an argument whose principal faces back; then the δ meets the argument's root cell and copying begins (§3.6).

### 4.3 Step gallery: `(λx. x) y`

```inet
net: @(y, r) ~ λ(x, x)
show: steps
title: (λx. x) y: one interaction
term: (λx. x) y | y
caption: the λ's body is its variable, one loop wire x; β splices var–arg and body–result, leaving r–y
expect: 1
animate
```

Annihilation: var–arg gives `λ.aux1 ── y`; body–result gives `λ.aux2 ── r`; λ.aux1 and λ.aux2 were the two ends of one loop wire, so splicing yields **r–y**. One interaction. HVM4 prints the same single step for `(λx.x)(λy.y)`:


```text
@main
---------------------------------------- APP-LAM
@{@{λa.a}}
```

(`@{…}` marks terms still in book form, expanded lazily; §8.4.)

### 4.4 Step gallery: duplicating a function

`!f&A = λx.x; [f₀, f₁]`, "make two copies of the identity function and put them in a list". As a net: a δ (label A; labels are Part 5) whose principal faces the λ of `λx.x`.

1. **γ–δ commutation (DUP-LAM).** Two λ-copies appear at f₀, f₁; two δ-copies appear on the λ's aux wires. Those wires are one loop, so the two δ-copies face each other principal to principal (E3.5).
2. **δ–δ annihilation (DUP-SUP).** The δ-copies cancel; each λ-copy's variable is wired to its own body.

Two identity functions, **2 interactions**:

```inet
net: δA(f₀, f₁) ~ λ(x, x)
show: steps
title: Duplicating λx. x
term: !f&A = λx.x; [f₀, f₁] | (DUP-LAM) | [λa.a, λb.b]
caption: step 1 is DUP-LAM (commutation), step 2 DUP-SUP (equal labels annihilate)
expect: 2
animate
```

HVM4 at HEAD:


<!-- widget: trace src=traces/dup-id.txt -->

```text
@main
---------------------------------------- DUP-LAM
λa.A₀<>@{[λb.A₁]};!A&A=@{&A{a,b}};
---------------------------------------- DUP-SUP
λa.a<>@{[λb.b]}
```

Read the middle line slowly. After DUP-LAM the copies are `λa.A₀` and `λb.A₁`: two lambdas whose bodies are the two *sides* of a duplication `!A&A = &A{a,b}`, a duplication of **a superposition of the two copies' variables**. That superposition is the δ-copy seen from the other side (Part 5). The next step is DUP-SUP with equal labels, projection, giving `λa.a` and `λb.b`.

### 4.5 Copying stops at redexes

When a duplicator walks into a function body and reaches an active pair, it cannot pass: commutation needs a principal facing it, and the redex's two cells face each other. The copy *waits*. The redex reduces **once**, and the duplicator continues into the result. This is §1.3's mechanism, and it is why in §0.5 `(2 + 2)` was computed once for two copies of `@f(2)`.

### 4.6 The limit of one duplicator kind: the clone of a clone

With a single δ kind, nets for λ-terms go wrong when a duplicator copies a term that *itself contains* a duplicator: an outer δ-copy meets an inner δ and **annihilates** (δδ) where it should have **commuted**. The copies pair up wrong, and the net no longer reads back as the λ-term's normal form. This is the *clone of a clone* problem. Lamping solved it in 1990 with extra control cells, the **oracle**, at a large constant cost (Part 9). The Interaction Calculus solves the common case with **labels**: duplicators with different labels commute instead of annihilating (Part 5).

### What to remember from Part 4

- λ and @ are both γ; **β is one γγ annihilation**: var↔arg, body↔result.
- n uses → n−1 δ; zero uses → ε.
- Copying is **incremental and lazy**; a copy waits at a redex, so the redex is reduced once.
- One unlabeled δ cannot handle nested duplication; labels fix the common case.

### Exercises — Part 4

**E4.1 ★** Translate `λx. λy. x` to a net: list cells and wires.

<details><summary>Solution</summary>

1. Cells: λ₁ (binds x), λ₂ (binds y), ε (y unused).
2. Wires: root–λ₁.p; λ₁.aux2–λ₂.p; λ₂.aux2–λ₁.aux1 (the body of λ₂ is x); λ₂.aux1–ε.p.
3. 3 cells, 1 free port, 0 active pairs: a normal form.
</details>

**E4.2 ★** How many interactions does `(λx. λy. x) a b` take, with a and b free ports? What happens to b?

<details><summary>Solution</summary>

1. β₁: x ↔ a; the result is λ₂, i.e. `λy. a`.
2. β₂: `(λy.a) b`: y ↔ b. y's wire led to an ε, so now that ε faces b. b is a free port, not a cell: nothing more happens.
3. **2 interactions**; the result carries a; b is attached to an eraser (if b were a term, one erasure per cell would follow).
</details>

**E4.3 ★★** Draw the net of `λf. λx. f (f x)` (Church 2). How many δ cells, and where?

<details><summary>Solution</summary>

1. f occurs twice → **one δ**, principal at λf.aux1, aux ports to the two occurrences.
2. Two @ cells: @₂ = `f (…)` outer, @₁ = `f x` inner. δ.aux1–@₂.p, δ.aux2–@₁.p.
3. Wires: root–λf.p; λf.aux2–λx.p; λx.aux2–@₂.aux2; @₂.aux1–@₁.aux2; @₁.aux1–λx.aux1.
4. **5 cells** (4 γ, 1 δ), 0 active pairs.
</details>

**E4.4 ★★** Count the interactions of `(λx. x x)(λy. y)` on the net and check against HVM4.

<details><summary>Solution</summary>

1. β: x ↔ (λy.y); x's δ now faces the λy cell.
2. Copying the identity: DUP-LAM + δδ on the loop = 2 (§4.4).
3. `id id`: one more β.
4. Total **4**. HVM4: `@main = (λ&x. x(x))(λy.y)` reports `λa.a` with `Itrs: 4` (E7.1 asks you to run it).
</details>

**E4.5 ★★★** Construct a λ-term whose reduction makes a duplicator copy another duplicator, and say what goes wrong with a single unlabeled δ kind.

<details><summary>Solution</summary>

1. Church 2 applied to Church 2: `(λf.λx. f (f x)) (λg.λy. g (g y))`. β puts the second numeral (with its own δ for g) where f was; the first numeral's δ starts copying it.
2. The outer δ reaches the inner δ: **δ–δ**. With one δ kind this annihilates, connecting halves pairwise as if the inner fan were the pair being built.
3. The result is not 4 = `λs.λz. s(s(s(s z)))`. With labels (Part 5) the two fans commute when their labels differ; §7.3 measures both cases on HVM4.
</details>
