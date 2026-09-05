## Context

See `proposal.md` for motivation. Current state: `bend-docs/` holds only `openspec/` + `.opencode/` (greenfield). Sources verified so far: `bend2.dev` serves 14 pages as Astro static on Cloudflare (`cf-cache-status: HIT`, `~28kB`, `speculation-rules: /cdn-cgi/speculation` → Speed Brain `conservative` prefetch); VictorTaelin has 261 repos with key ones `Bend2` (WIP), `Interaction-Calculus` (948 stars), `hvm4-formal`, plus HigherOrderCO `Bend`/`HVM`/`Kind`; Alchemy provides `Cloudflare.Website.Astro` with `astro: { output: "static" }` assets-only deploys and profile-based login (`alchemy login`, `~/.alchemy/profiles.json`).

## Goals / Non-Goals

**Goals:**

- Research-first: read before writing; every claim cited with source URL + date.
- Concept-first content (plain idea, then depth) with honest verification labels.
- Reproducible edge deploy a second person can repeat from docs alone.

**Non-Goals:**

- No Bend2 compiler/runtime implementation or fork of Bend/HVM code.
- No SSR, auth, comments, or analytics beyond a minimal privacy-friendly beacon.
- No visual clone of `bend2.dev`; original minimal paper-style design.

## Decisions

- **Astro `output: static`, no adapter in config**: `bend2.dev` proves the shape works (zero JS framework, inline CSS, preloaded subset fonts). Alternative `output: server` rejected — no dynamic need; server bundle adds cost and complexity.
- **Alchemy `StaticSite` over the `Astro` resource and raw wrangler**: single `alchemy.run.ts` declares build + assets (`notFoundHandling: 404-page`); no `wrangler.jsonc` hand-maintenance, content-hashed deploys skip no-op rebuilds. The dedicated `Astro` resource was tried first and rejected: its builder injects a rolldown plugin that crashes with Astro 7's bundled Vite (`esmExternalRequirePlugin is not a function`), while plain `bun run build` succeeds. Revisit if alchemy/astro versions realign.
- **Cloudflare Speed Brain over Astro/inline prefetch**: the analyzed instant-navigation effect comes from the edge `Speculation-Rules` header, not site code. Ship zero prefetch JS; document the dashboard toggle. Alternative `astro:prefetch` / inline speculation rules rejected to keep bundles at zero.
- **Research notes live in the change, specs version long-term**: per-page notes under the change during research; only durable behavior contracts graduate to `openspec/specs/` at archive. Keeps the record useful for future improve/delete calls.

## Risks / Trade-offs

- [Bend2 is pre-release; facts decay fast] → every page shows source date + own verification date; research tasks re-check sources before drafting.
- [261 personal repos + org repos is too much to read fully] → bound scope to key repos + READMEs first; gap notes for the rest instead of pretending full coverage.
- [Cloudflare credentials not yet provided] → design and site build proceed without them; deploy task stays blocked until user runs `alchemy login`.
- [Bend examples may mislead if presented as runnable] → verification labels are a spec requirement, not a nice-to-have.

## Migration Plan

Greenfield, no migration. Deploy: `bun install` → `bun run build` → `alchemy login` (user) → `alchemy deploy`. Rollback: redeploy prior commit via Alchemy; static assets make this a cache-purge at most. Custom domain is a later additive step.

## Open Questions

- Cloudflare account + domain: reuse an existing zone or new subdomain? (Deferrable; deploy works on `workers.dev` first.)
- Content language: English only for v1? (Assumed yes; recorded in tasks.)
- Speed Brain on `workers.dev`: the `speculation-rules` header is absent on the workers.dev URL (platform zone, no user toggle); verify it appears once a custom domain is attached and Speed Brain is enabled there.
