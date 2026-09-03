import { useCallback, type Ref } from "react";
import type { ScrollView, ScrollViewProps } from "react-native";
import Animated from "react-native-reanimated";

import { useScreenScrollContentStyle } from "../../context/ScreenScrollInsetContext";
import {
  PullToRefreshSurface,
  type PullToRefreshProps,
} from "./PullToRefreshSurface";

type PullToRefreshScrollViewProps = Omit<
  ScrollViewProps,
  "refreshControl" | "onScroll" | "horizontal"
> &
  PullToRefreshProps & { ref?: Ref<ScrollView> };

export function PullToRefreshScrollView({
  onRefresh,
  className,
  style,
  contentContainerStyle,
  accessibilityActions,
  onAccessibilityAction,
  scrollEnabled = true,
  ref,
  ...scrollViewProps
}: PullToRefreshScrollViewProps) {
  const contentStyle = useScreenScrollContentStyle(contentContainerStyle);
  const setScrollRef = useCallback(
    (node: ScrollView | null) => {
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

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
        <Animated.ScrollView
          {...scrollViewProps}
          {...scrollProps}
          contentContainerStyle={contentStyle}
          ref={setScrollRef}
          scrollEnabled={scrollEnabled}
        />
      )}
    </PullToRefreshSurface>
  );
}
