import { defineConfig } from "astro/config";

// Static docs site. No adapter: `astro build` prerenders everything to ./dist
// for upload as Cloudflare Workers static assets (see alchemy.run.ts).
export default defineConfig({
  // Live deployment URL. Change this if a custom domain is attached.
  site: "https://bend-docs-website-dev-vscode-mppjuoypwkmixop6.lambdasolver2.workers.dev",
  output: "static",
  trailingSlash: "always",
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      langAlias: { bend2: "python", hvm: "haskell" },
    },
  },
});
