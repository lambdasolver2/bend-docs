# The Collapse Monad

URL: https://gist.github.com/VictorTaelin/60d3bc72fb4edefecd42095e44138b41

## File: collapse_monad.hs

import Control.Monad (ap, forM_)
import qualified Data.Map as M

-- The Collapse Monad
-- ------------------
-- The Collapse Monad allows collapsing a value with labelled superpositions
-- into a flat list of superposition-free values. It is like the List Monad,
-- except that, instead of always doing a cartesian product, it will perform
-- pairwise merges of distant parts of your program that are "entangled"
-- under the same label. Examples:
-- - collapse (&0{1 2}, 3)          == [(1,3), (2,3)]
-- - collapse (&0{1 2}, &0{3 4})    == [(1,3), (2,4)]
-- - collapse (&0{1 2}, &1{3 4})    == [(1,3), (1,4), (2,3), (2,4)]
-- - collapse (&0{1 2}, &1{3 4}, 5) == [(1,3,5), (1,4,5), (2,3,5), (2,4,5)]
-- Note how the second line above doesn't return the full cartesian product of
-- {1 2} and {3 4}; instead, it combines elements pairwise, because both
-- superpositions have the same label. I'm posting this file as a template to
-- recall later. This algorithm is used to flatten HVM3's results, which can be
-- superposed, back to a list of λ-terms without superpositions.

-- A bit-string
data Bin
  = O Bin
  | I Bin
  | E
  deriving Show

-- A Collapse is a tree of superposed values
data Collapse a = Sup Int (Collapse a) (Collapse a) | Val a

-- The Collapse Monad
-- Note: could be optimized using an IntMap instead of a List
bind :: Collapse a -> (a -> Collapse b) -> Collapse b
bind a f = fork a (repeat (\x -> x)) where
  fork (Val v)     paths = pass (f v) (map (\x -> x E) paths)
  fork (Sup k x y) paths = Sup k (fork x (mut k putO paths)) (fork y (mut k putI paths))
  pass (Val v)     paths = Val v
  pass (Sup k x y) paths = case paths !! k of
    E   -> Sup k x y
    O p -> pass x (mut k (\_->p) paths)
    I p -> pass y (mut k (\_->p) paths)
  putO bs = \x -> bs (O x)
  putI bs = \x -> bs (I x)

-- Collapses a Term and flattens into a list 
flatten :: Collapse a -> [a]
flatten (Val x)     = [x]
flatten (Sup _ x y) = flatten x ++ flatten y

-- Mutates an element at given index in a list
mut :: Int -> (a -> a) -> [a] -> [a]
mut 0 f (x:xs) = f x : xs
mut n f (x:xs) = x : mut (n-1) f xs
mut _ _ []     = []

instance Functor Collapse where
  fmap f (Val v)     = Val (f v)
  fmap f (Sup k x y) = Sup k (fmap f x) (fmap f y)

instance Applicative Collapse where
  pure  = Val
  (<*>) = ap

instance Monad Collapse where
  return = pure
  (>>=)  = bind

-- Example
-- -------
-- Collapsing a simple DSL with Superpositions

-- A simple DSL with tuples, numbers and superpositions
data Term
  = TNum Int           -- number
  | TTup Term Term     -- tuple
  | TSup Int Term Term -- superposition

-- Shows a term with superpositions
showTerm :: Term -> String
showTerm (TNum n)     = show n
showTerm (TTup x y)   = "(" ++ showTerm x ++ "," ++ showTerm y ++ ")"
showTerm (TSup k a b) = "&" ++ show k ++ "{" ++ showTerm a ++ " " ++ showTerm b ++ "}"

-- A Collapser for our DSL
-- - On normal values, we just use `<-`
-- - On superpositons, we return a Sup
collapse :: Term -> Collapse Term
collapse (TNum x) = do
  return $ TNum x
collapse (TTup l r) = do
  l <- collapse l
  r <- collapse r
  return $ TTup l r
collapse (TSup k a b) =
  Sup k (collapse a) (collapse b)

-- Test program
main :: IO ()
main = do
  -- Builds the term ((&0{1 2},&1{3 4}),(&0{5 6},&1{7 8}))
  let tup0 = TTup (TSup 0 (TNum 1) (TNum 2)) (TSup 1 (TNum 3) (TNum 4))
  let tup1 = TTup (TSup 0 (TNum 5) (TNum 6)) (TSup 1 (TNum 7) (TNum 8))
  let term = TTup tup0 tup1
  -- Collapses it
  let coll = flatten (collapse term)
  -- Prints the sup-free term list
  forM_ coll $ \ term ->
    putStrLn $ showTerm term

