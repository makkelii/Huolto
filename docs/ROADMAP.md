# Roadmap and known limitations

1. Production data boundary: Auth, organization bootstrap, membership administration, tenant-aware repository adapters, loading/retry/conflict states and server validation. No automatic fallback to demo on production failures.
2. Transactional completion RPC: lock job and inventory rows, idempotency key, planned/actual quantities, stock reservations, movement and history, confirmed fault outcomes, next recurring job in one transaction. Add database concurrency tests.
3. Templates: draft/approval workflow, immutable versions, human-reviewed actual-use improvement proposals. Demo UI supports explicit quantity approval and version history; production approval adapters remain.
4. Attachments/photos, private signed URLs, QR asset links, electrical/mechanical documents, explicit qualification/permit records and safe upload validation. No fabricated manuals.
5. Stripe test checkout/portal and signed idempotent webhook; server-side entitlement/asset limits; explicit approval before live mode. Business limit currently shown as a provisional 500 assets and must be agreed commercially.
6. Recurrence scheduler, reminders with tenant timezone and delivery logs; inventory reservation allocation and full audit UI. Demo completion creates the next recurring job, but no background scheduler runs.
7. Verified outcome capture for Huoltotutka; accent/stem matching with explainable evidence, machine/part-specific filters, no diagnoses without records. Demo starts with one historical scenario and accepts human-confirmed outcomes.
8. Full accessibility audit against WCAG 2.2 AA, keyboard/screen-reader and touch testing, contrast improvements where necessary, production localization review and date/number formatting. Current version targets AA but is not certified.
9. Dedicated PDF generation, stock-consumption reports and permission-aware exports. Current PDF is browser print/save only.
10. Operational readiness: dependency/security scanning, backups/restore, monitoring, GDPR workflows, retention and incident response. Current tests are foundations, not a production security assessment.
