# Apple sign-in

Apple login and passwordless workspace signup work through the native iOS Apple sheet and the adjacent Laravel API. Google and Android/web Apple login remain unavailable.

## Rollout

1. Deploy the backend implementation and migration first. Follow [backend setup](../../realestate-be/docs/apple-sign-in.md) for Apple credentials, shared cache, notifications and deletion lifecycle.
2. Enable Sign in with Apple for App ID `com.raze.terrane` in Apple Developer, then regenerate provisioning profiles. Backend `.p8` signing keys must never enter Expo environment variables or source control.
3. Keep `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=false` until backend setup is ready. Set it to `true` for the acceptance build. Configure `EXPO_PUBLIC_API_BASE_URL` with the deployed `/api` URL and both `EXPO_PUBLIC_TERMS_URL` and `EXPO_PUBLIC_PRIVACY_URL` with real HTTPS legal documents. Signup stays disabled when legal URLs are missing.
4. Install dependencies with `npm ci`. For a generated local iOS checkout, run `npx expo prebuild --platform ios` after preserving any manual native changes, then `npx expo run:ios`. EAS builds generate the native entitlement from `ios.usesAppleSignIn` and the `expo-apple-authentication` plugin. An existing development client needs a rebuild, not only Metro reload. Expo Go identities must not be used as production acceptance for this bundle ID.
5. Verify on a real iPhone and iPad, then enable the flag in the intended release build. The flag is evaluated at bundle time.

## Behavior

- Linked users receive the same Terrane session, permissions and deletion-recovery behavior as password login.
- Unlinked users explicitly choose workspace creation or linking. Linking requires the existing Terrane password, even when Apple uses private relay. Signup uses only server-verified Apple email and collects name/company/terms acceptance.
- New Apple accounts have no Terrane password. Security settings offer email recovery to set one; register the sender with Apple's private relay service so verification mail reaches relay addresses.
- Deletion submission/information response requests fresh Apple authentication for passwordless users. Proofs bind to the user and operation; existing password users retain their password checks.
- Cancellation returns to login without error. Provider failures show retry feedback. Pending signup/link credentials remain in memory for at most ten minutes and never enter route URLs or SecureStore. Only the resulting Terrane session and Apple subject persist in SecureStore.
- Revoked native credentials sign out Apple sessions. Backend notifications/daily validation revoke their server tokens. Existing password access is preserved.

## Disabled Apple button

For local iOS development, set `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=true` in `.env`, then fully reload the app. If the button remains disabled, the installed development client may lack the native Apple module. Rebuild and reinstall with `npx expo run:ios`; Metro reload alone cannot add native modules. Keep Android/web disabled. For EAS builds, configure the same flag in the selected EAS environment and rebuild the app.

Backend `.env` must contain dotenv assignments without Markdown code fences. With `APPLE_SIGN_IN_ENABLED=true` and credentials configured, `POST /api/auth/apple/challenge` should return 200 before the native Apple sheet is requested.

## Checks

```bash
node --test tests/appleAuthentication.test.mjs tests/accountDeletion.test.mjs tests/passwordChange.test.mjs
npx tsc --noEmit
git diff --check
```

Real-device checklist: first signup, repeat login without name, private relay, existing ADMIN/MANAGER linking, cancellation, network failure/retry, app restart, consent revocation, deletion recovery and fresh deletion proof. Check small screens, iPad, keyboard, enlarged text, VoiceOver and both themes. Android/web must retain disabled alternatives. Source tests do not establish Apple Developer setup, backend deployment or store/device acceptance.

Official button artwork: [Apple logo-only generator](https://appleid.cdn-apple.com/appleid/button/logo?size=56&color=white&border=false&border_radius=16&scale=3). The downloaded 168px image displays at 56pt with its original padding and proportions.
