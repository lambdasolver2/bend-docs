// Markdown -> HTML for the book. One pipeline, two documents.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import GithubSlugger from "github-slugger";
import { visit } from "unist-util-visit";

export type Heading = { level: number; text: string; id: string };
export type RenderOptions = {
  compendiumIds?: Set<string>;       // ids that coursebook cross-references may link to
  highlight?: boolean;               // shiki (coursebook only)
  headings?: Heading[];              // out-param
  sectionPrefix?: boolean;           // prefix ids inside <section class="file">
};

function textOf(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (node.type === "element" && node.tagName === "img") return node.properties?.alt ?? "";
  const kids = node.children ?? [];
  return kids.map(textOf).join("");
}

// Drop attributes/children we never want in the book.
function postprocess(tree: any) {
  visit(tree, "element", (el: any) => {
    if (el.tagName === "a") {
      const href = el.properties?.href ?? "";
      if (/^https?:/i.test(href)) {
        el.properties.target = "_blank";
        el.properties.rel = "noopener";
      }
    }
  });
  // wrap tables
  const stack: any[] = [tree];
  while (stack.length) {
    const node = stack.pop();
    if (!node?.children) continue;
    node.children = node.children.map((c: any) => {
      if (c?.type === "element" && c.tagName === "table") {
        return { type: "element", tagName: "div", properties: { className: ["table-wrap"] }, children: [c] };
      }
      return c;
    });
    for (const c of node.children) stack.push(c);
  }
}

export async function renderMarkdown(
  md: string,
  opts: RenderOptions,
  highlighter: any,
): Promise<string> {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  const compendiumIds = opts.compendiumIds ?? new Set<string>();
  const langMap: Record<string, string> = {
    hvm: "haskell", bend: "python", output: "text", error: "text", text: "text",
    sh: "bash", shell: "bash", js: "javascript", ts: "typescript", json: "json",
  };

  const remark = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: true });

  const processor = remark
    .use(rehypeRaw)
    // ---- heading ids + collection -------------------------------------------------
    .use(() => (tree: any) => {
      visit(tree, "element", (el: any) => {
        if (!/^h[1-6]$/.test(el.tagName ?? "")) return;
        const text = textOf(el).replace(/\s+/g, " ").trim();
        const id = slugger.slug(text);
        el.properties = el.properties ?? {};
        el.properties.id = id;
        headings.push({ level: Number(el.tagName[1]), text, id });
      });
      postprocess(tree);
    })
    // ---- coursebook -> compendium links ------------------------------------------
    .use(() => (tree: any) => {
      if (!compendiumIds.size) return;
      const re = /(?<![A-Za-z0-9.§])([A-M])\.(\d+)(?![\d.])/g;
      const skip = new Set(["a", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6"]);
      const walk = (node: any, ancestors: string[]) => {
        if (!node?.children) return;
        if (node.type === "element" && skip.has(node.tagName)) return;
        const next: any[] = [];
        for (const child of node.children) {
          if (child.type === "text") {
            const value: string = child.value;
            let last = 0;
            const parts: any[] = [];
            for (const m of value.matchAll(re)) {
              const idPart = `${m[1]}.${m[2]}`;
              if (!compendiumIds.has(idPart)) continue;
              const at = m.index ?? 0;
              parts.push({ type: "text", value: value.slice(last, at) });
              parts.push({
                type: "element",
                tagName: "a",
                properties: { href: `compendium.html#file-${m[1]}-${m[2]}`, className: ["xref"] },
                children: [{ type: "text", value: idPart }],
              });
              last = at + idPart.length;
            }
            if (parts.length) {
              parts.push({ type: "text", value: value.slice(last) });
              next.push(...parts);
            } else next.push(child);
          } else {
            walk(child, [...ancestors, node.tagName ?? ""]);
            next.push(child);
          }
        }
        node.children = next;
      };
      walk(tree, []);
    })
    // ---- syntax highlighting (coursebook) -----------------------------------------
    .use(() => async (tree: any) => {
      if (!opts.highlight || !highlighter) return;
      const jobs: Array<Promise<void>> = [];
      visit(tree, "element", (node: any) => {
        if (node.tagName !== "pre") return;
        const code = node.children?.find((c: any) => c.type === "element" && c.tagName === "code");
        if (!code) return;
        const cls: string[] = code.properties?.className ?? [];
        const m = cls.map((c) => /^language-(.+)$/.exec(c)).find(Boolean);
        const src: string = textOf(code).replace(/\n$/, "");
        const lang = m ? langMap[m[1]] ?? m[1] : "text";
        const known = highlighter.getLoadedLanguages?.() ?? [];
        const use = known.includes(lang) ? lang : "text";
        jobs.push(
          highlighter.codeToHast(src, { lang: use, theme: "github-light" }).then((h: any) => {
            const pre = h.children.find((c: any) => c.type === "element" && c.tagName === "pre");
            if (pre) {
              node.tagName = "pre";
              node.properties = { ...(pre.properties ?? {}), className: [...(pre.properties?.className ?? []), "code"] };
              node.children = pre.children;
            }
          }),
        );
      });
      await Promise.all(jobs);
    })
    .use(rehypeStringify, { allowDangerousHtml: true });

  let html = String(await processor.process(md));
  // solution placeholders -> real <details>, so markdown inside them was parsed
  html = html.replace(/<p>\s*@@SOL@@\s*<\/p>/g, '<details class="solution"><summary>Solution</summary>');
  html = html.replace(/<p>\s*@@END@@\s*<\/p>/g, "</details>");
  // any leftover placeholder (inline usage)
  html = html.replace(/@@SOL@@/g, '<details class="solution"><summary>Solution</summary>').replace(/@@END@@/g, "</details>");
  // ascii blocks
  html = html.replace(/<pre><code class="language-text">/g, '<pre class="ascii"><code>');
  if (opts.headings) opts.headings.push(...headings);
  return html;
}
