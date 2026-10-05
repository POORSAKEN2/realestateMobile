import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { useThemeColors } from "../../context/WorkspacePresentationContext";
import { ProfileAvatar } from "./ProfileAvatar";

type ProfileIdentityCardProps = {
  imageUri?: string;
  name: string;
  onPress: () => void;
  planLabel?: string;
  roleLabel: string;
};

export function ProfileIdentityCard({
  imageUri,
  name,
  onPress,
  planLabel,
  roleLabel,
}: ProfileIdentityCardProps) {
  const palette = useThemeColors();
  const accessibilityLabel = [name, roleLabel, planLabel]
    .filter(Boolean)
    .join(", ");

  return (
    <TouchableOpacity
      accessibilityHint="Opens account details"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.78}
      className="relative mt-6 min-h-28 flex-row items-center overflow-hidden rounded-[28px] border border-primary/20 bg-primary/10 px-5 py-5 shadow-sm shadow-primary/10"
      onPress={onPress}
    >
      <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-accent/40" />
      <View className="absolute -bottom-12 right-12 h-24 w-24 rounded-full bg-primary/10" />
      <ProfileAvatar imageUri={imageUri} name={name} size="large" tone="mint" />
      <View className="ml-4 min-w-0 flex-1">
        <Text
          className="font-ralewayExtraBold text-xl text-textPrimary"
          numberOfLines={1}
        >
          {name}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <View className="rounded-full bg-accent px-3 py-1.5">
            <Text
              className="font-ralewayExtraBold text-xs text-success"
              numberOfLines={1}
            >
              {roleLabel}
            </Text>
          </View>
          {planLabel ? (
            <View className="flex-row items-center gap-1.5 rounded-full border border-primary/25 bg-panel/80 px-3 py-1.5">
              <Ionicons
                name="star-outline"
                color={palette.primaryContent}
                size={13}
              />
              <Text
                className="font-ralewayExtraBold text-xs text-primaryContent"
                numberOfLines={1}
              >
                {planLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-panel">
        <Ionicons name="chevron-forward" color={palette.primary} size={21} />
      </View>
    </TouchableOpacity>
  );
}
