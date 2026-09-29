import type { ReactNode } from "react";
import { useEffect } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import type { QuickNavigationItem } from "../../constants/quickNavigation";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { NavigationTile } from "./NavigationTile";

export function QuickNavigationSheet({
  visible,
  reducedMotion,
  items,
  footer,
  onClose,
  onDismiss,
  onNavigate,
}: {
  visible: boolean;
  reducedMotion: boolean;
  items: readonly QuickNavigationItem[];
  footer: ReactNode;
  onClose: () => void;
  onDismiss: () => void;
  onNavigate: (item: QuickNavigationItem) => void;
}) {
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      onDismiss={onDismiss}
      backdropAccessibilityLabel="Close quick navigation"
      bottomInsetMode="safe-area"
      footer={footer}
      reducedMotion={reducedMotion}
    >
      <View className="px-5 pb-4 pt-3">
        <Text
          accessibilityRole="header"
          className="text-center font-ralewayExtraBold text-2xl text-textPrimary"
        >
          Quick navigation
        </Text>
        <Text className="mt-1 text-center font-ralewayMedium text-sm text-description">
          Your workspace, one tap away.
        </Text>
      </View>
      <ScrollView
        style={{ flexShrink: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <View className="flex-row flex-wrap">
          {items.map((item) => (
            <View key={String(item.href)} className="w-1/3 px-2 pb-4">
              <NavigationTile item={item} onNavigate={() => onNavigate(item)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}
