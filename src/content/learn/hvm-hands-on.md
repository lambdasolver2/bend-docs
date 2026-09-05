---
title: "HVM4 hands-on"
description: "Build the actual runtime with gcc and run superpositions, duplication, and fib — every output below was produced this way."
updated: 2026-09-05
verified: 2026-09-05
status: runnable
canonical: /learn/hvm-hands-on/
sources:
  - https://github.com/HigherOrderCO/HVM4
  - https://github.com/HigherOrderCO/HVM4/blob/main/docs/primer.md
  - https://github.com/HigherOrderCO/HVM4/blob/main/docs/hvm/syntax.md
---

# HVM4 hands-on

This page is different from the Bend2 pages: everything here runs today.
HVM4 is public, one C file, and the outputs below were produced by
building it and running each snippet (gcc works; the README uses clang).

```sh
curl -sSL -o hvm.c https://raw.githubusercontent.com/HigherOrderCO/HVM4/main/src/hvm.c
gcc -O2 -o hvm hvm.c   # a few warnings, builds fine
./hvm file.hvm -s      # -s shows interaction/heap stats
./hvm file.hvm -s -C10 # -C collapses superpositions into separate results
```

## First run: a function of two arguments

Books are `@name = term` lines; application is `f(a, b)` — never `f a b`
(whitespace application is a parse error). Lambdas use `λ`:

```hvm
@add = λa. λb. (a + b)
@main = @add(1, 2)
//3
```

Actual run: `3`, 3 interactions, 23 heap nodes. Three interactions for
`1 + 2` tells you the price model honestly: every step is graph surgery.

## Superposition: one location, two values

```hvm
@main = (&A{1,2} + 10)
```

Actual run (`-C10`): `11` then `12`, 4 interactions, 13 nodes. Both
values flowed through the same addition, sharing everything except the
choice. Two corrections to the README here, found by running: the
superposition needs a **label** (`&A{…}`, not `&{…}` — bare `&{}` is
erasure), and there must be no spaces inside the braces.

## Labels decide: annihilate or multiply

A duplication meeting a superposition with the **same** label extracts
pairwise; with **different** labels it multiplies branches:

```hvm
@main =
  !x&A = &A{1, 2};
  [x₀, x₁]
//[1,2]          -- one result, 1 interaction
```

```hvm
@main =
  !x&A = &B{1, 2};
  [x₀, x₁]
//[1,1]
//[2,2]          -- two results, 5 interactions
```

Both verified by running. `!x&A = v; body` binds the two copies as `x₀`
and `x₁` (subscripts required); `[a, b]` is list sugar.

## Affinity: the compiler that says no twice

Variables may be used at most once. This fails:

```hvm
@bad = λx. (x + x)   // PARSE/AFFINITY ERROR: x used twice
```

The fix is a cloned binder — `&` tells the parser to insert duplication:

```hvm
@square = λ&x. (x * x)
@main = @square(5)
//25               -- verified: 3 interactions
```

Style rule from the primer, worth memorizing: dups are the expensive
primitive, so arrange definitions as case-trees that avoid clones, and
never apply an inline match (`λ{...}(x)`).

## Fib, with a stopwatch

```hvm
@fib = λ{
  0: 0
  1: 1
  λ&n. (@fib((n - 1)) + @fib((n - 2)))
}
@main = @fib(10)
//55
```

Actual run: `55`, 760 interactions, 2512 nodes, 19.33M interactions/s on
an ordinary CPU. `0:`/`1:` switch on machine ints; the default arm names
its binder (`λ&n.` — cloned, since `n` is used twice).

## Pattern matching that actually parses

The primer's `<>:` list-cons pattern does **not** parse on current main
(`expected: name`). Match the constructor explicitly:

```hvm
@len = λ{
  []: 0
  #CON: λh. λt. (1 + @len(t))
}
@main = @len([1, 2, 3])
//3                -- verified: 16 interactions
```

`[]` is `#NIL{}` sugar and still works; Peano naturals use `Nn` sugar
with `0n:` / `1n+:` arms. Where this guide deviates from upstream docs, the
binary was the tiebreaker — every snippet above exited 0.
