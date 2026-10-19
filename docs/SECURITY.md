# Security and privacy

## Private application boundary

Authenticated organization data is stored in PostgreSQL. Only the SDK's refreshable session and interface preferences use browser persistence. The synthetic demo uses its own `huoltopilotti-demo-v1` key, and production adapters never import that data or fall back to it. Local demo storage is not a security boundary; do not enter real customer data in it.

The private migration supersedes the first migration's direct write policies: all tenant tables have RLS, authenticated clients have tenant-scoped SELECT policies, and direct client INSERT/UPDATE/DELETE grants are revoked. No browser endpoint provisions organizations or memberships. `private_snapshot` validates membership and returns one tenant's records. `private_mutate` validates role, fields and same-tenant references, locks the organization revision, and applies one bounded command. SECURITY DEFINER functions fix their search path; internal helpers are not executable by clients. Owners/admins manage assets, stock adjustments and template approvals. Technicians manage jobs, preparation, completion and confirmed fault evidence. Viewers cannot mutate. Composite foreign keys prevent cross-tenant asset/item/assignment references. Approved template versions, completion history and stock ledgers cannot be edited through the browser API.

Completion serializes with stock adjustments, locks the job and inventory, validates quantities/availability, consumes only parts/consumables, records actual usage/history/audit and creates recurrence in the same transaction. Stale organization revisions and duplicate completions fail rather than retrying blindly. An actual two-connection PostgreSQL test races consumption of the last part. Production service-role/manual SQL bypasses RLS; do not use those credentials from the frontend, and use reviewed procedures when changing data administratively.

## Authentication and invitations

The Supabase SDK performs password sign-in, refresh, recovery and local-device sign-out. User changes/sign-out clear loaded records and stale in-flight loads are discarded. An unprovisioned user cannot enter a workspace. Public signup and anonymous auth must be disabled in hosted Supabase settings as described in PRIVATE_SETUP.md; the local config file alone does not configure the hosted service.

Only a manager in the single private deployment may reserve the second slot. Edge requests verify the bearer token with `auth.getUser()`, not unverified claims, before calling the user-scoped reservation RPC. The privileged admin invite API runs only in Edge memory. Origins/redirects are server-selected. A pending invitation expires after two days; membership becomes technician only after email confirmation, once, with a two-member limit. Failed delivery revokes the unused reservation. Network/provider uncertainty may require an administrator to reconcile pending invite/Auth state before retrying. No automatic membership grants are made to existing Auth users on an invite API failure.

Private self-registration/organization creation is not available. The first owner is confirmed through Supabase's admin invitation and bootstrapped once in SQL Editor with a non-secret user UID. Exact setup, SMTP and redirect settings are operational requirements. Use strong passwords, sensible hosted session timeouts, verified SMTP and Dashboard session revocation for lost devices. Browser session storage remains sensitive to XSS; React text escaping and no HTML injection reduce risk but do not replace hosting CSP and dependency review.

## Verification and remaining work

Tests exercise actual PostgreSQL RLS, permission checks, cross-tenant references, shared reads, invitation acceptance and concurrent transactions with Auth/Storage fixtures. Frontend and Edge-handler service boundaries are mocked. Live GoTrue, email delivery, Storage HTTP, deployed Edge functions, redirect configuration, TLS/DNS and hosting CSP remain operator acceptance tests. See VALIDATION.md. Public frontend keys are intentionally public; build-time validation rejects secret-key and non-anon JWT formats. Do not log tokens/passwords or expose service-role keys in `VITE_*`. Billing is inactive.

## GDPR and deletion

Determine controller/processor roles, lawful basis, purposes, privacy notice and retention periods. Use appropriate EU regions and DPAs with Supabase, hosting and the mail provider; review subprocessors and transfers. Minimize free text, provide access/export and correction, restrict administrative access, document incident response, enable backups and test restores.

There is no self-service organization/data deletion UI in this initial private version. For a verified owner erasure request: export if needed, review legal/audit retention, revoke sessions/invitations, remove private attachment objects, remove dependent SQL rows in dependency order, delete memberships/organization and the private-deployment marker, then remove Auth users only if they have no other memberships. Record a minimal non-personal receipt, document backup expiry and suppress restoration of erased records. Foreign keys intentionally restrict some deletions; use a reviewed privileged transaction rather than weakening RLS. Demo erasure is independent: reset demo data, then clear site storage if preferences/session deletion is also intended.

Readiness remains logistical preparation, not a safety authorization. Only qualified personnel can verify isolation, permits, competencies and site safety. Historical matching retrieves verified records without inventing manufacturer instructions, specifications or diagnoses.

## Independent brunbar.fi preparation

The new root deployment uses a dedicated Pages repository with hard repository/domain guards and an isolated invitation function (`invite-technician-brunbar`, `BRUNBAR_APP_ORIGIN`). The legacy function and global `APP_ORIGIN` are deliberately preserved. Never change shared Supabase Site URL, redirect entries, SMTP, database or Auth settings without checking their existing users. Add brunbar callback allowlist entries; do not remove legacy entries. No database schema change or reset accompanies this preparation. See HOSTING_INSPECTION.md and BRUNBAR_DEPLOYMENT.md for the remaining hosting uncertainty and manual cutover/rollback requirements.
