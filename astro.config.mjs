import { defineConfig } from "astro/config";

// Static docs site. No adapter: `astro build` prerenders everything to ./dist
// for upload as Cloudflare Workers static assets (see alchemy.run.ts).
export default defineConfig({
  site: "https://bend-docs.example.com",
  output: "static",
  trailingSlash: "always",
});
