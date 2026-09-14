const { withXcodeProject } = require("@expo/config-plugins");

/** Ensures regenerated iOS projects retain the StoreKit purchase capability. */
module.exports = function withInAppPurchaseCapability(config) {
  return withXcodeProject(config, (projectConfig) => {
    projectConfig.modResults.addTargetAttribute("SystemCapabilities", {
      "com.apple.InAppPurchase": { enabled: 1 },
    });

    return projectConfig;
  });
};
