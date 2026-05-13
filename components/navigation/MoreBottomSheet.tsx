import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type MoreBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const sections: MenuSection[] = [
  {
    title: "General",
    items: [
      {
        label: "Analytics",
        href: "/(tabs)/analytics",
        icon: { family: "Ionicons", name: "analytics-outline" },
      },
    ],
  },
  {
    title: "Property Management",
    items: [
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
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Documents",
        href: "/(tabs)/documents",
        icon: {
          family: "MaterialCommunityIcons",
          name: "file-document-outline",
        },
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Settings",
        href: "/(tabs)/settings",
        icon: { family: "Ionicons", name: "settings-outline" },
      },
    ],
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
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetOpacity,
              paddingBottom: Math.max(insets.bottom, 18),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Menu</Text>
              <Text style={styles.title}>Manage Portfolio</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              activeOpacity={0.75}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" color="#475569" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.sections}>
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.itemGroup}>
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      accessibilityRole="button"
                      activeOpacity={0.78}
                      onPress={() => handleItemPress(item.href)}
                      style={styles.item}
                    >
                      <View style={styles.iconBox}>
                        <MenuIcon icon={item.icon} />
                      </View>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      <Ionicons
                        name="chevron-forward"
                        color="#CBD5E1"
                        size={19}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  sheet: {
    backgroundColor: colors.whitePrimary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    marginBottom: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.black,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 18,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sections: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  itemGroup: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 62,
    paddingHorizontal: 14,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  itemLabel: {
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
});
