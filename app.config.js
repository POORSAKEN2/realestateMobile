const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

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
    projectId: process.env.EXPO_PROJECT_ID ?? config.extra?.projectId,
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      process.env.VITE_API_BASE_URL ??
      "http://localhost:8000/api",
  },
});
