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
- Continuing with Apple accepts the linked legal documents and requests automatic signup. An unlinked identity with an unused, server-verified email creates a passwordless ADMIN account, a `My workspace` tenant and the existing trial. Apple supplies the name when available; otherwise `Apple member` is temporary. Company details stay empty.
- Existing-email conflicts and identities without a verified email open email-code linking. Enter the existing Terrane email, request a code and verify it; no Terrane password is collected. Codes bind to the pending Apple proof and target account, expire within ten minutes, and respect the existing resend/lockout limits. Private relay addresses can be used for signup; linking may use a different Terrane email.
- New signup sessions persist before the `Complete your profile` popup appears. `Open Profile` navigates to the existing Profile screen; `Later` opens the dashboard. An unacknowledged notice survives app restart; either action saves its dismissal. Details remain optional, and editing the profile company does not rename the workspace.
- Login scrolling is disabled while the keyboard is closed and enabled while it is visible. The legal footer sits outside the scrolling form, above the bottom safe area or keyboard; branding shrinks to the available space and collapses while typing.
- New Apple accounts have no Terrane password. Settings → Set password opens an authenticated two-field form. Saving requires fresh native Apple verification and preserves the existing session and Apple sign-in. Password setup requires an Apple-enabled iOS build; public email recovery remains separate.
- Deletion submission/information response requests fresh Apple authentication for passwordless users. Proofs bind to the user and operation; existing password users retain their password checks.
- Cancellation returns to login without error. Provider failures show retry feedback. Pending signup/link credentials remain in memory for at most ten minutes and never enter route URLs or SecureStore. Only the resulting Terrane session and Apple subject persist in SecureStore.
- Revoked native credentials sign out Apple sessions. Backend notifications/daily validation revoke their server tokens. Existing password access is preserved.
- Valid Terrane sessions restore from SecureStore on app reopen without opening Apple's sheet. Apple controls password/biometric prompts after sign-out or fresh reauthentication; the app never stores the Apple password. Simulator credential-state checks are skipped, and unavailable checks preserve the session. Test native revocation on a real device.

## Disabled Apple button

For local iOS development, set `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=true` in `.env`, then fully reload the app. If the button remains disabled, the installed development client may lack the native Apple module. Rebuild and reinstall with `npx expo run:ios`; Metro reload alone cannot add native modules. Keep Android/web disabled. For EAS builds, configure the same flag in the selected EAS environment and rebuild the app.

Backend `.env` must contain dotenv assignments without Markdown code fences. With `APPLE_SIGN_IN_ENABLED=true` and credentials configured, `POST /api/auth/apple/challenge` should return 200 before the native Apple sheet is requested.

## Checks

```bash
node --test tests/appleAuthentication.test.mjs tests/appleCredentialState.test.mjs tests/appleSessionLifecycle.test.mjs tests/appleSignupFlow.test.mjs tests/authErrorPopup.test.mjs tests/accountDeletion.test.mjs tests/passwordChange.test.mjs
npx tsc --noEmit
git diff --check
```

Deploy the compatible API before shipping this mobile flow. This update adds no native module or migration; the original Apple capability and passwordless-account migration remain prerequisites. Email delivery must work for code linking; a code is never returned by the API, including debug builds.

Real-device checklist: first automatic signup and both popup actions, repeat login without name, private relay, existing ADMIN/MANAGER code linking, cancellation, network failure/retry, app restart with an unacknowledged notice, consent revocation, deletion recovery and fresh deletion proof. Check small screens, iPad, keyboard, enlarged text, VoiceOver and both themes. Android/web must retain disabled alternatives. Source tests do not establish Apple Developer setup, backend deployment or store/device acceptance.

Official button artwork: [Apple logo-only generator](https://appleid.cdn-apple.com/appleid/button/logo?size=56&color=white&border=false&border_radius=16&scale=3). The downloaded 168px image displays at 56pt with its original padding and proportions.

## First-password setup

Deploy `/api/user/set-password/challenge`, `/verify`, and the final `/api/user/set-password` endpoint before releasing the nested Settings screen. No native rebuild or migration is required beyond the existing Apple-enabled development/release app.

The screen validates matching passwords with at least eight characters, obtains fresh Apple proof, and submits once. Cancellation and errors preserve the draft; subsequent submissions start a new challenge. Passwords and receipts stay in memory and are cleared on completion or departure. Success persists the updated `has_password` in the current session, returns to Settings, and shows `Password set`. Existing Change password and public Forgot password flows remain separate.

Acceptance: set the first password yourself in Apple-enabled iOS, verify Settings changes to Change password, reopen the app, and confirm both password and Apple login. Source tests and simulator layout inspection do not establish real-device password/autofill or deployment acceptance.
