import { FontAwesome } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 48 48" accessible={false}>
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 32.5 14l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
      <Path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 32.5 14l5.7-5.7A20 20 0 0 0 6.3 14.7Z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44Z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.5l6.2 5.2A20 20 0 0 0 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
    </Svg>
  );
}

export function SocialLoginSection() {
  return (
    <View className="mt-6">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-white/40" />
        <Text className="shrink text-center font-ralewayMedium text-sm text-onPrimary">
          or continue with
        </Text>
        <View className="h-px flex-1 bg-white/40" />
      </View>

      <View className="mt-5 flex-row justify-center gap-3">
        <Pressable
          accessibilityLabel="Continue with Google"
          accessibilityHint="Not available yet"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          className="h-14 w-14 items-center justify-center rounded-2xl bg-white"
          disabled
        >
          <View aria-hidden importantForAccessibility="no-hide-descendants">
            <GoogleIcon />
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel="Continue with Apple"
          accessibilityHint="Not available yet"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          className="h-14 w-14 items-center justify-center rounded-2xl bg-white"
          disabled
        >
          <View aria-hidden importantForAccessibility="no-hide-descendants">
            <FontAwesome name="apple" size={26} color="#000000" />
          </View>
        </Pressable>
      </View>

      <Text className="mt-3 text-center font-ralewayMedium text-xs text-onPrimary">
        Not available yet
      </Text>
    </View>
  );
}
