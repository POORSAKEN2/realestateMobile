import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

const DEFAULT_ACTION_WIDTH = 72;

export function SwipeActionCard({
  actionAccessibilityLabel,
  actionIcon,
  actionLabel,
  actionWidth = DEFAULT_ACTION_WIDTH,
  children,
  disabled = false,
  onAction,
}: {
  actionAccessibilityLabel: string;
  actionIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  actionLabel: string;
  actionWidth?: number;
  children: React.ReactNode;
  disabled?: boolean;
  onAction: () => void;
}) {
  const swipeableRef = useRef<Swipeable | null>(null);

  useEffect(() => {
    if (disabled) swipeableRef.current?.close();
  }, [disabled]);

  function handleAction() {
    swipeableRef.current?.close();
    onAction();
  }

  return (
    <Swipeable
      dragOffsetFromRightEdge={8}
      enabled={!disabled}
      friction={1}
      overshootRight={false}
      ref={swipeableRef}
      renderRightActions={() => (
        <View className="bg-primary" style={{ width: actionWidth }}>
          <TouchableOpacity
            accessibilityLabel={actionAccessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            activeOpacity={0.85}
            className="flex-1 items-center justify-center px-3"
            disabled={disabled}
            onPress={handleAction}
          >
            <MaterialCommunityIcons
              name={actionIcon}
              color="#FFFFFF"
              size={21}
            />
            <Text className="mt-1.5 text-center font-ralewayBold text-xs text-white">
              {actionLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      rightThreshold={actionWidth / 2}
      containerStyle={{
        backgroundColor: "#634CE4",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {children}
    </Swipeable>
  );
}
