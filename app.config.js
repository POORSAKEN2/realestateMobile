const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleMapsApiKey
        ? {
            config: {
              ...config.android?.config,
              googleMaps: {
                ...config.android?.config?.googleMaps,
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      "@react-native-community/datetimepicker",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow Real Estate Mobile to use your location to set the default property pin.",
        },
      ],
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
  };
};
