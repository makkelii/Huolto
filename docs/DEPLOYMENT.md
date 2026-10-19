# Deployment architecture

Canonical prepared application URL: **https://brunbar.fi/**, Vite base `/`. Hash navigation (`#assets`, `#jobs`) and Auth query callbacks share the root static entrypoint. `npm run build` produces `dist/`; `npm run verify:build` checks emitted root asset references and rejects legacy deployment URLs in the browser bundle.

Read **HOSTING_INSPECTION.md** before any live action. Existing Pages custom-domain configuration could not be read (API Forbidden), so no sharing relationship with 585.fi is assumed safe. Do not repoint the existing Pages site.

Use a **new, dedicated** `makkelii/huoltopilotti-brunbar` repository and Pages site. **BRUNBAR_DEPLOYMENT.md** contains the Finnish operator checklist, new-repository setup, domain verification, DNS records, HTTPS, propagation, acceptance tests and brunbar-only rollback. **PRIVATE_SETUP.md** covers Supabase configuration without recreating an existing database.

- `.github/workflows/deploy.yml`: PR/manual validation only, no Pages publish step or Pages-write/OIDC permissions. It emits a normal non-deployed artifact, with no CNAME.
- `.github/workflows/deploy-brunbar.yml`: manual-only publishing, exact dedicated repository and main-branch guards, explicit repository-variable/domain confirmation, and read-only Pages custom-domain verification. It never edits Pages settings, DNS or Supabase configuration. The `brunbar-production` environment can require human reviewers.
- `deploy/brunbar/CNAME`: `brunbar.fi`, staged separately. Only the dedicated workflow copies it into its deployment artifact after tests. There is no root/public CNAME that could accidentally bind the source repo.
- Public GitHub variables in the new repository: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `BRUNBAR_DEPLOYMENT_APPROVED`. The workflow sets `VITE_BASE_PATH=/`. Never expose service-role, database or SMTP secrets in browser variables.
- The existing invitation Edge Function is preserved; deploy only `invite-technician-brunbar` when later authorized. Set its namespaced `BRUNBAR_APP_ORIGIN=https://brunbar.fi`, leaving shared `APP_ORIGIN` and legacy function deployment unchanged.

PR #2 was open at inspection; this preparation branch is based on its exact head and includes authentication, persistence and security work. No migrations are changed and no database reset is requested. If PR #2 is reviewed/merged separately, integrate in order; when copying into the dedicated repository use this reviewed combined branch, not the demo-only main.

No automatic publication, merging, DNS changes or live integration work was performed. GitHub Pages hosts public static files; authorization remains in Supabase RLS and verified functions. Preserve any separately managed security headers and HTTPS policies. Stripe remains disabled.
