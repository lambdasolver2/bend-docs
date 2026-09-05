## Why

Bend (massively parallel language), HVM/Interaction Calculus (its runtime), and the unreleased Bend2 are scattered across `bend2.dev` notes, Taelin's 261 personal repos, and HigherOrderCO org repos. No single source explains the main concept simply first, then deep. A from-scratch Astro docs site, deployed reproducibly via Alchemy to Cloudflare, fixes that.

## What Changes

- Research-first content sourcing: deep-read all 14 `bend2.dev` pages (release tracker, 7 notes, 5 learn pages) plus Taelin/HigherOrderCO source repos (Bend2, Interaction-Calculus, hvm4-formal, Bend, HVM, Kind) and distill verified concepts with citations and `Last updated` dates.
- New docs site in `bend-docs/`: concept-first pages (what/why in plain language, then deep dives), runnable-style Bend examples clearly marked by verification status, diagrams for interaction nets / HVM reduction.
- Astro static build + Alchemy `Cloudflare.Website.Astro` (`output: static`, assets-only) deploy to the user's Cloudflare account; Cloudflare Speed Brain for prefetch, no custom prefetch code.
- OpenSpec stays the long-term record: specs + changes versioned in this repo for every future improve/delete decision.

## Capabilities

### New Capabilities

- `content-model`: what the docs cover and how (concept-first structure, verification labels, citation + last-updated rules, `index.md` mirrors, `llms.txt`).
- `docs-site`: observable site behavior (routes, navigation, themes, search/ToC, fonts, zero-JS default, offline/print behavior).
- `cloudflare-deploy`: reproducible Alchemy deploy (static assets-only Worker, custom domain handling, Speed Brain + cache expectations, credential/profile flow).

### Modified Capabilities

- None (greenfield; `openspec/specs/` is empty).

## Impact

- New code: Astro site (`src/`, `public/`), `alchemy.run.ts`, package setup (bun). No changes to existing code (repo currently only holds `openspec/` + `.opencode/`).
- External systems: Cloudflare account (Workers Assets, optional custom domain, Speed Brain toggle). Requires user login (`alchemy login` OAuth or API token) — blocked on user until credentials provided.
- Sources are third-party and pre-release: content must never claim unverified Bend2 code compiles; every claim cites canonical URL + date.
