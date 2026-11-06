// String-level preparation of the two Markdown documents before parsing.
import { chartFromTable } from "./charts";
import { Inet } from "./inet";

/** Renders the body of an ```inet fence: a static figure, plus a player when `animate` is set. */
export function inetBlock(body: string): string {
  const sp = Inet.spec(body);
  const parts = [Inet.staticFigure(sp)];
  if (sp.animate) parts.push(Inet.playerFigure(sp));
  return parts.join("\n");
}

export function splitFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) return { meta: {}, body: md };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-zA-Z_]+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].replace(/^"|"$/g, "");
  }
  return { meta, body: md.slice(m[0].length) };
}

function widgetFigure(marker: string): string | null {
  const m = /^<!--\s*widget:\s*(.+?)\s*-->$/.exec(marker.trim());
  if (!m) return null;
  const spec = m[1];
  if (spec.startsWith("trace ")) {
    const src = /src=(\S+)/.exec(spec)?.[1] ?? "";
    const name = src.split("/").pop()!.replace(/\.txt$/, "");
    return [
      `<figure class="widget trace" data-trace="${name}">`,
      `<div class="widget-head"><span class="widget-kicker">HVM4 TRACE · <span class="trace-rule"></span></span><span class="trace-tally"></span></div>`,
      `<ol class="trace-terms"></ol>`,
      `<div class="widget-controls" data-controls></div>`,
      `<figcaption>Recorded from HVM4 HEAD <code>6defdfc</code> with <code>-D</code>; rule names are HVM4's own.</figcaption>`,
      `</figure>`,
    ].join("\n");
  }
  return null;
}

function normalizeDetails(text: string): string {
  // <details ...>...</details> -> block form with blank lines, so Markdown inside is parsed.
  const re = /<details[^>]*>([\s\S]*?)<\/details>/g;
  return text.replace(re, (_m, inner: string) => {
    const s = /<summary>([\s\S]*?)<\/summary>/.exec(inner);
    const summary = s ? s[1].trim() : "Solution";
    const rest = (s ? inner.slice(s.index + s[0].length) : inner).trim();
    return `<details class="solution">\n<summary>${summary}</summary>\n\n${rest}\n\n</details>`;
  });
}

export function preprocessCoursebook(body: string): string {
  const segments = body.split(/(```[\s\S]*?```)/);
  body = segments.map((seg, i) => (i % 2 === 0 ? normalizeDetails(seg) : seg)).join("");
  const lines = body.split("\n");
  const out: string[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inFence && /^```inet\s*$/.test(line)) {
      const body: string[] = [];
      let j = i + 1;
      while (j < lines.length && !/^```\s*$/.test(lines[j])) body.push(lines[j++]);
      out.push("", inetBlock(body.join("\n")), "");
      i = j;
      continue;
    }
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) { out.push(line); continue; }

    let l = line;

    if (/^\s*<!--\s*widget:\s*chart\b/.test(line)) {
      // collect the table that follows, emit it, then the chart
      const table: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith("|")) j++;
      while (j < lines.length && lines[j].trim().startsWith("|")) { table.push(lines[j]); j++; }
      if (table.length >= 3) {
        out.push(...table);
        out.push("");
        const svg = chartFromTable(table);
        if (svg) out.push(`<figure class="chart">${svg}<figcaption>Plotted from the table above.</figcaption></figure>`);
        out.push("");
        i = j - 1;
        continue;
      }
    }

    const fig = /^\s*<!--\s*widget:/.test(line) ? widgetFigure(line) : null;
    if (fig) {
      out.push("", fig, "");
      continue;
    }
    out.push(l);
  }
  return out.join("\n");
}

export type CompendiumSegment =
  | { kind: "md"; text: string }
  | { kind: "file"; id: string; heading: string; body: string };

function stripFrontmatter(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

/** Applies `fn` to the lines outside fenced code blocks only. */
function mapProse(text: string, fn: (line: string) => string | null): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let fenced = false;
  for (const line of lines) {
    if (/^```/.test(line)) { fenced = !fenced; out.push(line); continue; }
    const mapped = fenced ? null : fn(line);
    out.push(mapped == null ? line : mapped);
  }
  return out.join("\n");
}

/**
 * File bodies in these archives use `--` and `===` as ASCII rulers, which Markdown
 * reads as setext heading underlines; escape them outside code blocks. Heading levels
 * are demoted later on the rendered HTML (where code is already escaped).
 */
function cleanBody(text: string): string {
  return mapProse(stripFrontmatter(text), (line) =>
    /^[=-]{1,}\s*$/.test(line) ? `\\${line}` : null,
  );
}

/** Splits the compendium into plain Markdown and its 478 embedded files. */
export function splitCompendium(body: string): CompendiumSegment[] {
  const lines = body.split("\n");
  const segs: CompendiumSegment[] = [];
  let cur: string[] = [];
  const flush = () => {
    const text = cur.join("\n");
    if (text.trim()) segs.push({ kind: "md", text });
    cur = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const b = /^<!-- ===== BEGIN FILE · ([A-M])\.(\d+) ===== -->\s*$/.exec(lines[i]);
    if (!b) { cur.push(lines[i]); continue; }
    flush();
    const id = `${b[1]}.${b[2]}`;
    let j = i + 1;
    const buf: string[] = [];
    while (j < lines.length && !/^<!-- ===== END FILE · [A-M]\.\d+ ===== -->\s*$/.test(lines[j])) {
      buf.push(lines[j]); j++;
    }
    let k = 0;
    while (k < buf.length && (buf[k].trim() === "" || /^<!--[\s\S]*-->\s*$/.test(buf[k]))) k++;
    const heading = (buf[k] ?? "").replace(/^#{1,6}\s*/, "").trim();
    segs.push({ kind: "file", id, heading, body: cleanBody(buf.slice(k + 1).join("\n")) });
    i = j;
  }
  flush();
  return segs;
}
