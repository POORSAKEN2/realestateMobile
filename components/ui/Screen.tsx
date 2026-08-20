import { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

export type ScreenBottomInset = "safe-area" | "tab-bar";

type ScreenProps = PropsWithChildren<{
  className?: string;
  bottomInset?: ScreenBottomInset;
}>;

const SCREEN_EDGES: Edge[] = ["top", "right", "bottom", "left"];
const TAB_SCREEN_EDGES: Edge[] = ["top", "right", "left"];

export function Screen({
  bottomInset = "safe-area",
  children,
  className = "",
}: ScreenProps) {
  const usesTabBarInset = bottomInset === "tab-bar";

  return (
    <SafeAreaView
      className={`flex-1 bg-surface ${className}`}
      edges={usesTabBarInset ? TAB_SCREEN_EDGES : SCREEN_EDGES}
    >
      <View className={`flex-1 px-6 pt-6 ${usesTabBarInset ? "" : "pb-6"}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
