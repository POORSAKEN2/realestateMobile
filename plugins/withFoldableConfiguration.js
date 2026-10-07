const { AndroidConfig, withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withFoldableConfiguration(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(
      androidConfig.modResults,
    );
    const flags = new Set(
      (activity.$["android:configChanges"] ?? "")
        .split("|")
        .map((flag) => flag.trim())
        .filter(Boolean),
    );
    flags.add("smallestScreenSize");
    flags.add("density");
    activity.$["android:configChanges"] = [...flags].join("|");
    return androidConfig;
  });
};
