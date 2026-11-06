// Chunk renderer: Markdown -> HTML with marked (no AST), plus the book's post-passes.
// Deterministic and cacheable: heading ids come out as %%hN%% placeholders so a chunk
// does not depend on headings that appear before it.
import { marked } from "marked";
import GithubSlugger from "github-slugger";
import { Inet } from "./inet";

export type Heading = { level: number; text: string; key: string };
export type Rendered = { html: string; headings: Heading[]; };

const LANGS: Record<string, string> = {
  hvm: "haskell", bend: "python", output: "text", error: "text", text: "text",
  sh: "bash", shell: "bash", js: "javascript", ts: "typescript", json: "json",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}


const VOID = new Set(["br", "hr", "img", "input", "wbr", "col", "area", "base", "embed", "link", "meta", "source", "track", "param"]);
// Tags the archive may legitimately carry inline. Anything else is text: a type signature
// such as `Maybe<String>` or `S <T> U` must not become an element — a stray <s> would
// strike out everything after it, which is exactly what happened before this pass.
const INLINE_HTML = new Set([
  "a", "b", "i", "u", "em", "strong", "code", "pre", "kbd", "samp", "var", "sub", "sup", "mark", "del", "ins",
  "p", "div", "span", "figure", "figcaption", "svg", "g", "path", "rect", "circle", "line", "polyline",
  "polygon", "ellipse", "text", "tspan", "defs", "use", "title", "desc", "marker", "table", "thead", "tbody",
  "tfoot", "tr", "td", "th", "caption", "ul", "ol", "li", "dl", "dt", "dd", "blockquote", "details", "summary",
  "img", "center", "small", "big", "tt", "font", "abbr", "cite", "q", "h1", "h2", "h3", "h4", "h5", "h6",
]);

/**
 * Escapes `<name …>` when `name` is not an allowed tag, or has no closing tag left in this
 * chunk. Marked passes any `<word>` through as raw HTML, so prose like `x <s> y` otherwise
 * opens a real element. Text inside `<pre>`/`<code>` is already escaped and never matches.
 */
export function escapeStrayTags(html: string): string {
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  const toks: { start: number; end: number; name: string; close: boolean; self: boolean; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = tag.exec(html))) {
    toks.push({
      start: m.index, end: m.index + m[0].length,
      name: m[2].toLowerCase(), close: m[1] === "/", self: /\/\s*>$/.test(m[0]), text: m[0],
    });
  }
  if (!toks.length) return html;
  // how many closers of each name remain after position i
  const closers = new Map<string, number>();
  const remaining: number[] = new Array(toks.length).fill(0);
  for (let i = toks.length - 1; i >= 0; i--) {
    const t = toks[i];
    remaining[i] = closers.get(t.name) ?? 0;
    if (t.close) closers.set(t.name, (closers.get(t.name) ?? 0) + 1);
  }
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = "", at = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const keep = t.close ? INLINE_HTML.has(t.name) : (INLINE_HTML.has(t.name) && (t.self || VOID.has(t.name) || remaining[i] > 0));
    if (keep) continue;
    out += html.slice(at, t.start) + esc(t.text);
    at = t.end;
  }
  return out + html.slice(at);
}


/**
 * A wildcard asterisk straight after a word and before punctuation ("`bend2*`, verbatim")
 * otherwise opens or closes emphasis and swallows the rest of the bold span. One asterisk
 * between a word and `, . ; : )` is a literal, so escape it.
 */
const escapeWildcards = (text: string) =>
  text
    .split("\n")
    .map((line) => {
      // an even count means the asterisks pair up as emphasis; leave the line alone
      if ((line.match(/\*/g) ?? []).length % 2 === 0) return line;
      return line.replace(/(\w)\*(?=[,.;:)])/g, "$1\\*");
    })
    .join("\n");

type Fence = { lang: string; code: string };

function extractFences(md: string): { text: string; fences: Fence[] } {
  const lines = md.split("\n");
  const fences: Fence[] = [];
  const text: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = /^```(.*)$/.exec(lines[i]);
    if (!open) { text.push(lines[i]); continue; }
    const body: string[] = [];
    let j = i + 1;
    while (j < lines.length && !/^```\s*$/.test(lines[j])) { body.push(lines[j]); j++; }
    const lang = (open[1] || "").trim().split(/\s+/)[0];
    fences.push({ lang, code: body.join("\n") });
    text.push("", `@@FENCE${fences.length - 1}@@`, "");
    i = j;
  }
  return { text: text.join("\n"), fences };
}

export async function renderChunk(
  md: string,
  opts: { highlight?: (code: string, lang: string) => Promise<string>; compendiumIds?: Set<string> },
): Promise<Rendered> {
  const { text, fences } = extractFences(md);
  let html = escapeStrayTags(marked.parse(escapeWildcards(text), { gfm: true, async: false }) as string);

  // ---- code fences -------------------------------------------------------------
  // Archive box diagrams (DUP/SUP/… joined by wires) are vectorised as they stand; the
  // ASCII stays in the page, in a <details>, so the reproduced document is still whole.
  const asFigure = fences.map((f) => (f.lang === "text" || f.lang === "" ? Inet.gridHTML(f.code) : null));
  const highlighted = opts.highlight
    ? await Promise.all(fences.map((f, i) => opts.highlight!(f.code, LANGS[f.lang] ?? f.lang ?? "text")))
    : fences.map((f) => {
        const cls = f.lang ? ` class="language-${f.lang}"` : "";
        return `<pre class="${f.lang === "text" ? "ascii" : "code"}"><code${cls}>${esc(f.code)}</code></pre>`;
      });
  html = html.replace(/<p>\s*@@FENCE(\d+)@@\s*<\/p>/g, (_m, n) => asFigure[Number(n)] ?? highlighted[Number(n)]);
  html = html.replace(/@@FENCE(\d+)@@/g, (_m, n) => highlighted[Number(n)]);

  // ---- heading ids (placeholders, resolved at assembly) ------------------------
  const headings: Heading[] = [];
  let n = 0;
  html = html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g, (_m, lvl, attrs, inner) => {
    const key = `%%h${n++}%%`;
    headings.push({ level: Number(lvl), text: stripTags(inner).replace(/\s+/g, " ").trim(), key });
    return `<h${lvl}${attrs} id="${key}">${inner}</h${lvl}>`;
  });

  // ---- tables, ascii, links ----------------------------------------------------
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  html = html.replace(/<a href="(https?:[^"]*)"/g, '<a href="$1" target="_blank" rel="noopener"');
  // images that were never part of this repository (the embedded Bend docs pointed at them)
  html = html.replace(/<img\b[^>]*>/g, (tag) => {
    const src = /src="([^"]*)"/.exec(tag)?.[1] ?? "";
    if (/^(https?:|data:)/.test(src)) return tag;
    const alt = /alt="([^"]*)"/.exec(tag)?.[1] ?? src.split("/").pop();
    return `<span class="missing-media">[image not bundled: ${alt}]</span>`;
  });

  if (opts.compendiumIds?.size) html = crosslink(html, opts.compendiumIds);
  return { html, headings };
}

const XREF = /(?<![A-Za-z0-9.§])([A-M])\.(\d+)(?![\d.])/g;

function crosslink(html: string, ids: Set<string>): string {
  const parts = html.split(/(<[^>]+>)/);
  let skip = 0;
  const out: string[] = [];
  for (const part of parts) {
    if (part.startsWith("<")) {
      if (/^<(code|pre|a|h[1-6])\b/i.test(part)) skip++;
      else if (/^<\/(code|pre|a|h[1-6])>/i.test(part)) skip = Math.max(0, skip - 1);
      out.push(part);
      continue;
    }
    if (skip > 0) { out.push(part); continue; }
    out.push(part.replace(XREF, (m, a, b) => {
      const id = `${a}.${b}`;
      return ids.has(id) ? `<a class="xref" href="compendium.html#file-${a}-${b}">${id}</a>` : m;
    }));
  }
  return out.join("");
}

/** Demote every heading in `html` by `by` levels, optionally keeping the first one. */
export function demoteHtml(html: string, by: number, keepFirst = true): string {
  let seen = 0;
  return html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g, (m, lvl, attrs, inner) => {
    if (keepFirst && seen++ === 0) return m;
    const n = Math.min(6, Number(lvl) + by);
    return `<h${n}${attrs}>${inner}</h${n}>`;
  });
}

/** Resolve %%hN%% placeholders to final, document-unique slugs (github-slugger). */
export function assignIds(chunks: Rendered[]): { html: string; headings: (Heading & { id: string })[] } {
  // One slugger for the whole document (duplicate headings get -1, -2 …), but the
  // placeholder keys are local to a chunk, so resolve them per chunk.
  const slugger = new GithubSlugger();
  const all: (Heading & { id: string })[] = [];
  const html = chunks.map((c) => {
    const local = new Map<string, string>();
    for (const h of c.headings) {
      const id = slugger.slug(h.text);
      local.set(h.key, id);
      all.push({ ...h, id });
    }
    return c.html.replace(/%%h(\d+)%%/g, (_m, n) => local.get(`%%h${n}%%`) ?? `h${n}`);
  }).join("\n");
  return { html, headings: all };
}
