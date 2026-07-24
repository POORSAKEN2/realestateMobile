import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { colors } from "../../constants/colors";

type MenuItem = {
  label: string;
  href: string;
  icon:
    | { family: "Ionicons"; name: keyof typeof Ionicons.glyphMap }
    | {
        family: "MaterialCommunityIcons";
        name: keyof typeof MaterialCommunityIcons.glyphMap;
      };
};

type MoreBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const menuItems: MenuItem[] = [
  {
    label: "Analytics",
    href: "/(tabs)/analytics",
    icon: { family: "Ionicons", name: "analytics-outline" },
  },
  {
    label: "Leases",
    href: "/(tabs)/leases",
    icon: { family: "Ionicons", name: "document-text-outline" },
  },
  {
    label: "Tenants",
    href: "/(tabs)/tenants",
    icon: { family: "Ionicons", name: "people-outline" },
  },
  {
    label: "Documents",
    href: "/(tabs)/documents",
    icon: {
      family: "MaterialCommunityIcons",
      name: "file-document-outline",
    },
  },
  {
    label: "Profile",
    href: "/(tabs)/profile",
    icon: { family: "Ionicons", name: "person-outline" },
  },
  {
    label: "Settings",
    href: "/(tabs)/settings",
    icon: { family: "Ionicons", name: "settings-outline" },
  },
];

function MenuIcon({ icon }: { icon: MenuItem["icon"] }) {
  if (icon.family === "Ionicons") {
    return <Ionicons name={icon.name} size={21} color={colors.primary} />;
  }

  return (
    <MaterialCommunityIcons name={icon.name} size={22} color={colors.primary} />
  );
}

function AnalyticsCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Open analytics"
      activeOpacity={0.82}
      onPress={onPress}
      className="overflow-hidden rounded-[22px] border border-[#DBE3EF] bg-white px-4 pt-4"
    >
      <View className="flex-row items-center">
        <View className="h-[46px] w-[46px] items-center justify-center rounded-2xl bg-blue-50">
          <MenuIcon icon={item.icon} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-ralewayExtraBold text-lg text-slate-900">
            {item.label}
          </Text>
          <Text className="mt-0.5 font-ralewayBold text-[13px] text-slate-500">
            View insights
          </Text>
        </View>
        <View className="h-[38px] w-[38px] items-center justify-center rounded-2xl bg-blue-50">
          <Ionicons name="arrow-forward" color={colors.primary} size={18} />
        </View>
      </View>

      <View className="mt-2.5 h-28">
        <Svg width="100%" height="112" viewBox="0 0 320 112">
          <Defs>
            <LinearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.2} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {[24, 56, 88].map((y) => (
            <Line
              key={y}
              x1="0"
              x2="320"
              y1={y}
              y2={y}
              stroke="#DBEAFE"
              strokeDasharray="5 6"
              strokeWidth="1"
            />
          ))}

          <Path
            d="M0 94 C18 88 24 98 39 86 C53 74 61 76 76 88 C92 101 103 83 118 87 C138 91 146 69 165 64 C181 59 188 72 204 61 C220 49 228 55 243 38 C257 23 266 43 280 29 C294 14 303 23 320 6 L320 112 L0 112 Z"
            fill="url(#analyticsArea)"
          />
          <Path
            d="M0 94 C18 88 24 98 39 86 C53 74 61 76 76 88 C92 101 103 83 118 87 C138 91 146 69 165 64 C181 59 188 72 204 61 C220 49 228 55 243 38 C257 23 266 43 280 29 C294 14 303 23 320 6"
            fill="none"
            stroke={colors.primary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <Circle
            cx="320"
            cy="6"
            r="5"
            fill={colors.whitePrimary}
            stroke={colors.primary}
            strokeWidth="3"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

function CompactBentoCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`}
      activeOpacity={0.8}
      onPress={onPress}
      className="min-h-[122px] flex-1 justify-between rounded-[22px] border border-slate-200 bg-white p-4"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
        <MenuIcon icon={item.icon} />
      </View>
      <View className="flex-row items-center">
        <Text className="flex-1 font-ralewayBold text-[15px] text-slate-900">
          {item.label}
        </Text>
        <Ionicons name="chevron-forward" color={colors.primary} size={18} />
      </View>
    </TouchableOpacity>
  );
}

function WideBentoCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`}
      activeOpacity={0.8}
      onPress={onPress}
      className="min-h-[78px] flex-row items-center rounded-[22px] border border-slate-200 bg-white px-4"
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
        <MenuIcon icon={item.icon} />
      </View>
      <Text className="flex-1 font-ralewayBold text-[15px] text-slate-900">
        {item.label}
      </Text>
      <Ionicons name="chevron-forward" color={colors.primary} size={19} />
    </TouchableOpacity>
  );
}

function UtilityBentoCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`}
      activeOpacity={0.8}
      onPress={onPress}
      className="min-h-[70px] flex-1 flex-row items-center rounded-[20px] border border-slate-200 bg-slate-50 px-3.5"
    >
      <View className="mr-2.5 h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
        <MenuIcon icon={item.icon} />
      </View>
      <Text className="flex-1 font-ralewayBold text-sm text-slate-900">
        {item.label}
      </Text>
      <Ionicons name="chevron-forward" color="#94A3B8" size={17} />
    </TouchableOpacity>
  );
}

export function MoreBottomSheet({ visible, onClose }: MoreBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const [
    analyticsItem,
    leasesItem,
    tenantsItem,
    documentsItem,
    profileItem,
    settingsItem,
  ] = menuItems;

  useEffect(() => {
    const closedPosition = height;

    if (visible) {
      setIsMounted(true);
      translateY.setValue(closedPosition);
      sheetOpacity.setValue(0.92);
    }

    const sheetAnimation = visible
      ? Animated.spring(translateY, {
          toValue: 0,
          damping: 30,
          stiffness: 260,
          mass: 0.9,
          overshootClamping: false,
          restDisplacementThreshold: 0.5,
          restSpeedThreshold: 0.5,
          useNativeDriver: true,
        })
      : Animated.timing(translateY, {
          toValue: closedPosition,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });

    const animation = Animated.parallel([
      sheetAnimation,
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 260 : 210,
        easing: visible ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: visible ? 1 : 0.96,
        duration: visible ? 180 : 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !visible) {
        setIsMounted(false);
      }
    });

    return () => animation.stop();
  }, [backdropOpacity, height, sheetOpacity, translateY, visible]);

  function handleItemPress(href: string) {
    onClose();
    setTimeout(() => {
      router.push(href as Href);
    }, 190);
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          className="absolute inset-0 bg-slate-950/40"
          style={{ opacity: backdropOpacity }}
        >
          <Pressable className="absolute inset-0" onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="rounded-t-[30px] bg-white px-5 pt-2.5 shadow-2xl shadow-slate-950/20"
          style={{
            maxHeight: height - Math.max(insets.top, 20) - 12,
            opacity: sheetOpacity,
            paddingBottom: Math.max(insets.bottom, 18),
            transform: [{ translateY }],
          }}
        >
          <View className="mb-[18px] h-[5px] w-11 self-center rounded-full bg-slate-300" />

          <View className="mb-[18px] flex-row items-center justify-between">
            <View>
              <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-[0.8px] text-slate-500">
                Menu
              </Text>
              <Text className="mt-1 font-ralewayExtraBold text-[22px] text-blackPrimary">
                Manage Portfolio
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              activeOpacity={0.75}
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50"
            >
              <Ionicons name="close" color="#475569" size={20} />
            </TouchableOpacity>
          </View>

          <View
            className="gap-[18px] pb-0.5"
            // showsVerticalScrollIndicator={false}
          >
            <AnalyticsCard
              item={analyticsItem}
              onPress={() => handleItemPress(analyticsItem.href)}
            />

            <View className="gap-3.5">
              <View className="flex-row gap-3">
                <CompactBentoCard
                  item={leasesItem}
                  onPress={() => handleItemPress(leasesItem.href)}
                />
                <CompactBentoCard
                  item={tenantsItem}
                  onPress={() => handleItemPress(tenantsItem.href)}
                />
              </View>

              <WideBentoCard
                item={documentsItem}
                onPress={() => handleItemPress(documentsItem.href)}
              />

              <View className="flex-row gap-3">
                <UtilityBentoCard
                  item={profileItem}
                  onPress={() => handleItemPress(profileItem.href)}
                />
                <UtilityBentoCard
                  item={settingsItem}
                  onPress={() => handleItemPress(settingsItem.href)}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
