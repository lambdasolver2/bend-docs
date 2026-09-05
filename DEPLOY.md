# Deploy

## First time (you, the account owner)

1. `bun install`
2. `bun run build` — must pass with 16 pages, 0 JS bundles.
3. `alchemy login` — OAuth in the browser, or paste an API token.
   Saved to the `default` profile at `~/.alchemy/profiles.json`.
   Nothing secret is committed to this repo (CI check: search for
   `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`).
4. `alchemy deploy` — prints the live `*.workers.dev` URL.

## After deploy

- Dashboard → Speed → Settings → enable **Speed Brain** (the
  `Speculation-Rules` prefetch header the performance spec expects).
- Confirm headers: `cf-cache-status: HIT` and
  `speculation-rules: "/cdn-cgi/speculation"`.
- Custom domain later: set `site:` in `astro.config.mjs` to the final
  domain and redeploy (canonical/OG/sitemap URLs follow it).

## CI (no interactive login)

Set `CLOUDFLARE_ACCOUNT_ID` plus `CLOUDFLARE_API_TOKEN` as environment
secrets and run `alchemy deploy --stage prod`.
