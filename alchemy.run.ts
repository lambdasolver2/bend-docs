import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

// bend-docs: Astro static site deployed as Cloudflare Workers static assets.
// Assets-only: no server bundle, Cloudflare's asset layer answers requests,
// 404.html served for unknown routes. No secrets here — credentials come
// from the alchemy profile (see DEPLOY.md).
export default Alchemy.Stack(
  "bend-docs",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    // StaticSite (not the Astro resource): alchemy's Astro builder injects a
    // rolldown plugin that crashes with Astro 7's bundled Vite
    // (`esmExternalRequirePlugin is not a function`). Our `bun run build`
    // already prerenders everything, so deploy ./dist as-is.
    const site = yield* Cloudflare.Website.StaticSite("Website", {
      command: "bun run build",
      outdir: "dist",
      assets: { notFoundHandling: "404-page" },
    });

    return { url: site.url };
  }),
);
