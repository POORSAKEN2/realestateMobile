import { Stack } from "expo-router";

import { useThemeColors } from "../../context/WorkspacePresentationContext";

export default function AuthLayout() {
  const palette = useThemeColors();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.surface },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: palette.panel },
        headerTintColor: palette.text,
      }}
    />
  );
}
