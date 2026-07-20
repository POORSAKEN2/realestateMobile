import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

import type { ProfileCompletion } from "../../types";
import { getInitials } from "../../utils/profile/profileForm";

type ProfileSummaryCardProps = {
  completion: ProfileCompletion;
  email?: string;
  imageUri: string;
  jobTitle: string;
  name: string;
  onChangePhoto: () => void;
};

export function ProfileSummaryCard({
  completion,
  email,
  imageUri,
  jobTitle,
  name,
  onChangePhoto,
}: ProfileSummaryCardProps) {
  return (
    <View className="mt-7 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <View className="items-center">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          accessibilityHint="Opens your photo library"
          activeOpacity={0.82}
          onPress={onChangePhoto}
          className="relative"
        >
          <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-50">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="font-soraBold text-3xl text-blue-700">
                {getInitials(name)}
              </Text>
            )}
          </View>
          <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-blue-600">
            <Ionicons name="camera" color="#FFFFFF" size={16} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={onChangePhoto}
          className="mt-3 min-h-11 justify-center px-3"
        >
          <Text className="font-soraSemiBold text-sm text-blue-600">
            {imageUri ? "Change photo" : "Add profile photo"}
          </Text>
        </TouchableOpacity>

        <Text
          className="mt-1 font-soraSemiBold text-xl text-slate-950"
          numberOfLines={1}
        >
          {name.trim() || "Your name"}
        </Text>
        <Text className="mt-1 text-sm text-slate-500" numberOfLines={1}>
          {email || jobTitle.trim() || "Real estate professional"}
        </Text>
      </View>

      <View className="mt-5 rounded-2xl bg-slate-50 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-soraSemiBold text-sm text-slate-700">
            Profile completion
          </Text>
          <Text className="font-soraSemiBold text-sm text-blue-600">
            {completion.percent}%
          </Text>
        </View>
        <View className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <View
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${completion.percent}%` }}
          />
        </View>
        <Text className="mt-3 text-xs leading-5 text-slate-500">
          {completion.nextMissingItem
            ? `Add your ${completion.nextMissingItem} to help complete your profile.`
            : "All key profile details are complete."}
        </Text>
      </View>
    </View>
  );
}
