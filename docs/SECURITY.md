# Security and privacy

## Trust boundaries

Demo data is untrusted local browser storage, not a security boundary. React escapes rendered text; CSV prefixes spreadsheet formula characters. No HTML injection or paid API is used. Production connectivity is intentionally absent. The optional public Supabase URL/anon key are public identifiers, not authorization.

All tenant SQL tables enable RLS. Membership reads use SECURITY DEFINER helpers with fixed search paths to avoid policy recursion. Tenant relationships use composite foreign keys to reject cross-organization asset/item/job references. Users cannot write memberships, subscriptions, balances, audit events, stock movements or history directly. Assets and templates require owner/admin; work records allow technicians. Viewer access is read-only. No deletion policies are supplied; deletion needs a reviewed server operation.

The stock RPC checks authenticated membership and role, updates a single row atomically subject to nonnegative available stock and appends movement/audit records in one transaction. Production job completion and reservations still need idempotent transactional RPCs; the browser-local completion model must not be reused as server authorization. Initial inventory creation needs a privileged audited provisioning endpoint.

Before release: run SQL isolation tests on PostgreSQL; add explicit grants, RLS mutation tests per role/table, storage tests, concurrent stock tests, membership administration and last-owner protection. The schema rejects edits to approved template versions and checks the approving manager; production UI adapters and broader tests remain. Implement plan/asset limits server-side, rate limiting, session expiry, invitation safeguards, monitoring and restore drills. Review dependency advisories and pin action SHAs before deployment.

## GDPR obligations

Determine controller/processor roles, lawful basis, processing purposes, privacy notice and retention schedule. Execute DPAs with hosting, Supabase and Stripe; select EU regions and review subprocessors/international transfer safeguards. Minimize technician data and free text. Provide access/export, correction, erasure and account closure procedures. Document incident response and breach notification obligations. Avoid sensitive information in logs and audit payloads.

Deletion procedure to implement: authenticated owner request → verify ownership and legal retention constraints → export if requested → cancel subscription → revoke sessions/invitations → delete private Storage objects → delete dependent SQL rows in dependency order → delete memberships/organization → remove orphan Auth users only if they belong to no other organization → verify deletion and record a minimal non-personal receipt. Document backup expiry and restoration suppression. Current schema intentionally restricts some deletions; no production erasure endpoint is available. Browser demo deletion: reset settings, then clear site storage for complete removal of preferences.

## Safety

Readiness is logistical preparation, not a permit or electrical isolation certificate. Demo specifications are synthetic examples. Never derive torque values or manufacturer instructions from them. Historical matching is deterministic lexical retrieval, not diagnostic certainty. Only verified same-tenant evidence is eligible. Qualified people must approve safety decisions and template changes.
