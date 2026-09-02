import { Feather, Ionicons } from "@expo/vector-icons";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "../../constants/colors";
import {
  capitalizeWords,
  getInitials,
} from "../../utils/dashboard/dashboardHelpers";

type DashboardHeroProps = {
  email?: string;
  name: string;
  onNotificationsPress: () => void;
  onSearchPress: () => void;
  profileImageUri?: string;
  subtitle: string;
};

export function DashboardHero({
  email,
  name,
  onNotificationsPress,
  onSearchPress,
  profileImageUri,
  subtitle,
}: DashboardHeroProps) {
  const { height } = useWindowDimensions();
  const heroHeight = Math.min(Math.max(height * 0.24, 192), 224);

  return (
    <ImageBackground
      source={require("../../assets/images/dashboard.webp")}
      resizeMode="cover"
      className="-mx-6 -mt-6 overflow-hidden px-6 pt-6"
      style={{ height: heroHeight }}
    >
      <View className="absolute inset-0 bg-textPrimary/60" />

      <View className="flex-row items-center justify-between pt-4">
        <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
          <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/50 bg-white/30">
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="font-ralewayBold text-base text-white">
                {getInitials(name, email)}
              </Text>
            )}
          </View>

          <View className="min-w-0 flex-1">
            <Text
              className="font-ralewayBold text-base text-white"
              numberOfLines={1}
            >
              {capitalizeWords(name)}
            </Text>
            <Text className="text-sm text-white/80" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            accessibilityLabel="Open global search"
            accessibilityRole="button"
            activeOpacity={0.82}
            className="h-11 w-11 items-center justify-center rounded-2xl border-white/60 bg-white/90 shadow-lg shadow-textPrimary/20"
            hitSlop={10}
            onPress={onSearchPress}
          >
            <Feather name="search" color={colors.primary} size={20} />
          </TouchableOpacity>

          {/* <TouchableOpacity
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            activeOpacity={0.82}
            className="relative h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-primary shadow-lg shadow-textPrimary/20"
            hitSlop={10}
            onPress={onNotificationsPress}
          >
            <Ionicons
              name="notifications-outline"
              color={colors.whitePrimary}
              size={21}
            />
            <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-danger" />
          </TouchableOpacity> */}
        </View>
      </View>
    </ImageBackground>
  );
}
