import { Stack } from "expo-router";
import { AccessBoundary } from "../../components/auth/AccessBoundary";

export default function SecondaryLayout() {
  return (
    <AccessBoundary>
      <Stack screenOptions={{ headerShown: false }} />
    </AccessBoundary>
  );
}
