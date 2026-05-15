const fs = require("fs");
const path = require("path");

function readDotEnvValue(key) {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const env = fs.readFileSync(envPath, "utf8");
  const line = env
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));

  if (!line) {
    return undefined;
  }

  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    "@react-native-community/datetimepicker",
    "expo-notifications",
    "expo-secure-store",
  ],
  extra: {
    ...config.extra,
    projectId:
      process.env.EXPO_PROJECT_ID ??
      readDotEnvValue("EXPO_PROJECT_ID") ??
      config.extra?.projectId,
    apiBaseUrl:
      process.env.VITE_API_BASE_URL ??
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      readDotEnvValue("VITE_API_BASE_URL") ??
      readDotEnvValue("EXPO_PUBLIC_API_BASE_URL") ??
      "http://localhost:8000/api",
  },
});
