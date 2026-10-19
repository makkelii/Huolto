# Hosting inspection and isolation decision

Inspection performed during brunbar.fi preparation on 19 October 2026. This is a source/configuration review, not proof of live domain routing.

## Findings

- Repository: `makkelii/Huolto`, default branch `main`. At inspection `main` was `b1d0bb9` and contained the initial demo, not PR #2.
- PR #2 was **open and unmerged**, with head `feature/private-supabase` at `84fdfa6`. The brunbar preparation branch was created from exactly that head, so all authentication, persistence, RLS, inventory transactions and demo separation are included. No database migrations or bootstrap scripts are changed in this preparation.
- The source before preparation used Vite `/huolto/`, hash navigation, same-entrypoint Auth callbacks and the legacy `invite-technician` Edge Function. The Pages workflow could manually deploy the source repository's artifact. No tracked `CNAME` or public static CNAME existed.
- GitHub repository metadata was accessible, but the read-only Pages query `gh api repos/makkelii/Huolto/pages` returned **Forbidden**. Therefore the repository's Pages custom domain, build source, public URL and relationship to 585.fi could **not** be verified. DNS zones, hosting control panels, reverse proxies and the current brunbar site were not accessed or modified.

## Decision

Do not repoint or deploy `makkelii/Huolto`, the account-level `makkelii.github.io` repository, or any existing 585.fi hosting resource. Prepare a **new, dedicated repository** named `makkelii/huoltopilotti-brunbar`, with its own Pages site and custom domain `brunbar.fi`. This repository has not been created automatically.

- The source repository's `deploy.yml` becomes validation/artifact-only in the proposed changes. It has no Pages deployment action or Pages-write/OIDC permissions.
- `deploy-brunbar.yml` is manual-only and rejects any repository except the exact dedicated name, any non-main ref, missing operator approval, or a confirmation other than `brunbar.fi`. A read-only Pages check must find `cname = brunbar.fi` before proceeding. No workflow changes custom-domain settings.
- `deploy/brunbar/CNAME` is a staging file; it is not in `public/` and is not emitted by a normal Vite build. Only the dedicated workflow copies it into its artifact.
- The existing `invite-technician` source remains byte-identical to PR #2. Brunbar uses a separate `invite-technician-brunbar` function and `BRUNBAR_APP_ORIGIN`, so an existing global `APP_ORIGIN` can remain untouched.

## Manual evidence needed before cutover

1. In GitHub Settings → Pages for `makkelii/Huolto` and any account-level site, record the existing URL, custom domain, source and active deployments **without editing them**.
2. In the existing hosting/proxy control panel, identify how 585.fi and `/huolto/` are served. Check whether brunbar.fi shares a document root, proxy upstream, deployment hook or hosting account. Do not replace shared files, virtual hosts, root paths, nameservers or shared deployment credentials.
3. Identify the separate brunbar.fi DNS zone and current hosting origin; export that zone and the old site before making future brunbar-only changes. Check apex and www, including A/AAAA, CNAME/ALIAS, DNSSEC, certificates and TTL.
4. Verify the **new** dedicated Pages site belongs only to brunbar.fi. Do not transfer or edit the 585.fi custom-domain binding. Use GitHub's separate domain-verification challenge for brunbar.fi.
5. If an existing Supabase project is shared with a working 585 application, preserve its data, SMTP/provider settings, existing redirect entries, Site URL and global `APP_ORIGIN`. Add only the brunbar redirect entries and deploy only the new namespaced Edge Function; see PRIVATE_SETUP.md. Stop and review any setting that would change old authentication email behavior.

## Remaining risk to 585.fi

Live hosting independence cannot be proven from the available access. The new path avoids that uncertainty by using a separately named repository, separately bound Pages site, domain-specific DNS changes, and a namespaced invitation function. No live deployment, DNS edit, Pages-settings edit, database reset, Auth-setting change or invitation was performed.

A human could still damage 585.fi by editing the wrong zone/site, replacing a shared document root, changing shared Supabase settings, or dispatching an old historical deployment workflow. The preparation does not authorize those actions. Follow the exact repository/domain checks and rollback instructions in BRUNBAR_DEPLOYMENT.md; never run an older source-repository deploy workflow as part of this migration.
