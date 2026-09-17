# Issue #100: run the updated billing app

Deploy the compatible backend and apply its migrations and idempotent trial/grandfathering command first. See the [backend rollout guide](../../realestate-be/docs/issue-100-billing-rollout.md) for catalog limits, rollout and release validation.

## Local app setup

```bash
npm install
npx expo start --clear
```

Point `.env` at that backend, preserving `/api`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_public_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_public_key
EXPO_PUBLIC_REVENUECAT_STARTER_MONTHLY_PRODUCT_ID=starter_monthly
EXPO_PUBLIC_REVENUECAT_STARTER_YEARLY_PRODUCT_ID=starter_yearly
EXPO_PUBLIC_REVENUECAT_PROFESSIONAL_MONTHLY_PRODUCT_ID=professional_monthly
EXPO_PUBLIC_REVENUECAT_PROFESSIONAL_YEARLY_PRODUCT_ID=professional_yearly
EXPO_PUBLIC_REVENUECAT_PORTFOLIO_MONTHLY_PRODUCT_ID=portfolio_monthly
EXPO_PUBLIC_REVENUECAT_PORTFOLIO_YEARLY_PRODUCT_ID=portfolio_yearly
```

Use `10.0.2.2` on Android Emulator or the backend computer's LAN IP on a physical device. Restart Metro after changing environment variables. SDK keys are public platform keys from the same RevenueCat project as the backend's private REST key. Never put a private `sk_` key in `EXPO_PUBLIC_`. A local Test Store public key can use `EXPO_PUBLIC_REVENUECAT_API_KEY`; preview/production builds must use platform keys and configured `EXPO_PUBLIC_TERMS_URL`/`EXPO_PUBLIC_PRIVACY_URL`.

## Products and native build

Issue #97 must provision the six monthly/yearly store products in offering `default`, mapping each plan pair to `starter_access`, `professional_access` or `portfolio_access`. Product variables must match exact RevenueCat identifiers, including Google Play base-plan suffixes if present. Retain legacy Tier 1/All-In entitlements and identifiers for restore and existing ownership, but do not sell them or create new lifetime products.

Rebuild native binaries for RevenueCat and the PDF file-sharing module:

```bash
npx expo run:ios
# or
npx expo run:android
```

Expo Go can preview UI/Test Store state; real store purchase testing needs a native development build, App Store sandbox/TestFlight or Google Play test track. For EAS, use the existing development profile with `expo-dev-client` installed. Configure matching `com.raze.terrane` store applications, agreements and RevenueCat store credentials. Use tenant UUID as RevenueCat app user ID and preserve original tenant ownership during restore/transfer configuration.

## Where to open the implementation

1. Sign in as **ADMIN**. Open the **Profile tab → Plan & Billing**. Inspect Professional trial dates, server access and quotas; open plan options for Starter/Professional/Portfolio, monthly/yearly packages and preview. Buy, restore and Customer Center actions are ADMIN only, including direct provider calls.
2. Open **Team & Access** for server-driven user limits. Owner and disabled managers count. Starter allows one total user, so no additional manager.
3. Open **Analytics → Financial Summary Report → Export CSV / Export PDF**. Native PDF opens the share sheet; web downloads the file. Dates are constrained by backend history availability.
4. In an isolated test tenant, check asset creation/import, publication and property/document/floorplan/receipt/profile uploads at quota boundaries. Quota errors show required plan/excess. Trial expiry makes operational writes read-only while retaining records and listings.
5. Sign in as an authorized **MANAGER**. Billing metadata remains readable, while purchase/restore/management and staff administration require ADMIN. Existing property permissions still apply.

Missing offerings show unavailable purchase options rather than invented prices. Store purchase success does not guarantee server activation: the app displays store state and server access separately, and ADMIN reconciliation retries. Trial access is never presented as confirmed purchased access. Scheduled reports and automated support SLAs remain deferred.

## Checks

```bash
npx tsc --noEmit
node --test tests/*.test.mjs
```

Separately verify native purchase, restore, Customer Center, session/tenant switching, cancellation, renewal, refund, grace and delayed webhooks against the deployed backend. Code tests do not prove store configuration or native runtime behavior.
