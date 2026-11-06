
---

## Appendix B · The 61 HVM4 interaction sheets (verbatim, HEAD `6defdfc`)

Copied from `docs/hvm/interactions/*.md`. Each sheet is a sequent: the redex above the line, the result below, the rule name on the line. `eql_nam.md` is empty upstream.

**`alo_cop`**

```
@{s} n₀
------- ALO-DP0
s[n]₀ or n₀ when substitution missing (n is a de Bruijn level)
@{s} n₁
------- ALO-DP1
s[n]₁ or n₁ when substitution missing (n is a de Bruijn level)
```

**`alo_dry`**

```
@{s} ^(f x)
-------------- ALO-DRY
^(@{s}f @{s}x)
```

**`alo_dup`**

```
@{s} ! x &L = v; t
------------------ ALO-DUP
x' ← fresh
! x' &L = @{s} v
@{x',s} t
```

**`alo_lam`**

```
@{s} λx.f
------------ ALO-LAM
x' ← fresh
λx'.@{x',s}f
```

**`alo_nam`**

```
@{s} ^n
------- ALO-NAM
^n
```

**`alo_nod`**

```
@{s} T{a,b,...}
---------------- ALO-NOD
T{@{s}a, @{s}b, ...}
```

**`alo_var`**

```
@{s} n
------ ALO-VAR
s[n] or n when substitution missing (n is a de Bruijn level)
```

**`and_era`**

```
(&{} .&. b)
----------- AND-ERA
&{}
```

**`and_inc`**

```
(↑a & b)
--------- AND-INC
↑(a & b)
```

**`and_num`**

```
(#0 .&. b)
---------- AND-ZER
#0
(#n .&. b)   [n ≠ 0]
-------------------- AND-ONE
b
```

**`and_sup`**

```
(&L{a0,a1} .&. b)
-------------------------- AND-SUP
! B &L = b
&L{(a0 .&. B₀), (a1 .&. B₁)}
```

**`app_ctr`**

```
(ctr a)
----------- APP-CTR (stuck)
^(ctr a)
```

**`app_dry`**

```
(^(f x) a)
----------- APP-DRY
^(^(f x) a)
```

**`app_era`**

```
(&{} a)
------- APP-ERA
&{}
```

**`app_inc`**

```
(↑f x)
-------- APP-INC
↑(f x)
```

**`app_lam`**

```
(λx.f a)
-------- APP-LAM
x ← a
f
```

**`app_mat_ctr`**

```
(λ{#K:h; m} #K{a,b})
-------------------- APP-MAT-CTR-MAT
(h a b)
(λ{#K:h; m} #L{a,b})
-------------------- APP-MAT-CTR-MIS
(m #L{a,b})
```

**`app_mat_num`**

```
(λ{#a:h; m} #a)
--------------- APP-MAT-NUM-MAT
h
(λ{#a:h; m} #b)
--------------- APP-MAT-NUM-MIS
(m #b)
```

**`app_mat_sup`**

```
(λ{#K:h; m} &L{a,b})
-------------------- APP-MAT-SUP
! H &L = h
! M &L = m
&L{(λ{#K:H₀; M₀} a)
  ,(λ{#K:H₁; M₁} b)}
```

**`app_nam`**

```
(name a)
--------- APP-NAM
^(name a)
```

**`app_sup`**

```
(&L{f,g} a)
----------------- APP-SUP
! A &L = a
&L{(f A₀),(g A₁)}
```

**`ddu_era`**

```
! X &(&{}) = v; b
----------------- DDU-ERA
&{}
```

**`ddu_inc`**

```
! X &(↑x) = v; b
---------------- DDU-INC
↑(! X &(x) = v; b)
```

**`ddu_num`**

```
! X &(#n) = v; b
---------------- DDU-NUM
! X &n = v
b(X₀, X₁)
```

**`ddu_sup`**

```
! X &(&L{x,y}) = v; b
------------------------------ DDU-SUP
! V &L = v
! B &L = b
&L{! X &(x) = V₀; B₀, ! X &(y) = V₁; B₁}
```

**`dsu_era`**

```
&(&{}){a, b}
------------ DSU-ERA
&{}
```

**`dsu_inc`**

```
&(↑x){a, b}
------------ DSU-INC
↑(&(x){a, b})
```

**`dsu_num`**

```
&(#n){a, b}
----------- DSU-NUM
&n{a, b}
```

**`dsu_sup`**

```
&(&L{x,y}){a, b}
-------------------------- DSU-SUP
! A &L = a
! B &L = b
&L{&(x){A₀,B₀}, &(y){A₁,B₁}}
```

**`dup_dry`**

```
! X &L = ^(f x)
--------------- DUP-DRY
! F &L = f
! A &L = x
X₀ ← ^(F₀ A₀)
X₁ ← ^(F₁ A₁)
```

**`dup_lam`**

```
! F &L = λx.f
---------------- DUP-LAM
F₀ ← λ$x0.G₀
F₁ ← λ$x1.G₁
x  ← &L{$x0,$x1}
! G &L = f
```

**`dup_nam`**

```
! X &L = name
------------ DUP-NAM
X₀ ← name
X₁ ← name
```

**`dup_nod`**

```
! X &L = T{a,b,...}
------------------- DUP-NOD
! A &L = a
! B &L = b
...
X₀ ← T{A₀,B₀,...}
X₁ ← T{A₁,B₁,...}
```

**`dup_sup`**

```
! X &L = &R{a,b}
---------------- DUP-SUP
if L == R:
  X₀ ← a
  X₁ ← b
else:
  ! A &L = a
  ! B &L = b
  X₀ ← &R{A₀,B₀}
  X₁ ← &R{A₁,B₁}
```

**`eql_any`**

```
(* === b)
----------- EQL-ANY-L
1
(a === *)
----------- EQL-ANY-R
1
```

**`eql_ctr`**

```
(#K{a0,a1...} === #K{b0,b1...})  (same tag)
--------------------------------------- EQL-CTR-MAT
For SUC (1n+): ↑(pred === pred)
For CON (<>): ↑((head === head) & ↑(tail === tail))
Others: (a0 === b0) & (a1 === b1) & ...
(#K{...} === #L{...})  (different tag)
------------------------------------- EQL-CTR-MIS
#0
```

**`eql_dry`**

```
(^(af ax) === ^(bf bx))
----------------------- EQL-DRY
(af === bf) & (ax === bx)
```

**`eql_era`**

```
(&{} === b)
----------- EQL-ERA-L
&{}
(a === &{})
----------- EQL-ERA-R
&{}
```

**`eql_inc`**

```
(↑a === b)
----------- EQL-INC-L
↑(a === b)
(a === ↑b)
----------- EQL-INC-R
↑(a === b)
```

**`eql_lam`**

```
(λax.af === λbx.bf)
------------------- EQL-LAM
X := fresh_nam()
ax ← X
bx ← X
af === bf
```

**`eql_mat`**

```
(λ{#K:ah;am} === λ{#K:bh;bm})  (same tag)
----------------------------------------- EQL-MAT-MAT
(ah === bh) & (am === bm)
(λ{#K:...} === λ{#L:...})  (different tag)
----------------------------------------- EQL-MAT-MIS
#0
```

**`eql_nam`**

```
```

**`eql_num`**

```
(#a === #b)
------------ EQL-NUM
#(a == b)
```

**`eql_sup`**

```
(&L{a0,a1} === b)
---------------------- EQL-SUP-L
! B &L = b
&L{(a0 === B₀), (a1 === B₁)}
(a === &L{b0,b1})
---------------------- EQL-SUP-R
! A &L = a
&L{(A₀ === b0), (A₁ === b1)}
```

**`eql_use`**

```
(λ{af} === λ{bf})
----------------- EQL-USE
af === bf
```

**`mat_inc`**

```
(λ{...} ↑x)
------------ MAT-INC
↑(λ{...} x)
```

**`op2_era`**

```
@@opr(&{}, y)
------------- OP2-ERA
&{}
```

**`op2_inc`**

```
(↑x op y)
---------- OP2-INC-X
↑(x op y)
(#n op ↑y)
---------- OP2-INC-Y
↑(#n op y)
```

**`op2_num_era`**

```
(x op &{}) where x is NUM
-------------- OP2-NUM-ERA
&{}
```

**`op2_num_num`**

```
(#a op #b)
-------------- OP2-NUM-NUM
#(a opr b)
```

**`op2_num_sup`**

```
(x op &L{a,b}) where x is NUM
------------------------- OP2-NUM-SUP
! X &L = x
&L{(X₀ op a), (X₁ op b)}
```

**`op2_sup`**

```
@@opr(&L{a,b}, y)
------------------------- OP2-SUP
! Y &L = y
&L{@@opr(a,Y₀), @@opr(b,Y₁)}
```

**`or_era`**

```
(&{} .|. b)
----------- OR-ERA
&{}
```

**`or_inc`**

```
(↑a | b)
--------- OR-INC
↑(a | b)
```

**`or_num`**

```
(#0 .|. b)
---------- OR-ZER
b
(#n .|. b)   [n ≠ 0]
-------------------- OR-ONE
#1
```

**`or_sup`**

```
(&L{a0,a1} .|. b)
-------------------------- OR-SUP
! B &L = b
&L{(a0 .|. B₀), (a1 .|. B₁)}
```

**`uns`**

```
! ${f, v}; t
------------- WNF UNS
t(λy.λ$x.y, $x)
```

**`use_era`**

```
(λ{f} &{})
---------- USE-ERA
&{}
```

**`use_inc`**

```
(use ↑x)
--------- USE-INC
↑(use x)
```

**`use_sup`**

```
(λ{f} &L{a,b})
----------------- USE-SUP
! F &L = f
&L{(λ{F₀} a), (λ{F₁} b)}
```

**`use_val`**

```
(λ{f} x)
--------- USE-VAL
(f x)
```

