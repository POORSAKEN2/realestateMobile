import { PropsWithChildren } from "react";
import { View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from "react-native-safe-area-context";

import { getTabBarContentInset } from "../../constants/tabBar";
import { ScreenScrollInsetContext } from "../../context/ScreenScrollInsetContext";

export type ScreenBottomInset = "none" | "safe-area" | "tab-bar";
export type ScreenHorizontalInset = "none" | "safe-area";
export type ScreenTopInset = "none" | "safe-area";

type ScreenProps = PropsWithChildren<{
  className?: string;
  bottomInset?: ScreenBottomInset;
  horizontalInset?: ScreenHorizontalInset;
  topInset?: ScreenTopInset;
}>;

export function Screen({
  bottomInset = "none",
  children,
  className = "",
  horizontalInset = "safe-area",
  topInset = "safe-area",
}: ScreenProps) {
  const usesTabBarInset = bottomInset === "tab-bar";
  const insets = useSafeAreaInsets();
  const edges: Edge[] = [];

  if (topInset === "safe-area") edges.push("top");
  if (horizontalInset === "safe-area") edges.push("right", "left");
  if (bottomInset === "safe-area") edges.push("bottom");

  return (
    <SafeAreaView className={`flex-1 bg-surface ${className}`} edges={edges}>
      <View
        className="flex-1 px-6 pt-6"
        style={{
          paddingBottom: usesTabBarInset ? 0 : 24,
        }}
      >
        <ScreenScrollInsetContext.Provider
          value={usesTabBarInset ? getTabBarContentInset(insets.bottom) : 0}
        >
          {children}
        </ScreenScrollInsetContext.Provider>
      </View>
    </SafeAreaView>
  );
}
