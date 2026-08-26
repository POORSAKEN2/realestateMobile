import { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

export type ScreenBottomInset = "none" | "safe-area" | "tab-bar";

type ScreenProps = PropsWithChildren<{
  className?: string;
  bottomInset?: ScreenBottomInset;
}>;

const SCREEN_EDGES: Edge[] = ["top", "right", "bottom", "left"];
const TOP_SCREEN_EDGES: Edge[] = ["top", "right", "left"];

export function Screen({
  bottomInset = "none",
  children,
  className = "",
}: ScreenProps) {
  const usesTabBarInset = bottomInset === "tab-bar";
  const edges = bottomInset === "safe-area" ? SCREEN_EDGES : TOP_SCREEN_EDGES;

  return (
    <SafeAreaView className={`flex-1 bg-surface ${className}`} edges={edges}>
      <View className={`flex-1 px-6 pt-6 ${usesTabBarInset ? "" : "pb-6"}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
