That's a great question. Sadly, no, HVM won't do that, by design. That's because we follow the Linux philosophy of doing just one thing, and doing it well: it is a runtime, not an optimizing compiler. GHC does both at once, but HVM separates these responsibilities. As such, it will just run the program you feed as fast as it can, but it won't alter it in any way. It is the compiler's job (i.e., the language that is targeting the HVM) to apply optimizing transformations. This is good because it gives the source language full control over what will actually run.

That said, it is worth noting that, due to optimal reduction, we already have "runtime deforestation"! Yes, that's right. That's because optimal reduction can be seen as as if HVM was doing aggressive inlining at runtime, which in all other  languages used to be a compile-time thing. Let me give you a concrete example. Consider the following program:

```
(Gen 0 r) = r
(Gen n r) = (Gen (- n 1) (List.cons (- n 1) r))

(Map f List.nil)         = List.nil
(Map f (List.cons x xs)) = (List.cons (f x) (Map f xs))

(Main n) =
  let list = (Gen 100 Nil)
  let list = (Map λx(x) list)
  let list = (Map λx(x) list)
  ...
  let list = (Map λx(x) list)
  let list = (Map λx(x) list)
  list
```

It just applies `Map` to a list of 100 elements, many times in a row. We can measure the complexity of this program by querying the number of graph rewrite rules with `hvm run -c true`. Here are the results, based on the number of times we called `Map`:

```
calls | rewrites
----- | --------
0     | 402
1     | 802
2     | 1202
3     | 1602
4     | 2002
5     | 2402
6     | 2802
7     | 3202
8     | 3602
9     | 4002
```

As you can see, each call to Map adds exactly 400 to the total cost. Now, as you may be aware, a popular deforestation technique employed by Haskell is `build/foldr`, which works (using List as an example) by 1. folding over the list, 2. implementing the functions to operate on the folded-version, 3. rebuilding the list. The reason this works is that the compiler is able to inline algorithms implemented for folded lists, removing all the intermediate allocations. Clever. Now, on HVM, we don't need the compiler to do that. **The runtime itself is capable of deforesting!** So, let's reimplement `Map` using the foldr/build approach:

```
(Gen 0 r) = r
(Gen n r) = (Gen (- n 1) (List.cons (- n 1) r))

(Fold List.nil)         = λcons λnil nil
(Fold (List.cons x xs)) = λcons λnil (cons x ((Fold xs) cons nil))

(Build fold) = (fold λhλt(List.cons h t) List.nil)

(Map f fold) = λcons λnil (fold λh (cons (f h)) nil) 

(Main n) =
  let list = (Gen 100 Nil)
  let list = (Fold list)
  let list = (Map λx(x) list)
  let list = (Map λx(x) list)
  ...
  let list = (Map λx(x) list)
  let list = (Map λx(x) list)
  (Build list)
```

Here is the number of rewrites in function of the number of calls to Map:

```
calls | rewrites
----- | --------
0     | 1403
1     | 1408
2     | 1413
3     | 1418
4     | 1423
5     | 1428
6     | 1433
7     | 1438
8     | 1443
9     | 1448
```

As you can see, each call to `Map` only added `5` rewrite rules to the total count. Since the list has 100 elements, it would be impossible to allocate a whole list with just `5` graph rewrites, indicating that, indeed, HVM removed the need for allocating intermediate structures! Of course, the function used is just `id`. If you use anything else, the cost will increase proportional to the cost of the function itself, but no intermediate structures will be allocated. Even cooler, if the function applied itself fuses, then it will also be optimized that way. For example, mapping 10x `λx (Add 1 x)` will turn it into a single map of `λx (Add 10 x)`, as long as `Add` is implemented with λ-encodings too. This approach generalizes to all cases, so more advanced approaches (like Haskell's stream fusion) can also be done on HVM with no change to the compiler. Just implement it as a lib, and it will work as expected.
