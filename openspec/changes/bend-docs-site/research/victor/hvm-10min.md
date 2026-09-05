# Optimal Evaluation in 1 Minute or 10 Minutes or 10 Years

URL: https://gist.github.com/VictorTaelin/311f6a58a7756945196c15733e61d0c6


## File: optimal_evaluation_in_1_or_10_or_10_years.md



# Optimal Evaluation in 1 Minute (or 10 Minutes) (or 10 Years)

## Short Version (1 minute)

A prerequisite to intelligence is the ability to find a program that explains a pattern. Programs are functions. To test a candidate program, we need to implement a "function evaluator". The problem is: all modern programming languages are sub-optimal "function evaluators", which, in the context of search, leads to massive slowdowns. To implement an optimal interpreter, we need to: 1. postpone the execution of expressions, to avoid wasted work, 2. cache the result of postponed expressions, to avoid duplicated work, 3. incrementally copy cached structures, to ensure 1 and 2 don't interfere. Haskell *almost* achieves this, but falls short on 3, because it is unable to incrementally copy lambdas. To solve this, we introduce the concept of a "superposition", which allows multiple versions of a term to exist simultaneously. This ensures that no work is ever wasted or duplicated, allowing us to optimally interpret (or compile) a given language.

## Long Version (10 minutes)

A prerequisite to intelligence is the ability to find a program that explains a pattern. Programs are functions. To test a candidate program, we need to implement a "function evaluator". The problem is: it turns out all modern programming languages are sub-optimal "function evaluators"! For example, consider the following Python expression:

```python
arr = [9999 ** 2, 42]
print(arr[1])
```

When running this program, Python will gladly compute `9999**2`, even though that expression isn't ever used. That's wasted work. In a large space of random programs, the number of unnecessary computations is massive - thus, the amount of wasted work in naive program search is colossal, making it very slow. But what if we could prevent all that waste?

Here's the plan: let's "postpone" computing expressions for only when they're needed. So, for example, in the program above, we'd only compute `9999**2` if we printed it to the screen - which we don't, so it is never computed. By designing an interpreter around that idea, we'd never evaluate unnecessary expressions, greatly speeding up our computation. Except for a small problem: postponing, turns out, can accidentally cause *duplicated work*. For example, consider:

```python
mul2 = lambda x: x + x
print(mul2(9999**2))
```

If we blindly postpone the execution of `9999**2`, the program above will evaluate to:

```python
(9999**2) + (9999**2)
```

Which will compute the same expression twice. That's terrible! Postponing let us avoid unnecessary expressions, at the cost of computing necessary expressions twice, which is equally bad. Is all hope lost? Not yet. Here's an idea: what if we also *cached* the result of a postponed expression? For example, in the same program:

```python
mul2 = lambda x: x + x
print(mul2(9999**2))
```

We could first apply `mul2`, postponing `9999**2` in a "cached thunk":

```python
cache x = 9999**2
print(x + x)
```

Now, since `x` is clearly used, we could then proceed to compute `9999**2`, copy the result, and perform the addition. That wastes no work! So, is that all? Are we optimal yet? Well, almost... but now we need to decide how we evaluate cached expressions. For example, consider:

```python
cache xs = [10 ** 2, 20 ** 2, 30 ** 2]
print(xs[0] + xs[0])
```

In this case, the cached expression has many sub-expressions that also need to be evaluated. How do we proceed? If we just evaluate the whole expression and "memcpy" the entire result, we'll compute `20 ** 2` and `30 ** 2`, which aren't used. That's not good. If we, instead, copy first, and evaluate later, then, we'll have:

```python
cache xs = [10 ** 2, 20 ** 2, 30 ** 2]
print(xs[0] + xs[0])
----------------------------------------------------------------------
print([10 ** 2, 20 ** 2, 30 ** 2][0] + [10 ** 2, 20 ** 2, 30 ** 2][0])
----------------------------------------------------------------------
print((10 ** 2) + (10 ** 2))
----------------------------
print(100 + 100)
```

Which not only copies the whole array unnecessarily, but also computes `10 ** 2` twice. Seems like we're back to the same issue! Fortunately, it turns out there IS a proper way to do it: just **copy incrementally**. Like this:

```python
cache xs = [10 ** 2, 20 ** 2, 30 ** 2]
print(xs[0] + xs[0])
--------------------------------------
cache xs = [100, 20 ** 2, 30 ** 2]
print(xs[0] + xs[0])
--------------------------------------
cache xs = [20 ** 2, 30 ** 2]
print(100 + 100)
--------------------------------------
print(200)
```

Notice how we never computed `20 ** 2` or `30 ** 2`, and only computed `10 ** 2` once. That's perfect!

This interleaved "postponed expression + incremental cloning" approach is provably **optimal**. That is, an interpreter designed that way is guaranteed to never 1. compute unused expressions nor 2. compute the same expression twice. And that's fast! This is what "optimal evaluation" is all about. But there's still a last catch... what if the cached expression is, itself, a lambda? For example, consider:

```python
cache fn = lambda x: x + 10 ** 2
print(fn(1) + fn(2))
```

Take a moment to reflect about the program above. How do we avoid computing `10 ** 2` twice? Since we're postponing computations, we can't execute `10 ** 2` yet (we don't know if it will be used). Thus, the best we can do is just copy the function, and proceed like:

```python
print((lambda x: x + 10 ** 2)(1) + (lambda x: x + 10 ** 2)(2))
--------------------------------------------------------------
print(1 + 10 ** 2 + 2 + 10 ** 2)
--------------------------------
print(1 + 100 + 2 + 100)
------------------------
print(203)
```

Here, clearly, `10 ** 2` was evaluated twice, wasting compute. So, how do we avoid that in a classical programming language? It turns out we can't, and this is the exact moment when all languages in the world - even Haskell, which does all the tricks above - become sub-optimal. That's because there is no way to "incrementally copy" a function without expanding our universe, just like we need to expand real numbers with imaginary units to solve certain equations. I call that extension "superposition". Here's how it goes:

```python
cache {fn0,fn1} = lambda x: x + 10 ** 2
print(fn0(1) + fn1(2))
------------------------------------------------
cache {fn0,fn1} = {x0,x1} + 10 ** 2
print((lambda x0: fn0)(1) + (lambda x1: fn1)(2))
------------------------------------------------
cache {fn0,fn1} = {1,2} + 10 ** 2
print(fn0 + fn1)
------------------------------------------------
cache {fn0,fn1} = {1,2} + 100
print(fn0 + fn1)
-----------------------------------------------
cache {fn0,fn1} = {1 + 100, 2 + 100}
print(fn0 + fn1)
-----------------------------------------------
cache {fn0,fn1} = {101, 102}
print(fn0 + fn1)
-----------------------------------------------
print(101 + 102)
-----------------------------------------------
print(203)
```

Here, instead of caching "fn" directly, we cached a superposition of its future copies: "fn0" and "fn1". Then, we proceeded to incrementally copy its binder (`lambda x:`), while keeping its body (`x + 10 ** 2`) intact. As a result, its variable, `x`, became a superposed variable, `{x0,x1}`, which was bound to its two partial copies (`lambda x0:` and `lambda x1:`). This has the unintuitive consequence that some lambdas are now bound to variables that occur outside of their bodies! That looks forbidden, but is actually fine: in the end, just like imaginary numbers, everything cancels out, and the final result is correct: `203`. And the good news is: we arrived at that result without ever computing `10 ** 2` twice.

A lazy interpreter that implements caching and superpositions this way is guaranteed to never compute any unnecessary expression, and never duplicate any necessary expression. In other words, it is an **optimal evaluator** for the language it interprets (or compiles). This has some crazy, yet beautiful consequences. For example, in an optimal evaluator, we can implement addition by repeated increment:

```python
def add(x, y):
  for i in range(x):
    y += 1
  return y
```

And, despite looking embarrassingly inefficient, it performs as well as the "add-carry" algorithm (!!!). Regarding real-world applications, in situations where there is an exponential amount of redundant computations that are generated by some simple procedure - for example, church-nat exponentiation, discrete program search, and certain forms of ray tracing - optimal evaluation can yield potentially massive speedups. I personally believe clever usage of superposition can result in the design of algorithms that solve hard number theory problems like the DLP - but, of course, that's my speculation.

## Expert Version (10 years)

If you're interested in the underlying theory behind optimal evaluation, start by reading [The Optimal Implementation of Functional Programming Languages](https://www.amazon.com/Implementation-Functional-Programming-Languages-Theoretical/dp/0521621127), by Andrea Asperti and Stefano Guerrini. If you want to explore this model of evaluation, [Bend](https://github.com/HigherOrderCO/Bend) is a practical programming language that will be optimally evaluated, but note that, in its current version, it isn't lazy yet - this will arrive later this year (2024). For now, you can use [HVM1](https://github.com/HigherOrderCO/HVM1) directly.
