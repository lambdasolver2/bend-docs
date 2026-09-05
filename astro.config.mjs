import { defineConfig } from "astro/config";

const bend2Language = {
  id: "bend2",
  scopeName: "source.bend2",
  grammar: {
    patterns: [
      { include: "#comments" },
      { include: "#strings" },
      { match: "\\b(def|match|case|assert|for|all|do|import)\\b", name: "keyword.control.bend2" },
      { match: "\\b(U32|Nat|Bool|IO|Unit|Data)\\b", name: "support.type.bend2" },
      { match: "\\b[0-9]+\\b", name: "constant.numeric.bend2" },
      { match: "\\b[A-Z][A-Za-z0-9_]*\\b", name: "entity.name.type.bend2" },
      { match: "->|::|<-|\\+\\+|!|%|\\{=\\}", name: "keyword.operator.bend2" },
      { match: "#[A-Za-z_][A-Za-z0-9_]*", name: "comment.line.number-sign.bend2" },
    ],
    repository: {
      comments: { patterns: [{ match: "#.*$", name: "comment.line.number-sign.bend2" }] },
      strings: { patterns: [{ begin: '"', end: '"', name: "string.quoted.double.bend2" }] },
    },
  },
};

// Static docs site. No adapter: `astro build` prerenders everything to ./dist
// for upload as Cloudflare Workers static assets (see alchemy.run.ts).
export default defineConfig({
  site: "https://bend-docs.example.com",
  output: "static",
  trailingSlash: "always",
  markdown: {
    shikiConfig: {
      // Bend2 is intentionally highlighted with Python's mature grammar:
      // the posted syntax is Python-shaped, while the visible language
      // label remains `bend2` in the rendered block.
      langs: [bend2Language],
      theme: "github-dark",
    },
  },
});
