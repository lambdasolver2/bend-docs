# Mini Termination Checker Via Fold Generation

URL: https://gist.github.com/VictorTaelin/676241eb4e290a006e5618f97b8a1c25

## File: mini_termination_checker_via_fold_generation.hs

-- ============================================================================
--  MINI TERMINATION CHECKER VIA FOLD GENERATION
--  finding the legal recursive calls of a clause, without comparing sizes
-- ============================================================================
--
--  Everything here is written in the term language and nothing else:
--
--      x               a variable
--      λx. e           a lambda
--      (f x)           application      (n-ary: (f x y))
--      ()              the unit value
--      #0{e}           left injection   (the first constructor of a sum)
--      #1{e}           right injection  (the second constructor of a sum)
--      (e, e')         a pair
--      λ{#0: o; #1: i} a match
--
--  Types:  1 (unit) · A|B (sum) · A&B (pair) · A→B · μX.B · X~[…] (see below).
--  The two example types are encodings, nothing built in:
--
--      N   = μX. 1 | X            zero = #0{()}      succ p = #1{p}
--      N[] = μX. 1 | (N & X)      nil  = #0{()}      cons h t = #1{(h, t)}
--
--
--  WHAT WE WANT
--  ============
--  A recursive function may only call itself on smaller arguments, or it can
--  loop forever. For each clause we want the exact list of calls that are sure
--  to be smaller: its FOLDS. Below, the folds sit in place of each body; a fold
--  with a leftover λ may be applied to anything in that spot.
--
--      F : N → N → N
--      F #0{()} b         = (no folds)
--      F #1{a} #0{()}     = λy.(F a y)
--      F #1{a} #1{#0{()}} = λy.(F a y)
--      F #1{a} #1{#1{b}}  = λy.(F a y), (F #1{a} b), (F #1{a} #1{b})
--
--      G : N[] → N
--      G #0{()}          = (no folds)
--      G #1{(#0{()}, t)} = (G t)
--      G #1{(#1{p}, t)}  = λs.(G #1{(p, s)}), (G t)
--
--  These folds ARE the permitted recursive calls. A clause is safe exactly when
--  every self-call in its body is one of its folds with the leftover λ's filled
--  by anything: λy.(F a y) permits (F a ANYTHING); (F #1{a} b) permits only that
--  exact call; λs.(G #1{(p,s)}) permits (G #1{(p, ANYTHING)}). This file only
--  GENERATES the folds; checking a body against them is that one extra step.
--
--  How could we KNOW these are right? Why is λy.(F a y) fine for any second
--  argument, but (F #1{a} b) only for that exact b? Why does a #1 head give
--  λs.(G #1{(p,s)}) but a #0 head gives no such call? Why does the last clause,
--  which peels the second argument twice and binds b, get BOTH (F #1{a} b) and
--  (F #1{a} #1{b})? The rest of the file answers this, never measuring a size.
--
--
--  THE OVERVIEW
--  ============
--  Walk down the function's type, following the clause's pattern, and carry the
--  recursive call with its undecided arguments left as λ-holes. Call that term
--  the CARRY. Three things happen on the way down:
--
--      SPEC   the pattern matches a constructor → wrap it onto the carry.
--      SNAP   we open a recursive type          → save the carry at the spot.
--      EMIT   the pattern binds a variable       → apply each snapshot saved
--                                                  there to it; each is one fold.
--
--  The folds are just snapshots applied to the variables the pattern binds.
--
--
--  THE DETAILS
--  ===========
--  A recursive type μX.B refers to itself as X. In N = μX. 1 | X the X is the
--  RECURSIVE SPOT: where a smaller value of the same type sits (the predecessor
--  of #1, the tail of #1{(h,t)}). Snapshots are saved on spots.
--
--  Why every fold is smaller.
--    A snapshot is saved BEFORE the constructor at that spot is peeled. The
--    variable bound there later is what is LEFT after peeling one constructor.
--    Feeding it back into the snapshot rebuilds the call with one argument one
--    constructor shorter. So it is smaller, always, for free.
--
--  Why snapshots are a list, not one.
--    A pattern can peel the same spot twice (#1{#1{b}}). Each peel saves another
--    snapshot, one layer deeper. Binding the last variable applies them all, one
--    fold per depth: the deep snapshot gives (F #1{a} b) (two layers off), the
--    shallow one gives (F #1{a} #1{b}) (one layer off). This only happens when a
--    clause matches a BOUND variable again; a language that cannot do that keeps a
--    single snapshot per spot, so the list is always a singleton there.
--
--  Why some λ-holes survive into a fold.
--    Applying a snapshot fills one hole; the carry's other holes stay as λ's, and
--    can be anything, because once one argument shrinks, everything to its right
--    is free. Two cases: a later argument not yet reached → a partial fold,
--    λy.(F a y); a sibling field not yet bound → a flexible field, λs.(G #1{(p,s)}).
--
--
--  THE CARRY
--  =========
--  The carry is the clause's left side, rebuilt as a call as far as we have
--  matched, the unfinished spots left as λ-holes. It grows. For f : N → N on the
--  clause f #1{a}:
--
--      start        λx. (f x)              one hole
--      match #1     λp. (f #1{p})          the hole slid under a #1
--      bind a       (f #1{a})              no holes: the clause's own lhs
--
--  A pair field ADDS a hole. For g : N[] → N on g #1{(h,t)}:
--
--      start        λx. (g x)              one hole
--      match #1     λp. (g #1{p})          one hole
--      split pair   λh.λt. (g #1{(h,t)})   two holes now (head, tail)
--      bind h, t    (g #1{(h,t)})          no holes: the lhs again
--
--  The final carry is always the clause's own lhs, the same size, never a legal
--  call. Folds come from EARLIER carries (the snapshots) applied to the bound
--  variables: the snapshot λx.(f x) applied to a is (f a), one constructor smaller.
--
--  Strip the bookkeeping and a fold is just the recursive call with ONE argument
--  replaced by a structurally smaller variable, the rest left free. The carry as a
--  term is one way to compute that; an implementation may instead carry the plain
--  list of arguments-so-far and skip the rebuilding entirely.
--
--
--  THE ALGORITHM
--  =============
--  fold takes the carry c, the type still to walk, the clause skeleton (itself a
--  term: a match, a λ that binds, or () for the body), and the folds so far.
--  X~ms is a spot already opened, holding the snapshot list ms.
--
--  fold c  k          ()             ms-fs = ms-fs
--  fold c (1   → k)   s              fs    = fold (c ()) k s fs
--  fold c (A&B → k)   s              fs    = fold (λh.λt. (c (h,t))) (A→B→k) s fs
--  fold c (μX.B → k)  λ{#0:o;#1:i}   fs    = fold c (B[X := X~[c]]    → k) λ{#0:o;#1:i} fs
--  fold c (X~ms → k)  λ{#0:o;#1:i}   fs    = fold c (B[X := X~(ms++[c])] → k) λ{#0:o;#1:i} fs
--  fold c (A|B → k)   λ{#0:o;#1:i}   fs    = λ{ #0: fold (λw. (c #0{w})) (A→k) o fs
--                                             ; #1: fold (λw. (c #1{w})) (B→k) i fs }
--  fold c (X~ms → k)  λv. s          fs    = λv. fold (c v) k s (fs ++ [(m v) | m ← ms])
--  fold c (A   → k)   λv. s          fs    = λv. fold (c v) k s fs
--
--      line 1 (body)  return the folds collected.
--      line 2 (1)     a unit field: plug (), no bind, no fold.
--      line 3 (A&B)   a pair field: SPEC, the carry grows two holes.
--      line 4 (μX.B)  open a fresh μ to match it: SNAP, save c (ms = [c]).
--      line 5 (X~ms)  match an opened spot again: SNAP, add c (ms ++ [c]).
--      line 6 (A|B)   the match: each branch SPECs its tag and walks its payload.
--      line 7 (X~ms)  bind a variable at a spot: EMIT one fold per snapshot.
--      line 8 (A)     bind a variable elsewhere: no snapshot, no fold.
--
--  Every line rebuilds the carry the same way — app fills a hole, the constructor
--  cases wrap one on — and walks on. Binding is uniform: lines 7 and 8 both do
--  (c v); only line 7, sitting at a spot, also emits. There is no per-argument
--  special-casing and no notion of "this λ binds a whole argument" versus "a
--  field": a bind is a bind, an emit only happens on a spot.
--
--
--  WORKED DERIVATIONS
--  ==================
--  Each derivation reduces one whole function. The dashed line names the rule
--  applied next. A leaf shows  < carry : remaining-type ; [folds] >  while it
--  has work, or just its [folds] at a body. A snapshot list is written T~[…]. To
--  save steps, a #0 branch fills its () and a #1 branch splits its pair in the
--  same match step, so neither shows as a binder. The leaves are the clauses.
--
--
--  F : N → N → N
--
--    < F : N → N → N ; [] >
--    ---------------------------------------------------------------------- unroll-N
--    < F : (1 | N~[F]) → N → N ; [] >
--    ---------------------------------------------------------------------- mat-N
--    λ{
--      #0: < (F #0{()}) : N → N ; [] >;
--      #1: < λp.(F #1{p}) : N~[F] → N → N ; [] >
--    }
--    ---------------------------------------------------------------------- abs-N
--    λ{
--      #0: λb. [];
--      #1: λa. < (F #1{a}) : N → N ; [λy.(F a y)] >
--    }
--    ---------------------------------------------------------------------- unroll-N
--    λ{
--      #0: λb. [];
--      #1: λa. < (F #1{a}) : (1 | N~[(F #1{a})]) → N ; [λy.(F a y)] >
--    }
--    ---------------------------------------------------------------------- mat-N
--    λ{
--      #0: λb. [];
--      #1: λa. λ{
--        #0: [λy.(F a y)];
--        #1: < λp.(F #1{a} #1{p}) : N~[(F #1{a})] → N ; [λy.(F a y)] >
--      }
--    }
--    ---------------------------------------------------------------------- unroll-N
--    λ{
--      #0: λb. [];
--      #1: λa. < (F #1{a}) : (1 | N~[(F #1{a})]) → N ; [λy.(F a y)] >
--    }
--    ---------------------------------------------------------------------- mat-N
--    λ{
--      #0: λb. [];
--      #1: λa. λ{
--        #0: [λy.(F a y)];
--        #1: < λp.(F #1{a} #1{p}) : N~[(F #1{a})] → N ; [λy.(F a y)] >
--      }
--    }
--    ---------------------------------------------------------------------- unroll-N
--    λ{
--      #0: λb. [];
--      #1: λa. λ{
--        #0: [λy.(F a y)];
--        #1: < λp.(F #1{a} #1{p})
--           : (1 | N~[(F #1{a}), λp.(F #1{a} #1{p})]) → N
--           ; [λy.(F a y)] >
--      }
--    }
--    ---------------------------------------------------------------------- mat-N
--    λ{
--      #0: λb. [];
--      #1: λa. λ{
--        #0: [λy.(F a y)];
--        #1: λ{
--          #0: [λy.(F a y)];
--          #1: < λp.(F #1{a} #1{#1{p}})
--             : N~[(F #1{a}), λp.(F #1{a} #1{p})] → N
--             ; [λy.(F a y)] >
--        }
--      }
--    }
--    ---------------------------------------------------------------------- abs-N
--    λ{
--      #0: λb. [];
--      #1: λa. λ{
--        #0: [λy.(F a y)];
--        #1: λ{
--          #0: [λy.(F a y)];
--          #1: λb. [λy.(F a y), (F #1{a} b), (F #1{a} #1{b})]
--        }
--      }
--    }
--
--
--  G : N[] → N
--
--    < G : N[] → N ; [] >
--    ---------------------------------------------------------------------- unroll-N[]
--    < G : (1 | (N & N[]~[G])) → N ; [] >
--    ---------------------------------------------------------------------- mat-N[]
--    λ{
--      #0: [];
--      #1: < λh.λt.(G #1{(h,t)}) : N → N[]~[G] → N ; [] >
--    }
--    ---------------------------------------------------------------------- unroll-N
--    λ{
--      #0: [];
--      #1: < λh.λt.(G #1{(h,t)})
--         : (1 | N~[λh.λt.(G #1{(h,t)})]) → N[]~[G] → N
--         ; [] >
--    }
--    ---------------------------------------------------------------------- mat-N
--    λ{
--      #0: [];
--      #1: λ{
--        #0: < λt.(G #1{(#0{()},t)}) : N[]~[G] → N ; [] >;
--        #1: < λp.λt.(G #1{(#1{p},t)})
--           : N~[λh.λt.(G #1{(h,t)})] → N[]~[G] → N
--           ; [] >
--      }
--    }
--    ---------------------------------------------------------------------- abs-N[]
--    λ{
--      #0: [];
--      #1: λ{
--        #0: λt. [(G t)];
--        #1: < λp.λt.(G #1{(#1{p},t)})
--           : N~[λh.λt.(G #1{(h,t)})] → N[]~[G] → N
--           ; [] >
--      }
--    }
--    ---------------------------------------------------------------------- abs-N
--    λ{
--      #0: [];
--      #1: λ{
--        #0: λt. [(G t)];
--        #1: λp. < λt.(G #1{(#1{p},t)}) : N[]~[G] → N ; [λs.(G #1{(p,s)})] >
--      }
--    }
--    ---------------------------------------------------------------------- abs-N[]
--    λ{
--      #0: [];
--      #1: λ{
--        #0: λt. [(G t)];
--        #1: λp. λt. [λs.(G #1{(p,s)}), (G t)]
--      }
--    }
--
-- ============================================================================

module Main where

import Data.List (intercalate)
import Control.Monad (forM_)

-- Types
-- -----

-- Term ::= x | λx.f | (f x) | () | #0{x} | #1{x} | λ{#0:o;#1:i} | (x,y) | [folds]
-- Type ::= 1 | A|B | A&B | A→B | μX.T | T~[carry,...]
-- Mat, Lam and One double as the clause skeleton; Fds holds a body's folds.

type Name = String

data Term
  = Var Name
  | Lam (Term -> Term)
  | App Term Term
  | One
  | Inl Term
  | Inr Term
  | Mat Term Term
  | Con Term Term
  | Fds [Term]

-- Rec holds its own unrolling and the snapshots saved while reaching it.
data Type
  = Uni
  | Eit Type Type
  | Par Type Type
  | Fun Type Type
  | Fix (Type -> Type)
  | Rec (Type -> Type) [(Term, Type)]

type Test = (Name, Term, Type, Term)

-- Stringification
-- ---------------

name :: Int -> Name
name n = [['a' .. 'z'] !! n]

-- flatten an application into head and arguments: (App (App F a) b) -> [F,a,b]
spine :: Term -> [Term]
spine (App f x) = spine f ++ [x]
spine t         = [t]

show_term :: Int -> Term -> String
show_term d (Fds fs)  = "[" ++ intercalate ", " (map (show_term d) fs) ++ "]"
show_term d (Mat o i) = "λ{#0: " ++ show_term d o ++ "; #1: " ++ show_term d i ++ "}"
show_term d (Lam f)   = "λ" ++ name d ++ ". " ++ show_term (d + 1) (f (Var (name d)))
show_term d (App f x) = "(" ++ unwords (map (show_term d) (spine (App f x))) ++ ")"
show_term _ (Var x)   = x
show_term _ One       = "()"
show_term d (Inl x)   = "#0{" ++ show_term d x ++ "}"
show_term d (Inr x)   = "#1{" ++ show_term d x ++ "}"
show_term d (Con a b) = "(" ++ show_term d a ++ ", " ++ show_term d b ++ ")"

-- Carry application
-- -----------------

-- Fill the carry's outermost hole, and nothing else: (λx.f)(v) reduces, anything
-- else stays applied. This is NOT the language's evaluator. The carry's only
-- redexes are the holes we put there with Lam; its head (F, G) is a plain Var and
-- is never the function of an App, so the recursive call is never run. Keep this
-- restraint when porting: there F is a real reference, and a true evaluator would
-- unfold and EXECUTE the very call we are trying to inspect (and likely diverge).
app :: Term -> Term -> Term
app (Lam f) x = f x
app f       x = App f x

-- Termination
-- -----------

-- folds tm fn ty fs walks the type ty along the skeleton tm, carrying the carry
-- fn and the folds fs so far, returning the skeleton with each body replaced by
-- its fold list. The eight clauses are the eight lines of THE ALGORITHM.
folds :: Term -> Term -> Type -> [Term] -> Term
folds One       _  _                    fs = Fds fs
folds tm        fn (Fun Uni b)          fs = folds tm (app fn One) b fs
folds tm        fn (Fun (Par ax ay) b)  fs = folds tm (Lam (\h -> Lam (\t -> app fn (Con h t)))) (Fun ax (Fun ay b)) fs
folds (Mat o i) fn (Fun (Fix nf) b)     fs = folds (Mat o i) fn (Fun (nf (Rec nf [(fn, Fun (Fix nf) b)])) b) fs
folds (Mat o i) fn (Fun (Rec nf ms) b)  fs = folds (Mat o i) fn (Fun (nf (Rec nf (ms ++ [(fn, Fun (Rec nf ms) b)]))) b) fs
folds (Mat o i) fn (Fun (Eit l r) b)    fs = Mat (folds o (Lam (\w -> app fn (Inl w))) (Fun l b) fs) (folds i (Lam (\w -> app fn (Inr w))) (Fun r b) fs)
folds (Lam g)   fn (Fun (Rec _ ms) b)   fs = Lam (\v -> folds (g v) (app fn v) b (fs ++ map (\m -> app (fst m) v) ms))
folds (Lam g)   fn (Fun _ b)            fs = Lam (\v -> folds (g v) (app fn v) b fs)
folds _         _  _                     _ = error "folds: ill-formed skeleton"

-- Tests
-- -----

nat :: Type
nat = Fix (\x -> Eit Uni x)

lst :: Type
lst = Fix (\x -> Eit Uni (Par nat x))

-- each carry is the recursive call eta-expanded to the function's arity, so a
-- partial fold keeps a visible λ per argument not yet supplied
selfF :: Term
selfF = Lam (\x -> Lam (\y -> App (App (Var "F") x) y))

selfG :: Term
selfG = Lam (\x -> App (Var "G") x)

-- a skeleton is a case tree: Mat is a match, Lam binds a variable, One is a body.
-- Each test runs one whole function; its leaves are that function's clauses.
tests :: [Test]
tests =
  [
    ("F : N -> N -> N", selfF, Fun nat (Fun nat nat),
      Mat (Lam (\_ -> One)) (Lam (\_ -> Mat One (Mat One (Lam (\_ -> One)))))),
    ("G : N[] -> N", selfG, Fun lst nat,
      Mat One (Mat (Lam (\_ -> One)) (Lam (\_ -> Lam (\_ -> One)))))
  ]

main :: IO ()
main = do
  forM_ tests $ \(lbl, fn, ty, sk) -> do
    putStrLn ("-- " ++ lbl)
    putStrLn (show_term 0 (folds sk fn ty []))
    putStrLn ""

