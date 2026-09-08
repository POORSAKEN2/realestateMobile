import type { Ref } from "react";
import type { FlatList, FlatListProps } from "react-native";
import Animated from "react-native-reanimated";

import { useScreenScrollContentStyle } from "../../context/ScreenScrollInsetContext";
import {
  PullToRefreshSurface,
  type PullToRefreshProps,
} from "./PullToRefreshSurface";

type PullToRefreshFlatListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  | "onRefresh"
  | "refreshing"
  | "refreshControl"
  | "onScroll"
  | "horizontal"
  | "CellRendererComponent"
> &
  PullToRefreshProps & { ref?: Ref<FlatList<ItemT>> };

export function PullToRefreshFlatList<ItemT>({
  onRefresh,
  className,
  style,
  contentContainerStyle,
  accessibilityActions,
  onAccessibilityAction,
  scrollEnabled = true,
  ref,
  ...listProps
}: PullToRefreshFlatListProps<ItemT>) {
  const contentStyle = useScreenScrollContentStyle(contentContainerStyle);

  return (
    <PullToRefreshSurface
      accessibilityActions={accessibilityActions}
      className={className}
      onAccessibilityAction={onAccessibilityAction}
      onRefresh={onRefresh}
      scrollEnabled={scrollEnabled}
      style={style}
    >
      {(scrollProps) => (
        <Animated.FlatList
          {...listProps}
          {...scrollProps}
          contentContainerStyle={contentStyle}
          ref={ref}
          scrollEnabled={scrollEnabled}
        />
      )}
    </PullToRefreshSurface>
  );
}
