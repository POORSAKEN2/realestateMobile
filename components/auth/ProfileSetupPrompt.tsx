import { router } from "expo-router";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/buttons/Button";
import { AuthDialog } from "./AuthDialog";

export function ProfileSetupPrompt() {
  const { session, isAuthenticated, isLoading, signInPersisted } = useAuth();
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (isLoading || !isAuthenticated || !session?.profileSetupNoticePending)
    return null;
  const finish = async (openProfile: boolean) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await signInPersisted({ ...session, profileSetupNoticePending: false });
      router.replace(
        openProfile ? "/(secondary)/profile" : "/(tabs)/dashboard",
      );
    } catch {
      setError("Your choice could not be saved. Please try again.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <AuthDialog visible onClose={() => void finish(false)}>
      <View className="gap-3 p-6">
        <Text
          accessibilityRole="header"
          className="font-ralewayBold text-xl leading-7 text-textPrimary"
        >
          Complete your profile
        </Text>
        <Text className="font-ralewayMedium text-base leading-6 text-description">
          Your workspace is ready. Complete your account details in Profile.
        </Text>
        {error ? (
          <Text accessibilityRole="alert" className="text-sm text-textPrimary">
            {error}
          </Text>
        ) : null}
        <View className="mt-3 flex-row items-stretch gap-3">
          <View className="min-w-0 flex-1">
            <Button
              title="Later"
              compact
              variant="secondary"
              disabled={busy}
              onPress={() => void finish(false)}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Button
              title="Open Profile"
              compact
              variant="secondary"
              disabled={busy}
              onPress={() => void finish(true)}
            />
          </View>
        </View>
      </View>
    </AuthDialog>
  );
}
