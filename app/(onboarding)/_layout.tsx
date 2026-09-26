import { Stack } from "expo-router";

import { useThemeColors } from "../../context/WorkspacePresentationContext";

export default function OnboardingLayout() {
  const palette = useThemeColors();

  return (
    <Stack
      screenOptions={{
        animation: "none",
        contentStyle: { backgroundColor: palette.surface },
        gestureEnabled: false,
        headerShown: false,
      }}
    />
  );
}
