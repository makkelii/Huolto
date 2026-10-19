# Huoltopilotti

A Finnish-first maintenance management MVP for small industrial teams. React 19, TypeScript, Vite, Tailwind 4, shadcn-style Button with CVA, Radix dialogs and Lucide. Finnish, English and German interface; synthetic records retain their entered language.

## Preview

Requires Node 22+ and npm. No credentials needed.

```sh
npm ci
npm run dev
```

Open the printed URL ending in `/Huolto/`. Demo data persists in this browser's localStorage. Settings → Reset demo data restores the original examples. Never enter confidential or real personal data into the demo. Demo storage is not authenticated, encrypted or shared between users.

## Working MVP

- Responsive dashboard and navigation; light/dark themes; language selection; onboarding, dialogs, feedback and empty states.
- Equipment creation and editing, manufacturer/model/serial/location fields and job lookup.
- Maintenance job creation and editing, due dates, priority, assignment, duration, progress state, preparation checklist, completion history and next-job creation on recurring completion.
- Huoltovalmius groups tools, parts, consumables, isolation/PPE/permits, documents and personnel. Missing items and review status are explicit. A checked list never grants a safety authorization.
- Human-approved demo template revisions with retained prior versions; confirmed fault recording feeds future historical matches.
- Inventory item creation/editing, quantities, location, part number, compatibility, alternatives and calibration date. Completion validates all usage before applying a single state update; consumables/parts decrease, reusable tools do not.
- Huoltotutka uses exact normalized token overlap against verified synthetic history in the same organization; evidence, matching words and limitations are shown. It has no AI dependency and invents no evidence.
- Completed/overdue reports, escaped CSV and browser print/save-to-PDF.
- Supabase schema foundation, tenant RLS, composite tenant foreign keys, controlled stock RPC and private attachment policies.
- Explicitly inactive billing function. No real checkout, payment or deployment has been activated.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

See `docs/VALIDATION.md` for commands actually executed in the implementation environment. Application tests do not establish database RLS correctness; `npm run test:db` runs SQL tenant and stock tests in disposable PostgreSQL with minimal Supabase auth/storage fixtures. Full Supabase deployment tests remain necessary.

## Production status

This is a usable browser-local MVP, not a production SaaS release. Supabase credentials in `.env.example` are reserved for future integration; setting them does not switch the app into production mode. Authentication, tenant provisioning, invitations, production data adapters, reminders, transactional server completion, reservation allocation, file/QR workflows, server recurrence scheduling and Stripe integration are not connected. Demo templates support explicit approval of actual-use quantities as a new version. Requirements remain illustrative and require qualified review. There are no genuine manufacturer instructions in the demo.

Before storing customer data, complete `docs/SECURITY.md`, run database tests, and implement the roadmap. Do not use demo readiness or matching as a safety decision.

## Documentation

- `docs/DEPLOYMENT.md`: GitHub Pages, base path and backend setup
- `docs/SECURITY.md`: trust boundaries, permissions and GDPR
- `docs/ROADMAP.md`: remaining product and production work
- `supabase/migrations/202610190001_core.sql`: schema and policies

No secrets belong in VITE variables. No deployment or payment activation is automatic on push.
