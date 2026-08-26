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

import { colors } from "../../constants/colors";
import { MODAL_OVERLAY_CLASS_NAME } from "../../constants/modal";
import { appRoutes } from "../../constants/navigation";

type MenuIcon =
  | { family: "Ionicons"; name: keyof typeof Ionicons.glyphMap }
  | {
      family: "MaterialCommunityIcons";
      name: keyof typeof MaterialCommunityIcons.glyphMap;
    };

type MenuItem = {
  label: string;
  supportingText: string;
  href?: Href;
  badge?: string;
  icon: MenuIcon;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type MoreBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const menuSections: MenuSection[] = [
  {
    title: "Operations",
    items: [
      {
        label: "Inquiries",
        supportingText: "Review listing leads and engagement",
        badge: "Planned",
        icon: { family: "Ionicons", name: "chatbubbles-outline" },
      },
      {
        label: "Leases",
        supportingText: "Manage agreements and lease terms",
        href: appRoutes.secondary.leases,
        icon: { family: "Ionicons", name: "document-text-outline" },
      },
      {
        label: "Expenses",
        supportingText: "Track portfolio operating costs",
        href: appRoutes.primary.expenses,
        icon: { family: "Ionicons", name: "receipt-outline" },
      },
      {
        label: "Documents",
        supportingText: "Store property and tenant files",
        href: appRoutes.secondary.documents,
        icon: {
          family: "MaterialCommunityIcons",
          name: "file-document-outline",
        },
      },
      {
        label: "Bookings",
        supportingText: "Manage transient property stays",
        href: appRoutes.primary.bookings,
        icon: { family: "Ionicons", name: "calendar-outline" },
      },
    ],
  },
  {
    title: "Portfolio",
    items: [
      {
        label: "Public Listing",
        supportingText: "Manage published properties and units",
        badge: "Planned",
        icon: { family: "Ionicons", name: "globe-outline" },
      },
      {
        label: "Analytics & Reports",
        supportingText: "View performance and portfolio insights",
        href: appRoutes.secondary.analytics,
        icon: { family: "Ionicons", name: "analytics-outline" },
      },
      {
        label: "AI Assistant",
        supportingText: "Ask questions and create reports",
        icon: { family: "MaterialCommunityIcons", name: "robot-outline" },
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Team & Access",
        supportingText: "Manage managers and property access",
        badge: "Owner",
        icon: { family: "Ionicons", name: "people-circle-outline" },
      },
      {
        label: "Plan & Billing",
        supportingText: "View subscription and property limits",
        badge: "Owner",
        icon: { family: "Ionicons", name: "card-outline" },
      },
      {
        label: "Notifications & Reminders",
        supportingText: "Review alerts and rent reminders",
        href: appRoutes.secondary.notifications,
        icon: { family: "Ionicons", name: "notifications-outline" },
      },
      {
        label: "Support",
        supportingText: "Get product and account help",
        badge: "Planned",
        icon: { family: "Ionicons", name: "help-buoy-outline" },
      },
      {
        label: "Profile",
        supportingText: "Update your personal information",
        href: appRoutes.secondary.profile,
        icon: { family: "Ionicons", name: "person-outline" },
      },
      {
        label: "Settings & Security",
        supportingText: "Manage password and app preferences",
        href: appRoutes.secondary.settings,
        icon: { family: "Ionicons", name: "settings-outline" },
      },
    ],
  },
];

function MenuItemIcon({ icon }: { icon: MenuIcon }) {
  if (icon.family === "Ionicons") {
    return <Ionicons name={icon.name} size={21} color={colors.primary} />;
  }

  return (
    <MaterialCommunityIcons name={icon.name} size={22} color={colors.primary} />
  );
}

function MenuItemCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`}
      activeOpacity={0.78}
      onPress={onPress}
      className="min-h-[78px] flex-row items-center rounded-[22px] border border-textPrimary/10 bg-white px-4 py-3"
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
        <MenuItemIcon icon={item.icon} />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="shrink font-ralewayBold text-[15px] text-textPrimary"
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {item.badge ? (
            <Text className="rounded-full bg-accent px-2 py-0.5 font-ralewayExtraBold text-[9px] uppercase tracking-wide text-textPrimary">
              {item.badge}
            </Text>
          ) : null}
        </View>
        <Text
          className="mt-0.5 font-ralewayMedium text-xs text-description"
          numberOfLines={1}
        >
          {item.supportingText}
        </Text>
      </View>

      <Ionicons name="chevron-forward" color="#6F6D6D" size={18} />
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
        duration: 180,
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

  function handleItemPress(href: Href) {
    onClose();
    setTimeout(() => {
      router.push(href);
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
          className={`absolute inset-0 ${MODAL_OVERLAY_CLASS_NAME}`}
          style={{ opacity: backdropOpacity }}
        >
          <Pressable className="absolute inset-0" onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="rounded-t-[30px] bg-white px-5 pt-2.5 shadow-2xl shadow-textPrimary/20"
          style={{
            height: Math.min(height - Math.max(insets.top, 20) - 12, 760),
            opacity: sheetOpacity,
            paddingBottom: Math.max(insets.bottom, 18),
            transform: [{ translateY }],
          }}
        >
          <View className="mb-[18px] h-[5px] w-11 self-center rounded-full bg-description/20" />

          <View className="mb-[18px] flex-row items-center justify-between">
            <View>
              <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-[0.8px] text-description">
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
              className="h-10 w-10 items-center justify-center rounded-[18px] border border-textPrimary/10 bg-surface"
            >
              <Ionicons name="close" color="#6F6D6D" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="-mx-1 flex-1 px-1"
            contentContainerClassName="gap-6 pb-2"
            showsVerticalScrollIndicator={false}
          >
            {menuSections.map((section) => (
              <View key={section.title} className="gap-3">
                <Text className="px-1 font-ralewayExtraBold text-[11px] uppercase tracking-[1.6px] text-description">
                  {section.title}
                </Text>
                {section.items.map((item) => (
                  <MenuItemCard
                    key={item.label}
                    item={item}
                    onPress={
                      item.href ? () => handleItemPress(item.href!) : undefined
                    }
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
