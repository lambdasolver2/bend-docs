# Truly Optimal Evaluation with Unordered Superpositions

URL: https://gist.github.com/VictorTaelin/93c327e5b4e752b744d7798687977f8a


## File: truly_optimal_evaluation_with_unordered_superpositions.md

# Truly Optimal Evaluation with Unordered Superpositions

In this post, I'll address two subjects:

1. How to solve HVM's quadratic slowdown compared to GHC in some cases

2. Why that is relevant to logic programming, unification, and program search

## Optimal Evaluators aren't Optimal

HVM is an optimal λ-calculus evaluator in Lévy's sense: given an admissible
λ-term, it computes its normal form with the minimal number of β-reductions. This,
in some cases, leads to exponential speedups compared to non β-optimal
evaluators like Haskell's GHC, making HVM a promising tool for designing
purely functional algorithms. No wonder I was surprised when @oxalica opened a
[GitHub issue](https://github.com/HigherOrderCO/HVM/issues/60) reporting a
function which HVM computes quadratically slower than GHC.

After some research, I learned this problem isn't a bug - it is known and documented in the
literature. The culprit is the accumulation of "redundant" control nodes or
duplication nodes in some cases. To my understanding, only by eliminating these
can an "optimal" evaluator be truly optimal, not just in Lévy's sense
(minimizing β-reductions), but also in general (minimizing all steps in a Turing
machine). Asperti, BOHM's author, "patched" this by using "safe nodes", which they
describe in chapter 9 of "The Optimal Implementation of Functional Programming
Languages". Unfortunately, while this solution "works well in practice", it is
more of a workaround that doesn't work in all cases.

## What it Takes to be Optimal

After reasoning about the problem, I developed a good intuition about the issue,
which I'll explain in simple terms. To perform optimal evaluation, in the sense
of minimizing β-reductions, we need two things: 1. laziness, and 2. incremental
duplications. These must be features of an optimal evaluator since, without
them, work can be wasted either by evaluating unnecessary expressions or by
evaluating the same expression more than once. That's the key insight when it
comes to optimal functional evaluation.

Interestingly, Haskell is accidentally "almost optimal" because 1. it is lazy,
and 2. it also implements a form of lazy cloning via STG's thunks. Haskell's
thunks allow immutable datatypes to be shared and expressions to be "memoized".
Unfortunately, this doesn't work with lambdas, since we can't share free variables,
as they can become different in different contexts. This forces Haskell to undo
sharing to evaluate lambdas, duplicating work and leading to the famous cases
where Haskell is exponential while HVM is linear. Church Number exponentiation
is notorious precisely because it is a λ-term with tons of inherent sharing,
which fails to be captured by Haskell's evaluator.

Fan nodes, discovered in Optimal Evaluation literature, solve that issue
precisely by providing a solution to the problem of incrementally cloning a
lambda. Sadly, they introduce a different issue: that of accumulating
"redundant" fan nodes, leading to a quadratic slowdown in some cases. A
question thus remains: how do we avoid this quadratic slowdown in an otherwise
optimal evaluator, without an "ugly hack" like safe nodes? I now believe I have
a satisfactory approach that is quite elegant, which I'm going to share soon.
But before that, let's talk about superpositions and program search.

## Emulating Logic Programming with Superpositions

An interesting potential application of optimal evaluation is search.
In particular, if we turn fan nodes into first-class constructs, they can be used
directly in a program to express "superposed expressions", allowing us to
greatly optimize some computations. For example, consider:

```
@main = (@sum [1, 2, {3,4}, 5])
```

Here, `{3,4}` represents a superposition of `3` and `4`, placed in the same
index of the list. HVM will compute this expression and return `{11,12}`, which
is a superposition of the sum of both lists:

```
@main = {(@sum [1,2,3,5]) (@sum [1,2,4,5])}
```

Except that it won't actually clone the list like that. Instead, it will
traverse it only once, sharing computations along the way. In [this
Gist](https://gist.github.com/VictorTaelin/7fe49a99ebca42e5721aa1a3bb32e278), I
elaborate on how that can be used to accelerate Discrete Program Search. It can
also be used to emulate logic-based programming by representing pseudo
metavars as superpositions of all terms of a type, and then collapsing them to a
single value. See
[here](https://gist.github.com/VictorTaelin/9061306220929f04e7e6980f23ade615)
for a SAT solving example.

For the purpose of this post, let's focus on a simpler example. Suppose we want
to solve the following equation:

```c
X + 1 == 0b10010111
```

That is, we want to invert the `+ 1` operation and find the predecessor of
0b10010111. With superpositions, we could do it like this:

```c
// Metavar X: a superposition of all bitstrings
X = {E {(O X) (I X)}}

// BitString representing 0b10010111
Y = (I (I (I (O (I (O (O (I E))))))))

// Solves X + 1 == Y
Main =
  let goal = (Equal (Add X (I E)) Y)
  (Collapse (if goal { X } else { * }))
```

This will essentially "fork" HVM's runtime into infinite universes, one for each
value of X, and return the first one that satisfies the equation `X + 1 == Y`.
Then, in that universe, we print the value of `X`. In any other runtime, doing
so would be exponential on the bitstring length `S` - after all, there are 2^S
values to consider. Yet, this actually works on HVM and is merely quadratic.
The reason is that there is an immense amount of shared work across these
"universes", and optimal lazy evaluation quickly "aborts" any universe where the
equation isn't satisfied.

## Visualizing Quadratic Slowdown on Pseudo Unification

Does the above mean HVM (and Bend) can be used as great logic-based
programming tools out of the box? Not quite yet. Unfortunately, this same quadratic slowdown
also manifests here, somewhat preventing the idea. The issue is that, while we
indeed avoid the exponential blowup in cases like searching for a binary string
that satisfies a proposition - which is cool - we embarrassingly need quadratic
time to in cases that should absolutely be linear. For example, consider the goal:

```
X = 100
```

Where `X` is a Peano Nat. In any half-decent logic-based programming language,
this equation would immediately unify `X` as `100` in `O(1)` time - obviously
so. Now, in the "pseudo metavar" solution, we should expect that to be, at best,
linear time; after all, we need to spawn 100 "parallel universes" only to
destroy all universes where `X != 100`. Even if we completely ignored the cost
of spawning and destroying universes, just comparing `100 == 100` is already
linear. So, that's the best we can do. Yet, that's not too bad either. If it was
indeed linear, and efficient, it would actually be quite practical.

Yet, unfortunately, it isn't linear - it is quadratic. And the interaction
count blows up pretty badly for large enough numbers. Not exponentially bad, but
quadratically bad. Which is still bad. So, why does that happen?

To visualize this issue, I've drawn, by hand, the full evaluation of the process
of solving `X == 4` in HVM, where `4` is a Peano Nat, and `X` is a superposition
of all Peano Nats up to 4. Here it is:

```
{Z (S {Z (S {Z (S {Z (S Z)})})})} == (s (s (s (s z))))
------------------------------------------------------
{x0 x1} = (s (s (s (s z))))
{(Z == x0) ((S {Z (S {Z (S {Z (S Z)})})}) == x1)}
-------------------------------------------------
{x0 x1} = (s (s (s z)))
{(Z == (s x0)) ((S {Z (S {Z (S {Z (S Z)})})}) == (s x1))}
---------------------------------------------------------
{*  x1} = (s (s (s z)))
{⊥ ({Z (S {Z (S {Z (S Z)})})} == x1)}
-------------------------------------
{*  x1} = (s (s (s z)))
{x2 x3} = x1
{⊥ {(Z == x2) ((S {Z (S {Z (S Z)})}) == x3)}}
--------------------------------------------- WASTED 1
{*  x1} = (s (s z))
{x2 x3} = (s x1)
{⊥ {(Z == x2) ((S {Z (S {Z (S Z)})}) == x3)}}
--------------------------------------------- WASTED 2
{*  x1} = (s (s z))
{x2 x3} = x1
{⊥ {(Z == (s x2)) ((S {Z (S {Z (S Z)})}) == (s x3))}}
-----------------------------------------------------
{*  x1} = (s (s z))
{*  x3} = x1
{⊥ {⊥ ({Z (S {Z (S Z)})} == x3)}}
---------------------------------
{*  x1} = (s (s z))
{*  x3} = x1
{x4 x5} = x3
{⊥ {⊥ {(Z == x4) ((S {Z (S Z)}) == x5)}}}
----------------------------------------- WASTED 3
{*  x1} = (s z)
{*  x3} = (s x1)
{x4 x5} = x3
{⊥ {⊥ {(Z == x4) ((S {Z (S Z)}) == x5)}}}
----------------------------------------- WASTED 4
{*  x1} = (s z)
{*  x3} = x1
{x4 x5} = (s x3)
{⊥ {⊥ {(Z == x4) ((S {Z (S Z)}) == x5)}}}
----------------------------------------- WASTED 5
{*  x1} = (s z)
{*  x3} = x1
{x4 x5} = x3
{⊥ {⊥ {(Z == (s x4)) ((S {Z (S Z)}) == (s x5))}}}
-------------------------------------------------
{*  x1} = (s z)
{*  x3} = x1
{*  x5} = x3
{⊥ {⊥ {⊥ ({Z (S Z)} == x5)}}}
-----------------------------
{*  x1} = (s z)
{*  x3} = x1
{*  x5} = x3
{x6 x7} = x5
{⊥ {⊥ {⊥ {(Z == x6) ((S Z) == x7)}}}}
------------------------------------- WASTED 6
{*  x1} = z
{*  x3} = (s x1)
{*  x5} = x3
{x6 x7} = x5
{⊥ {⊥ {⊥ {(Z == x6) ((S Z) == x7)}}}}
------------------------------------- WASTED 7
{*  x1} = z
{*  x3} = x1
{*  x5} = (s x3)
{x6 x7} = x5
{⊥ {⊥ {⊥ {(Z == x6) ((S Z) == x7)}}}}
------------------------------------- WASTED 8
{*  x1} = z
{*  x3} = x1
{*  x5} = x3
{x6 x7} = (s x5)
{⊥ {⊥ {⊥ {(Z == x6) ((S Z) == x7)}}}}
------------------------------------- WASTED 9
{*  x1} = z
{*  x3} = x1
{*  x5} = x3
{x6 x7} = x5
{⊥ {⊥ {⊥ {(Z == (s x6)) ((S Z) == (s x7))}}}}
---------------------------------------------
{*  x1} = z
{*  x3} = x1
{*  x5} = x3
{*  x7} = x5
{⊥ {⊥ {⊥ {⊥ (Z == x7)}}}}
-------------------------
{*  x1} = z
{*  x3} = x1
{*  x5} = x3
{*  x7} = x5
{⊥ {⊥ {⊥ {⊥ (Z == x7)}}}}
------------------------- WASTED 10
{*  x3} = z
{*  x5} = x3
{*  x7} = x5
{⊥ {⊥ {⊥ {⊥ (Z == x7)}}}}
------------------------- WASTED 11
{*  x5} = z
{*  x7} = x5
{⊥ {⊥ {⊥ {⊥ (Z == x7)}}}}
------------------------- WASTED 12
{*  x7} = z
{⊥ {⊥ {⊥ {⊥ (Z == x7)}}}}
------------------------- WASTED 13
{⊥ {⊥ {⊥ {⊥ (Z == z)}}}}
------------------------ WASTED 14
{⊥ {⊥ {⊥ {⊥ ⊤}}}}
```

Now, take a careful look at the computation above. Can you spot the issue? Of
course you can, since I labeled the bad interactions with "WASTED". The issue
is, precisely, that of accumulating redundant duplication nodes. For example, in
the part from "WASTED 6" to "WASTED 9", it takes 4 interactions to copy that
single "S" from the right-hand side value to the equations, because the constructor has to
jump between a chain of "redundant" duplications that make a copy only to immeidatelly
discard it. As the program evolves, each subsequent copy of a head "S"
constructor takes +1 interaction, resulting in a quadratic blowup. To fully copy
the Peano Nat `1000`, we would need about 1 million interactions!

## BOHM's Old Solution: Safe Nodes and Interactions

So, how could we solve this? As I mentioned, Asperti solved it "in practice" on
BOHM by implementing "safe nodes". The idea is to remove redundant duplications;
i.e., whenever we have:

```
{* x} = T
```

We just substitute `x <- T` and remove that fan node. The problem is that this
rule isn't always safe: if there is a SUP node with the same label as that DUP
node in some other part of the program, merely removing it could result in an
incorrect interaction later on. Asperti's idea is to flag nodes that are safe in
the sense that applying this rule is harmless. That basically happens when a
DUP node never annihilated with a LAM node. In HVM terms, that's because the
DUP-LAM rule creates a DUP and a SUP, rather than two DUPs:

```
! &L{r s} = λx(f)
----------------- DUP-LAM
! &L{f0 f1} = f
r <- λx0(f0)
s <- λx1(f1)
x <- &L{x0 x1}
```

As long as there are only DUPs (or only SUPs) of a given fan node label, this
rule can be safely applied for these nodes. Asperti keeps a boolean flag on the
nodes, which works well enough. For HVM, this approach isn't so promising,
though, because this technique relies on erasure interactions, which HVM
doesn't perform. So, what's the plan?

## Visualizing a Haskellish Solution

Let's for a moment consider the following thought experiment: imagine we had
a new kind of superposition node that behaved like a hybrid of Haskell's
thunks and HVM's duplicators. That is, whenever a SUP would generate a DUP;
for example, via the APP-SUP rule:

```
(&L{a b} c)
----------------- APP-SUP
! &L{x0 x1} = c
&L{(a x0) (b x1)}
```

We, instead, create a "Haskell-like thunk". How would that work? Let's try.

```
{Z (S {Z (S {Z (S {Z (S Z)})})})} == (s (s (s (s z))))
------------------------------------------------------
{x} = (s (s (s (s z))))
{(Z == x) ((S {Z (S {Z (S {Z (S Z)})})}) == x)}
-------------------------------------------------
{x} = (s (s (s z)))
{(Z == (s x)) ((S {Z (S {Z (S {Z (S Z)})})}) == (s x))}
--------------------------------------------------------
{x} = (s (s (s z)))
{⊥ ({Z (S {Z (S {Z (S Z)})})} == x)}
------------------------------------ *
{x} = (s (s (s z)))
{⊥ {(Z == x) ((S {Z (S {Z (S Z)})}) == x)}}
---------------------------------------------
{x} = (s (s z))
{⊥ {(Z == (s x)) ((S {Z (S {Z (S Z)})}) == (s x))}}
---------------------------------------------------
{x} = (s (s z))
{⊥ {⊥ ({Z (S {Z (S Z)})} == x)}}
-------------------------------- JOIN x
{x} = (s (s z))
{⊥ {⊥ {(Z == x) ((S {Z (S Z)}) == x)}}}
---------------------------------------
{x} = (s z)
{⊥ {⊥ {(Z == (s x)) ((S {Z (S Z)}) == (s x))}}}
-------------------------------------------------
{x} = (s z)
{⊥ {⊥ {⊥ ({Z (S Z)} == x)}}}
----------------------------
{x} = (s z)
{⊥ {⊥ {⊥ {(Z == x) ((S Z) == x)}}}}
-------------------------------------
{x} = z
{⊥ {⊥ {⊥ {(Z == (s x)) ((S Z) == (s x))}}}}
-------------------------------------------
{x} = z
{⊥ {⊥ {⊥ {⊥ (Z == x)}}}}
------------------------
{⊥ {⊥ {⊥ {⊥ (Z == z)}}}}
------------------------
{⊥ {⊥ {⊥ {⊥ ⊤}}}}
```

Well, that's much shorter! But what does that even mean in the context of
Interaction Combinators? Can these concepts mix? I think they can.

## Thunks are Unordered DUP Nodes

My interpretation of this is that, from the point of view of Interaction
Combinators, what the program above did was exploit the concept of an *unordered
superposition* - that is, a SUP node `{x y}` such that `∀x y. {x y} == {y x}` -
as well as its DUP node counterpart. In other words, where the runtime is free
to swap the SUP's ports, and where the user isn't able to split a SUP node in
two; they can only "pop an element of the bag". But how does that relate to the
evaluation above?

Let's think about this: suppose we had a tree of DUP nodes cloning the nat `3`,
and using it inside some list later:

```
{x0 xA} = (S (S (S Z)))
{x1 xB} = xA
{x2 xC} = xB
{x3 xD} = xC
...
[... x0 x1 x2 x3 ... ]
```

How many steps would HVM need to take the `wnf` of `x0`, `x1`, `x2` and `x3`?
Intuitively, it should be `1` for all - but that's not what happens. Since the
DUP nodes form a tree, `x0` will immediately evaluate to `(S ...)`, in a single
DUP-CTR interaction, while `x3` will require 4 interactions, as `S` moves down
the tree, all the way to the list:

```
{x0 xA} = (S (S (S Z)))
{x1 xB} = xA
{x2 xC} = xB
{x3 xD} = xC
...
[... x0 x1 x2 x3 ... ]
----------------------
{x0 xA} = (S (S Z))
{x1 xB} = (S xA)
{x2 xC} = xB
{x3 xD} = xC
...
[... (S x0) x1 x2 x3 ... ]
--------------------------
{x0 xA} = (S (S Z))
{x1 xB} = xA
{x2 xC} = (S xB)
{x3 xD} = xC
...
[... (S x0) (S x1) x2 x3 ... ]
------------------------------
{x0 xA} = (S (S Z))
{x1 xB} = xA
{x2 xC} = xB
{x3 xD} = (S xC)
...
[... (S x0) (S x1) (S x2) x3 ... ]
----------------------------------
{x0 xA} = (S (S Z))
{x1 xB} = xA
{x2 xC} = xB
{x3 xD} = xC
...
[... (S x0) (S x1) (S x2) (S x3) ... ]
--------------------------------------
```

Which is suboptimal. Now, suppose that SUP/DUP nodes were unordered. This would
allow the runtime to freely rearrange the tree of DUPs. So, if we knew, for a
fact, that `x3` was more important, for whatever reason - we could, in theory,
rearrange the nodes so that `x3` is the closest to the number instead. That
alone would be enough for us to solve the quadratic slowdown in that case. But
why stop there? If we're able to rearrange DUPs at will, why do we need to store
two variables on DUP nodes at all? After all, if DUPs are unordered, then the
`x` and `y` in `{x y} = V` are observationally equivalent. So, we can, instead,
merge both ports and store a single variable instead:

```
{x} = (S (S (S Z)))
{y} = x
{z} = y
{w} = z
...
[... x y z w ... ]
```

But wait - these *chains of DUPs* are now clearly redundant. So, we can just
shorten it all as:

```
{x} = (S (S (S Z)))
[... x x x x ... ]
```

And, now, any of the occurrences of `x` can wnf in `O(1)`! Cool, right?

## Unordered DUP/SUP Interactions: where they help, what they break

But wait, hold on - have we actually just reinvented Haskell's thunk? Are we
discovering the groundbreaking technique of... *ref counting*? Well, yes and no.
Let's take a moment to reason about how this would actually work in the context
of interactions. For example, if the conventional DUP-CTR interaction is:

```
{x0 x1} = (S pred)
------------------ DUP-CTR
x0 <- (S y0)
x1 <- (S y1)
{y0 y1} = pred
```

Then, the UDUP-CTR interaction is:

```
{x} = (S pred)
-------------- UDUP-CTR
x <- (S y)
{y} = pred
```

That basically means that the first thread to come in performs the interaction,
peeling an `S` layer off, and storing `(S y)` as `x` in the substitution map,
where `y = pred` is a fresh new unordered duplication node. Moreover, since many
parts of the program can now access the same variable `x`, we better make the
subst map ref-counted, allowing us to clear an entry when a substitution has
been consumed by all of its occurrences. Fair enough, right? And indeed, so far,
this looks almost exactly like how Haskell behaves. So, where do things fall apart?

Let's have a look at the DUP-LAM interaction:

```
{f0 f1} = λx(body)
-------------------- DUP-LAM
{body0 body1} = body
f0 <- λx0(body0)
f1 <- λx1(body1)
x  <- {x0 x1}
```

If we collapsed SUPs and DUPs to be unordered, then the corresponding UDUP-LAM
would become something like...

```
{f0 f1} = λx(body)
-------------------- UDUP-LAM
{body'} = body
f0 <- λx0(body')
f1 <- λx1(body')
x  <- {x0 x1}
```

Which looks rather problematic. This is why Haskell undoes sharing when a
lambda is involved. Otherwise, we'd have the bizarre behavior that cloned
lambdas become "entangled" in a rather defective manner: they now share the same
body, and whenever we apply one of them to an argument, the substitution may
end up happening on its entangled lambda's body - randomly so. After all, the
`{x0 x1}` superposition is part of both bodies, but that SUP is unordered! That
looks like a very useless feature to have and definitely something too strange
to call a lambda - even by my standards. For example, consider:

```
{f0 f1} = λx(x)
[f0 f1]
----------------
{f0 f1} = {x0 x1}
[λx1(f0) λx0(f1)]
-----------------
[λx1(x0) λx0(x1)]
```

The program above attempted to copy the identity function by using an unordered
DUP. It resulted in two lambdas with their bodies hilariously mixed up - which
is not invalid in HVM, but is devoid of any meaning or sense. This also means
that, sadly, unordered dups can't really be used to emulate logic-based
programming with λ-encodings. But they provide a way to copy low-order datatypes
that is closer to how Haskell does it (solving the quadratic issue posted by
@oxalica), while also allowing us to emulate logic-based programming on HVM
with, I believe, possibly reasonable asymptotics: to emulate a metavariable, we
just create a superposition of all elements of a datatype. 

## Conclusion

In essence, this is kinda like ref counting - or, rather, how ref counting would
work in the context of an interaction net system, and where it would break. 
In special, it justifies and
explains how we should proceed to incorporate something akin to Haskell's thunk
on HVM's model. This gives us Haskell-like asymptotics in cases where HVM would
be quadratic (as pointed in that old GitHub issue), while still allowing us to
remain linear in cases where GHC is exponential (sharing closures).
And a cool side-effect is that
we gain access to the dual of thunks - i.e., unordered superpositions. And that
could have powerful applications to search and logic based programming, since
USUP nodes allow us to create superposed values in a way that optimally reuses
computation across universes.

I've not implemented any of this yet, and this is all theoretical for now and I
could be wrong. But it makes sense to me, and I plan to add it soon to the [HVM3
WIP repository](https://github.com/HigherOrderCO/HVM3).

## Edit:

This has now been implemented experimentally on HVM3 and it, indeed, **reduces
the interaction count (and run time) of the program above, from quadratic to
linear!** That said, I have more to say about the UDUP-LAM interaction. 

Initially, my plan was to just not implement it. That is, consider it undefined
behavior and throw a runtime error when it occurs. Sadly, for the examples above
to work, we actually need to provide some UDUP-LAM rule. That's because UDUPs
will eventually interact with LAM nodes during its reduction. This was not
visible on my drawings because I conveniently reduced `A == B` in a single step,
but `==` is meant to represent a user-defined equality function for Peano Nats.
Something like:

```
eq a b = match a {
  #Z: match b {
    #Z: 1
    #S: λb_pred 0
  }
  #S: λa_pred match b {
    #Z: 0
    #S: λb_pred (eq ap bp)
  }
}
```

So, when we have an application like `(eq {A0 A1} B)`, i.e., with an unordered
superposition, it will reduce to:

```
match {A0 A1} {
  #Z: zero-case
  #S: λa_pred succ-case
}
```

Which will then reduce to:

```
{Z} = zero-case
{S} = λa_pred succ-case
{
  match A0 { #Z:zero-case #S:succ-case }
  match A1 { #Z:zero-case #S:succ-case }
}
```

And here we have `{S} = λa_pred succ-case`, which means we absolutely need to
provide *some* justification for the UDUP-LAM rule. What now?

I could go ahead and just implement the rule I suggested. It would actually
work, if we ignore the fact it isn't too useful to clone lambdas (due to the
swapped bodies issue). The problem is, due to the optimization where we store
both UDUP binders in a single port - which is what allow us to merge UDUP nodes
and get the quadratic speedup - we can't actually implement the UDUP-LAM rule
as written. That rule relies on both ports existing.

Now, observe that, for this specific case, the `{Z} = zero-case` and the `{S} =
succ-case` do not actually need to clone anything, because our initial
superposition covered different variants of the Nat type: Z and S. As such,
either we'll select zero/succ, or succ/zero, but never zero/zero or succ/succ.
The body is never cloned. This "happy coincidence" (inets have many of these,
don't they?) suggests a clever solution: rather than making the UDUP-LAM rule
undefined, we can define it, under the assumption that it will only be used
once. The definition, thus, becomes:

```
! &L{F} = λx(f)
----------------- UDUP-LAM
! &L{G} = f
F <- λx0(G)
F <- *
x <- &L{x0 *}
```

That is, when we perform an "unordered duplication" of a lambda, we forcefully
erase one of the copies, based on the assumption that this UDUP node is only
triggered once. That's always the case when it was generated by a superposition
of different variants of an ADT, which is the main use-case I'm looking for.
That said, this means HVM3 is not a faithful implementation of unordered
superpositions. I'll think whether we can have the quadratic speedup and a
proper UDUP-LAM interaction later on, as the "body swapping" behavior might
perhaps be desirable in some contexts (which?). Perhaps we should just keep the
2 ports, and just swap UDUPs when convenient?

## Edit: simpler implementation based on oportunistic swaps

*(Note: ignore this section - move to the last edit)*

~~I've now changed HVM3's implementation to keep unordered DUP/SUP nodes identical
to the ordered versions; that is, I'm not merging UDUP binders into a single
port anymore. That greatly simplifies the code, as we don't need to implement a
new node type: just store an "unordered" bit on normal DUP/SUP nodes, and reuse
the same code. That bit essentially tells the runtime we don't care about the
order of elements, allowing it to permute nodes at will. Then, to solve the
quadratic issue, it suffices to perform oportunistic swaps on unordered DUP
nodes. Specifically, whenever we enter an UDUP node from its aux port, and
provided its parent node is also an UDUP node, we will swap these nodes - and
that's it.~~

~~The reason this work is that, whenever we access a DUP node, we essentially push
it closer to the values it wants to clone, giving it "higher priority". The
chain of "redundant" UDUP nodes will still be formed, but it will now be
harmless, since redundant nodes will be "pushed away from the action", and be
collected later. This solves the quadratic issue, as now we're able to use
unordered dups to share immutable datatypes with the same asymptotics of
Haskell's thunks.~~

~~In short: the simplest way to solve the quadratic slowdown in an optimal
evaluator is to merely store an "unordered" bit on SUP/DUP nodes, and swap UDUP
with their parents whenever we access them during the lazy evaluation
traversal.~~

~~To be more specific, I use the following commutation rules in HVM3:~~

```
// ,----------------,---------------,
// :    v      v    :    v      v   :
// :    |      |    :    |      |   :
// :   /#\    /_\   :   /#\    /_\  :
// :   | |    | |   :   | |    | |  :
// :  /_\y    a/#\  :  /_\y   /#\b  :
// :  | |     ↑| |  :  | |    | |↑  :
// :  a b      x y  :  a b    x y   :
// :  ↑        b    :    ↑    a     :
// :----------------|---------------|
// :   v       v    :   v       v   :
// :   |       |    :   |       |   :
// :  /#\     /_\   :  /#\     /_\  :
// :  | |     | |   :  | |     | |  :
// : x /_\    a/#\  : x /_\   /#\b  :
// :   | |    ↑| |  :   | |   | |↑  :
// :   a b     x y  :   a b   x y   :
// :   ↑         b  :     ↑     a   :
// '----------------'---------------'
```

~~Or, in textual form:~~

```
// %L{y0 y1} = v 
// %L{x0 x1} = y0
// --------------- DUH_DUH
// %L{x0 x1} = v
// %L{y0 y1} = y0 
// x1 <- y0
```

~~(And variations.)~~

~~This approach is cleaner than what I wrote earlier not just because it is much
simpler to implement, but because it is a proper implementation of unordered
sups/dups, allowing us to define all interactions, including UDUP-LAM, without
the weird issues and limitations I mentioned earlier. An "unordered duplication"
of a lambda might still cause lambdas to swap their bodies, but the operation is
well-defined now.~~

~~It is worth noting, though, that unordered sups/dups might break strong
confluence, as it is an interaction that happens between a node and its aux
port. Specifically, the use of unordered node causes HVM3 to report different
interaction counts when certain optimizations are on (i.e., when the graph is
traversed in a different order). This is something that I plan to investigate
futurely.~~

## Edit:

Oops - after testing and inspecting the memory, I realize the "cleaner" approach
above doesn't actually solve the quadratic issue, as the complexity is just
moved to swap rules. That said, the initial approach works, and I also realize
there is a more sensible definition for the UDUP-LAM rule:

```
{F} = λx(f)
---------------- UDP-LAM
{F} = λx0(G)
{G} = f
x <- {x0 x1}
λx1(G)
```

This says that, to unordered-dup a lambda, we create two fresh lambdas: `λx0`,
for our immediate consumption, and `λx1`, for future cloners.  Then, we
substitute `x` by an unordered superposition, `{x0 x1}`, including both lambda's
variables. Finally, we create an unordered duplication of the λ's body, and
attach it to both fresh lambdas. Essentially, this creates a mechanism to clone
a λ infinitely many times. Each time a clone is made, its bound variable if
superposed further and further.

As far as my tests go, this works really well. I also realized that we don't
need to store two ports on UDUP nodes; just one. That's because an UDUP node is
never "consumed", becoming a substitution. It is always kept alive, serving as
an "infinite" (or ref-counted) producer of the value it duplicates. In a way,
this also means UDUPs are actually an implementation of non-linear variables on
interaction nets, sort of?

Below is an example on how to use that to solve `X + 12345 = 1000000` on HVM3:

```
// Unary Peano Nats
data Nat { #Z #S{pred} }

// Converts an U32 to a Nat
@nat(n) = ~n{
  0: #Z
  _: λnp #S{@nat(np)}
}

// Converts a Nat to an U32
@u32(n) = ~n{
  #Z: 0
  #S: λnp (+ 1 @u32(np))
}

// Adds two Nats
@add(a b) = ~a{
  #Z: b
  #S: λap #S{@add(ap b)}
}

// Compares two Nats for equality
@eq(a b) = ~a{
  #Z: ~b{
    #Z: 1
    #S: λbp 0
  }
  #S: λap ~b{
    #Z: 0
    #S: λbp @eq(ap bp)
  }
}

// A Pseudo Metavar "X"
// (Implemented as a superposition of all Nats)
@X = %0{#Z #S{@X}}

// Collapses a boolean view on 'X', returning it
@colX(X) = !%0{v}=X @colXGo(v)

@colXGo(v) = ~v{
  0: (+ 1 @colXGo(v))
  _: λp 0
}

// Solves X + 1234 = 10000
@main = @colX(@eq(@add(@nat(12345) @X) @nat(1000000)))
```

The program above correctly outputs `987655` in just `24m` interactions, showing
it is clearly linear on the length of the Nat (which is `1m`). We've
successfully used HVM3 as a logic programming language, even though it isn't!

For completion, below is an snapshot of the entire HVM3 lazy-mode design:

### HVM3 Syntax

```
// Top-Level Function
@name(x y z) = body

// Expressions
@name(x y z)       // Function Call
x                  // Variable
λx λy λz expr      // Lambda
(f x y z)          // Application
&L{x y}            // Superposition
!%L{x y}=v expr    // Duplication
!x=a expr          // Let binding
#Ctr{x y z}        // Constructor
~x{ #Z:A #S:λp B } // Pattern matching
123                // Number literal
(+ x y)            // Numeric operation
%L{x y}            // Unordered Superposition
!%L{x}=a expr      // Unordered Duplication
```

### HVM3 Interactions

```
@foo
--------- REF
book[foo]

! x = val
bod
--------- LET
x <- val
bod

(* a)
----- APP-ERA
*


(λx(body) a)
-------------- APP-LAM
x <- a
body

(&L{a b} c)
----------------- APP-SUP
! &L{x0 x1} = c
&L{(a x0) (b x1)}

(%L{a b} c)
----------------- APP-USUP
! %L{x} = c
%L{(a x) (b x)}

(#{x y z ...} a)
---------------- APP-CTR
⊥

(123 a)
------- APP-W32
⊥

! &L{x y} = *
------------- DUP-ERA
x <- *
y <- *

! &L{x y} = λz(f)
----------------- DUP-LAM
! &L{f0 f1} = f
x <- λz0(f0)
y <- λz1(f1)
z <- &L{z0 z1}

! &L{x y} = &R{a b}
------------------- DUP-SUP
if L == R:
  x <- a
  y <- b
else:
  x <- &R{a0 b0} 
  y <- &R{a1 b1}
  ! &L{a0 a1} = a
  ! &L{b0 b1} = b

! &L{x y} = %R{a b}
------------------- DUP-USUP
x <- %R{a0 b0} 
y <- %R{a1 b1}
! &L{a0 a1} = a
! &L{b0 b1} = b

! &L{x y} = #{a b c ...}
------------------------ DUP-CTR
! &L{a0 a1} = a
! &L{b0 b1} = b
! &L{c0 c1} = c
...
x <- #{a0 b0 c0 ...}
y <- #{a1 b1 c1 ...}

! &L{x y} = 123
--------------- DUP-W32
x <- 123
y <- 123

~ * {K0 K1 K2 ...} 
------------------ MAT-ERA
*

~ λx(x) {K0 K1 K2 ...}
---------------------- MAT-LAM
⊥

~ &L{x y} {K0 K1 K2 ...}
------------------------ MAT-SUP
! &L{k0a k0b} = K0
! &L{k1a k1b} = K1
! &L{k2a k2b} = K2
...
&L{ ~ x {K0a K1a K2a ...}
    ~ y {K0b K1b K2b ...} }

~ %L{x y} {K0 K1 K2 ...}
------------------------ MAT-USUP
! %L{k0} = K0
! %L{k1} = K1
! %L{k2} = K2
...
%L{ ~ x {K0 K1 K2 ...}
    ~ y {K0 K1 K2 ...} }

~ #N{x y z ...} {K0 K1 K2 ...} 
------------------------------ MAT-CTR
(((KN x) y) z ...)

~ num {K0 K1 K2 ... KN}
----------------------- MAT-W32
if n < N: Kn
else    : KN(num-N)

<op(* b)
--------- OPX-ERA
*

<op(λx(B) y)
------------- OPX-LAM
⊥

<op(&L{x0 x1} y)
------------------------- OPX-SUP
! &L{y0 y1} = y
&L{<op(x0 y0) <op(x1 y1)}

<op(%L{x0 x1} y)
------------------------- OPX-USUP
! %L{y0} = y
%L{<op(x0 y0) <op(x1 y0)}

<op(#{x0 x1 x2...} y)
---------------------- OPX-CTR
⊥

<op(x0 x1)
----------- OPX-W32
<op(x0 x1)

>op(a *)
--------- OPY-ERA
*

>op(a λx(B))
------------- OPY-LAM
⊥

>op(a &L{x y})
------------------------- OPY-SUP
&L{>op(a x) >op(a y)}

>op(a %L{x y})
--------------------- OPY-USUP
%L{>op(a x) >op(a y)}

>op(#{x y z ...} b)
---------------------- OPY-CTR
⊥

>op(x y)
--------- OPY-W32
x op y

! %L{x} = *
----------- UDUP-ERA
x <- *

! %L{x} = λz(f)
---------------- UDUP-LAM
! %L{G} = f
x <- λz0(G)
z <- %L{z0 z1}
λz1(G)

! %L{x} = &R{a b}
----------------- UDUP-SUP
x <- &R{a0 b0}
! %L{a0} = a
! %L{b0} = b

! %L{x} = %R{a b}
----------------- UDUP-USUP
if L == R:
  ! %L{x} = b
  a
else:
  x <- %R{a0 b0}
  ! %L{a0} = a
  ! %L{b0} = b

! %L{x} = #{a b c ...}
---------------------- UDUP-CTR
! %L{ax} = a
! %L{bx} = b
! %L{cx} = c
...
x <- #{ax bx cx ...}

! %L{x} = 123
------------- UDUP-W32
x <- 123
```
