# REWRITE BRIEF · bend-docs v2 — audit first, verify everything, then rebuild BOTH documents

You are a frontier model (Opus-class) with file/terminal access. This is a long autonomous task. Your job: **adversarially audit two existing documents, fix their flaws, and fully rewrite both** — with beautiful interaction-net rendering, first-principles didactics, Victor Taelin's own (publicly said) insights mined from the sources, honest claim-typing, and faithful HVM4 (and HVM5) mechanics. Work from the raw sources, not from memory. Prove every number by running it.

Repo: `/workspaces/typescript-node/bend-docs` (Astro docs site; workspace root is `/workspaces/typescript-node`).

---

## 0 · The two documents — and the only deliverables

| # | File (must remain at this path) | v1 scale | What it is |
|---|---|---|---|
| **D1** | `src/content/compendium/bend-hvm-inet-compendium.md` | 3.05 MB · 76.5k lines · 401 source files · parts A–K + LINK INDEX + PROVENANCE | **One document that combines every existing source**, copied verbatim, with stable section ids (`A.1`…`K.5`) and machine markers `<!-- ===== BEGIN FILE · A.4 ===== -->` / `END FILE` |
| **D2** | `src/content/coursebook/bend-hvm-inet-coursebook.md` | 2.6k lines · 76 exercises | **One learning document**: a tutorial with quickstart, worked solutions, and appendices (tools, 61-rule index, verified-program ledger, glossary, maps, verification ledger) |

**Hard rules about the set:** exactly these two documents are the deliverable. The audit you produce becomes an **appendix inside D1** (see §3). You may add tooling under `bend-docs/scripts/` only. Do not split content into extra files. Do not register the folders in `src/content.config.ts` unless the build forces it — `bun run build` must stay green.

**Fidelity rules:** D1 stays a *verbatim collector* (parts + markers + ids). If you restructure D1, you must update every cross-reference in D2 in the same commit and record an old→new id map in the audit appendix. D2 is *yours to rewrite fully*: use v1 as a floor, not a ceiling.

---

## 1 · Source map — read before writing

**Raw sources (prefer these over D1 for any question; D1 is a snapshot):**

- `bend-docs/src/content/tutorial/` — 17 chapters: the site's Bend 2 course (checked against bend 2.0.25), plus `index.md`.
- `bend-docs/src/content/learn/` and `src/content/notes/` — hands-on + deep notes; **house style and SVG examples live here** (`notes/interaction-nets.md`, `notes/four-interactions.md`, `notes/hvm-runtime.md`).
- `bend-gme/version-1/.opencode/skills/` — `bend2` + `bend2-{language,proofs,ownership,superposition,effects-targets,performance,app,runtime}` (9 skills), `hvm5-ic` (16 references), `research-to-release` (the HVM5 v1 maps).
- `bend-runtime/knowledge/` — the Bend2/HVM5/INET knowledge base (incl. `ALL-COMBINED*` rollups that preserve older content).
- `bend-runtime/hvm5/version1/` (normative v1 spec + maps + plan; `spec/01a-hvm4-execution.md` is the model↔machine bridge) and `version2/` (the rewrite: `README.md`, `REVIEW.md`, `spec/00..07`, islands, code-as-data) plus `reference/hvm5-mini/`.
- `forgecode_clone/hvm/` — the **HVM4 repo clone**: `docs/hvm/interactions/*.md` (61 rule sheets), `docs/hvm/{core,syntax,memory,collapser}.md`, `docs/theory/interaction_calculus.md`, `docs/primer.md`, `test/` (216+ programs with expected outputs, `_book_.hvm`, `_all_.sh`), and **`clang/` — the actual C implementation. Read the code, not just the docs.**
- `bend-docs/openspec/changes/bend-docs-site/research/` — **Taelin primary sources**: `victor/*` (15 posts incl. `hvm-10min`, `hvm-how`, `hvm-unordered-sup`, `hvm-search1/3`, `hvm-collapse-monad`, `hvm-sieve`, `hvm-linker`, `hvm-deforestation`, `hvm-sat`, `hoc-history`, `hoc-optimal-computer`, `kind-conv-checker`, `term-checker`), `repos/*` (HVM1–4 / Kind / Bend / Bend2 / Interaction-Calculus READMEs, `hvm4-docs/*`), `sources/*` (bend2.dev pages), `concept-map.md`.
- `bend-docs/scripts/check-tutorial.py` — the fence-checking convention to imitate for D2.
- Fresh upstream (fetch; record date + sha256 in the ledger): `https://raw.githubusercontent.com/bendlang/bend/main/README.md`, `.../guide/GUIDE.md`, `.../guide/EFFECTS.md`, `.../guide/SHADERS.md`.
- **v1 build intermediates (may still exist on this machine — check):** the compendium was assembled by `/tmp/opencode/compendium-build/build.mjs` with fetched inputs + `RETRIEVAL.txt` (sha256s) in `/tmp/opencode/compendium-build/inputs/`; the coursebook was written as section files in `/tmp/opencode/coursebook/parts/`. Read them if present; otherwise regenerate from the workspace sources.
- Also explore: `bend-runtime/hvm5/version1/legacy/*`, `bend-docs/openspec/changes/bend-docs-site/{design,proposal}.md`, `bend-video/` (skip if irrelevant), `effect-hvm-1/packages/hvm4` (duplicate clone).

**D1 part map (v1):** A = tutorial · B = learn+notes · C = bend2 skills · D = hvm5-ic · E = research-to-release · F = knowledge base · G = hvm5 specs · H = primary sources (Taelin/HOC/bend2.dev/fresh) · I = HVM4 docs+tests · J = .opencode tooling · K = workspace context.

**House style:** `src/layouts/Base.astro` (serif textbook look), CSS classes `box box-key`, `box box-info`, `box box-warn`, inline `<figure><svg role="img" aria-label="…">` like `notes/four-interactions.md`. **No mermaid — the site does not render it.** No emoji. No marketing tone.

---

## 2 · Toolchains — build them and run EVERYTHING

Work in `/tmp/opencode/rewrite-v2/` (keep the repo clean). Network is available; pin and record commit hashes.

```sh
# HVM4 (the machine)
git clone --depth 1 https://github.com/HigherOrderCO/HVM4 /tmp/opencode/rewrite-v2/hvm4
cd /tmp/opencode/rewrite-v2/hvm4/clang && clang -O2 -o main main.c -ldl
./main ../test/autodup_1.hvm -s            # smoke test
cd .. && ./test/_all_.sh -i                # full suite (expect 1 timeout: fib_small needs ~5 s)

# The Interaction Calculus reference (the pure calculus)
git clone --depth 1 https://github.com/VictorTaelin/Interaction-Calculus /tmp/opencode/rewrite-v2/ic
cd /tmp/opencode/rewrite-v2/ic && make && ./bin/ic run prog.ic    # add -C to collapse

# Bend 2 (the language) — already installed locally
bend version        # v1 used 2.0.39; tutorial material is 2.0.25 — label every output with its version
```

Rules: every `hvm` / `ic` / `bend` fence in D2 either (a) runs and its printed output is recorded, or (b) is explicitly labelled a sketch. Regenerate the verified ledger (D2 Appendix C) from **your** runs, with dates and commit hashes. Write `bend-docs/scripts/check-coursebook.mjs` (or extend the `.py` pattern) so the check is repeatable. If a tool cannot be built, mark affected claims `unverified (tool unavailable)` — never fake a run.

---

## 3 · Phase 1 — adversarial audit (nothing gets rewritten before this list exists)

Hunt for defects in **both** documents with evidence (`command → output`, `file:line`, or source id). For each finding: id `F-nn`, severity (blocker / major / minor / polish), evidence, and the fix. Fold the finished list into D1 as **“Appendix R — v2 audit ledger”**, plus a “what changed v1→v2” summary. Do not create a third file.

**Seed list — verify each; do NOT trust, and find more:**

1. **Program fences**: any that don't run, any pseudo-code masquerading as code (v1 had `--` comments — HVM4 comments are `//`), any `...` ellipses inside runnable fences.
2. **Two numeral systems**: `n`-literals (`3n`, prints as `3n`, matched by `0n:`/`1n+:` patterns) vs constructor chains `#S{#S{#Z{}}}` (matched by `#Z:`/`#S:` patterns). Mixing fails with `cannot apply a number`. Check every claim about either form; check the docs' use of `#Suc/#Zer` names against the runtime.
3. **Collapse `#N` tags**: meaning, stability, when to ignore; make v1's statements consistent everywhere.
4. **Flags**: `-D` is NOT combinable with `-C`; document `--to-c`, `--as-c`, `-o`, FFI flags accurately.
5. **Heap node counts** vary between runs — never quote them as evidence.
6. **`ic` WORK accounting**: what exactly is counted (dispatch? cleanup? collapse?). Only explain counts you can derive; otherwise present them as the tool's own metric.
7. **`@c2(@c2)` vs `@c2(@k2)`**: find the authoritative wording (HVM5 v2 status line “same label gives 1, not 4”; tests `c2_not_t`, `c8_k8_not_t`) and present raw outputs + careful interpretation.
8. **“Single-file C” vs `clang/` module dirs**: describe the true build structure (read `hvm.c`; how the TU includes modules).
9. **`eql_nam` sheet ships empty** — test what really happens when name heads meet; fix or explain.
10. **`hvm5-mini` is "a port of `hvm5.c`"** — does `hvm5.c` exist publicly? Adjust wording to what is verifiable.
11. **HVM5 status honesty**: v1 frozen / v2 in-flight; cite `REVIEW.md`; never overclaim.
12. **SupGen**: private; only quoted claims; the public mechanism (labels/collapse/erasure) may be taught, the synthesizer may not be implied available.
13. **Model vs machine**: anywhere D2's pictures could be read as HVM4's heap being a port graph — fix (HVM5 spec §01a says the term encoding is legitimate; say both).
14. **BendRT**: not a net reducer; verify the affine/no-GC/balanced-fork/24-bit-refcount claims against the tutorial's ch. 04 block and the guide.
15. **Bend version drift**: label every Bend output with the compiler version that produced it; re-run everything with the installed `bend`.
16. **Licenses**: HVM4 and Interaction-Calculus ship **no license text** (state “study, not a grant”); Bend is Apache-2.0; keep all attributions; note this in provenance.
17. **Reduction diagrams**: re-verify every pair of ports, every free-port-preserving rewiring, every step count. Where a diagram can be machine-checked (it can, for ic/HVM4 programs), do it.
18. **Cross-references**: every `A.x` / `§` / “see Part n” resolves; write a checker and run it.
19. **Link index**: verify the core links with `curl -sIL`; de-duplicate; group and annotate; dead links get noted not hidden.
20. **Taelin quotes**: only verbatim text that exists in the sources; paraphrase must be marked as paraphrase; hunt for quotes v1 missed.
21. **The `#CON:` mystery** from the archived 2026-09-05 log (“len via `#CON:` of 3-list”) — resolve what it was or drop it.
22. **`*` trap**: IC `*` = erasure; HVM4 `*` = wildcard (`Any`, “duplicates itself, equals anything”). Test HVM4's `*`; make sure the trap stays flagged.
23. **Auto-dup expansions** (`λ&x.` with 3–4 uses; `λx&.` fresh labels): verify against `syntax.md` and by running; make the label-freshness verifiable (e.g. `(λx&.[x₀,x₁])(&A{1,2})` gives two branches because labels differ).
24. **The sharing showpiece** (11 vs 8 itrs): re-run, re-read the `-D` trace, and phrase the claim exactly (work shared, counts include overhead).
25. **Factorial counts**: v1's `109` vs suite's `119` (argument construction) — re-verify and explain so it can't be misread.
26. **First-principles derivability**: every exercise must be solvable from preceding text; find exercises that aren't and fix them.
27. **Pedagogy gaps**: concepts used before defined; missing motivation for labels/collapse; Part 9 (optimality) too thin vs its importance; HVM5 chapter too shallow; no code-reading exercises.
28. **Missed Taelin insights**: list which `victor/*` files were under-used and mine them (§4.3).
29. Anything that contradicts between sources: prefer **runnable artifact → repo docs of the pinned version → third-party summaries**, and log the contradiction.
30. Freshness: re-fetch upstream docs; note what changed since v1 (dates + hashes).

---

## 4 · Phase 2 — rewrite D2 (the learning document)

Target: **the best public tutorial on interaction nets and the HVM/IC lineage** — a motivated Haskeller should finish it in ~10–15 hours able to: reduce nets by hand; read any of the 61 HVM4 rule sheets; run and interpret HVM4 (flags, counts, traces); explain labels (projection vs copy) and the `c2/k2` accident; explain sharing/optimality and its costs honestly; describe HVM4's machine and HVM5's homoiconic design; and know what is proven / measured / claimed across the ecosystem.

### 4.1 Structure (fundamentals → mastery; keep a numbered `## N ·` scheme)

Keep v1's arc, but deepen and re-balance. Suggested skeleton (change only for the better):

0. How to use · the three toolchains · **First 15 minutes** (runnable) · the map · honest limits
1. Why copying is the whole game (sharing, memoization's limit inside lambdas)
2. The model: cells, ports, wires, active pairs, confluence (with the model's two theorems and the anti-theorem)
3. The six rules of the symmetric interaction combinators — **make this the visual centerpiece**
4. λ-calculus on nets: β as one interaction; DUP placement; copy costs
5. Labels and the Interaction Calculus: the four core rules + erasure; both dialects (ic vs HVM4)
6. Superposition as a tool: collapse, enumeration, **search by erasure**, infinite sups, forks, limits
7. Algorithms: Church numerals, add/mul/exp, the `c2/k2` label story, Peano (two numeral forms!), lists/strings, the sharing showpiece, the optimal 2²
8. Inside HVM4: the machine view — **read `clang/`** — term word, book/heap/SUB/ALO/UNS, WNF loop, bags, collapse pool, FFI; then every rule family; then all 61 sheets explained (bulk index in an appendix)
9. Parallelism & optimality, honestly: locality ⇒ free parallelism; Lévy/Lamping; the oracle's price; the bookkeeping-free fragment; Asperti–Mairson; claim-class audit; GoI pointer
10. The lineage: HVM1→4, **BendRT is not nets**, Bend 2 (laws/proofs/affinity/limits), and **HVM5** (v1 contracts/subspaces/capabilities; v2 code-as-data: fork = one DUP, superposed testing, merge3, islands, trust)
11. **Taelin's insights** (see 4.3) — woven throughout *and* collected here
12. Capstones: three levels (warm-up / full / challenge), ≥ 12 problems
A–G. Appendices: tools & reproduce-in-minutes · all 61 sheets (one line each) · regenerated verified ledger · glossary · maps (compendium ids; the site's planned `/course/` chapters) · verification ledger · “how to read the sources (D1 navigation)”

### 4.2 Rendering — nets shown beautifully

- Define **one legend** for net diagrams and use it everywhere (suggested, refine it): `●` principal port, `○` auxiliary port, `●—●` wire, cells as labeled boxes, `⇄` active pair, `✂` erasure, free ports as lowercase letters, labels as `[L=A]`. Keep every diagram readable as **raw markdown**.
- Every rule (six SIC + four core IC + erasure) gets: a before/after diagram, a one-line firing condition, a trace example, a count.
- Every worked example gets a **step gallery**: one block per interaction, rule name on the transition, cell/free-port counts checked at each step.
- **Inline SVG hero figures** (follow `notes/four-interactions.md` house style: `<figure>`, `role="img"`, `aria-label`, `currentColor`, no external assets) — at least 12–20: six-rule poster; β; commutation/copying; DUP-LAM with the escaping variable; L≠R commute vs annihilation; collapse/search; the HVM4 word + tag families; book/heap/SUB; HVM5 fork/test/merge; the four-layer pipeline. Every SVG needs an **ASCII equivalent or an equivalent step gallery** (raw-markdown readers + accessibility).
- Tables for counts; `box box-key` / `box box-info` / `box box-warn` for insights / definitions / pitfalls.

### 4.3 Taelin's own insights (public statements only)

Mine `research/victor/*`, the Interaction-Calculus README, HVM docs, and the `bendlang/bend` README. Produce **≥ 15–25 “insight cards”**, each with: title · **verbatim quote (or clearly-marked paraphrase) with the source file path/section id** · what it means · how it shows up mechanically (with a runnable demo where possible) · status class (theorem / measurement / claim / vision). Themes to look for (check, don't assume): why the calculus completes λ (pair application, lambda projection); optimal sharing *inside lambdas* and why Haskell can't; fans = pairs + projections; the clone-of-a-clone problem and labels as a *local* oracle; “search without loops”; unordered superpositions; the collapse monad; deforestation at runtime; the sieve/SAT/DPS experiments; why full optimality wasn't shipped; “computation is graph rewriting”; Kindelia/SupGen vision language. **Never invent quotes.** If a file is thin, say so.

### 4.4 HVM4 chapter (deep, from the code)

Read `clang/` and describe the real machine: the single translation unit and its module layout; term word `SUB|TAG|EXT|VAL`; static book vs dynamic heap; linked vars & substitution cells; `DP0/DP1`; ALO lazy expansion; UNS; the WNF loop and how ready pairs are found; the collapse path (queue keys, work stealing, FIFO determinism when single-threaded); FFI; CLI flags. Then a guided tour of the rule families with real traces; finish with “reading the C” exercises (find where a given sheet is implemented; predict a trace line before running).

### 4.5 HVM5 chapter

Teach homoiconicity concretely (books of hashed terms; code as data; the enumerator's `#Lam/#App` idea); contracts as compiled inet packages; subspaces/capabilities/fuel from v1; v2's fork=DUP, superposed testing (`&T{old,new}` shares the common prefix), merge3 + epoch swap, islands, trust (`07-trust.md`), and the honest status/`REVIEW.md` caveats. Exercises: design a capability wire; predict a fork's cost; trace a superposed test; classify claims.

### 4.6 Exercises

- **Target 100–150 total**, every section covered, difficulty marked ★–★★★.
- Types: hand reductions; predict-then-run; write-a-program; **debug-the-program** (include the numeral-mixing bug, an affinity violation, a label mistake, `-D`+`-C`); trace-reading; explain-the-count; claim-audit; C-code-reading; HVM5 design questions.
- Solutions = **numbered reasoning steps**, not answers; every runnable solution verified on the tools.
- Capstones: three levels.

---

## 5 · Phase 3 — rebuild D1 (the compendium)

- Keep verbatim content + `BEGIN FILE` markers + id scheme (or globally re-map and update D2).
- Refresh the fresh-fetch set; add missing sources you find (e.g. updated upstream docs, additional Taelin gists referenced in ch. 14 if retrievable, more of `hvm4-docs`), each with fetch date + sha256.
- Improve navigation: per-part blurbs, a reading-path index, a “where is X” table; dedupe/annotate the LINK INDEX; update PROVENANCE.
- Append **Appendix R — v2 audit ledger** and a “what changed v1→v2” summary. Fold everything else into the two documents; no third file.

---

## 6 · Hard constraints

- Two documents, same paths; audit inside D1; scripts allowed under `bend-docs/scripts/` only.
- No fabricated quotes, numbers, or outputs. Every factual claim traceable; every claim typed (theorem / measurement / claim / vision / quote).
- Keep the honesty discipline: SupGen private; HVM5 status as documented; BendRT ≠ nets; version-labelled Bend outputs; licenses noted.
- `bun run build` green at every commit; frontmatter fields valid (`title, description, updated, verified, status, canonical, sources`).
- Git: branch `opus/rewrite-v2`, small logical commits, **do not push** unless asked. Never rewrite other files' history.
- Write in English; precise, textbook tone.

---

## 7 · Acceptance checklist (verify with commands before you stop)

- [ ] HVM4 + IC built; **every** fence in D2 runs or is labelled a sketch; ledger regenerated (dates + commit hashes); `scripts/check-coursebook.mjs` exists and passes.
- [ ] D2: ≥ 100 exercises, all with step solutions; ≥ 12 SVG figures each with ASCII/step equivalent; legend defined and used consistently; six-rules section diagram-complete.
- [ ] D2: insights chapter with 15+ sourced insight cards; zero invented quotes.
- [ ] D2: HVM4 chapter references `clang/` specifics; HVM5 chapter covers v1 + v2 with status honesty.
- [ ] Cross-references resolve both ways; LINK INDEX spot-checked; dead links annotated.
- [ ] D1: audit appendix complete (every finding has evidence + fix); provenance updated; no third document.
- [ ] `bun run build` green; `git status` shows only expected changes.

---

## 8 · Command cheat sheet

```sh
# verify loops
cd /tmp/opencode/rewrite-v2/hvm4/clang && clang -O2 -o main main.c -ldl
./main file.hvm -s -C      # collapse runs; -s stats; -D trace (not with -C); --to-c AOT
cd .. && ./test/_all_.sh -i

cd /tmp/opencode/rewrite-v2/ic && ./bin/ic run file.ic [-C]

bend file.bend --check-only && bend file.bend   # local bend 2.0.39
bend PROOF.bend                                  # proof gate (prints ALL PROOFS CHECK)
```

---

## 9 · Final report (in your closing message)

State: audit finding counts by severity; the biggest flaws found in v1 and their fixes; what you added for beauty/didactics/insights (figure list, exercise count, insight-card count); where everything lives; verification evidence (commands + observed outputs); every decision you made where sources disagreed; and anything you could not verify, left explicitly flagged.
