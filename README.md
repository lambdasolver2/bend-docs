# Bend Documentation

Concept-first documentation for HVM4 and Bend2: interaction nets, the
runtime, search by superposition, proofs, and a 45-item Bend2-by-Example
curriculum — plus runnable HVM4 pages with verified outputs.

Live: `https://bend-docs-website-dev-vscode-mppjuoypwkmixop6.lambdasolver2.workers.dev`

## Commands

| Command | Action |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Local dev server |
| `bun run build` | Prerender to `./dist/` (19→26 pages, 0 JS) |
| `bunx alchemy plan` | Preview infrastructure diff |
| `bunx alchemy deploy --yes` | Build + upload to Cloudflare Workers |

See `DEPLOY.md` for first-time Cloudflare login. No secrets live in this
repo — credentials come from the alchemy profile or CI variables.

## Layout

- `src/content/` — notes + learn markdown (frontmatter: title, dates, status)
- `src/pages/` — routes, markdown mirrors, `llms.txt`, `sitemap.xml`
- `src/layouts/`, `src/lib/order.ts` — template, reading order, prev/next
- `alchemy.run.ts` — the entire infrastructure (static site on Workers)
- `openspec/` — specs + change history (OpenSpec; invoke with `/opsx-*`)
