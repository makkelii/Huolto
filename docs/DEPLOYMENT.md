# Deployment

## Local

Run `npm ci`, `npm run dev`, then visit the printed URL at `/Huolto/`. `npm run build` creates `dist/`. Hash navigation preserves direct links such as `/Huolto/#assets` without server rewrites. Vite uses the fixed `/Huolto/` base path for scripts and CSS. Changing the repository name requires changing this base and browser test baseURL.

## GitHub Pages (requires owner approval)

1. Review changes on a branch and run validation. Commit `package-lock.json`.
2. Merge only after explicit approval. In repository Settings → Pages, select GitHub Actions.
3. Configure the `github-pages` environment with required reviewers to gate publishing.
4. Explicitly dispatch “Validate and deploy GitHub Pages” from `main` after approval. Pull requests validate but never deploy. Pushes do not trigger deployment.
5. The workflow installs, lints, type-checks, runs unit/integration tests, builds, runs desktop/mobile Chromium smoke tests and publishes the build artifact.
6. Confirm https://makkelii.github.io/Huolto/ and a direct hash route. Check network assets load from `/Huolto/assets/` and no server secrets appear in the bundle.

This workflow was created but has not been dispatched. No remote branch or PR was created by the implementation task.

## Supabase (not connected yet)

Create a development Supabase project, run migrations with Supabase CLI (`supabase db reset` locally), then run `supabase/tests/tenant_isolation.sql` against the migrated local database. Review policies before production. Tenant provisioning must atomically create an organization and owner membership through a verified server endpoint. Clients must never self-assign memberships or edit subscriptions. Build authenticated production adapters and explicit organization selection before enabling production mode.

The current billing function returns HTTP 503 by design. Before replacement: implement JWT verification, owner/admin membership verification, server-selected Stripe price IDs, allowlisted redirect URLs, customer ownership checks for the portal, raw-body webhook signature verification, an event-ID uniqueness ledger and idempotent subscription updates. Store Stripe keys, webhook secret and service-role key only as Edge secrets. Test with Stripe test keys; obtain explicit approval before live payments.

## Commercial hosting limitations

GitHub Pages is suitable for this static demo and uses a public static bundle. It has no server secrets, server routes, configurable security headers, SSR, authentication gateway or SLA; review GitHub's current commercial-use policies before operating a subscription business there. Host the static frontend on Cloudflare Pages, Netlify or Vercel with security headers and a custom domain; keep Supabase Auth/Postgres/Storage/Edge Functions as the backend. Update Vite base to `/` on a root-domain host. Configure CSP, HTTPS, HSTS, trusted origins and redirects. A public frontend is never a substitute for RLS.

For isolated SQL validation without Supabase CLI, `npm run test:db` uses Docker PostgreSQL 16 and minimal Auth/Storage API fixtures. It does not test Supabase Auth sessions, Storage HTTP access or Edge deployment.
