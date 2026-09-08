# Staff and billing integration

Deploy the accompanying backend changes and run `php artisan migrate` before releasing this mobile version. The migration adds `users.is_active` and nullable `users.permissions`. Existing users remain active; existing managers keep their role defaults. No live migration is performed by this code change.

## Staff

- `GET /users` returns the complete manager roster for the owner's tenant (including disabled accounts).
- `POST /users` creates a manager with name, email, password, optional `assigned_property_ids`, and optional `permissions`. The backend serializes creation against the tenant's two-manager limit.
- `PATCH /users/{id}` updates manager details, assignments, permissions, or `is_active`. Disabling revokes existing tokens and prevents new logins.
- `DELETE /users/{id}` removes the manager and assignments and revokes tokens. Existing foreign-key deletion behavior applies to associated user records.
- All staff operations require an owner and validate the target tenant and MANAGER role. Profile updates cannot alter role or access fields.
- Staff editor supports assignments and granular permissions. Property details also has an owner-only assignment editor using `POST /properties/{id}/managers` with the complete selected `manager_ids` array.
- Login and `/user` include the normalized access snapshot and assignment IDs. Mobile refreshes on session restoration, foregrounding, and every minute while active, clearing cached data when access changes.
- Managers may create properties against the shared tenant quota. Creation automatically assigns that manager; mobile refreshes access before uploading follow-up documents.
- Manager aggregate reporting remains unavailable until reporting endpoints support assignment scope. Client-side filters supplement server checks; they are not a substitute for backend authorization.

## Billing

- Tier keys: `free`, `tier1`, `all_in`.
- Billing displays effective/subscribed tier, cancellation/payment grace, over-limit dimensions, storage/listing/user usage, analytics/report/support levels, and history allowance.
- Plan selection loads `/billing/plan-change-preview?tier=...` and displays usage blockers. Paid checkout requires a successful preview and explicit continuation. Free-plan preview directs users to support because the existing checkout endpoint supports only paid tiers.
- Structured 403 `entitlement_limit_reached` responses open a plan modal for owners and direct managers to their account owner. Form input is retained. Ordinary permission failures do not open billing prompts.
- Checkout is disabled while plan data is loading, failed, or another plan operation is pending. Billing refreshes on app foregrounding after returning from checkout.
- Displayed report/support levels describe entitlement only; they do not implement scheduled exports, PDF generation, or a support routing engine.

## Verification

- `node --test tests/accessPolicy.test.mjs tests/staffManagement.test.mjs tests/billingEntitlement.test.mjs`
- `npx tsc --noEmit`
- Backend: `php vendor/bin/pest tests/Feature/Api/StaffManagementTest.php tests/Feature/Api/Billing tests/Unit/Billing tests/Unit/Services/Authorization tests/Feature/Authorization --compact`
- Before release, run the PostgreSQL RLS suite against a dedicated test database, and smoke-test owner/manager flows on a device and real billing sandbox.
