# Fast Discrete Program Search with HVM Superpositions (SUP nodes) - finding ADD-CARRY

URL: https://gist.github.com/VictorTaelin/d5c318348aaee7033eb3d18b0b0ace34


## File: fast_dps_add_carry.md

## HOC's Fast Discrete Program Search (DPS)

HOC will soon (EOY?) launch an API for our DPS solution.
The interface will be simple:

- You give us a set of examples (input/output pairs)

- We'll give you a (Python?) function that models it

And that's it. It will be an universal function finder.

We'll not release the full source, but, meanwhile, I can talk about the theory. As I've written before, the main idea is to exploit "superpositions" - a feature that HVM inherited from Interaction Combinators - to accelerate DPS (or Symbolic Regression). SUPs are the opposite of DUPs: instead of "cloning one value into two locations", they "merge two values into one location". For example, if you write:

```haskell
Main = (+ {10 20} 1)
```

HVM will add the superposition of {10 20} to 1, resulting in {11 21}. While this looks like something simple you could just add to existing languages - it isn't. To get an asymptotical speedup, SUPs must be first-class, deeply ingrained into the runtime - and that's incompatible with the classical model that all languages use (the full λ-Calculus).

## But how SUPs accelerate DPS?

To explain this, suppose you're trying to find the binary ADD-CARRY algorithm. Assume you don't know the implementation, but you know it can be done with a single recursive pass through both strings. As such, you write the following template:

```haskell
ADC :: Int -> [Int] -> [Int] -> Bool -> [Int]
ADC 0 a     b     c = []
ADC n (0:a) (0:b) 0 = ? : ADC (n-1) a b ?
ADC n (0:a) (1:b) 0 = ? : ADC (n-1) a b ?
ADC n (1:a) (0:b) 0 = ? : ADC (n-1) a b ?
ADC n (1:a) (1:b) 0 = ? : ADC (n-1) a b ?
ADC n (0:a) (0:b) 1 = ? : ADC (n-1) a b ?
ADC n (0:a) (1:b) 1 = ? : ADC (n-1) a b ?
ADC n (1:a) (0:b) 1 = ? : ADC (n-1) a b ?
ADC n (1:a) (1:b) 1 = ? : ADC (n-1) a b ?
```

Now, all you need to do is find the correct replacement for each of the 16 missing bits (`?`). In a conventional language (like Haskell), you'd need to use a loop to *enumerate* and *try* all the 65,536 options separately. Now, here's the insight: all these "add candidates" share a lot in common. Couldn't we save a lot of time if we could optimally "cache" identical computations across different guesses? Indeed: that's where hash-consing - lol, jk - SUP nodes come to save the day.

On HVM, instead of trying each candidate separately, we can create a superposition of all possible functions. Then, we can apply them all to some test cases. Finally, we can collapse the result into a single value, to recover a function that works. More or less like this:

```haskell
let adc = {superposition of candidates}

let test_0 = add 48436 10318 == 58754
let test_1 = add 38148 25462 == 63610

collapse $ if test_0 && test_1 then None else Some BITS
```

Running this on HVM will output the missing bits:

```c
[0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0]
```

And voilà: we just discovered the ADD-CARRY function! 

So, how fast this is? In this implementation, a single call to 'add' takes about ~4k interactions. As such, calling it 65k times would take about 262m interactions. Yet, the program above returns in just 36k interactions! That's a ridiculous 7277x speedup. More impressively, we achieved sub-1 interactions per guess! And that speedup only gets larger as the search space grows.

Below I publish the HVM1 source to replicate this experiment:

```c
// type Bool = F | T
F = λf λt f
T = λf λt t

// type Bin = (O Bin) | (I Bin)
(O xs) = λo λi (o xs)
(I xs) = λo λi (i xs)

// type Nat = (S n) | Z
(S n)  = λs λz (s n)
Z      = λs λz z

// If-Then-Else
(If 0 t f) = f
(If x t f) = t

// Converts U60 to Bin
(Bin 0 n) = E
(Bin s n) = (If (== (% n 2) 0) (O (Bin (- s 1) (/ n 2))) (I (Bin (- s 1) (/ n 2))))

// Converts Bin to U60
(U60 0 bs) = 0
(U60 n bs) = (bs λp (+ (* 2 (U60 (- n 1) p)) 0) λp (+ (* 2 (U60 (- n 1) p)) 1))

// Converts U60 to Nat
(Nat 0) = Z
(Nat n) = (S (Nat (- n 1)))

// Boolean Fns
And = λa (a λb(F) λb(b))
Or  = λa (a λb(T) λb(b))

// Maybe Or
(Join None     b) = b
(Join (Some x) b) = (Some x)

// Collapse an N-label Superposition
(Collapse 0 x) = x
(Collapse n x) = (HVM.DUP (- n 1) x λx0λx1(Collapse (- n 1) (Join x0 x1)))
    
// Checks if two Bins are equal
Eq = λn (n
  λn λa (a
    λa λb (b λb ((Eq) n a b) λb F)
    λa λb (b λb F λb ((Eq) n a b)))
  λa λb T)

// Target Add Function (we're searching this)
Add = λn (n
  λn λa (a
    λa λb (b
      λb λk (k
        (O ((Add) n a b F))
        (I ((Add) n a b F)))
      λb λk (k
        (I ((Add) n a b F))
        (O ((Add) n a b T))))
    λa λb (b
      λb λk (k
        (I ((Add) n a b F))
        (O ((Add) n a b T)))
      λb λk (k
        (O ((Add) n a b T))
        (I ((Add) n a b T)))))
  λa λb λk E)

// Superposed Function Template (with 16 missing bits)
Fun = λn (n
  λn λa (a
    λa λb (b
      λb λk (k
        (#0{λx(O x) λx(I x)} ((Fun) n a b #8{T F}))
        (#1{λx(O x) λx(I x)} ((Fun) n a b #9{T F})))
      λb λk (k
        (#2{λx(O x) λx(I x)} ((Fun) n a b #10{T F}))
        (#3{λx(O x) λx(I x)} ((Fun) n a b #11{T F}))))
    λa λb (b
      λb λk (k
        (#4{λx(O x) λx(I x)} ((Fun) n a b #12{T F}))
        (#5{λx(O x) λx(I x)} ((Fun) n a b #13{T F})))
      λb λk (k
        (#6{λx(O x) λx(I x)} ((Fun) n a b #14{T F}))
        (#7{λx(O x) λx(I x)} ((Fun) n a b #15{T F})))))
  λa λb λe E)

// Superposition Labels used in the Template
Map = [
  #0{0 1} #1{0 1}  #2{0 1}  #3{0 1}  #4{0 1}  #5{0 1}  #6{0 1}  #7{0 1}
  #8{0 1} #9{0 1} #10{0 1} #11{0 1} #12{0 1} #13{0 1} #14{0 1} #15{0 1}
]

// Tests if `Fun a b == c`
(Test s a b c) =
  let x = ((Fun) (Nat s) (Bin s a) (Bin s b) F)
  let y = (Bin s c)
  ((Eq) (Nat s) x y)

// Main
// ----

// Finds the Binary Addition Function
Main =
  let e0 = (Test 16 48436 10318 58754) // test: 48436 + 10318 = 58754
  let e1 = (Test 16 38148 25462 63610) // test: 38148 + 25462 = 63610
  let ok = ((And) e0 e1) // looks for a Fun that passes both tests
  (Collapse 16 (ok None (Some Map))) // output: [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0]
```

This is the heart of the algorithm we'll be running, and I'm posting it for anyone to explore. In special, note how we fully replaced *loops* and *enumeration* by *superposition* and *collapsing*. Of course, this version is greatly simplified, as I provided a template for the ADD-CARRY shape, simplifying the task. Our full solution generates the templates on the fly, and employs a bunch of new tricks to let us to recover functions from I/O pairs alone. We also use a custom HVM version, and (depending on our Series A outcome 😅) a MASSIVE LOT of compute.

Even with all these tricks, the general problem is still exponential, but, by greatly optimizing the cost of a guess (all the way to <1 interaction), and with massive compute, this "dumb" approach can discover programs and proofs that would otherwise be intractable.
    
Discussion: https://x.com/VictorTaelin/status/1819774880130158663
