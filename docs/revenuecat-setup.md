# RevenueCat setup for Terrane

Terrane uses `react-native-purchases` for customer state and native StoreKit /
Google Play purchases. `react-native-purchases-ui` provides Customer Center.
Client-side access checks recognize server-aligned entitlements `tier1_access` and
`all_in_access`. Protected access still uses `/billing/entitlement`.

## 1. Install packages

From `/Users/pandesal/apps/realestateMobile`:

```bash
npm install --save react-native-purchases react-native-purchases-ui
```

Installed versions are `10.9.1`. Both packages need a new native build after
installation. Expo Go uses RevenueCat Preview API Mode, so real purchases must
be tested in an Expo development build:

```bash
npx expo run:ios
# or
npx expo run:android
```

For an EAS development client, install `expo-dev-client`, then use the existing
`development` build profile:

```bash
npx expo install expo-dev-client
eas build --platform ios --profile development
# or
eas build --platform android --profile development
```

## 2. Configure public SDK keys

Local `.env` and `.env.example` contain the supplied Test Store key:

```dotenv
EXPO_PUBLIC_REVENUECAT_API_KEY=test_nBlsQTmMNHDqXAZrJwLcSxsjAih
```

RevenueCat SDK keys are public app identifiers, not secret REST API keys. Never
put a RevenueCat secret API key in an `EXPO_PUBLIC_` variable. Before production,
connect each store and use its public platform key:

```dotenv
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_public_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_public_key
```

Remote EAS builds also need these variables configured in the selected EAS
environment. Restart Metro after changing `.env`.

## 3. Configure RevenueCat dashboard

In **Product catalog**, create/import six products for each target store:

- Tier 1: `tier1_lifetime`, `tier1_yearly`, `tier1_monthly`.
- All-In: `all_in_lifetime`, `all_in_yearly`, `all_in_monthly`.

For App Store Connect, put renewable Tier 1 and All-In products in the same
subscription group so upgrades work correctly. For Google Play, create matching
subscription products/base plans.
Product identifiers must match exactly, including case.

Create entitlements `tier1_access` and `all_in_access`. Attach all paid products
to `tier1_access`; attach the three All-In products to `all_in_access` too. This
lets All-In satisfy Tier 1 feature checks while the higher entitlement maps the
server tier. Lifetime grants access without expiry.

Create offering `default`, mark it Current, and add:

- Tier 1 lifetime, annual, and monthly packages.
- All-In lifetime, annual, and monthly packages.

The app renders these packages in its own React Native paywall. A RevenueCat
Paywall template or Web Purchase Link is not required.

## 4. App integration

`RevenueCatProvider` is mounted under `AuthProvider` in `app/_layout.tsx`. It:

- Configures the SDK once, using tenant UUID immediately when restored auth is available.
- Uses Terrane tenant UUID as RevenueCat `app_user_id`.
- Calls `Purchases.logIn` after Terrane login and `Purchases.logOut` after logout.
- Registers one `CustomerInfo` update listener and removes it on unmount.
- Fetches CustomerInfo and Current Offering concurrently.
- Exposes offering packages to the app's native subscription modal.
- Calls `Purchases.purchasePackage` for the selected billing period.
- Invalidates `/billing/entitlement` when CustomerInfo changes. RevenueCat
  webhooks remain authoritative for protected server access.

Use RevenueCat state anywhere below the root provider:

```tsx
import { useRevenueCat } from "../hooks/useRevenueCat";

function PremiumFeature() {
  const { activeTier, isLoading, packages, purchasePackage } = useRevenueCat();

  if (isLoading) return null;
  if (activeTier === "free") {
    return (
      <Button
        title="Unlock Tier 1"
        onPress={() => {
          const pkg = packages.tier1_monthly;
          if (pkg) void purchasePackage(pkg);
        }}
      />
    );
  }

  return <PremiumContent />;
}
```

The entitlement check is equivalent to:

```ts
const customerInfo = await Purchases.getCustomerInfo();
const isTier1 = Boolean(customerInfo.entitlements.active.tier1_access);
const isAllIn = Boolean(customerInfo.entitlements.active.all_in_access);
```

Fetch packages and purchase from custom native UI:

```tsx
const { packages, purchasePackage } = useRevenueCat();
const monthlyPackage = packages.tier1_monthly;

if (monthlyPackage) {
  const customerInfo = await purchasePackage(monthlyPackage);
  const unlocked = Boolean(customerInfo?.entitlements.active.tier1_access);
}
```

`UpgradePlanModal` presents available monthly, yearly, and lifetime packages.
`purchasePackage` opens the native StoreKit or Google Play purchase sheet.

## 5. Customer info, restore, and errors

```tsx
const { customerInfo, error, isPremium, refresh, restorePurchases } =
  useRevenueCat();

await refresh();
const restoredInfo = await restorePurchases();
```

Purchase cancellation returns `null` from `purchasePackage` and should not show
an error. Network, offline, pending payment, unavailable product, store
restriction, and configuration errors receive specific user-safe messages.
Never parse free-form error text; the client maps RevenueCat error codes.

Always provide a visible Restore Purchases action. Never call
`restorePurchases()` automatically because it can trigger store-account prompts
and transfer/alias behavior.

## 6. Native checkout and Customer Center

`RevenueCatSubscriptionCard` is shown on Terrane's Plan & Billing screen. It
opens the custom native plan modal, restores purchases, and shows Customer
Center only after purchase history exists.

Customer Center makes sense for subscribers who need cancellation, plan changes,
refund/support paths, or purchase restore. Configure it in RevenueCat Dashboard.
It is a RevenueCat Pro/Enterprise feature and needs iOS 15+ or Android API 24+.

```tsx
const { presentCustomerCenter } = useRevenueCat();
await presentCustomerCenter();
```

## 7. Server entitlement sync

Terrane server treats tenant UUID as RevenueCat `app_user_id`, so all managers in
one organization share purchase state. Authenticated user responses now retain
`tenant_id` for stable SDK identity.

Configure RevenueCat webhook URL:

```text
POST https://your-api.example/api/webhooks/revenuecat
Authorization: value matching REVENUECAT_WEBHOOK_AUTH_HEADER
```

The client and server both use `tier1_access` and `all_in_access`. RevenueCat
webhooks are the normal asynchronous writer; scheduled server reconciliation
remains the backstop. Client checkout does not call `POST /billing/reconcile`,
so unavailable server reconciliation cannot turn a successful store purchase
into a purchase error. Never grant sensitive server access solely from client
CustomerInfo.

## 8. Release checklist

- Confirm iOS bundle ID and Android package are `com.raze.terrane` in stores and RevenueCat.
- Confirm all products show prices in `Purchases.getOfferings()`.
- Confirm offering `default` is Current and contains all six packages.
- Test new purchase, cancellation, renewal, expiration, restore, and lifetime access.
- Test one tenant through owner and manager accounts; RevenueCat app user ID must match tenant UUID.
- Confirm RevenueCat webhook delivery updates `GET /billing/entitlement`.
- Use sandbox/TestFlight and Google Play test tracks before production.
- Keep server-side entitlement checks for protected API operations.
