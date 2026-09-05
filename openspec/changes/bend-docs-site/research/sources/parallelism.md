# Automatic parallelism in Bend2

Last updated 2026-08-13. Canonical: https://bend2.dev/learn/parallelism/

Bend2 parallelizes ordinary recursion: split the work in two, and the runtime evaluates the
halves concurrently, with no pragmas, no threads, and no scheduler in the program. The program
sums 2²⁴ numbers this way.

```
import Base

# Sums a range of numbers in parallel.
def sum(d: U32, i: U32) -> U32:
  match d:
    case 0:
      i
    case 1+d:
      a, b = sum(d, i*2), sum(d, i*2+1) # fork
      a + b

# Runs sum on the GPU, via `!`.
def main() -> U32:
  sum!(24, 0)
```

## The fork

Bend2 forks where the data flow splits. `a, b = sum(d, i*2), sum(d, i*2+1)` starts both
recursive calls, and nothing joins them until `a + b` needs both results. The calls share no
state, so on the interaction-net runtime they are disjoint subgraphs, and any idle core can
reduce either one without locks; the mechanism is in
[Interaction nets, explained](/notes/interaction-nets-explained/).

## The match

Bend2 pattern-matches on numbers with a successor case. `case 0:` handles zero, and
`case 1+d:` matches any value of at least one, binding `d` to one less than the value matched;
the new `d` shadows the argument, and the recursive calls use it. A branch body is an
expression, with no `return` anywhere. The arguments are `U32`, 32-bit unsigned integers,
where Bend1's node encoding [stopped at 24 bits](/notes/bend2-vs-bend1/).

## What it computes

The Bend2 program sums every integer below 2²⁴. Each call owns a block of 2ᵈ consecutive
integers and splits it in half, and at depth 0 the block is the single number `i`, so
`sum(24, 0)` covers 0 through 16,777,215. The exact sum is 140,737,479,966,720, which does not
fit in a `U32`.

## Running it on the GPU

Bend2 picks the device separately from the parallelism: `sum!(24, 0)` runs the same call on
the GPU, and the fork is what gives the GPU work to spread. The `!` has
[its own page](/learn/gpu/).