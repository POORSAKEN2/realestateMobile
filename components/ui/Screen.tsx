import { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

export type ScreenBottomInset = "none" | "safe-area" | "tab-bar";
export type ScreenTopInset = "none" | "safe-area";

type ScreenProps = PropsWithChildren<{
  className?: string;
  bottomInset?: ScreenBottomInset;
  topInset?: ScreenTopInset;
}>;

const SCREEN_EDGES: Edge[] = ["top", "right", "bottom", "left"];
const TOP_SCREEN_EDGES: Edge[] = ["top", "right", "left"];
const SIDE_SCREEN_EDGES: Edge[] = ["right", "left"];
const SIDE_AND_BOTTOM_SCREEN_EDGES: Edge[] = ["right", "bottom", "left"];

export function Screen({
  bottomInset = "none",
  children,
  className = "",
  topInset = "safe-area",
}: ScreenProps) {
  const usesTabBarInset = bottomInset === "tab-bar";
  const usesTopInset = topInset === "safe-area";
  const edges =
    bottomInset === "safe-area"
      ? usesTopInset
        ? SCREEN_EDGES
        : SIDE_AND_BOTTOM_SCREEN_EDGES
      : usesTopInset
        ? TOP_SCREEN_EDGES
        : SIDE_SCREEN_EDGES;

  return (
    <SafeAreaView className={`flex-1 bg-surface ${className}`} edges={edges}>
      <View className={`flex-1 px-6 pt-6 ${usesTabBarInset ? "" : "pb-6"}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
