# Simple SAT Solver via superpositions

URL: https://gist.github.com/VictorTaelin/9061306220929f04e7e6980f23ade615


## File: sat.md


# Solving SAT via interaction net superpositions

I've recently been amazed, if not mind-blown, by how a very simple, "one-line"
SAT solver on Interaction Nets can outperform brute-force by orders of magnitude
by exploiting "superposed booleans" and optimal evaluation of λ-expressions. In
this brief note, I'll provide some background for you to understand how this
works, and then I'll present a simple code you can run in your own computer to
observe and replicate this effect. Note this is a new observation, so I know
little about how this algorithm behaves asymptotically, but I find it quite
interesting that this simple approach performs much better than it should.

## What are interaction net superpositions?

Interaction Nets are a new model of computation capable of evaluating lambdas
optimally. [HVM](https://github.com/HigherOrderCO) is a practical implementation
of that system. Since INets are fully linear, variables must be "cloned" via
"dup-nodes", which can be seen as "lazy cloners". Usually, these can only be
linked to variables, and are "invisible" to the user. But what happens if we
expose dup nodes as a first-class feature of the user-facing language?

Turns out that they behave like "superposed values", which can be seen as a new
programming feature that semantically means "this expression has two values at
the same time". In HVM, the superposition of `X` and `Y` is written as `{X Y}`.
When you apply a function to a superposed value, as in, `F({X Y})`, `F` will be
executed for each input, `X` and `Y`. So, for example, `double({2 3})` computes
to `{4 6}`. What makes this interesting, though, is that these calls are
"overlapped", in a way that *shares computations*, giving you a huge performance
boost.

<img src="https://pbs.twimg.com/media/GArVWfTW4AASNfQ?format=png" width="50%">

## What are its applications?

### 1. Fast function calls

When we apply a function to a tree of superposed values, it will behave like a
"map", and be applied to each value. For example, if `F(x) = x * 10`, then `F({1
2 3 4})` is seen as `{F(1) F(2) F(3) F(4)}`, which reduces to `{10 20 30 40}`,
with the advantage of computations being shared optimally across different
calls. For example, suppose that `F` has a heavy computation inside it:

```python
def F(x):
    return x + slow(999999)
```

Here, `slow(999999)` would take a long time to compute. Yet, when `F` is
applied to superposed values, that sub-expression would only be computed once,
saving a lot of work. This is a very general behavior. For example,
sub-expressions that depend on the inputs (and, thus, can't be computed once)
will still be "partly computed only once", as much as possible, making your
program much faster.

### 2. Automated vectorization

Another application is automated vectorization. If we compile eliminators and
destructors of datatypes to lambdas with different labels, these behave like
superpositions across different types. As such, if we evaluate, say, `(Not (Pair
True False))`, it will reduce to `(Pair False True)`. The `Not` eliminator
"passes through" the `Pair` constructor, and only interacts with the bools.

### 3. Search

Now, for the most interesting part; and what made me hyped enough to make this
post; we can also use superposition to **search**. For example, if we evaluate
`(And {True False} {True False})`, it will output `{{True False} {False
False}}`, which is the truth-table for the And function. In other words,
applying a function to a superposition of its complete domain results in a
superposition of its complete image.

So, what happens if we're searching for a specific output? Turns out we can use
superpositions to perform this "brute-force" search without loops. In other
words, instead of:

```python
for x0 in [T, F]:
    for x1 in [T, F]:
        for x2 in [T,F]:
            ...
            print F(x0, x1, x2, ...)
```

We do this instead:

```python
print F({T,F}, {T,F}, {T,F}, ...)
```


As you may have expected, the later will share a lot of computation across
"guesses", resulting in a search that is much faster than a naive brute-force
search would be. Below, we exploit this technique to find the solution of a SAT
problem in HVM. The "brute-force" algorithm takes 3 minutes to solve a random
instance with 32 variables in Rust. In HVM, the same instance is solved in 1
second by using superpositions. Below is an example SAT solver in HVM, for a
random instance with 16 variables:

```javascript
// Bool/List constructors and functions
(Cons h t)  = λcλn(c h (t c n))
Nil         = λcλn(n)
T           = λt λf t
F           = λt λf f
(Id a)      = a
(Not a)     = λt λf (a f t)
(And a b)   = (a λx(x) λx(F) b)
(Or a b)    = (a λx(T) λx(x) b)
(Or3 a b c) = (Or a (Or b c))

// Pretty prints a bool
(Bool x) = (x 1 0)

// Converts a solution to a pretty-printed church-list singleton
(Log x0 x1 x2 x3 x4 x5 x6 x7 x8 x9 xA xB xC xD xE xF x) = (x (Cons λt(t
  (Bool x0) (Bool x1) (Bool x2) (Bool x3)
  (Bool x4) (Bool x5) (Bool x6) (Bool x7)
  (Bool x8) (Bool x9) (Bool xA) (Bool xB)
  (Bool xC) (Bool xD) (Bool xE) (Bool xF)
) Nil) Nil)

// A random 3-SAT instance with 16 variables
(Foo x0 x1 x2 x3 x4 x5 x6 x7 x8 x9 xA xB xC xD xE xF) =
  (Log x0 x1 x2 x3 x4 x5 x6 x7 x8 x9 xA xB xC xD xE xF
  (And (Or3 xC x8 (Not xB))
  (And (Or3 (Not xA) (Not x2) (Not x8))
  (And (Or3 xB (Not x9) x4)
  (And (Or3 xA x1 (Not x8))
  (And (Or3 (Not x9) x0 x5)
  (And (Or3 (Not x4) (Not x4) xD)
  (And (Or3 (Not x1) (Not x4) xB)
  (And (Or3 (Not x2) xE (Not xD))
  (And (Or3 xD (Not x8) (Not x7))
  (And (Or3 xD (Not x1) x7)
  (And (Or3 (Not x8) x4 x8)
  (And (Or3 x5 (Not x0) xC)
  (And (Or3 x1 x0 (Not x3))
  (And (Or3 x3 xE (Not xD))
  (And (Or3 x9 (Not xC) (Not xB))
  (And (Or3 x8 (Not xE) (Not x5))
  (And (Or3 (Not x7) (Not x9) (Not xF))
  (And (Or3 xF xB x2)
  (And (Or3 (Not x2) (Not xE) (Not x7))
  (And (Or3 (Not xE) x3 (Not x3))
  (And (Or3 x3 (Not xF) x1)
  (And (Or3 (Not x0) x0 xD)
  (And (Or3 (Not x8) (Not x3) xC)
  (And (Or3 xC (Not x1) x7)
  (And (Or3 x2 (Not xE) (Not x0))
  (And (Or3 x6 (Not x5) x1)
  (And (Or3 (Not xC) x3 (Not x3))
  (And (Or3 (Not x1) (Not xC) (Not x5))
  (And (Or3 xB xA x6)
  (And (Or3 xF x6 x9)
  (And (Or3 (Not xF) x3 (Not x9))
  (And (Or3 (Not xB) x1 x8)
  (And (Or3 x9 (Not xE) xE)
  (And (Or3 (Not xA) (Not x2) x2)
  (And (Or3 x5 xE (Not x2))
  (And (Or3 (Not xB) xC x2)
  (And (Or3 x1 xB (Not x2))
  (And (Or3 x8 (Not x6) (Not x7))
  (And (Or3 xD x9 (Not xA))
  (And (Or3 x0 x8 (Not x8))
  (And (Or3 (Not xA) x9 (Not x0))
  (And (Or3 (Not xE) (Not x7) (Not xC))
  (And (Or3 x9 xC (Not xA))
  (And (Or3 (Not x7) (Not xF) xD)
  (And (Or3 x0 (Not x2) xD)
  (And (Or3 xC (Not x9) (Not x0))
  (And (Or3 (Not xA) x8 (Not x1))
  (And (Or3 x4 x5 (Not xE))
  (And (Or3 (Not x0) x5 (Not x7))
  (And (Or3 (Not x1) (Not xC) xA)
  (And (Or3 x0 xF x9)
  (And (Or3 (Not xA) x3 (Not x2))
  (And (Or3 (Not x7) (Not xF) x6)
  (And (Or3 (Not x1) x4 (Not x5))
  (And (Or3 xC (Not x8) x2)
  (And (Or3 x4 x7 (Not x5))
  (And (Or3 (Not x9) (Not x0) (Not xA))
  (And (Or3 xC x1 (Not x2))
  (And (Or3 xB xE (Not xB))
  (And (Or3 xF x5 xA)
  (And (Or3 (Not x6) xE x3)
  (And (Or3 (Not xB) xB x1)
  (And (Or3 (Not xF) x0 x7)
       (Or3 xE (Not x3) (Not x2))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

// Collapsers (to retrieve solutions from superpositions) - credit to @Franchu
Join = λaλbλcλn(a c (b c n))
Col0 = λx let #A0{x0 x1} = x; (Join x0 x1)
Col1 = λx let #A1{x0 x1} = x; (Join x0 x1)
Col2 = λx let #A2{x0 x1} = x; (Join x0 x1)
Col3 = λx let #A3{x0 x1} = x; (Join x0 x1)
Col4 = λx let #A4{x0 x1} = x; (Join x0 x1)
Col5 = λx let #A5{x0 x1} = x; (Join x0 x1)
Col6 = λx let #A6{x0 x1} = x; (Join x0 x1)
Col7 = λx let #A7{x0 x1} = x; (Join x0 x1)
Col8 = λx let #A8{x0 x1} = x; (Join x0 x1)
Col9 = λx let #A9{x0 x1} = x; (Join x0 x1)
ColA = λx let #AA{x0 x1} = x; (Join x0 x1)
ColB = λx let #AB{x0 x1} = x; (Join x0 x1)
ColC = λx let #AC{x0 x1} = x; (Join x0 x1)
ColD = λx let #AD{x0 x1} = x; (Join x0 x1)
ColE = λx let #AE{x0 x1} = x; (Join x0 x1)
ColF = λx let #AF{x0 x1} = x; (Join x0 x1)

// Finds a solution by applying Foo to superposed inputs
Main = 
  (Col0 (Col1 (Col2 (Col3
  (Col4 (Col5 (Col6 (Col7
  (Col8 (Col9 (ColA (ColB
  (ColC (ColD (ColE (ColF
  (Foo
    #A0{T F} #A1{T F} #A2{T F} #A3{T F}
    #A4{T F} #A5{T F} #A6{T F} #A7{T F}
    #A8{T F} #A9{T F} #AA{T F} #AB{T F} 
    #AC{T F} #AD{T F} #AE{T F} #AF{T F}
  )))))))))))))))))
```

Discussion: https://twitter.com/VictorTaelin/status/1744788091833917696
