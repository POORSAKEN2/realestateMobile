import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { validateBillingEnvironment } = require("../config/billingEnvironment");

const validReleaseEnvironment = {
  EAS_BUILD_PROFILE: "production",
  EAS_BUILD_PLATFORM: "ios",
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: "appl_public-key",
  EXPO_PUBLIC_TERMS_URL: "https://terrane.example/terms",
  EXPO_PUBLIC_PRIVACY_URL: "https://terrane.example/privacy",
};

test("release billing configuration accepts platform keys and legal URLs", () => {
  assert.doesNotThrow(() =>
    validateBillingEnvironment(validReleaseEnvironment),
  );
});

test("release billing configuration rejects Test Store keys", () => {
  assert.throws(
    () =>
      validateBillingEnvironment({
        ...validReleaseEnvironment,
        EXPO_PUBLIC_REVENUECAT_API_KEY: "test_public-key",
      }),
    /Test Store keys are forbidden/,
  );
});

test("release billing configuration requires legal URLs", () => {
  assert.throws(
    () =>
      validateBillingEnvironment({
        ...validReleaseEnvironment,
        EXPO_PUBLIC_PRIVACY_URL: "",
      }),
    /EXPO_PUBLIC_PRIVACY_URL is required/,
  );
});

test("release billing configuration requires public HTTPS legal pages", () => {
  assert.throws(
    () =>
      validateBillingEnvironment({
        ...validReleaseEnvironment,
        EXPO_PUBLIC_TERMS_URL: "http://localhost/terms",
      }),
    /EXPO_PUBLIC_TERMS_URL must be a valid public HTTPS URL/,
  );
});
