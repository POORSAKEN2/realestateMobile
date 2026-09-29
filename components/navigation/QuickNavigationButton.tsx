import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, TouchableOpacity } from "react-native";

import BrandLogomarkWhite from "../../assets/branding/svg/brand-logomark-white.svg";
import { tabBarLayout } from "../../constants/tabBar";
import { useThemeColors } from "../../context/WorkspacePresentationContext";

export function QuickNavigationButton({
  open,
  disabled,
  reducedMotion,
  onPress,
  top,
  left,
}: {
  open: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onPress: () => void;
  top: number;
  left: number;
}) {
  const palette = useThemeColors();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.stopAnimation();
    if (reducedMotion) {
      progress.setValue(open ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 280 : 220,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [open, progress, reducedMotion]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={
        open ? "Close quick navigation" : "Open quick navigation"
      }
      accessibilityHint={
        disabled ? "No permitted shortcuts available" : undefined
      }
      accessibilityState={{ disabled, expanded: open }}
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      className="absolute items-center justify-center rounded-full bg-primary shadow-lg"
      style={{
        top,
        left,
        width: tabBarLayout.addButtonSize,
        height: tabBarLayout.addButtonSize,
        zIndex: 3,
        shadowColor: palette.primary,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Animated.View
        pointerEvents="none"
        accessible={false}
        style={{
          position: "absolute",
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.6],
              }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "90deg"],
              }),
            },
          ],
        }}
      >
        <BrandLogomarkWhite width={40} height={40} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        accessible={false}
        style={{
          position: "absolute",
          opacity: progress,
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["-90deg", "0deg"],
              }),
            },
          ],
        }}
      >
        <Ionicons name="close" size={32} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
}
