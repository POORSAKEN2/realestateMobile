import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { colors } from "../../constants/colors";

export type ExpenseDashboardVisual =
  | "insurance"
  | "maintenance"
  | "management"
  | "other"
  | "spend"
  | "taxes"
  | "utilities";

export type ExpenseDashboardCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  visual: ExpenseDashboardVisual;
};

const cardShadow = {
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.17,
  shadowRadius: 14,
  elevation: 5,
};

function DashboardChart({ type }: { type: ExpenseDashboardVisual }) {
  if (type === "maintenance") {
    return (
      <View className="mt-auto h-[5px] overflow-hidden rounded-full bg-accent">
        <View className="h-full w-[56%] rounded-full bg-primary" />
      </View>
    );
  }

  if (type === "utilities") {
    return (
      <View className="mt-auto h-[48px]">
        <Svg width="100%" height="48" viewBox="0 0 112 48">
          <Rect x="2" y="29" width="16" height="17" rx="1" fill="#BEE3DB" />
          <Rect x="20" y="24" width="16" height="22" rx="1" fill="#BEE3DB" />
          <Rect x="38" y="28" width="16" height="18" rx="1" fill="#BEE3DB" />
          <Rect x="56" y="18" width="16" height="28" rx="1" fill="#BEE3DB" />
          <Rect x="74" y="10" width="16" height="36" rx="1" fill="#8A77F4" />
          <Rect
            x="92"
            y="7"
            width="18"
            height="39"
            rx="1"
            fill={colors.primary}
          />
          <Path
            d="M4 25 L22 23 L40 17 L58 23 L76 13 L96 8 L108 9"
            fill="none"
            stroke="#0F6B55"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <Circle cx="40" cy="17" r="3" fill="#0F6B55" stroke="#FFFFFF" />
          <Circle cx="76" cy="13" r="3" fill="#0F6B55" stroke="#FFFFFF" />
        </Svg>
      </View>
    );
  }

  if (type === "insurance") {
    return (
      <View className="mt-auto h-[48px]">
        <Svg width="100%" height="48" viewBox="0 0 112 48">
          <Circle
            cx="24"
            cy="24"
            r="15"
            fill="none"
            stroke="#BEE3DB"
            strokeWidth="7"
          />
          <Circle
            cx="24"
            cy="24"
            r="15"
            fill="none"
            rotation="-90"
            origin="24, 24"
            stroke="#0F6B55"
            strokeDasharray="68 27"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <Rect x="52" y="11" width="54" height="5" rx="2.5" fill="#BEE3DB" />
          <Rect
            x="52"
            y="11"
            width="42"
            height="5"
            rx="2.5"
            fill={colors.primary}
          />
          <Rect x="52" y="23" width="54" height="5" rx="2.5" fill="#BEE3DB" />
          <Rect x="52" y="23" width="31" height="5" rx="2.5" fill="#8A77F4" />
          <Rect x="52" y="35" width="54" height="5" rx="2.5" fill="#BEE3DB" />
          <Rect x="52" y="35" width="47" height="5" rx="2.5" fill="#8A77F4" />
        </Svg>
      </View>
    );
  }

  if (type === "taxes") {
    return (
      <View className="mt-auto h-[48px]">
        <Svg width="100%" height="48" viewBox="0 0 112 48">
          <Path d="M3 44 H109" stroke="#BEE3DB" strokeWidth="1" />
          <Rect x="8" y="28" width="18" height="16" rx="3" fill="#BEE3DB" />
          <Rect x="34" y="20" width="18" height="24" rx="3" fill="#8A77F4" />
          <Rect
            x="60"
            y="11"
            width="18"
            height="33"
            rx="3"
            fill={colors.primary}
          />
          <Rect x="86" y="24" width="18" height="20" rx="3" fill="#8A77F4" />
          <Circle cx="69" cy="7" r="3" fill="#0F6B55" />
        </Svg>
      </View>
    );
  }

  if (type === "management") {
    return (
      <View className="mt-auto h-[48px]">
        <Svg width="100%" height="48" viewBox="0 0 112 48">
          <Rect x="3" y="6" width="106" height="8" rx="4" fill="#BEE3DB" />
          <Rect
            x="3"
            y="6"
            width="76"
            height="8"
            rx="4"
            fill={colors.primary}
          />
          <Rect x="3" y="20" width="106" height="8" rx="4" fill="#BEE3DB" />
          <Rect x="3" y="20" width="55" height="8" rx="4" fill="#0F6B55" />
          <Rect x="3" y="34" width="106" height="8" rx="4" fill="#BEE3DB" />
          <Rect x="3" y="34" width="89" height="8" rx="4" fill="#8A77F4" />
        </Svg>
      </View>
    );
  }

  if (type === "other") {
    return (
      <View className="mt-auto h-[48px]">
        <Svg width="100%" height="48" viewBox="0 0 112 48">
          <Rect x="3" y="9" width="106" height="12" rx="6" fill="#BEE3DB" />
          <Rect
            x="3"
            y="9"
            width="31"
            height="12"
            rx="6"
            fill={colors.primary}
          />
          <Rect x="36" y="9" width="24" height="12" rx="6" fill="#0F6B55" />
          <Rect x="62" y="9" width="18" height="12" rx="6" fill="#8A77F4" />
          <Circle cx="12" cy="35" r="5" fill="#BEE3DB" />
          <Circle cx="31" cy="35" r="5" fill="#8A77F4" />
          <Circle cx="50" cy="35" r="5" fill={colors.primary} />
          <Path
            d="M59 35 H107"
            stroke="#8A77F4"
            strokeDasharray="5 5"
            strokeLinecap="round"
            strokeWidth="3"
          />
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
          stroke={colors.primary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M2 45 H110"
          fill="none"
          stroke="#BEE3DB"
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
      className="h-[164px] w-[128px] rounded-[20px] border border-primary/20 bg-white p-3.5"
      style={cardShadow}
    >
      <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-primary/10">
        <MaterialCommunityIcons name={icon} color={colors.primary} size={21} />
      </View>
      <Text
        adjustsFontSizeToFit
        className="mt-3 font-ralewayMedium text-[12px] text-textPrimary"
        minimumFontScale={0.75}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className="mt-0.5 font-ralewayExtraBold text-[20px] tracking-tight text-textPrimary"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <DashboardChart type={visual} />
    </Pressable>
  );
}
