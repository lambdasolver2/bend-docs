---
title: "Bend 2 · HVM · Interaction nets — the compendium (Claude edition)"
description: "Every source on Bend 2, BendRT, HVM1–HVM5, the Interaction Calculus and interaction nets in this workspace, copied verbatim with stable ids, plus the current HVM4 HEAD documentation (Part L), a reading guide to Victor Taelin's work, an audit ledger and a regenerated link index. Companion of the coursebook."
updated: 2026-11-06
verified: 2026-11-06
status: docs-only
canonical: /compendium/bend-hvm-inet-compendium-claude/
sources:
  - https://github.com/bendlang/bend
  - https://github.com/HigherOrderCO/HVM4
  - https://github.com/VictorTaelin/Interaction-Calculus
  - https://github.com/VictorTaelin
  - https://github.com/HigherOrderCO
  - https://bend2.dev/
---
# Bend 2 · HVM · Interaction nets — the compendium

*Claude edition, 2026-11-06. One of two documents: this **compendium** collects every source verbatim; the **coursebook** (`../coursebook/bend-hvm-inet-coursebook-claude.md`) teaches from them, with exercises and worked solutions, and cites this document by section id.*

## How to use this document

- **Ids.** Every source file has a stable id (`A.4`, `H.46`, `L.7`) in its heading and in machine markers `<!-- ===== BEGIN FILE · <id> ===== -->` / `END FILE`. `grep -n "BEGIN FILE" …` lists every source; the ids of the parts kept from the first edition (A–I and K) are unchanged, so older references still resolve.
- **Fidelity.** Every part is verbatim: the only additions are banners and markers. Everything authored for this edition is outside the parts: this introduction, Appendix R (audit), the link index and the provenance.
- **Snapshots.** Some sources exist in several copies (the tutorial in Part A and inside the skills; HVM4 docs in Parts H, I and L). They are different snapshots; the newer one wins, and Appendix R says which is newer.

## The parts

| Part | What | Read it for |
|---|---|---|
| **A** | the site's Bend 2 tutorial (17 chapters, bend 2.0.25 era) | the language, BendRT, proofs, what released Bend 2 does and does not do |
| **B** | site pages: learn + notes (interaction nets, four interactions, HVM runtime, search by superposition) | short explanations with diagrams |
| **C** | `.opencode` Bend 2 skills (9) | project-distilled facts about Bend 2 targets, ownership, superposition, performance |
| **D** | `.opencode` hvm5-ic skill | the IC as used by the HVM5 project |
| **E** | research-to-release skill | HVM5 v1 maps and method |
| **F** | Bend2/HVM5/INET knowledge base | broad background, rollups, lineage |
| **G** | HVM5 specifications v1 and v2 | homoiconic, forkable runtime design; **v2 README G.51, REVIEW G.52, code-as-data G.57**; v1 README G.2; model↔machine bridge G.5 |
| **H** | primary sources: Victor Taelin, HigherOrderCO, bend2.dev, bendlang/bend | the authors' own words (**H.33 IC README, H.41–H.55 Taelin posts**, H.1–H.4 Bend README and guides) |
| **I** | HVM4 **March 2026** snapshot (`2d7f28e`): docs + test suite | history: the multi-file `clang/` runtime with AOT, FFI, threads |
| **K** | workspace context: experiments, docs-site design notes | how this documentation project came about |
| **L** | **HVM4 at HEAD `6defdfc` (2026-05-29)**: README, AGENTS, primer, theory, core, memory, syntax, collapser, all 61 interaction sheets, test listing | **the current machine** (single sequential `src/hvm.c`) |
| **R** | audit ledger: what was wrong or outdated in the first edition, with evidence and fixes | trust calibration |

## Reading paths

| Goal | Path |
|---|---|
| Understand interaction nets from zero | coursebook Parts 1–5 → B (interaction-nets, four-interactions) → H.33 → L.4 |
| Understand the HVM4 machine and why it is built that way | coursebook Parts 8 and 8B → the HVM2 paper §13 (its limitations, quoted in the coursebook) → H.46 → L.2 (AGENTS: code map) → L.6 (memory) → L.8 (collapser) → L.9–L.69 (rules) |
| Understand Taelin's ideas in his words | H.42 → H.43 → H.46 → H.41 → H.53 → H.50/H.51 → coursebook Part 11 |
| Understand Bend 2 as released | A (chapters 01–05, 14) → H.1–H.4 → C |
| Understand HVM5 | G.51 → G.52 → G.57 → coursebook Part 10 |
| Check what changed | Appendix R → L vs I |

## Victor Taelin: a map of his public work

The person behind the Interaction Calculus, HVM1–HVM4 and Bend. The sources below are the ones this workspace holds; read them in this order.

| Topic | Source (id) | Online |
|---|---|---|
| The calculus itself: affine global variables, DUP/SUP, the rules | Interaction-Calculus README (H.33) | <https://github.com/VictorTaelin/Interaction-Calculus> |
| Manifesto: why substitution is not physical and interaction combinators are | "Towards an optimal computer" (H.42) | — |
| Optimal evaluation explained from scratch ("copy incrementally") | "Optimal evaluation in 1 or 10 or 10 years" (H.43) | — |
| How HVM works: linear objects, lazy clone, sharing inside lambdas, memory format | "HVM: how it works" (H.46) | <https://github.com/HigherOrderCO/HVM> |
| History: Optlam, Lamping's abstract algorithm and oracle, why optimal reduction stalled | HOC history (H.41) | <https://github.com/VictorTaelin/optlam> |
| The limits of Lévy optimality; unordered superpositions | (H.53) | — |
| Superposition as program search; the collapse monad; SAT; the sieve | H.50, H.51, H.44, H.49, H.52 | — |
| Deforestation at run time; the linker; type checkers | H.45, H.47, H.54, H.55 | — |
| The machines | HVM1–HVM4 READMEs (H.27–H.30), Part L | <https://github.com/HigherOrderCO/HVM3>, <https://github.com/HigherOrderCO/HVM4> |
| Symmetric Interaction Calculus (HVM1's memory format) | cited in H.46 | <https://github.com/VictorTaelin/Symmetric-Interaction-Calculus> |
| The language | Bend (H.1–H.4), bend2.dev (H.8–H.23) | <https://github.com/bendlang/bend>, <https://bend2.dev/> |
| His profile and repositories | H.24 | <https://github.com/VictorTaelin> |

## Editions and drift

- **HVM4.** Parts H (`hvm4-docs`, September 2026 retrieval of older docs) and I (March 2026 clone) describe the runtime **before** commit `4bc2336` (2026-05-07, "Refactor HVM runtime into pure single source"). Part L is HEAD. At HEAD: build `clang -O2 -o src/hvm src/hvm.c`; flags `-s -S -C[=N] -D -d -v`; no AOT, FFI or threads.
- **Bend.** Part A was checked against bend 2.0.25; the local compiler is 2.0.39; H.1–H.4 were fetched fresh for the first edition.
- **HVM5.** v1 is superseded by v2 (G.2); v2's status table is dated 2026-10-23 (G.51).
