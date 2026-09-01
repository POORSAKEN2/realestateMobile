import { Stack } from "expo-router";

import { colors } from "../../constants/colors";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "none",
        contentStyle: { backgroundColor: colors.whitePrimary },
        gestureEnabled: false,
        headerShown: false,
      }}
    />
  );
}
