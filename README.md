# Bend Documentation

Concept-first documentation for HVM4 and Bend2: interaction nets, the
runtime, search by superposition, proofs, and a 45-item Bend2-by-Example
curriculum — plus runnable HVM4 pages with verified outputs.

Live: `https://bend-docs-website-dev-vscode-mppjuoypwkmixop6.lambdasolver2.workers.dev`

## The book (published on GitHub Pages)

**<https://lambdasolver2.github.io/bend-docs/>** — a two-document book built from the Markdown in
this repo: the **coursebook** (114 exercises, worked solutions, animated interaction nets) and the
**compendium** (the sources, verbatim, with the archive's own diagrams vectorised).

| Command | Action |
|---|---|
| `bun scripts/book/build.ts` | build `book/` (incremental, content-hash cache) |
| `bun scripts/book/dev.ts` | live dev server on :4321 |
| `bun scripts/book/check.ts` | acceptance checks in headless Chromium |
| `bun scripts/book/pdf.ts` | A4 PDFs into `book/pdf/` |

The site is the prebuilt `book/` directory, served from the **`gh-pages`** branch (Pages → Deploy from
a branch → `gh-pages` / root). `book/` is generated and gitignored on `main`; publish with:

```sh
bun scripts/book/build.ts
git worktree add /tmp/book-ghp --detach && (cd /tmp/book-ghp && git checkout --orphan gh-pages && git rm -rf . && cp -r ../../bend-docs/book/. . && touch .nojekyll && git add -A && git commit -m publish && git push -f origin gh-pages)
```

See `scripts/book/README.md` for the renderer and the ` ```inet ` block format.

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
