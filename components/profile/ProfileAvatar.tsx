import { Image, Text, View } from "react-native";

import { getInitials } from "../../utils/profile/profileForm";

type ProfileAvatarProps = {
  imageUri?: string;
  name: string;
  size?: "compact" | "large";
  tone?: "mint" | "lavender";
};

export function ProfileAvatar({
  imageUri,
  name,
  size = "compact",
  tone = "lavender",
}: ProfileAvatarProps) {
  const sizeClassName = size === "large" ? "h-16 w-16" : "h-12 w-12";
  const textClassName = size === "large" ? "text-xl" : "text-base";
  const toneClassName = tone === "mint" ? "bg-accent/70" : "bg-primary/15";

  return (
    <View
      className={`${sizeClassName} ${toneClassName} items-center justify-center overflow-hidden rounded-full border border-primary/20`}
    >
      {imageUri ? (
        <Image
          accessibilityLabel={`${name} profile photo`}
          className="h-full w-full"
          resizeMode="cover"
          source={{ uri: imageUri }}
        />
      ) : (
        <Text
          className={`${textClassName} font-ralewayExtraBold text-textPrimary`}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
