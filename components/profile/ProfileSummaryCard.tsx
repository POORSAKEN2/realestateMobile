import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import type { ProfileCompletion } from "../../types";
import { colors } from "../../constants/colors";
import { getInitials } from "../../utils/profile/profileForm";
import type { ProfileAccountPresentation } from "../../utils/profile/profileAccountPresentation";

type ProfileSummaryCardProps = {
  completion: ProfileCompletion;
  account: ProfileAccountPresentation;
  imageUri: string;
  jobTitle: string;
  name: string;
  onChangePhoto: () => void;
  disabled?: boolean;
};

export function ProfileSummaryCard({
  completion,
  account,
  imageUri,
  jobTitle,
  name,
  onChangePhoto,
  disabled = false,
}: ProfileSummaryCardProps) {
  return (
    <View className="mt-4 gap-3 rounded-[24px] border border-textPrimary/10 bg-panel p-4 shadow-sm shadow-textPrimary/5">
      <View className="flex-row items-start gap-4">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          accessibilityHint="Opens your photo library"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onChangePhoto}
          className="shrink-0"
        >
          <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="font-ralewayExtraBold text-xl text-primaryContent">
                {getInitials(name)}
              </Text>
            )}
          </View>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-panel"
            style={{ backgroundColor: colors.primaryStrong }}
          >
            <Ionicons name="camera" color={colors.whitePrimary} size={13} />
          </View>
        </TouchableOpacity>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-ralewayBold text-xl leading-7 text-textPrimary">
            {name.trim() || "Your name"}
          </Text>
          {account.provider === "apple" ? (
            <>
              <Text className="font-ralewayMedium text-sm leading-5 text-description">
                Apple account
              </Text>
              {account.summaryEmail ? (
                <Text
                  selectable
                  className="font-ralewayMedium text-sm leading-5 text-description"
                >
                  {account.summaryEmail}
                </Text>
              ) : null}
            </>
          ) : (
            <Text
              selectable
              className="font-ralewayMedium text-sm leading-5 text-description"
            >
              {account.summaryEmail ||
                jobTitle.trim() ||
                "Real estate professional"}
            </Text>
          )}
        </View>
      </View>

      <View className="gap-2 border-t border-textPrimary/10 pt-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="min-w-0 flex-1 font-ralewaySemiBold text-sm leading-5 text-description">
            Profile completeness
          </Text>
          <Text className="shrink-0 font-ralewayBold text-sm leading-5 text-primaryContent">
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
