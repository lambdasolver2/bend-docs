---
title: "Bend 2 tutorial 05: parallelism and the runtime"
description: "Parallel calls, the balanced fork shape with leaves, GPU calls with bang, --threads, how to measure a speedup honestly, and how to count keeps in the emitted C."
updated: 2026-10-18
verified: 2026-10-18
status: runnable
canonical: /tutorial/05-parallelism-and-runtime/
sources:
  - https://bend2.dev/learn/parallelism/
  - https://bend2.dev/learn/measuring-speedup/
  - https://bend2.dev/learn/gpu/
  - https://bend2.dev/notes/bendrt-explained/
  - https://bend2.dev/notes/ai-agents-bend/
  - https://github.com/bendlang/bend/blob/main/guide/GUIDE.md
---

# 05: parallelism and the runtime

Bend runs independent recursive calls in parallel without threads, locks, or annotations. You write a *parallel call*, and the compiler makes it a fork. Two promises come with it. The calls must be independent, which purity and affine ownership guarantee. They must also take about the same time, which is your job. This chapter shows the shape that meets the second promise, and how to check the result honestly.

## The parallel call

```bend
import Base

def pow2(+d: Nat) -> U32:
  match d:
    case 0n:
      1
    case 1n+p:
      a b = pow2(p) pow2(p)
      (a + b : U32)

def main() -> U32:
  pow2(12n)
```

```output
4096
```

`a b = pow2(p) pow2(p)` is one line with two calls. Both start together, and the line continues when both have finished. `+d` lets both calls use the depth. The checker runs this program and prints 4096. A native binary runs the same calls on several cores. Compile it with `bend pow2.bend -o pow2` and run `./pow2 --threads 8`.

Bang runs the calls on a GPU. `pow2!(12n)` sends that call and every parallel call it makes to the GPU. The lab machine for this tutorial has no GPU device (there is no `/dev/dri` and no NVIDIA device), so the bang form was not timed here. On a machine with no usable GPU, `--gpu off` runs bang calls on the CPU threads.

## How a call runs

A top-level definition is code, not a value, so calling it does not use it up. The checker counts uses of values: a closure may be called once, and a `+` value costs a reference count when it is shared (chapter 03). A definition may call itself as often as its argument shrinks (chapter 02).

The guide describes the run-time shape of those calls:

- A tail call compiles to a loop. `leaf` below calls itself in tail position, so each leaf becomes one loop.
- Bend has no C stack. Each definition compiles to a segment of a flat state machine, and a call is a jump.

## The fork shape: a tree of leaves

A parallel call that splits one call into two equal halves is a *fork*. Forking at every level down to single numbers costs more in scheduling than the work itself. The shape that works has two parts:

- **Tree.** Above a fixed depth, split the range in two equal halves with a parallel call.
- **Leaf.** Below the tree, a tail loop walks 8 to 64 consecutive items with scalar accumulators. A loop of this kind compiles to one native loop.

This program sums the numbers from 0 to 511 with eight leaves of 64 items each:

```bend
import Base

def leaf(+n: Nat, +i: U32, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      leaf(p, (i + 1 : U32), (acc + i : U32))

def tree(+d: Nat, +i: U32) -> U32:
  match d:
    case 0n:
      leaf(64n, i, 0)
    case 1n+p:
      a b = tree(p, i) tree(p, (i + (64 << p) : U32))
      (a + b : U32)

def main() -> U32:
  tree(3n, 0)
```

```output
130816
```

The check is arithmetic: the numbers 0 to 511 sum to 511 × 512 / 2 = 130816. Two details carry the design:

- The second half starts at `i + (64 << p)`. Each leaf covers 64 indices, so a tree of depth `p` covers `64 << p` indices, and the second half begins right after the first. The general formula is `i + (L << p)`, where `L` is the leaf size. With leaves of one item it is `i + (1 << p)`, which is why that form appears in other examples. With leaves of 64 it must use 64.
- The tree's halves are equal in work, because every leaf does the same 64 steps. A fork over unequal halves would leave one core idle.

Use a `tree` for data a fork splits, and a `List` for data a leaf walks once. Head-and-tail recursion over a list runs on one core, so use it only inside a leaf. Use an `Array` for data you index or update in place (chapter 03).

## Exercises

**1. Four levels.** Change the depth to `4n`. How many numbers are summed, and what is the output? Check your answer by running the program.

*Solution.* The tree covers 64 × 2⁴ = 1024 numbers, so the sum is 1023 × 1024 / 2 = 523776.

```bend
import Base

def leaf(+n: Nat, +i: U32, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      leaf(p, (i + 1 : U32), (acc + i : U32))

def tree(+d: Nat, +i: U32) -> U32:
  match d:
    case 0n:
      leaf(64n, i, 0)
    case 1n+p:
      a b = tree(p, i) tree(p, (i + (64 << p) : U32))
      (a + b : U32)

def main() -> U32:
  tree(4n, 0)
```

```output
523776
```

**2. Break the midpoint.** Replace `64 << p` with `1 << p` in the program above and run it. Explain the output before you run it.

*Solution.* The halves overlap. The second half starts only one index after the first, so most indices are summed several times and the total is wrong. Expect the program to print 17920, and that the number is not 130816.

```bend
import Base

def leaf(+n: Nat, +i: U32, acc: U32) -> U32:
  match n:
    case 0n:
      acc
    case 1n+p:
      leaf(p, (i + 1 : U32), (acc + i : U32))

def tree(+d: Nat, +i: U32) -> U32:
  match d:
    case 0n:
      leaf(64n, i, 0)
    case 1n+p:
      a b = tree(p, i) tree(p, (i + (1 << p) : U32))
      (a + b : U32)

def main() -> U32:
  tree(3n, 0)
```

```output
17920
```

Each leaf still sums 64 consecutive values from `i`. With the midpoint `i + (1 << p)`, the second half of a level-one tree starts one index after the first, so every leaf overlaps its neighbour by 63 values. The total counts many values several times, and 17920 is not the sum 0 to 511. The check is simple: whenever a parallel sum disagrees with the sequential sum, recompute the midpoints first.

## Build a native binary and run it

The checker runs a pure `main` slowly, so measure with a native build:

```sh
bend main.bend -o main
./main --threads 1
./main --threads 8
```

Both runs must print the same output. If they do not, the program has a bug, not a scheduling problem. The speedup is the one-thread time divided by the multi-thread time, measured on the same input, with checks that the outputs match.

## Measure honestly

A speedup claim needs five things:

1. The same input for every run, and the same output checked against the one-thread result.
2. Several runs per mode, reported as a median, with the order rotated between modes.
3. The machine, thread count, GPU setting, and compiler version written down with the numbers.
4. A named baseline. "Twelve times faster" means nothing without the two times.
5. Build time separate from run time. Compile first, then time only the binary.

Small inputs mislead: for work this small, process startup dominates the time. Measure with inputs big enough that the run takes long enough to time reliably, and state how long that is.

## Choosing the thread count

Bend has no automatic setting. `--threads` takes a number from 1 to 128, and without the flag a binary uses the CPU count, which `./main --help` prints. `--threads auto` is rejected:

```text
$ ./main --threads auto
bend: expected a thread count of 1 or more after --threads
```

> **Definition.** The thread count is the `--threads N` setting of a native binary: the number of CPU threads it runs on, from 1 to 128. Without the flag it is the CPU count.

> **Core insight.** The fastest count belongs to one program, one input, and one machine. The number of leaves does not give it. `tree(d)` has 2^d leaves, far more than any thread count, and the scheduler hands each task to a core once and never moves it (the guide). Measure.

A script can do the measuring. It runs each count after a warm-up, requires every run to print the output of the one-thread run, and reports the median and the range:

```sh
#!/usr/bin/env bash
# sweep.sh PROGRAM [THREADS...]
# Runs PROGRAM at each thread count after one warm-up run. Every timed run must
# print the same output as the one-thread run, or the sweep stops. Prints the
# median and range of RUNS runs per count, then the fastest count.
set -euo pipefail
prog=$1
shift
[ "$#" -gt 0 ] || set -- 1 2 4 8 12
runs=5
reference=$("$prog" --threads 1)
best_t=""
best_ms=""
for t in "$@"; do
  "$prog" --threads "$t" >/dev/null
  times=""
  for _ in $(seq "$runs"); do
    start=$(date +%s%N)
    out=$("$prog" --threads "$t")
    end=$(date +%s%N)
    if [ "$out" != "$reference" ]; then
      echo "threads=$t printed a different result; stopping" >&2
      exit 1
    fi
    times="$times $(( (end - start) / 1000000 ))"
  done
  sorted=$(printf '%s\n' $times | sort -n)
  median=$(printf '%s\n' "$sorted" | sed -n "$(( (runs + 1) / 2 ))p")
  low=$(printf '%s\n' "$sorted" | head -1)
  high=$(printf '%s\n' "$sorted" | tail -1)
  echo "threads=$t median=${median} ms (range ${low}-${high} ms)"
  if [ -z "$best_ms" ] || [ "$median" -lt "$best_ms" ]; then
    best_t=$t
    best_ms=$median
  fi
done
echo "fastest: --threads $best_t (${best_ms} ms)"
```

Save it as `sweep.sh` and run `bash sweep.sh ./main 1 2 4 8 12 16 24`, with `main` set to `tree(26n, 0)`. On the lab machine (12 CPUs) it printed:

```text
threads=1 median=366 ms (range 343-372 ms)
threads=2 median=214 ms (range 208-237 ms)
threads=4 median=150 ms (range 143-151 ms)
threads=8 median=108 ms (range 102-118 ms)
threads=12 median=112 ms (range 107-115 ms)
threads=16 median=108 ms (range 100-113 ms)
threads=24 median=101 ms (range 98-112 ms)
fastest: --threads 24 (101 ms)
```

Three things stand out:

- Most of the gain comes by 8 threads: 366 ms falls to 108 ms.
- The default of 12 was not the fastest. Sixteen and 24 were a few milliseconds faster, but their ranges overlap with the range of 12.
- On `tree(22n, 0)`, one thread took 22 ms, and each of 4, 8, 12, 16, and 24 threads took 14 to 17 ms. Those differences are about the size of the run-to-run spread, so the sweep cannot choose a count there. Use an input large enough to time, as the section Measure honestly says.

The script has limits. It times wall-clock time on the machine it runs on, so other load changes the numbers. It needs bash and GNU `date`. Its answer holds for this program, this input, and this machine. The guide says the GPU shines on uniform numeric work, such as mandelbrot or nbody, and that divergent work, such as n-queens, stays faster on the CPU. Measure those too, with `!` and without it.

## Count what the compiler emits

`bend main.bend -o main.c` writes the C source. Three names mark runtime work that copies or releases a shared value: `term_keep`, `ctr_take`, and `rfc_seal`. A reference count is a `term_keep`. A program that uses `+` on values pays for them, and a program that does not should have none in its own functions.

For the `pow2` program above, the compiler emitted `term_keep` 2 times, `ctr_take` 3 times, `rfc_seal` 2 times, and `term_peek` 6 times. A program with no sharing at all, `def main() -> U32: 1`, emits exactly the same counts. So those occurrences come from the runtime, and `pow2` adds none of its own. `term_peek` is a borrow, which costs no count. When you audit a program, compare its counts with that baseline, and treat any new keep in your own code as a regression to remove or explain.

## Next

Chapter 06 covers duplication and superposition, the terms behind labels and search. It also says plainly what the released compiler does not have.
