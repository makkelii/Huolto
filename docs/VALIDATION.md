# Executed validation — 19 October 2026

Environment: Node 24.19, npm 11.9, Linux, installed system Chromium, disposable Docker PostgreSQL 16.15. No remote deployment, GitHub push, merge, Supabase production connection or payment activation occurred.

| Command | Result |
| --- | --- |
| `npm run build` | Passed; Vite production bundle at `/Huolto/` |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | 18 passed: 13 domain tests and 5 UI integration tests |
| `npm run test:integration` | 5 passed (same integration subset) |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e` | 4 passed: two scenarios each on desktop and mobile Chromium |
| `npm run test:db` | Passed: migration applied to PostgreSQL, tenant reads/writes, viewer permissions, stock ledger and insufficient-stock rollback assertions |
| `npm audit --omit=dev --audit-level=high` | 0 production dependency vulnerabilities reported |
| `git diff --check` | Passed |
| HTTP check of local `/Huolto/` | 200 |

Browser coverage: onboarding, dashboard, mobile width, sidebar navigation, equipment creation/edit, reload persistence, job creation/edit, preparation status change, explicit safety notice, completion, stock deduction, report history and evidence-based troubleshooting. Desktop and mobile screenshots were inspected. Domain tests cover unknown evidence, verified/same-organization filtering, readiness precedence, atomic stock consumption, reusable tools, reservations, recurrence, duplicate completion and CSV escaping. Integration tests cover language switching, confirmed fault retrieval and explicit human approval of template changes.

Early checks exposed an extra seed-file brace, ambiguous mobile menu name, mobile table/dialog overflow and invalid Testing Library options. These were corrected before final successful runs. Initial Playwright download was denied by network policy; installed system Chromium was used. Network-dependent commands required the execution environment's network capability.

Limits: SQL fixtures emulate Supabase Auth UID and Storage tables; this is actual PostgreSQL RLS validation but not an end-to-end Supabase service test. Auth, Storage HTTP APIs, production organization provisioning, deployed Edge functions, Stripe signatures/transactions, stock concurrency, background reminders, full WCAG audit, Safari and Firefox remain unverified. The inactive billing function is excluded from the frontend TypeScript build and has not been deployed. No paid API was used.
