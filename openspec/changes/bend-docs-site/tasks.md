## 1. Deep research (read-only, no site code)

- [x] 1.1 Fetch and archive notes for all 14 bend2.dev pages (markdown mirrors + retrieval dates) and verify each note file contains canonical URL and date
- [x] 1.2 Read source READMEs of VictorTaelin/Bend2, Interaction-Calculus, hvm4-formal and HigherOrderCO Bend, HVM, Kind, and verify research notes cite what each repo is and its last-commit date
- [x] 1.3 Distill concept map (Bend vs Bend2 vs HVM4 vs interaction nets vs Kind/Lean/Mojo comparisons) with per-claim citations, and verify every claim traces to a note from 1.1–1.2

## 2. Content drafting

- [x] 2.1 Draft concept-first pages (what-is, runtime/HVM4, interaction nets, comparisons, learn-by-example) with verification labels, and verify each code sample carries its label and each factual claim cites source + date
- [x] 2.3 Deep-source pass: read HVM4 docs/ (primer, theory, memory, syntax), Interaction-Calculus spec, Bend README+examples, Kind/Formality/articles lineage, and verify HVM4 hands-on by building with gcc and running README+primer examples
- [x] 2.4 New deep pages from 2.3 (runnable HVM hands-on with verified outputs, four-interactions theory with traces, proof lineage Formality→Kind→Bend2) with per-claim citations
- [x] 2.5 Victor's writings pass: HOC essays, HVM how/10-min/mystery, HOW.md, SAT solver, program-search series, Kind conversion checker, deforestation note, Bend release + HN reception — fetch all reachable, gap-note the rest
- [x] 2.6 Full docs rewrite from 2.5: professional formatting throughout, callout boxes + color, original diagrams, every claim cited
- [x] 2.8 Bend2-by-Example curriculum (45 items, 6 groups): new-syntax pages per group, extrapolated constructs flagged, planned items stubbed honestly
- [x] 2.2 Generate per-page Markdown mirrors, llms.txt, sitemap, robots, and verify mirrors match HTML content and llms.txt lists them

## 3. Astro site scaffold

- [x] 3.1 Scaffold Astro static site (contents index, notes/learn routes, ToC with dates, themes with system fallback, print CSS, zero-JS reading) and verify `bun run build` prerenders all routes with no JS bundle required for reading
- [x] 3.2 Add fonts (subset + preload), canonical/OG tags, custom 404, and verify Lighthouse performance and disabled-JS readability pass
- [x] 3.3 Professional contents + home: numbered parts with descriptions, curated learning tracks, original inline-SVG diagrams for interaction nets, and verify all routes still build with 0 JS bundles
- [x] 3.4 Code-block styling (rounded corners, border, language label, inline-code chips) + larger base type, and verify in built HTML with 0 added JS
- [x] 3.5 Wider template (42rem → 52rem container) + code-block refinements, verify + redeploy
- [x] 3.6 Spacing sweep (missing blanks after colons/links on all pages) + callout-box/color system in template, verified in build
- [x] 3.7 LYAH-style pass: global CSS fix (is:global — prior styling never applied), LYAH palette/structure, prev/next footers, chapters list, label chips, 3 new diagrams
- [x] 3.8 De-brand + rebrand pass: no Bend1/old-HVM/study-notes anywhere in dist, Bend Documentation identity, LYAH chapters ToC, Lean mirror-proof section
- [x] 3.9 Square professional theme (zero border-radius) + sticky right-side section nav with build-extracted anchors, all links verified resolving
- [x] 3.10 OCaml-style IV pages (prerequisites boxes, Lean goal transcript, remarks) + drop VI section (chain via curriculum order), numbered parts
- [x] 3.11 Rebuild contents as a professional documentation index: centered responsive reading layout, permanent desktop documentation rail, mobile contents disclosure, six numbered chapters, and all 45 curriculum items with resolving URLs
- [x] 3.12 Remove Python tooling from the repository; replace research fetch utility with Node ESM and verify no `*.py` files remain
- [x] 3.13 Editorial callout restyle (hairline box, top accent rule, small-caps label, no tint) + color-coded annihilation/commutation figures with wire correspondence
- [x] 3.14 Approved Lean-style 1–10 TOC: decimal section addresses, deferred superposition material, group-only right rail, restored rail scroll position, and code-copy controls
- [x] 3.15 Independent per-rail scroll memory, dead markup removal, and one-address-per-curriculum-item splits
- [x] 3.16 Professional voice pass: 960px effective column, beginner-first Types and Proofs chapter, process meta-text removed (status lives in badges)
- [x] 3.17 Expert audit pass: correct Bend2/HVM code labels via aliases, single SITE source of truth, right rail derived from TOC (no drift), astro check clean

## 4. Alchemy deploy (blocked on user credentials)

- [x] 4.1 Add alchemy.run.ts with Cloudflare.Website.Astro static assets-only config plus deploy docs, and verify `alchemy plan` succeeds without credentials committed
- [x] 4.25 User runs `alchemy login` (OAuth or API token) and confirms profile works; verify `alchemy profile show` redacts secrets — REQUIRES USER ACTION
- [x] 4.4 Publish source to GitHub lambdasolver2/bend-docs (secret-scanned, gitignored deps/dist/state) — DONE 2026-09-05

## 5. OpenSpec long-term record

- [x] 5.1 Run `openspec validate --change bend-docs-site` and verify it passes with zero errors
- [ ] 5.2 After apply, archive the change so specs graduate to openspec/specs and verify the main specs read correctly
