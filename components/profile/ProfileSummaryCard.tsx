import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { ProfileCompletion } from "../../types";
import { colors } from "../../constants/colors";
import { getInitials } from "../../utils/profile/profileForm";

type ProfileSummaryCardProps = {
  completion: ProfileCompletion;
  email?: string;
  imageUri: string;
  jobTitle: string;
  name: string;
  onChangePhoto: () => void;
  disabled?: boolean;
};

export function ProfileSummaryCard({
  completion,
  email,
  imageUri,
  jobTitle,
  name,
  onChangePhoto,
  disabled = false,
}: ProfileSummaryCardProps) {
  return (
    <View className="mt-4 gap-4 rounded-3xl border border-primary/20 bg-panel p-4">
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          accessibilityHint="Opens your photo library"
          disabled={disabled}
          onPress={onChangePhoto}
        >
          <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="font-ralewayExtraBold text-xl text-primary">
                {getInitials(name)}
              </Text>
            )}
          </View>
          <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-panel bg-primary">
            <Ionicons name="camera" color={colors.whitePrimary} size={13} />
          </View>
        </TouchableOpacity>
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="font-ralewayBold text-base text-textPrimary"
            numberOfLines={2}
          >
            {name.trim() || "Your name"}
          </Text>
          <Text selectable className="text-xs text-description">
            {email || jobTitle.trim() || "Real estate professional"}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={disabled}
            onPress={onChangePhoto}
            className="min-h-11 justify-center"
          >
            <Text className="font-ralewaySemiBold text-sm text-primary">
              {imageUri ? "Change photo" : "Add profile photo"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="gap-2 border-t border-primary/10 pt-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="min-w-0 flex-1 font-ralewaySemiBold text-xs text-description">
            Profile completeness
          </Text>
          <Text className="font-ralewayBold text-xs text-primary">
            {completion.percent}%
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Profile completeness"
          accessibilityValue={{ min: 0, max: 100, now: completion.percent }}
          className="h-1.5 overflow-hidden rounded-full bg-primary/10"
        >
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${completion.percent}%` }}
          />
        </View>
        <Text className="text-xs leading-5 text-description">
          {completion.nextMissingItem
            ? `Add your ${completion.nextMissingItem} to complete your profile.`
            : "All key profile details are complete."}
        </Text>
      </View>
    </View>
  );
}
