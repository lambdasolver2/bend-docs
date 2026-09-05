// Extracts h2/h3 headings (id + text) from built HTML pages and writes
// src/lib/heading-ids.json keyed by route. Run AFTER `bun run build` and
// rebuild so [slug] pages can render the right-side TOC from exact ids.
// Usage: bun run build && node scripts/gen-toc.mjs && bun run build
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const out = {};
const files = walk("dist");
for (const f of files) {
  const html = readFileSync(f, "utf8");
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/);
  if (!main) continue;
  const items = [];
  for (const m of main[1].matchAll(/<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)) {
    const text = m[3].replace(/<[^>]+>/g, "").trim();
    if (text) items.push({ id: m[2], text, depth: Number(m[1]) });
  }
  if (items.length === 0) continue;
  let route = "/" + path.relative("dist", f).replace(/index\.html$/, "").replace(/\\/g, "/");
  out[route] = items;
}
mkdirSync("src/lib", { recursive: true });
writeFileSync("src/lib/heading-ids.json", JSON.stringify(out, null, 2) + "\n");
const n = Object.values(out).reduce((a, v) => a + v.length, 0);
console.log(`wrote heading ids for ${Object.keys(out).length} routes, ${n} headings`);
