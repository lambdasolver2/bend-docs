---
title: "Where the proofs come from"
description: "Formality's productivity thesis, Kind's minimal theory, and why Bend2 treats proofs as a developer tool."
updated: 2026-09-05
verified: 2026-09-05
status: stable
canonical: /notes/proof-lineage/
sources:
  - https://github.com/VictorTaelin/Formality
  - https://github.com/HigherOrderCO/Kind
  - https://github.com/VictorTaelin/articles
  - https://bend2.dev/notes/bend2-vs-lean/
---

# Where the proofs come from

<div class="prereq">

**Prerequisites**

- [What is Bend2?](./what-is-bend2/) — the language this lineage leads to

</div>

Bend2's dependent types did not appear from nowhere. They are the third
generation of one author's argument: **proofs are a developer-productivity
tool**, an evolution of types the way TypeScript was an evolution of
JavaScript. Understanding the lineage makes Bend2's strangest choices
(linear everything, Dead vs Live, synthesis-first) read as conclusions
rather than quirks.

## Proof-oriented programming

Proofs are not only a way to certify mathematics. In HOC's tradition they
are a programming tool: precise specifications make generated programs
checkable, so synthesis can propose and the kernel can reject incorrect
answers.

## Formality: proofs as superpowers

Formality (Taelin, ~2018, "a modern programming language featuring formal
proofs — now written in itself") opens with the thesis outright: forget
mathematics and security, the boring stuff — adding types to untyped
languages already demonstrated the productivity jump, and formal proofs
are the next step of that same curve. The language is there to make the
developer faster, not the mathematician happier. Every Bend2 proof decision
descends from this sentence: in the [Lean comparison](./vs-lean.md), the
program is the product.

Taelin's essay on proving vs testing makes the mechanism explicit:
auditing doesn't scale, tests sample behavior, proofs cover it — and the
cheapest proof is one the machine helps write. That is the exact slot
SupGen occupies in Bend2: synthesis proposes, the checker disposes.

## Kind: the minimal theory

Kind ("a modern proof language") is the visible ancestor of Bend2's type
system — and it is deliberately tiny. Its core grammar fits on one screen:
dependent function `∀(x:T)U`, lambda, application, self-types, datatypes
with constructors, pattern matching, holes (`?name`) for unfinished
proofs, and `*` as the type of types. No tactic language, no standard
library ceremony: just enough theory to state and check precise types.

<div class="box box-key">
<b>Kind2's conversion checker in three lines</b> To decide <i>A == B</i>:
if textually identical, true; else reduce both to weak normal form and
check similarity field-by-field. No "seen equations" map (Kind1's slower
fix), no constructor flags — just identical → reduce → similar, in
exactly that order. It covers everything Coq's checker covers, and the
order-sensitivity is load-bearing: swap it and self-referential types
(like <i>List Char</i> where <i>Char</i> aliases <i>#U60</i>) loop
forever.
</div>

That design moral — the obvious algorithm works if reductions happen in
precisely the right order — runs through all of HOC's work, from
evaluators to checkers. Bend2 inherits the shape (quantifiers as types,
programs as proofs) and adds the linearity discipline plus the Dead/Live
mode split that lets it keep `Type : Type` without letting paradoxes near
live code.

## What this predicts about Bend2

Three predictions, all checkable at release: proofs will stay term-level
(recursion as induction, rewrites as `%`, no tactic layer — tactics serve
mathematicians, and Bend2 serves developers); the standard library will
grow specifications first (precise types are SupGen's search targets);
and the killer feature will read as productivity, not certainty — proofs
replacing test suites rather than chasing foundations. If release-day
Bend2 instead ships a tactic engine, this page is wrong in an interesting
way, and will say so.
