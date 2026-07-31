import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type ExpenseDashboardVisual = "spend" | "maintenance" | "utilities";

export type ExpenseDashboardCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  visual: ExpenseDashboardVisual;
};

const cardShadow = {
  shadowColor: "#4C3DBA",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.17,
  shadowRadius: 14,
  elevation: 5,
};

function DashboardChart({ type }: { type: ExpenseDashboardVisual }) {
  if (type === "maintenance") {
    return (
      <View className="mt-auto h-[5px] overflow-hidden rounded-full bg-[#E5E2EA]">
        <View className="h-full w-[56%] rounded-full bg-[#6547D9]" />
      </View>
    );
  }

  if (type === "utilities") {
    return (
      <View className="mt-auto h-[48px]">
        <Svg width="100%" height="48" viewBox="0 0 112 48">
          <Rect x="2" y="29" width="16" height="17" rx="1" fill="#D9EEE8" />
          <Rect x="20" y="24" width="16" height="22" rx="1" fill="#D9EEE8" />
          <Rect x="38" y="28" width="16" height="18" rx="1" fill="#E7E2FA" />
          <Rect x="56" y="18" width="16" height="28" rx="1" fill="#E7E2FA" />
          <Rect x="74" y="10" width="16" height="36" rx="1" fill="#CFC6F3" />
          <Rect x="92" y="7" width="18" height="39" rx="1" fill="#8D77E8" />
          <Path
            d="M4 25 L22 23 L40 17 L58 23 L76 13 L96 8 L108 9"
            fill="none"
            stroke="#54A98D"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <Circle cx="40" cy="17" r="3" fill="#168A68" stroke="#FFFFFF" />
          <Circle cx="76" cy="13" r="3" fill="#168A68" stroke="#FFFFFF" />
        </Svg>
      </View>
    );
  }

  return (
    <View className="mt-auto h-[48px]">
      <Svg width="100%" height="48" viewBox="0 0 112 48">
        <Path
          d="M2 39 C9 37 11 24 18 24 C24 24 26 32 32 32 C40 32 42 20 49 20 C56 20 58 26 64 25 C71 23 72 7 79 7 C86 7 87 23 94 23 C101 23 105 16 110 10"
          fill="none"
          stroke="#7D65D9"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M2 45 H110"
          fill="none"
          stroke="#ECE9F5"
          strokeLinecap="round"
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
}

export function ExpenseDashboardCard({
  icon,
  label,
  value,
  visual,
}: ExpenseDashboardCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}`}
      className="h-[164px] w-[128px] rounded-[20px] border border-[#ECE9F5] bg-white p-3.5"
      style={cardShadow}
    >
      <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-[#F1EEFF]">
        <MaterialCommunityIcons name={icon} color="#6249CF" size={21} />
      </View>
      <Text className="mt-3 font-ralewayMedium text-[12px] text-[#18181B]">
        {label}
      </Text>
      <Text
        className="mt-0.5 font-ralewayExtraBold text-[20px] tracking-tight text-[#111113]"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <DashboardChart type={visual} />
    </Pressable>
  );
}
