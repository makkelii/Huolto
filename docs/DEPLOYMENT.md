# Deployment

For the exact private Supabase/Auth/Edge/GitHub configuration, follow **PRIVATE_SETUP.md**.

- Canonical application URL and Vite base: `https://585.fi/huolto/`, `/huolto/`.
- Hash navigation (`#assets`, `#jobs`) needs no server rewrites. Supabase callbacks return to the same static entrypoint using `?auth=invite` or `?auth=recovery`.
- `.github/workflows/deploy.yml` retains PR validation and manual Pages deployment from `main` only. Manual builds require public repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The workflow supplies `VITE_BASE_PATH=/huolto/`. No server secrets belong in frontend variables.
- The workflow does not apply SQL, deploy Edge Functions, create users, send invitation email or modify the custom domain. Existing DNS/proxy/static mount behavior for `585.fi/huolto/` remains the operator's responsibility; no CNAME is added.
- Review and merge explicitly. Dispatch the workflow explicitly after configuring Supabase and the GitHub variables. Required reviewers on `github-pages` can add a deployment gate.
- Local preview: `npm ci`, `npm run dev`, open `/huolto/`. Static output: `npm run build` → `dist/`. For another mount, set `VITE_BASE_PATH` and the exact corresponding Auth redirects; this private deployment should retain `/huolto/`.

GitHub Pages hosts the public static application, not the authorization boundary. RLS, verified JWTs and privileged server functions protect data. Pages has no server secrets or configurable security headers; preserve any existing fronting host/proxy policies. If stronger header control or commercial hosting terms require it later, the same static build can be served from Cloudflare Pages, Netlify, Vercel or an existing static host while keeping Supabase and the current custom URL/path.

Stripe remains disabled. Do not deploy the billing stub or provide Stripe keys for this private internal deployment.
