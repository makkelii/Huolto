# Roadmap

Implemented in the private-deployment branch: email/password authentication, recovery/invite password setup, shared PostgreSQL adapters, private owner bootstrap, verified technician invitations, RLS and role enforcement, atomic completion/stock/history/recurrence, conflict detection, shared polling, explicit template approvals and separate demo mode. Live service configuration and acceptance checks are required; follow PRIVATE_SETUP.md.

Next priorities:

1. Complete operator acceptance on the real Supabase project: signup settings, SMTP/invitation delivery, recovery redirects, two-device shared data, session expiry, hosting path and backups. No live success is inferred from mocks.
2. Add reviewed membership administration/session revocation UI and a more convenient pending-invitation reconciliation flow. The current deployment intentionally has two users and one organization-wide preparation template.
3. Extend multiple template selection, required qualifications/permits/documents, private attachments/photos and QR links. Keep all safety decisions with qualified people.
4. Inventory reservation allocation, units/decimal consumption UI, stock adjustments with mandatory human reasons, richer audit UI and reorder workflows. Current completion checks available stock, but no reservation-allocation UI is added.
5. Background reminders, delivery logs and richer scheduling beyond transactional next-job creation on completion.
6. Better searchable fault context, equipment filters and localization review; preserve explainable verified evidence and no paid AI dependency.
7. Dedicated PDF generation, richer consumption reports, full WCAG audit, keyboard/screen-reader checks and Safari/Firefox testing.
8. GDPR erasure tooling, monitoring, backup/restore drills, retention and incident response procedures.

Stripe is intentionally excluded from the private deployment. It must remain disabled until separately requested and approved.
