# Independent property verification and optional mobile Support module

ADMIN flow: save an unpublished property with an owner, listing type and area; open full property details → Marketplace verification; create a draft, upload every required private evidence type, submit, and set listing availability. Publish becomes available after independent approval and all server eligibility checks pass. Publication quotas still apply.

Tenant ADMIN cannot verify lessors or make Support decisions. Legacy owner verification flags no longer issue public badges. Public consumers must use each listing's `isVerified` and `verificationLevel`, not the owner's legacy flag. Expiry, revocation and changed owner/location/type/area invalidate trust immediately. Expired or revoked listings disappear from public listing endpoints.

## Backend rollout and contract

Deploy the adjacent backend changes and migration before this mobile version. No live database migration or deployment is performed by this implementation.

`GET /properties/{id}/verification` returns paginated records, policy, allowed actions, eligibility reasons and availability. ADMIN may create drafts, upload multipart `type`/`file`, submit, inspect evidence and PATCH availability. Publishing uses the existing property PATCH with `is_published`. Evidence lives in the existing private media collection, counts toward tenant storage quota, and is never serialized as a public path.

No independent Support API existed in the inspected backend. This implementation adds `/platform-support/login`, `/logout` and scoped `/platform-support/tenants/{tenantId}/verifications` list/detail/decision/evidence endpoints. Support identities are separate from tenant users, have explicitly assigned account UUIDs, and receive revocable eight-hour tokens. Decision history is immutable; audit events preserve Support actor identity. The existing web Support app must adopt this contract or supply an equivalent adapter; hosted-web compatibility is not verified.

Provision a reviewer from the backend terminal:

```sh
php artisan support:reviewer reviewer@example.com --name="RAZE Reviewer" --tenant=TENANT_UUID
```

Password entry is hidden; updating a reviewer revokes old tokens. Never embed passwords, tokens or database credentials in mobile code. Use a reviewer email independent of all tenant users, including archived users. Add each account explicitly; broad cross-account database access is unnecessary.

Policy is server configuration: `config/property-verification.php`. Initial operational default is `documentary`, requiring owner identity and ownership/authority evidence, valid for 365 days (`PROPERTY_VERIFICATION_VALID_DAYS`). These are implementation defaults, not confirmed BRD policy. Platform product owners must approve or replace them before production; mobile reads the catalog and never invents verification levels or expiry.

## Local Support module

`local-modules/raze-support/` is deliberately Git-ignored. Its UI provides independent sign-in, assigned-account selection, paginated queue, evidence inspection, approve/reject/revoke with reasons, and history. Session stays in memory and separate from tenant auth/cache; closing the module clears it. Evidence inspection uses authenticated downloads; native temporary files are removed after the OS inspection/share dialog closes.

Tracked code contains only the typed module interface, disabled fallback, launcher, resolver and packaging command. A fresh clone works without the module. Preserve/share local module files separately if other developers need them; Git will not carry them. Do not force-add these files.

Local development:

```sh
EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW=true npx expo start
npx tsc --noEmit --project local-modules/raze-support/tsconfig.json
node --test local-modules/raze-support/gateway.test.cjs
```

Settings → RAZE Support preview opens a modal; no Support Expo route or public deep link exists.

Explicit EAS preview upload:

```sh
node scripts/build-with-support-preview.cjs preview --support --check
node scripts/build-with-support-preview.cjs preview --support --platform android
node scripts/build-with-support-preview.cjs preview --support --platform ios
```

The wrapper copies current Git-visible files into a temporary snapshot, adds only this local module when explicitly requested, sets the profile flag, and uploads via EAS. It leaves the checkout unchanged. Without `--support`, the module is excluded. Standard EAS uploads also exclude it through `.easignore`; enabling the flag without uploading files fails clearly. Production rejects enablement, and its snapshot physically omits local modules:

```sh
node scripts/build-with-support-preview.cjs production --check
node scripts/build-with-support-preview.cjs production --platform android
```

Existing preview billing keys and HTTPS legal links remain required. This feature does not waive release configuration.

## Acceptance

- ADMIN evidence submission, availability and publication; MANAGER publication/verification denial.
- Tenant tokens rejected by Support API; reviewer scope, inactive/expired tokens and self-review checks.
- Evidence private to the matching account/record; no public evidence paths.
- Missing evidence/stale reviews rejected; approve/reject/revoke audited; audit failure rolls back decisions.
- Expiry/revocation removes badges and public visibility immediately.
- Fresh clone fallback; missing enabled module error; opted-in preview inclusion; production exclusion.
- Native evidence picker/inspection, independent sign-in, review actions and publication must be smoke-tested against a migrated backend. Bundling alone does not prove those device flows.

## Local validation (2026-09-28)

- Mobile suite plus local Support session tests: 120 passed; app and local-module TypeScript checks passed.
- Enabled iOS/Android exports passed; disabled iOS export passed and excludes the Support API adapter.
- Upload snapshot checks passed for opted-in preview inclusion and production exclusion. No EAS upload/build was submitted.
- Backend verification tests cover authority, account/evidence scope, inactive/deleted accounts, current policy, expiry, revocation, immutable history and audit rollback. PostgreSQL-specific tests and native-device smoke checks remain outstanding.
