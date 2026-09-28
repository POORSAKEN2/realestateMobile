const fs = require("node:fs");
const path = require("node:path");

function supportPreviewTarget(
  environment = process.env,
  root = path.resolve(__dirname, ".."),
) {
  const enabled =
    environment.EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW === "true";
  const profile = environment.EAS_BUILD_PROFILE;
  if (
    enabled &&
    (profile === "production" ||
      (profile && !["development", "preview"].includes(profile)))
  ) {
    throw new Error(
      "RAZE Support preview module is forbidden in this build profile.",
    );
  }
  const target = enabled
    ? path.join(root, "local-modules/raze-support/index.tsx")
    : path.join(root, "components/support-preview/disabled.tsx");
  if (enabled && !fs.existsSync(target)) {
    throw new Error(
      "RAZE Support preview enabled but local-modules/raze-support/index.tsx is missing. Use the documented preview upload command.",
    );
  }
  return target;
}

module.exports = { supportPreviewTarget };
