# Issue #91 — Manager invitations and permission reinforcement

## Replacement issue wording

### Summary

Complete account-owner controlled manager invitations, explicit module/action grants, assigned-property scope, plan seat enforcement, and access auditing. Terrane keeps one `ADMIN` account owner and one invit-able `MANAGER` staff role. Specialized duties come from permissions; RAZE Support remains separate platform authority.

### Requirements

- [ ] Replace direct temporary-password account creation with emailed, seven-day, single-use invitations.
- [ ] Fix every staff invitation role to `MANAGER`; do not add subroles or additional `ADMIN` accounts.
- [ ] Load manager permission groups from the backend policy catalog. New invitations start with no grants.
- [ ] Intersect explicit manager grants with `config/permission-matrix.php`; unknown or malformed grants deny access.
- [ ] Restrict managers to `assigned_property_ids`. Shared records require every linked property; unlinked property-dependent records stay unavailable.
- [ ] Scope collections in SQL before pagination and scope downloads, uploads, search, reports, analytics, notifications, and aggregates on the server.
- [ ] Keep profile, password, logout, onboarding, and notification preferences available without operational grants.
- [ ] Keep staff governance, billing mutation, settings, approvals, verification, protected deletion, and governance operations `ADMIN` only.
- [ ] Allow explicitly granted property creation and atomically assign the created property to its manager.
- [ ] Support invitation edit, resend, revoke, delivery failure, expiry, acceptance, and login handoff on hosted web and `terrane` deep links.
- [ ] Count owner and all retained managers, including disabled managers, against `limits.users.used`; reserve separate capacity for pending unexpired invitations.
- [ ] Lock and recheck entitlement capacity during invitation creation and acceptance. Fail closed when entitlement metadata is missing.
- [ ] Block invitation and staff mutations in read-only subscription mode.
- [ ] Record immutable, tenant-scoped, sanitized invitation and staff access audit events as part of the mutation transaction.
- [ ] Apply the same authorization decisions to navigation, controls, API requests, deep links, and server policies. Server authorization remains authoritative.

### Acceptance criteria

- `ADMIN` can invite, edit, resend, revoke, disable, enable, and remove managers.
- Managers receive only explicitly granted actions on every assigned property, and no access from null, empty, malformed, or unknown grants.
- Cross-tenant records return `404`; same-tenant unassigned records return `403`; scoped collections and aggregates never expose tenant-wide data.
- Starter, Professional, and Portfolio staff capacities are `1`, `5`, and `15`; disabled accounts and pending reservations count correctly.
- Invitation tokens are hashed, rotated on resend, single-use, and expire after seven days. Raw tokens never enter audit events or server access-log URLs.
- Every access mutation has one immutable, sanitized audit event. Denied role, grant, and assignment changes are audited.
- PostgreSQL RLS/concurrency, mobile Node, TypeScript, hosted-link, and iOS/Android deep-link checks pass.

### BRD traceability

`FR-PLT-004`, `FR-PLT-007`, `NFR-SEC-002`, `NFR-AUD-001`.

## Deployment checklist

1. Back up the database, then run `php artisan migrate`.
2. Set production `APP_URL` to the public HTTPS backend origin. Invitation delivery fails closed when production URL is not HTTPS.
3. Configure a non-log mail transport and an encrypted queue worker. Keep `APP_KEY` stable so encrypted queued jobs remain readable.
4. Run Laravel scheduler so `staff:expire-invitations` executes every fifteen minutes.
5. Confirm mobile scheme `terrane` is registered in released iOS and Android builds.
6. Smoke-test one hosted `https://…/accept-invitation#token=…` link and its `terrane:///accept-invitation?token=…` handoff on each platform. The HTTPS fragment stays out of server logs; the custom-scheme query never reaches an HTTP server.
7. The PostgreSQL integration suite uses the backend's normal configured `pgsql` connection and rebuilds that database. Run it only when resetting the configured local database is intended:

   ```sh
   php vendor/bin/phpunit -c phpunit-pgsql.xml --do-not-cache-result
   ```

   RLS assertions skip when the configured PostgreSQL role is a superuser or has `BYPASSRLS`; concurrency tests still run.

8. Confirm queue failure produces `delivery_failed`, resend rotates the token, acceptance consumes one reservation, and account removal releases one seat.

## Current verification

- Mobile: TypeScript passes; full Node suite passes with 86 tests.
- Backend: all #91-created and #91-changed tests pass on PostgreSQL (`58` tests, `268` assertions).
- PostgreSQL RLS and concurrent invite/accept suite previously passed (`12` tests, `58` assertions). With the normal local PostgreSQL superuser, RLS-only assertions skip and concurrency tests remain available.
- All `49` changed PHP files pass syntax and Pint checks. SQLite is not a #91 runtime or acceptance dependency.
- The broader legacy backend suite is not PostgreSQL-ready because many pre-existing fixtures omit tenant context; its PostgreSQL run produced `153` passing and `125` failing tests outside the #91 release gate.
- Hosted invitation page HTTP smoke and iOS simulator deep-link acceptance/login handoff pass. Android and real mail-provider delivery remain release checks.
