import { Redirect } from "expo-router";

export default function LegacyEmailVerificationScreen() {
  return <Redirect href="/(auth)/register" />;
}
