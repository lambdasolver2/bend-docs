# Can a simple functional sieve be fast? Optimizing Tromp's algorithm on HVM.

URL: https://gist.github.com/VictorTaelin/a5571afaf5ee565689d2b9a981bd9df8


## File: simple_fast_functional_sieve.md



## Can a simple functional sieve be fast? Optimizing Tromp's algorithm on HVM.

Today, John Tromp - creator of the [Binary
λ-Calculus](https://tromp.github.io/cl/Binary_lambda_calculus.html), and one of
the smartest functional wizards alive - ported his famous prime number generator
(first published 12 years ago!) to [HVM](https://github.com/higherorderco/hvm):

```javascript
B0     = λx λy x
B1     = λx λy y
cons   = λx λy λz (z x y)
cons0  = λy λz (z B0 y)
Y      = λf ((λx (x x)) (λx (f (x x))))
S0     = λcont  λx λxs (cons0  (xs cont))
Ssucc  = λSn λc λx λxs (cons x (xs (Sn c)))
ap     = λx λy λz (x z (y z))
sieve  = λSn (cons B1 (ap sieve Y (Ssucc Sn)))
primes = (cons0 (cons0 (sieve S0)))
C2     = λf λx (f (f x))
C5     = λf λx (f (f (f (f (f x)))))
C10    = λf (C2 (C5 f))
C1K    = (C10 C2)
C3     = λf λx (f (f (f x)))
C4     = λf λx (f (f (f (f x))))
C8     = (C3 C2)
C256   = (C8 C2)
C12    = λf (C3 (C4 f))
C4K    = (C12 C2)
Take   = λcont λx λxs (SCons (x '0' '1') (xs cont))
Main   = (primes (C1K Take (B0 (B0 SNil))))
```

His algorithm is remarkable for being extremely elegant and small - possibly,
the smallest of all! Sadly, it isn't so fast. To generate the `N`th bit, a
"siever" has to be applied `N` times to it, which makes its complexity
quadratic. So, the question is: **can we take advantage of HVM's optimality, to
gain an asymptotical speedup on this elegant algorithm?** My first intuition was
to isolate the simplest siever (i.e., `siever(1)`), and measure its iterated
complexity. As expected, it was linear; applying 1 million sievers had a cost of
*30,000,040 interactions*.

```javascript
App   = λn λf λx match n { 0: x; +: (App (- n 1) f (f x)) } // applies a function N times
Y     = λf (f (Y f)) // y-combinator
B0    = λb0 λb1 b0 // bit 0
B1    = λb0 λb1 b1 // bit 1
cons  = λx λxs λcons (cons x xs) // cons on infinite lists
head  = λxs (xs λx λxs x) // gets the first bit
ones  = λc(c B1 ones) // infinite bitstring with 1's
S0    = λcont λx λxs (cons B0 (xs cont)) // the first siever (i.e., siever(1))
apply = λs λx (x (Y s)) // applies a siever
(F n) = (head (App n (apply S0) ones)) // applies siever(1) N times to [1..], and gets the first bit
Main  = (F 1000000) // COST: 30,000,040 interactions
```

Note that, on HVM, each *interaction* (also called "rewrite") is a constant-time
operation that takes just a few ASM instructions. As such, it is a precise
measure of complexity. That is, instead of measuring time and using the
imprecise `big-O` notation (`siever1^N = O(N)`), we can measure and write it in
terms of interactions: `siever1^N = 30*N + 40 interactions`. Below are some
specific measures:

```
// F(100) =     3040 interactions
// F(200) =     6040 interactions
// F(300) =     9040 interactions
// F(400) =    12040 interactions
// F(500) =    15040 interactions
// F(600) =    18040 interactions
// F(700) =    21040 interactions
// F(800) =    24040 interactions
// F(900) =    27040 interactions
// F(1k)  =    30040 interactions
// F(1kk) = 30000040 interactions
```

Thankfully, HVM as a clever way to perform repeated application in logarithmic
time: fusion! To obtain a fusible siever, I applied 3 transformations:

1. Perform repeated application by squared self-composition.

2. Flip the siever, so that it is a applied to the list (not the other way around). 

3. Lift the cons lambda inside the siever, allowing it to be shared.

I then ran the same computation and - wow - it completed in just *1012
interactions*! Now, that's an optimization. By merely fusing the siever, we got a
massive 29644x speedup. Asymptotics!

```javascript
App   = λn λf λx match n { 0: x; +: (App (/ n 2) λx(f (f x)) (match m = (% n 2) { 0: x; +: (f x) })) } // applies a function N times
Y     = λf (f (Y f)) // y-combinator
B0    = λb0 λb1 b0 // bit 0
B1    = λb0 λb1 b1 // bit 1
cons  = λx λxs λcons (cons x xs) // cons on infinite lists
head  = λxs (xs λx λxs x) // gets the first bit
ones  = λc(c B1 ones) // infinite bitstring with 1's
S0    = λcont λbs λcons (bs λxλxs(cons B0 (cont xs))) // the first siever (i.e., siever(1))
apply = λs λx ((Y s) x) // applies a siever
(F n) = (head (App n (Y S0) ones)) // applies siever(1) N times to [1..], and gets the first bit
Main  = (F 1000000) // COST: 1012
```

Below are some updated measures:

```
// F(1)   =  381 interactions
// F(2)   =  428 interactions
// F(3)   =  480 interactions
// F(4)   =  475 interactions
// F(5)   =  490 interactions
// F(6)   =  527 interactions
// F(7)   =  537 interactions
// F(8)   =  522 interactions
// F(9)   =  527 interactions
// F(1k)  =  537 interactions
// F(1kk) = 1012 interactions
```

So, can this trick be used to create a simple *and* fast pure functional prime
sieve? Probably! But one would need to carefully apply this technique to fuse
arbitrary sievers during the sieve generation. Tricky, yes; but doable. So, a
better question is: who will be the first one to develop it? Could be you!

*Note that, as of today (29 Jan 2024), HVM's production-ready version isn't
officially available yet, but you can already test the code above by installing
the `lazy_mode` branch of [HVM-Lang](https://github.com/higherOrderCO/HVM-lang),
with the `-L` flag.*

This discussion is taking place right now on HOC's Discord:

https://discord.HigherOrderCO.com/ (#hvm channel)
