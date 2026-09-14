const RELEASE_PROFILES = new Set(["preview", "production"]);

function requiredValue(environment, key, errors) {
  const value = environment[key]?.trim();
  if (!value) errors.push(`${key} is required for release builds.`);
  return value;
}

function requiredHttpsUrl(environment, key, errors) {
  const value = requiredValue(environment, key, errors);
  if (!value) return;

  try {
    if (new URL(value).protocol !== "https:") throw new Error("Not HTTPS");
  } catch {
    errors.push(`${key} must be a valid public HTTPS URL.`);
  }
}

function validatePlatformKey(environment, platform, errors) {
  if (platform === "ios") {
    const key = requiredValue(
      environment,
      "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY",
      errors,
    );
    if (key && !key.startsWith("appl_")) {
      errors.push(
        "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY must be an App Store key beginning with appl_.",
      );
    }
  }

  if (platform === "android") {
    const key = requiredValue(
      environment,
      "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY",
      errors,
    );
    if (key && !key.startsWith("goog_")) {
      errors.push(
        "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY must be a Google Play key beginning with goog_.",
      );
    }
  }
}

function validateBillingEnvironment(environment = process.env) {
  const profile = environment.EAS_BUILD_PROFILE?.trim();
  if (!profile || !RELEASE_PROFILES.has(profile)) return;

  const errors = [];
  requiredHttpsUrl(environment, "EXPO_PUBLIC_TERMS_URL", errors);
  requiredHttpsUrl(environment, "EXPO_PUBLIC_PRIVACY_URL", errors);
  validatePlatformKey(environment, environment.EAS_BUILD_PLATFORM, errors);

  const configuredKeys = [
    environment.EXPO_PUBLIC_REVENUECAT_API_KEY,
    environment.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    environment.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  ].filter(Boolean);
  if (configuredKeys.some((key) => key.trim().startsWith("test_"))) {
    errors.push("RevenueCat Test Store keys are forbidden in release builds.");
  }

  if (errors.length) {
    throw new Error(
      `Invalid billing release configuration:\n- ${errors.join("\n- ")}`,
    );
  }
}

module.exports = { validateBillingEnvironment };
