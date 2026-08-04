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
      [
        "@react-native-community/datetimepicker",
        {
          android: {
            datePicker: {
              colorAccent: { light: "#634CE4" },
              colorControlActivated: { light: "#634CE4" },
              colorControlHighlight: { light: "#BEE3DB" },
              textColor: { light: "#1E1F45" },
              textColorPrimary: { light: "#1E1F45" },
              textColorPrimaryInverse: { light: "#FFFFFF" },
              textColorSecondary: { light: "#6F6D6D" },
              textColorSecondaryInverse: { light: "#FAF9F9" },
              windowBackground: { light: "#FAF9F9" },
            },
            timePicker: {
              background: { light: "#FAF9F9" },
              headerBackground: { light: "#634CE4" },
              numbersBackgroundColor: { light: "#FAF9F9" },
              numbersSelectorColor: { light: "#8A77F4" },
              numbersTextColor: { light: "#1E1F45" },
            },
          },
        },
      ],
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
