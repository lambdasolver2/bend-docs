# Higher Order Company: Complete Historical Overview - WIP

URL: https://gist.github.com/VictorTaelin/77fd5a2a8a4a07e1da6157ebca3c7cf1


## File: hoc_historical_overview.md


# Higher-Order Company: Complete Historical Overview

This document is a complete historical overview of the Higher Order Company. If you want to learn anything about our background, a good way to do so is to feed this Gist into an AI (like Sonnet-3.5) and ask it any question!

## My Search for a Perfect Language

It all started around 2015. I was an ambitious 21-year-old CS student who, somehow, had been programming for the last 10 years, and I had a clear goal:

> I want to become the greatest programmer alive

I wished for the ability to write a whole game engine over a weekend, and C wouldn't give me that power. This led me to survey all programming languages that existed, looking for one that would maximize my productivity. After learning dozens of common and esoteric options, I was convinced the functional paradigm was the way forward. Soon after the initial enthusiasm, I came to the realization that FP languages struggled with performance and practical issues, so I decided to build my own. And that was the beginning of a long journey.

## The Lambda Calculus

The Lambda Calculus the elegant model of computation behind functional programming languages. It, to my eyes, seemed canonical, in a very fundamental sense. Because of that, I expected it to be "perfect", just like the Euler formula, or Tau constant. So, it was surprising to me to learn that all λ-Calculus evaluators - including the purest languages in the domain, like Haskell and Lisp - were *sub-optimal*. Why would that be the case? 

Trying to implement my own functional language, I quickly realized why: **substitution isn't atomic**. Instead, it is a quite convoluted operation that clones arbitrarily large structures, and performs complex renamings. It isn't lightweight, in the way I expect the most fundamental operation of the most fundamental model to be. But it HAD to be!

## Lamping's Optimal Algorithm

I then started looking for the fastest way to evaluate λ-terms, and someone linked me to [Lamping's 1990 algorithm](https://dl.acm.org/doi/10.1145/96709.96711). Turns out there IS a lightweight way to perform substitution, but it involves a new, graphical representation, rather than the syntax-based trees we're used to. Yet, in that new point of view, substitution becomes atomic, fast and absent of renaming schemes. It felt *canonical*.

I quickly implemented that algorithm as a small JavaScript project called [Optlam](https://github.com/VictorTaelin/optlam), and tested it on a bunch of terms that, on my previous implementations, took a long time to compute. And, in these cases, it was... fast. No, not just fast. It was miraculously fast. Impossibly so. I could actually not believe it, so I made [this](https://stackoverflow.com/questions/31707614/why-are-%CE%BB-calculus-optimal-evaluators-able-to-compute-big-modular-exponentiation) Stack Overflow post. Turns out my implementation was correct, and the algorithm was, indeed, that good. So... **[why the hell was nobody using it](https://www.reddit.com/r/haskell/comments/2zqtfk/why_isnt_anyone_talking_about_optimal_lambda/)**

After quick research, I identified 2 key reasons:

1. A *negative result* that was misinterpreted by researchers back then

2. The theoretical optimality didn't translate to real-world performance

## A misinterpreted theoretical result

To explain the negative result, a little bit of context is needed. Lamping's algorithm is actually divided into two parts: the **Abstract Algorithm** and the **Oracle**.

### 1. The Abstract Algorithm

The first part breaks down **substitution** into two operations: **application** and **cloning**. It looks like this:

![optimal algorithm](https://i.imgur.com/tMhe73c.png)

These simple graph-rewrite rules form the core algorithm to evaluate λ-terms! `λ` nodes represent lambdas, `@` nodes represent applications, and the triangles represent cloning. As the "optimal" word implies, there is no way to reduce lambda terms faster than this approach, because it ensures no work is needlessly duplicated (which is the main issue with tree-based evaluators). In other words...

If:

- Substitution is now an atomic, O(1) operation.

- The number of substitutions to compute a term is the minimum possible.

- Structural cloning is also kept at the bare theoretical minimum.

Then:

- The Abstract Algorithm is **optimal**!

That conclusion is sensible, and it implied, to many, that this simple algorithm could be used to evaluate λ-terms efficiently and, thus, serve as the backbone of functional programming languages. Amazing! So, what was the problem?

### 2. The Oracle

Turns out the Abstract Algorithm, alone, isn't capable of evaluating all λ-terms correctly. There are some terms for which it will, simply, produce an incorrect result. But Lamping himself provided a solution: the **Oracle**. It is a set of additional graph nodes that, in simple terms, do some scope tracking wizardry that makes the algorithm provably correct. Here is how it looks:

![oracle](https://i.imgur.com/Dxf9qRK.png)

The addition of these moon-bracket-looking nodes allows Lamping's algorithm to evaluate arbitrary lambda terms to normal form correctly and soundly. But they also introduce a problem: the nodes accumulate, greatly increasing the overall cost... sometimes, exponentially. This led to the perception that the "optimal" algorithm, perhaps, wasn't actually optimal: after all, while it minimizes the amount of substitutions, it seemed like the cost was just being pushed into the Oracle.

For some time, researchers were busy trying to better understand that aspect. Many alternatives to Lamping's algorithm were developed. They all kept the same "abstract" fragment, but proposed a different oracle. The overall hope was that a "better oracle" would get rid of that little problem, proving, once and for all, that the optimal algorithm is, indeed, optimal.

### 3. Lamping's algorithm is not actually optimal?

Sadly, that hope was shattered in 1996, when Asperti, Lawall and Mairson published a [paper](https://dl.acm.org/doi/10.1145/232627.232639) proving that the cost of evaluating a λ-term is NOT bounded by the total amount of substitutions. Now, let's think.

If:

- Lamping's algorithm minimizes the "substitution count".

Yet...

- "Substitution count" does NOT represent the "actual total cost".

Then:

- Lamping's algorithm **may** not be optimal in "actual total cost"!

And also:

- The Oracle was, indeed, "hiding" a very significant cost.

This is all true, and, as you can imagine, this realization shattered the hype around optimal evaluation. But, here's the catch: this result doesn't say anything about Lamping's algorithm. It just provides an insight about the Lambda Calculus itself: that minimizing substitution isn't enough for optimality, as everyone believed. In other words, it does not prove Lamping's algorithm isn't optimal; it just shows that *we don't know*. But it could still be. So, is it?

### 4. Lamping's algorithm IS actually optimal!

Later on, Asperti himself discovered another fact: the *extra cost* (presumably pushed to the Oracle) is actually already present in the abstract fragment, because the amount of *cloning* that a λ-term may present is not bounded by the amount of *substitutions* either! But, wait...

If:

- The "extra cost" is actually caused by "cloning", not by the Oracle

- Lamping's algorithm, indeed, minimizes cloning

Then:

- Lamping's algorithm is *actually* optimal!

That's the sensible, correct take. To recap:

1. Lamping devised an optimal algorithm for λ-Calculus evaluation, in terms of "substitution count"

2. People believed the algorithm was, indeed, optimal in terms of "total work done"

3. Asperti discovered an "extra cost", implying "substitution count" isn't enough to define "optimality"

4. People concluded the algorithm may, thus, not actually be optimal, since it minimizes a now-irrelevant metric

5. Asperti has shown that the "extra cost" is actually attributable to "cloning"

6. Lamping's algorithm also minimizes "cloning", so, it is optimal on that "extra cost" too!

So, essentially, as far as theory is concerned, Lamping's algorithm IS, indeed, an optimal λ-Calculus evaluator, w.r.t all investigated measures. Sadly, the misconceptual reception of the original "negative result" - which was not even related to Lamping's algorithm - was so strong that it distanced many researchers from this field. Years later (in a response to a question posted on Reddit!) Asperti himself published a [follow-up paper](https://arxiv.org/pdf/1701.04240) trying to clear up that misconception, but it was already too late to fix the accidental damage.

## From theoretical to practical performance

Even if Lamping's algorithm is, indeed, optimal in theory, this still leaves an open question: is it optimal **in practice**? Both notions aren't necessarily equivalent. For example, the theoretically optimal multiplication algorithm is `O(N*log(N))`. Yet, it has constant costs so high that, for most practical purposes, it is worth using some known sub-optimal algorithms instead. So, is that the case for Lamping's algorithm?

Asperti himself attempted to answer that question by implementing [The Bologna Optimal Higher-order Machine](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/1F2763B0F931680F9B15BDC750BEB343/S0956796800001994a.pdf/bologna_optimal_higherorder_machine.pdf). This work was the main inspiration behind HVM, and the first serious attempt at implementing Lamping's algorithm efficiently in practice. It is a marvelous piece of software, and a big achievement. Yet, it had two key problems:

1. Memory consumption was way too high

2. Total interaction count was way too high

Due to both of these problems, BOHM couldn't outperform classical evaluators such as Haskell's STG, or Scheme's closures, in practice. The benchmarks were brutally clear in that regard. So, how could we improve it?

### 1. Absal: Optimizing Optimal Reduction

Looking at BOHM's implementation, all my depraved engineer mind could think of was this massive, overlooked optimization opportunity:

> Implement just the Abstract Algorithm!

Remember Lamping's algorithm had two parts? The second one, the Oracle, is necessary to ensure sound λ-Calculus evaluation **in all cases**. Yet, it adds a 10x overhead, even in cases where it isn't needed at all! So, my question was: when is it *actually* needed? I'm an Engineer, not a Scientist. If I see a 10x speedup opportunity, hell I'm not discounting it.

To my surprise, [this](https://dl.acm.org/doi/abs/10.1145/1131313.1131315) paper identified that there is an entire class of λ-terms on which the oracle isn't needed at all; specifically, terms typeable in Elementary Affine Logic. That sounded perfect, so, I quickly reimplemented the algorithm in a more polished repository, [Absal](https://github.com/VictorTaelin/abstract-algorithm), with the goal of exploring this subset. And, over the next few years, I implemented basically ALL algorithms you can think of, in this little subset of the untyped lambda calculus. And I really mean it. It was months and months non-stop implementing all sorts of algorithms you can think of, in raw λ-terms. At a point, I was visiting my own mother in the hospital - a very dark time - and, in the waiting room, there I was, with my little notebook, drafting lambda terms. Back then, I had no big intentions with all of this. Just curiosity and, in a way, escapism.

So, after this long experience, I came up with one fundamental conclusion:

> The Abstract Algorithm is all you need

And that is just true: every program can be computed by the Abstract Algorithm (it is Turing Complete!), every λ-term can be "indirectly" computed (by interpretation), and specific λ-terms that aren't "directly compatible" can easily changed to compatible terms, or rejected by a type-system, just like Rust and Haskell reject many λ-terms too. It is a fact that most practical languages do not support the full λ-Calculus either, yet, for some reason, people take this as a negative point exclusive to the Abstract Algorithm. It isn't! And, if I could have a 10x speedup by just rejecting some defective λ-terms, hell I'd have it!

### 2. Interaction Combinators

After spending long enough time with the Abstract Algorithm, some quite eerie thoughts started occurring in my mind. Remember: the entire reason I got into this whole thing, to begin with, was because the Lambda Calculus seemed, to me, like "the one true Model of Computation". But, now, I had a direct counterpoint to this hypothesis. After all, if the λ-Calculus was so perfect... why would it have "defective terms" at all? Also, why does Lamping's algorithm have two parts... one that feels beautiful/canonical, and another that feels engineered/arbitrary?

I know that's not a very technical argument, but, still, it seemed very real to me. This prompted me to dig deeper into the nature of Lamping's Algorithm itself, which - and I don't remember exactly how - eventually got me to the most important paper of my life: Lafont's 1997 Interaction Combinator.

That paper was a distillation of a whole new model of computation, called Interaction Nets - and it was kind of framed as a "perfect" alternative to the Lambda Calculus and Turing Machines. A new model that was optimal, in a deep theoretical sense. Specifically, Lafont proved that his model was capable of emulating any other without increasing complexity; which is a property stronger than mere Turing completeness. Moreover, it was massively parallel, which, back then, wasn't something I was even looking for, but, hey, that's a nice bonus, I guess?

Here is how it looks like:

![Interaction Combinators](https://i.imgur.com/HjsjqlE.png)

Can you see it? That's right: if you just draw λ's as triangles, and @'s as triangles... then, Interaction Combinators are **exactly** the same thing as Lamping's Abstract Algorithm. Yves's work isn't just a universal distillation of Interaction Nets. It is also the heart of the Lambda Calculus. AND it also subsumes Turing Machines (which can be seen as just 1D Interaction Combinators) and Cellular Automata (which can be seen as just grid-aligned Interaction Combinators).

As you can probably already imagine - I now hold the very strong conviction that Interaction Combinators are THE optimal model of computation, and that everything else is just a bloated version of that tiny, ultra-efficient system; just like the Lambda Calculus was. And, if that's the case... that implies every programming language, every runtime, every processor, could be made faster - or, rather, less slow - by removing bloat through the lens of Interaction Combinators.

As usual, I was very enthusiastic about this new model, and asked on Reddit [why the hell nobody was talking about it](https://www.reddit.com/r/haskell/comments/568gtk/why_the_overall_lack_of_interest_in_interaction/).

### 3. Interaction Combinator ∩ Lambda Calculus = Interaction Calculus

At that point, I was convinced ICs are the ultimate model of computation, independent of the λ-Calculus, and, as such, I started asking the obvious questions: can it do things that the λ-Calculus fundamentally cannot? There are IC nets that don't directly correspond to λ-terms. What do they do? What can be done with them? That was so interesting, I started abandoning the λ-Calculus and playing with ICs directly. There was a problem, though: visualizing ICs on computers was quite hard, and, even though I implemented a bunch of renderers, ultimately, drawing was still the easiest way to explore the system. At a point, my floor was covered by [mountains of paper sheets](https://imgur.com/a/Zb0W7FQ) with hundreds of IC nets drawn manually.

The key insight is that, instead of drawing "triangles", you can actually write "CON nodes" as lambdas and application, as long as you accept the following departion from the λ-Calculus:

> Lambdas have global scopes

That is, the variable bound by a lambda can, as insane as that may seem, occur outside of its body. Once you accept that, then you can actually draw Interaction Combinators in a more familiar notation. From that point of view, the [Interaction Calculus](https://github.com/VictorTaelin/Interaction-Calculus) was born. Initially, this was meant to be merely a textual syntax for exploring the graphs, allowing me to write and debug its nets without having to make drawings, and it really worked well for that purpose. Nowadays, I think there is something more fundamental to it. 

> **NOTE: I went on a tangent here. Feel free to skip to the next part.**

Several concepts that are "strange" in conventional functional languages suddenly gain a new light once you think about them in terms of "lambdas with global scopes". For example, it is impossible to write a monadic function in Haskell that returns a HOAS λ-Term directly:

```haskell
-- Here, $x is a "globally bound variable"
make_lam : Context -> Term
make_lam ctx = do
  ...
  body <- make_lam ($x : ctx)
  ...
  return $ Lam (\$x -> body)
```

It is impossible to do so in one pass, because the solution requires the body to be constructed before the lambda, but the lambda is needed to construct the body. Similarly, fundamental features like call-cc, O(1) double-ended queues, mutable references(!) aren't expressive in the λ-Calculus, but can be done easily in the Interaction Calculus. Also, in a massivelly parallel setup, the λ-Calculus alone isn't sufficient to represent all concurrent algorithms; global λ's are needed to, say, fully emulate Erlang's work scheduler. (Amb nodes are too, but I won't get into that point.)

Also, just like lambdas and applications are duals, the dual to a duplication node was a superposition node, which turned out to be a very intuitive and massively impactful feature that I now apply intuitively to solve problems. For example, a simple [SAT](https://gist.github.com/VictorTaelin/9061306220929f04e7e6980f23ade615) brute-forcer gains an asymptotical speedup in certain cases, if you just use superpositions, instead of loops, to search through the space. This concept is now so familiar to me that I use it naturally on Bend, to the point I actually miss it when I'm coding in Haskell. I've been exploring it extensively on unpublished AI research, and its presence is absolutely key in some parts of the algorithms. Or, as I see it, its absence introduces tons of unecessary slowdowns!

Later on, when thinking about a [type system for Interaction Combinators](https://github.com/victortaelin/interaction-calculus-of-constructions), Franchu (on HOC's Discord) realized that a very elegant primitive, that we now call "The Bridge", could be used to derive the core axioms of type theory (such as Pi types and Sigma types). In other words, Π and Σ can be further broken down, and I strongly believe that may have strong applications in the study of mathematical foundations. For example, Bridges are sufficient to express Aaron Stump's [self types](https://homepage.divms.uiowa.edu/~astump/papers/fu-stump-rta-tlca-14.pdf), which, in turn, can be used to represent dependent λ-encodings, which allow small core theories like the Calculus of Constructions to express arbitrary inductive families (and even quotients) without a complex native datatype system (as currently implemented in all proof assistants).

Anyway, I'm going on a tangent here, so, back on track.

### 3. Formality-Net: The First Real Attempt

Fast forward a few years, I was working at the Ethereum Foundation, just hired as the new member of the Mist team: a browser designed as the entry point of the Ethereum network. Back then, the network was in a complete state of immaturity and chaos, and, as you can already imagine, ALL issues that occurred were obviously Mist's fault. People would literally have dogs eat their private keys, and blame Mist for it. But I was fine with that; what terrified me was when I learned about how Solidity worked, and how it was compiled to EVM. That language was being used to upload "unstoppable" contracts that held millions of dollars. Except they stopped working all the time, due to bugs in the code. That was completely insane to me, so, I had to do something.

During these times, I started heavily studying the one silver bullet for software bugs: mathematical proofs. As far as I could tell, it was the only technology capable of ensuring that given software is 100% correct on its first version - which is exactly what Ethereum needed. I made a lot of internal pressure inside EF, until they eventually gave up and just let me lead my own team to implement a proof language for it. And, just like that, the Formality language was born! But I also needed to compile it to something... and that thing had to be efficient enough to run inside the blockchain, an environment where every operation costs a lot of money. Idris had already attempted, and it was unviably expensive. Thus, as you can guess... I used Lamping's algorithm, and attempted to make it as fast as I could.

Formality's runtime was called [FM-Net](https://github.com/VictorTaelin/Formality-Net-legacy). It was now written in C, and optimized as much as I possibly could, using that idea of dispensing the Oracle entirely. Sadly, even with that "10x" speedup... it was still not so fast in practice. Haskell was still much faster, and there wasn't much I could do about it. Perhaps I was wrong, after all...

### 4. HVM: an efficient implementation

After Formality failed to meet the performance I expected it to, I just gave up on the problem for a while. During my time at the Ethereum Foundation, I converted most of my salaries to ETH, which appreciated enough to give me financial independence and allow me to retire early when I was 25. I proceeded to spend the next few years funding and working on gamedev projects that gave me joy, playing games, teaching friends how to program - but I always had this specific problem in the back of my mind.

One day, it randomly occurred to me an insight that should probably have been obvious: I could use the Interaction Calculus as a memory format to represent Interaction Combinator nodes with reduced memory footprint, by omitting pointers on lambda, application and superposition nodes. Moreover, by including tags directly on pointers (rather than on nodes), I can further cut it down. That meant a lambda could be represented with 2x less memory, from 256 to 128 bits (in a 64-bit architecture).

This naturally and almost simultaneously led me to realize another huge (now obvious) optimization opportunity: rather than using fan nodes to clone global definitions, I can actually do that with a specialized "deref" operation, in a single memcpy. And, while we're there, why not just go ahead and add native constructors? Then, we can actually dispatch pattern-matching equations with a switch statement, just like Haskell works! In essence, that setup would give me the same memory/compute footprint of GHC (in low-order computations), yet the exact same asymptotics of BOHM (in higher-order computations).

There was no reason it wouldn't work, so, I stopped everything I was doing, locked myself in a room for a few days, and, just like that, the first version of HVM was born, written 100% in Rust. And, to my actual surprise, on my very first benchmarks, it was computing some real-world algorithms at about 30% of the performance of Haskell GHC. Considering that all previous attempts were orders of magnitude slower, that, to me, was a clear indication that I finally got the right architecture.

But, wait... so, I had 1/3 the speed of Haskell, and 8 cores on my computer. And I know Interaction Combinators, as a paradigm, are inherently parallel. So... could I...? Yes, I could! A few parallelism annotations later and HVM was now using all the cores of my computer, and it actually surpassed GHC in real benchmarks. Okay, it wasn't THAT simple, and, unfortunately, the original parallelism on HVM1 had major bugs that I couldn't fix. But, hey, for some cases it did work, and surpassing Haskell in some cases was not something I was expecting ICs to do anytime soon.

## Higher Order Company

So, let's recap what the HVM represented, to me:

1. A new runtime capable of computing the functional paradigm as fast as
   Haskell/GHC in all low-order programs (because it is low-footprint in
   practice), yet, exponentially faster in some higher-order program (because it
   is optimal in theory).

2. A new paradigm capable of automatic massive parallelism, maximizing
   [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law) (because
   interactions are small atomic operations, which minimize the longest
   sequential fragment), and, thus, potentially scaling in performance with
   near-ideal speedup up to millions of concurrent threads.

3. New powerful primitives (global lambdas, superpositions, bridges) that could,
   one day, bring advancements in number theory, type theory and foundations.

Of course, perhaps, I was wrong. Perhaps all these things were just fruits of my
imagination, and the Interaction Combinator paradigm could never bring any real
progress to humanity whatsoever. But what if it could? At that point, this whole
thing was kinda on my hands? If I just stopped working on it, nobody would. It
is as if Newton had invented the Calculus, sent to me in a letter and
disappeared. I felt a huge sense of responsibility in bringing this technology
to the world, because I believed great things could come out of it. So, I had to
do something, and take it to the next level. But how?

### Taking Interaction Combinators seriously

Progress demands funding. Initially, I thought I could seek grants and get
closer to academia. But, honestly, I'm terrified of the economics of academia.
I don't think the incentives are right and I don't think the money goes to where
it has to be. I, sadly, don't trust the process. (Should I?)

My second plan was to create an alternative to Ethereum, called Kindelia. This
seemed like such a low-hanging fruit: we could replace EVM by the HVM, have
massively increased layer-1 throughput, greatly improve on the security problem
(because HVM runs proof languages natively!) and, once the project grows to the
top 10 of CoinMarketCap - which I'm fairly sure it would - we could fund HVM
research out of the appreciation of the token, alone. And I really think that
could work, so, we spent a few months researching the idea.

Yet, Kindelia is such a cool concept, that I'd love to see it existing as a core
component of the internet, like Unix and DNS. A fair network, just like Bitcoin.
Not a semi-private chain, with a team behind it taking a huge chunk of the total
supply. Because that sucks. Oh, wait, that owner would be us? No, that would
still suck. I love Kindelia, and I want it to be shipped on its best form.  And
its best form doesn't include my keys on the genesis block. There are other ways
to fund a project.

The third plan was to just create a normal business, make my own profit out of
the value of the technology, sustain its research from that and gracefuly give
parts of it to the world - as much as it would be viable to, without
compromising the business's survival. That made sense to me, because, if the
technology was truly capable of improving upon so many areas of computing, then,
it should not be hard to extract business opportunities from it, right? And if
it was not, well, then better it fail before it gets too big! Win-win. From that
point of view, the Higher Order Company was founded, with the goal of:

1. Further developing the "Interactional Paradigm" and HVM technology

2. Using private parts of this development to create profitable products

3. Launching parts of this development to the public (ex: HVM, Bend, Kindelia)

Now, it needed funds.

### The Seed Round

Of course, nobody makes money from just selling runtimes and programming
languages, even when these are already massively used and deployed (Unity 3D
kinda tried, and we know how that went). So, it was, obviously, really really
hard to come up with a reasonable business plan for a prototypal runtime that
barely managed to outperform public solutions in several cases. So, what now?

For our Seed Round, we made a highly technical pitch deck, with this clear
message stamped on it: ICs are a core fundamental technology that could, one
day, result in highly valuable products. But, for now, it still needs a lot of
development and polish, as it would be immature and unfruitiful to attempt to
create any product given the current state of things. So, the plan was to mature
the tech, develop a correct version of HVM's mass parallelizer, and then choose
one direction to focus, with Kindelia, Kind and Bend proposed as possible paths.

To be honest, I assumed - and kinda hoped, I guess? - nobody would buy that
pitch. There was still so much to do in the techn real before we could have a
proper business plan. And, initially, it did feel like that. Now, though, I
realize the reception was actually much better than I expected. In about 1 week
of meetings (which felt infinite to me, but actually isn't) we closed our $5m
round. Sadly, one of the investors pulled out, bringing it down to $4m. But
that was still enough to start, so, we did.

### The Seed Stage

Unfortunatelly, our seed stage wasn't as productive as I wish it would. As you
can probably imagine, neither I or my friends are very experienced with running
a business, hiring and managing people. We spent A LOT of money on professionals
that weren't productive. And, in most cases, it wasn't even their fault, as we
didn't provide the right conditions for progress to take place. Ultimately, most
of the results we got during this stage still came from the work of a few people.

Fortunatelly, even though the $ efficiency was not stellar, the results were.
During this period, we delivered on the promises of the seed pitch, with Bend
and its ecosystem chosen as the direction to focus, AND we pushed some other
directions that, in my view, are promising. We only used ~60% of the funds so
far, so, we still have a ~2 year runway. Key milestones:

1. Deeply researched how to make [HVM's automatic parallelism
   **correct**](https://github.com/HigherOrderCO/HVM/blob/main/paper/PAPER.pdf),
   to the point we now have a very good understanding of the problem, and a
   collection of simple, elegant algorithms that solve the issue for good.

2. Implemented [HVM2](https://github.com/higherorderco/hvm,) which, based on
   these parallel primitives, can now scale up to thousands (and, potentially,
   millions or billions) of threads, with near ideal speedup. Running the full
   λ-calculus on GPUs was a huge milestone.

3. Developed and shipped [Bend](https://github.com/higherorderco/hvm), an
   ultra-simplified, Python-like/Haskell-like language that runs natively on
   GPUs, while needing af fraction of the expertise necessary to develop
   parallel algorithms on C or CUDA.

4. Further developed the theoretical aspects, and better understood fundamental
   primitives like global lambdas,
   [superpositions](https://gist.github.com/VictorTaelin/9061306220929f04e7e6980f23ade615),
   [bridges](https://github.com/victortaelin/interaction-calculus-of-constructions),
   that I believe could have profound impact on algorithm design, type theory and
   AI.

5. Progressed on some other fronts like the
   [Kind](https://github.com/higherorderco/kind) proof assistant and
   [Kindelia](https://github.com/kindelia/Kindelia), which we plan to release
   somewhere during the Series A stage.

The main highlight is, of course, the correctness of HVM's new parallelizer.
Yet, Bend's reception surprised us. Before the announcement, we joked it would
barely reach 100 likes on Twitter, because  my technical posts usually flop,
while the meme/AI ones tend to viralize. The plan was to make a silent release,
and focus on organically growing a community later this year, once Bend had a
stdlib and HVM supported more targets. Yet, the announcement somehow got [13K
likes on Twitter](https://x.com/VictorTaelin/status/1791213162525524076), 25k+
stars on GitHub, and was featured on some major YouTube channels. In a way, that
made me realize how many people care about my work and want us to succeed, which
gives me determination. In another, such popularity in a moment where the
language is still not so mature may not give the best perception, but that's
something we'll have to keep in mind and work with.

