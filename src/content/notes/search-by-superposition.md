---
title: "Search by superposition"
description: "No loops, no enumeration: apply the function to every input at once and let sharing do the search. SAT in 1s, add-carry from 65,536 candidates."
updated: 2026-09-05
verified: 2026-09-05
status: docs-only
canonical: /notes/search-by-superposition/
sources:
  - https://gist.github.com/VictorTaelin/9061306220929f04e7e6980f23ade615
  - https://gist.github.com/VictorTaelin/d5c318348aaee7033eb3d18b0b0ace34
  - https://gist.github.com/VictorTaelin/7c4c69a1f07b5c668be613f1032e7d4e
---

# Search by superposition

Superposition is usually introduced as "two values in one location" with
a two-line arithmetic demo. Its serious use is different: **search
without loops**. Apply a function to a superposition of its entire
domain and you get a superposition of its entire image — with the
evaluator sharing work across all guesses at once.

<div class="box box-warn">
<b>Status</b> The experiments below ran on earlier HVM syntax and are
<strong>documentation-only</strong> here: shapes and numbers as reported
by Taelin, not re-run. The mechanism (first-class SUP + collapse) is
unchanged in HVM4.
</div>

## Truth tables for free

Evaluating `(And {True False} {True False})` yields the complete truth
table — `{{True False} {False False}}` — because applying a function to
a superposed domain produces the superposed image. So brute force stops
being written as nested loops:

```python
# instead of this:
for x0 in [T, F]:
    for x1 in [T, F]:
        ...
        print(F(x0, x1, ...))
# write this:
print(F({T,F}, {T,F}, ...))
```

The second form shares computation across guesses wherever the guesses
agree — which, for structured problems, is nearly everywhere.

## SAT: 3 minutes in Rust, 1 second in HVM

Taelin's one-line-style SAT solver feeds all 2¹⁶ assignments of a random
16-variable 3-SAT instance as superposed booleans, lets the formula
evaluate once across the whole superposition, then collapses per-label
results back into the satisfying assignment. A 32-variable instance: ~3
minutes of Rust brute force vs ~1 second superposed. The honest caveat is
his own: this was a new observation, asymptotics unknown — but the shape
of the win (shared prefixes across guesses) is exactly what the
machinery predicts.

## Program search: 65,536 candidates, 36k interactions

The Discrete Program Search series pushes the same idea up a level:
synthesize the add-carry function from a template with 16 unknown bits.
Conventionally that's 65,536 separate runs (~262M interactions at ~4k
per call). Superposed — one template holding all candidates, two test
cases, collapse — it returns the bit vector
`[0,1,1,0,1,0,0,1,1,1,1,0,1,0,0,0]` in **36k interactions**: under one
interaction per guess, a ~7200x win that grows with the search space.
Enumeration and loops are fully replaced by superposition and collapse;
the follow-ups extend it to DSL enumeration and superposed λ-terms.

## Why this page exists in Bend2's notes

Bend2's SupGen — synthesis from precise types — is this technique aimed
at programs instead of bits: types give the search a target, the checker
an acceptance test, and superpositions make each guess cost less than
one. The DPS posts even sketch the product shape (examples in, function
out). When SupGen ships, re-read this page first.

