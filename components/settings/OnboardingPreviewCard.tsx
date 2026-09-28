import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/buttons/Button";

export function OnboardingPreviewCard() {
  const { hasCompletedOnboarding, setOnboardingCompleted } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <View className="mt-7 overflow-hidden rounded-2xl border border-primary/20 bg-panel">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        className="min-h-16 flex-row items-center gap-3 p-4"
      >
        <Ionicons
          name="construct-outline"
          color={colors.description}
          size={20}
        />
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayBold text-sm text-textPrimary">
            Onboarding preview
          </Text>
          <Text className="mt-1 text-xs text-description">
            Testing tools ·{" "}
            {!hasCompletedOnboarding ? "Shown on launch" : "Hidden on launch"}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          color={colors.description}
          size={18}
        />
      </TouchableOpacity>
      {open ? (
        <View className="gap-4 border-t border-primary/10 p-4">
          <View className="flex-row items-center gap-3">
            <View className="min-w-0 flex-1">
              <Text className="font-ralewaySemiBold text-sm text-textPrimary">
                Show on launch
              </Text>
              <Text className="mt-1 text-xs leading-5 text-description">
                Temporarily replay onboarding while testing.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Show onboarding on launch"
              value={!hasCompletedOnboarding}
              trackColor={{ false: colors.description, true: colors.primary }}
              thumbColor={colors.whitePrimary}
              ios_backgroundColor={colors.description}
              onValueChange={(enabled) => setOnboardingCompleted(!enabled)}
            />
          </View>
          <Button
            title="Open onboarding"
            variant="secondary"
            onPress={() => {
              setOnboardingCompleted(false);
              router.replace("/(onboarding)/screen-1");
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
