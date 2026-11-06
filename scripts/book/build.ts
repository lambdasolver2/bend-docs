// Builds bend-docs/book/{index,compendium,coursebook}.html.
// Incremental: the documents are split into chunks, each cached by content hash in
// .cache/book/, so editing one part re-renders only that part (see dev.ts).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createHighlighter, type Highlighter } from "shiki";
import GithubSlugger from "github-slugger";
import { renderChunk, assignIds, demoteHtml, type Heading, type Rendered } from "./lib/render";
import { splitFrontmatter, preprocessCoursebook, splitCompendium } from "./lib/preprocess";

const HERE = import.meta.dir;
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(ROOT, "book");
const ASSETS = path.join(HERE, "assets");
const TRACES = path.join(HERE, "traces");
const CACHE = path.join(ROOT, ".cache/book");
// Any change to the renderer or the preprocessor invalidates every cached chunk.
const RENDER_VERSION = crypto
  .createHash("sha256")
  .update(fs.readFileSync(path.join(HERE, "lib/render.ts")))
  .update(fs.readFileSync(path.join(HERE, "lib/preprocess.ts")))
  .update(fs.readFileSync(path.join(HERE, "lib/charts.ts")))
  .update(fs.readFileSync(path.join(HERE, "build.ts")))
  .update(fs.readFileSync(path.join(HERE, "assets/inet.js")))
  .digest("hex")
  .slice(0, 12);

const CB_MD = path.join(ROOT, "src/content/coursebook/bend-hvm-inet-coursebook-claude.md");
const CP_MD = path.join(ROOT, "src/content/compendium/bend-hvm-inet-compendium-claude.md");

let highlighter: Highlighter | null = null;

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Chunk = { key: string; md: string };

function splitChunks(md: string, kind: "compendium" | "coursebook"): Chunk[] {
  const lines = md.split("\n");
  const starts: number[] = [];
  const isStart = (l: string) =>
    kind === "coursebook"
      ? /^## /.test(l)
      : /^## (PART [A-M]\b|APPENDIX R\b|LINK INDEX\b|PROVENANCE\b)/.test(l);
  for (let i = 0; i < lines.length; i++) if (isStart(lines[i])) starts.push(i);
  const bounds = [0, ...starts.filter((s) => s > 0), lines.length];
  const out: Chunk[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const md = lines.slice(bounds[i], bounds[i + 1]).join("\n");
    if (!md.trim()) continue;
    out.push({ key: sha(md), md });
  }
  return out;
}

async function renderDoc(
  kind: "compendium" | "coursebook",
  md: string,
  opts: { highlight: boolean; compendiumIds?: Set<string> },
): Promise<{ html: string; headings: (Heading & { id: string })[] }> {
  fs.mkdirSync(CACHE, { recursive: true });
  const idHash = opts.compendiumIds ? sha([...opts.compendiumIds].join(",")) : "none";
  const chunks: { key: string; md: string; wrap?: string }[] =
    kind === "coursebook"
      ? splitChunks(md, kind).map((c) => ({ ...c }))
      : splitCompendium(md).map((seg) =>
          seg.kind === "file"
            ? { key: sha("file\u0000" + seg.id + "\u0000" + seg.heading + "\u0000" + seg.body), md: `### ${seg.heading}\n\n${seg.body}`, wrap: `file-${seg.id.replace(".", "-")}` }
            : { key: sha("md\u0000" + seg.text), md: seg.text });

  const rendered: Rendered[] = [];
  let hits = 0, misses = 0;
  for (const chunk of chunks) {
    const key = sha([RENDER_VERSION, kind, opts.highlight ? "hl" : "plain", idHash, chunk.key].join("\u0000"));
    const file = path.join(CACHE, `${kind}-${key}.json`);
    let r: Rendered;
    if (fs.existsSync(file)) {
      r = JSON.parse(fs.readFileSync(file, "utf8"));
      hits++;
    } else {
      misses++;
      const t0 = performance.now();
      r = await renderChunk(chunk.md, {
        compendiumIds: opts.compendiumIds,
        highlight: opts.highlight
          ? async (code, lang) => {
              if (lang === "text") {
                const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return `<pre class="ascii"><code>${esc}</code></pre>`;
              }
              const known = highlighter?.getLoadedLanguages() ?? [];
              const use = known.includes(lang) ? lang : "text";
              return highlighter!.codeToHtml(code, { lang: use, theme: "github-light" });
            }
          : undefined,
      });
      fs.writeFileSync(file, JSON.stringify(r));
      if (misses <= 2 || misses % 100 === 0) {
        console.log(`  ${kind} ${chunk.md.split("\n")[0].slice(0, 56)} ${(performance.now() - t0).toFixed(0)}ms`);
      }
    }
    if (chunk.wrap) {
      // In-file links (#slug) point at this file's own headings; rewrite them to the
      // heading's placeholder so the global slugger's dedup cannot break them.
      const local = new GithubSlugger();
      const bySlug = new Map<string, string>();
      for (const h of r.headings) bySlug.set(local.slug(h.text), h.key);
      const linked = r.html.replace(/href="#([^"]+)"/g, (m, slug) => {
        const key = bySlug.get(slug) ?? bySlug.get(decodeURIComponent(slug));
        return key ? `href="#${key}"` : `href="#${chunk.wrap}"`;
      });
      r = {
        html: `<div class="file" id="${chunk.wrap}">${demoteHtml(linked, 3)}</div>`,
        headings: r.headings.map((h, i) => (i === 0 ? h : { ...h, level: Math.min(6, h.level + 3) })),
      };
    }
    rendered.push(r);
  }
  const out = assignIds(rendered);
  return { ...out, stats: { hits, misses } } as any;
}


/**
 * The compendium's printed index ("## Table of contents") is one list item per embedded file, and its labels are
 * full source paths. Shorten the visible path, keep the full one in `title`, and lay the
 * whole index out in columns so it reads as an index instead of eleven pages of prose.
 * Presentation only: the document's own bytes are untouched.
 */
function compactTocIndex(html: string): string {
  const mark = html.indexOf('id="table-of-contents"');
  if (mark < 0) return html;
  const at = html.lastIndexOf("<h2", mark);
  if (at < 0) return html;
  const end = html.indexOf("<h2", mark);
  if (end < 0) return html;
  const seg = html.slice(at, end).replace(
    /<code>(bend-docs\/(?:src\/content\/)?[^<]+)<\/code>/g,
    (_m, full: string) => {
      const short = full.replace(/^bend-docs\/(?:src\/content\/)?/, "").replace(/\.md$/, "");
      return `<code title="${esc(full)}">${esc(short)}</code>`;
    },
  );
  const head = /^[\s\S]*?<\/h2>/.exec(seg)?.[0] ?? "";
  return html.slice(0, at) + head + '<div class="toc-index">' + seg.slice(head.length) + "</div>" + html.slice(end);
}

function tocCoursebook(headings: (Heading & { id: string })[]): string {
  const items = headings
    .filter((h) => h.level === 2 || h.level === 3)
    .map((h) => `<li class="lvl${h.level}"><a href="#${h.id}">${esc(h.text)}</a></li>`);
  return `<ul class="toc-list">${items.join("\n")}</ul>`;
}

/** A readable label for an embedded file: `A.1 · bend-docs/src/x/index.md` → `index.md`. */
function fileLabel(text: string): { id: string; label: string; title: string } {
  const m = /^([A-M]\.\d+)\s*·\s*(.+)$/.exec(text.replace(/`/g, ""));
  if (!m) return { id: "", label: text.replace(/`/g, ""), title: "" };
  const id = m[1];
  let p = m[2].trim();
  const short = p
    .replace(/^bend-docs\/src\/content\//, "")
    .replace(/^bend-docs\//, "")
    .replace(/\.md$/, "");
  const parts = short.split("/").filter(Boolean);
  const label = parts.length > 2 ? parts.slice(-2).join("/") : short;
  return { id, label, title: p };
}

function tocCompendium(headings: (Heading & { id: string })[]): string {
  const rows: string[] = [];
  let files: string[] = [];
  let part = "";
  let partTitle = "";
  const flush = () => {
    if (files.length) {
      rows.push(
        `<li class="toc-part"><details><summary><a href="#${part}">${esc(partTitle)}</a><span class="toc-n">${files.length}</span></summary>` +
          `<ul class="toc-files">${files.join("")}</ul></details></li>`,
      );
    }
    files = [];
  };
  for (const h of headings) {
    if (h.level !== 2 && h.level !== 3) continue;
    const isFile = h.level === 3 && /^[A-M]\.\d+\s*· /.test(h.text);
    if (isFile) {
      const { id, label, title } = fileLabel(h.text);
      files.push(`<li><a href="#${h.id}" title="${esc(title)}"><span class="toc-id">${esc(id)}</span>${esc(label)}</a></li>`);
      continue;
    }
    if (h.level !== 2) continue;
    flush();
    if (/^PART [A-M]\b/.test(h.text)) {
      part = h.id;
      // "PART A · Bend 2 tutorial (complete)" reads better in a sidebar as "A · Bend 2 tutorial"
      partTitle = h.text.replace(/^(PART|APPENDIX)\s+/, "").replace(/\s*\(complete\)\s*$/, "");
    } else {
      part = "";
      rows.push(`<li class="lvl2"><a href="#${h.id}">${esc(h.text)}</a></li>`);
    }
  }
  flush();
  return `<ul class="toc-list">${rows.join("")}</ul>`;
}

const isLive = () => process.env.BOOK_LIVE === "1";

function page(opts: {
  kind: "compendium" | "coursebook";
  title: string;
  description: string;
  body: string;
  toc: string;
}): string {
  const tabs = opts.kind === "coursebook"
    ? `<a href="compendium.html">Compendium</a><a href="coursebook.html" class="active" aria-current="page">Coursebook</a>`
    : `<a href="compendium.html" class="active" aria-current="page">Compendium</a><a href="coursebook.html">Coursebook</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="stylesheet" href="assets/book.css">
<link rel="stylesheet" href="assets/print.css" media="print">
<link rel="icon" href="data:,">
</head>
<body class="doc-${opts.kind}">
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="index.html">Interaction nets<span class="long"> <span>·</span> HVM4 <span>·</span> HVM5</span></a>
  <nav class="tabs" aria-label="Documents">${tabs}</nav>
  <div class="tools">
    <button type="button" class="toc-toggle" aria-expanded="false" aria-controls="toc" aria-label="Open the table of contents">Contents</button>
    <button type="button" id="print-btn" title="Print or save as PDF">Print</button>
  </div>
</header>
<div class="layout">
  <nav class="sidebar" aria-label="Table of contents">
    <div class="sidebar-head">
      <input id="toc-filter" type="search" placeholder="filter contents" aria-label="Filter the table of contents">
      <button type="button" class="toc-close" aria-label="Close the table of contents">✕</button>
    </div>
    <div class="sidebar-inner" id="toc">${opts.toc}</div>
  </nav>
  <div class="backdrop" hidden></div>
  <main class="content" id="main">
${opts.body}
  </main>
</div>
<script src="assets/traces.js"></script>
<script src="assets/inet.js"></script>
<script src="assets/book.js"></script>
${isLive() ? '<script src="assets/live.js"></script>' : ""}
</body>
</html>
`;
}

function buildTraces(): string {
  const out: Record<string, { start: string; steps: { rule: string; term: string }[] }> = {};
  for (const file of fs.readdirSync(TRACES).filter((f) => f.endsWith(".txt"))) {
    const name = file.replace(/\.txt$/, "");
    const lines = fs.readFileSync(path.join(TRACES, file), "utf8").replace(/\x1b\[[0-9;]*m/g, "").split("\n");
    const start = lines.find((l) => l.trim() !== "") ?? "";
    const steps: { rule: string; term: string }[] = [];
    let rule: string | null = null;
    for (const line of lines) {
      const m = /^-{6,} ([A-Z0-9-]+)\s*$/.exec(line);
      if (m) { rule = m[1]; continue; }
      if (rule && line.trim() !== "") { steps.push({ rule, term: line }); rule = null; }
    }
    out[name] = { start, steps };
  }
  return `window.BOOK_TRACES = ${JSON.stringify(out)};`;
}

function indexPage(cb: Record<string, string>, cp: Record<string, string>, cpFileCount: number, cpPartCount: number): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Interaction nets, the Interaction Calculus, HVM4 and HVM5 — two books</title>
<link rel="stylesheet" href="assets/book.css"><link rel="stylesheet" href="assets/print.css" media="print">
<link rel="icon" href="data:,">
</head><body class="doc-index">
<main class="landing">
  <p class="kicker">TWO DOCUMENTS · ONE BOOKSHELF</p>
  <h1>Interaction nets, the Interaction Calculus,<br>HVM4 and HVM5</h1>
  <p class="lead">A reference compendium of sources and a from-first-principles coursebook. Every program runs on HVM4 HEAD <code>6defdfc</code>; every quote is checked word for word.</p>
  <div class="cards">
    <a class="card" href="coursebook.html">
      <span class="card-kicker">START HERE · 114 EXERCISES</span>
      <h2>Coursebook</h2>
      <p>${esc(cb.description ?? "")}</p>
      <span class="card-go">Read the coursebook →</span>
    </a>
    <a class="card" href="compendium.html">
      <span class="card-kicker">SOURCES · ${cpFileCount} FILES · ${cpPartCount} PARTS</span>
      <h2>Compendium</h2>
      <p>${esc(cp.description ?? "")}</p>
      <span class="card-go">Open the compendium →</span>
    </a>
  </div>
  <p class="foot">Print each document from its own page (Print → Save as PDF); both are laid out for A4, with every exercise solution opened.
  PDFs of the last build: <a href="pdf/coursebook.pdf">coursebook.pdf</a> (A4) · <a href="pdf/compendium.pdf">compendium.pdf</a> (A4).</p>
</main>
</body></html>`;
}

export async function build(): Promise<void> {
  const t0 = performance.now();
  highlighter = await createHighlighter({
    themes: ["github-light"],
    langs: ["haskell", "python", "c", "bash", "javascript", "typescript", "json"],
  });

  const cpRaw = fs.readFileSync(CP_MD, "utf8");
  const cbRaw = fs.readFileSync(CB_MD, "utf8");
  const compendiumIds = new Set([...cpRaw.matchAll(/^### ([A-M]\.\d+) · /gm)].map((m) => m[1]));
  const cpFm = splitFrontmatter(cpRaw);
  const cbFm = splitFrontmatter(cbRaw);

  const cp = await renderDoc("compendium", cpFm.body, { highlight: false });
  const cb = await renderDoc("coursebook", preprocessCoursebook(cbFm.body), {
    highlight: true, compendiumIds,
  });

  fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
  for (const f of fs.readdirSync(ASSETS)) {
    const src = path.join(ASSETS, f);
    if (fs.statSync(src).isDirectory()) continue;
    fs.copyFileSync(src, path.join(OUT, "assets", f));
  }
  fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });
  for (const f of fs.readdirSync(path.join(ASSETS, "fonts"))) fs.copyFileSync(path.join(ASSETS, "fonts", f), path.join(OUT, "fonts", f));
  fs.writeFileSync(path.join(OUT, "assets/traces.js"), buildTraces());

  fs.writeFileSync(path.join(OUT, "compendium.html"), page({
    kind: "compendium", title: cpFm.meta.title ?? "Compendium", description: cpFm.meta.description ?? "",
    body: compactTocIndex(cp.html), toc: tocCompendium(cp.headings),
  }));
  fs.writeFileSync(path.join(OUT, "coursebook.html"), page({
    kind: "coursebook", title: cbFm.meta.title ?? "Coursebook", description: cbFm.meta.description ?? "",
    body: cb.html, toc: tocCoursebook(cb.headings),
  }));
  const cpFileCount = (cp.headings.filter((h) => /^[A-M]\.\d+ · /.test(h.text)).length);
  const cpPartCount = cp.headings.filter((h) => h.level === 2 && /^PART [A-M]\b/.test(h.text)).length;
  fs.writeFileSync(path.join(OUT, "index.html"), indexPage(cbFm.meta, cpFm.meta, cpFileCount, cpPartCount));

  const mb = (f: string) => (fs.statSync(path.join(OUT, f)).size / 1e6).toFixed(2);
  console.log(
    `built in ${((performance.now() - t0) / 1000).toFixed(1)}s · coursebook ${mb("coursebook.html")} MB (${(cb as any).stats.hits}/${(cb as any).stats.misses} cache) · compendium ${mb("compendium.html")} MB (${(cp as any).stats.hits}/${(cp as any).stats.misses} cache)`,
  );
}

if (import.meta.main) await build();
