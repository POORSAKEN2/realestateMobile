import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, type ReactElement } from "react";
import { View, type ScrollViewProps } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "../../constants/colors";
import {
  MAX_PULL_DISTANCE,
  PULL_THRESHOLD,
  usePullToRefresh,
  type PullToRefreshOptions,
} from "../../hooks/ui/usePullToRefresh";

const INDICATOR_SIZE = 48;
const INDICATOR_TOP = 56;
const SCROLL_DEFAULTS = {
  alwaysBounceVertical: false,
  bounces: false,
  overScrollMode: "never",
  scrollEventThrottle: 16,
  className: "z-0 flex-1",
} as const;

export type PullToRefreshProps = PullToRefreshOptions;

type ScrollBindings = typeof SCROLL_DEFAULTS & {
  onScroll: ReturnType<typeof usePullToRefresh>["onScroll"];
} & Pick<ScrollViewProps, "accessibilityActions" | "onAccessibilityAction">;

type PullToRefreshSurfaceProps = PullToRefreshProps &
  Pick<
    ScrollViewProps,
    | "className"
    | "style"
    | "scrollEnabled"
    | "accessibilityActions"
    | "onAccessibilityAction"
  > & {
    children: (props: ScrollBindings) => ReactElement;
  };

/** Overlays a bounded indicator without clipping or shifting the scroll content. */
export function PullToRefreshSurface({
  children,
  className,
  style,
  accessibilityActions,
  onAccessibilityAction,
  ...options
}: PullToRefreshSurfaceProps) {
  const {
    nativeGesture,
    pullGesture,
    onScroll,
    pullDistance,
    refresh,
    refreshing,
  } = usePullToRefresh(options);
  const reduceMotion = useReducedMotion();
  const spin = useSharedValue(0);

  useEffect(() => {
    if (refreshing && !reduceMotion) {
      spin.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      spin.value = 0;
    }
    return () => cancelAnimation(spin);
  }, [refreshing, reduceMotion, spin]);

  const actions = useMemo(
    () => [
      ...(accessibilityActions ?? []).filter(
        (action) => action.name !== "refresh",
      ),
      { name: "refresh", label: "Refresh content" },
    ],
    [accessibilityActions],
  );
  const handleAccessibilityAction = useCallback<
    NonNullable<ScrollViewProps["onAccessibilityAction"]>
  >(
    (event) => {
      if (event.nativeEvent.actionName === "refresh") void refresh();
      else onAccessibilityAction?.(event);
    },
    [onAccessibilityAction, refresh],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const distance = Math.min(
      MAX_PULL_DISTANCE,
      Math.max(0, pullDistance.value),
    );
    const progress = Math.min(1, distance / PULL_THRESHOLD);
    return {
      opacity: progress,
      transform: [
        {
          translateY:
            -INDICATOR_SIZE +
            progress * (INDICATOR_SIZE + INDICATOR_TOP) +
            Math.max(0, distance - PULL_THRESHOLD),
        },
        { scale: 0.55 + progress * 0.45 },
      ],
    };
  });
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${Math.min(1, pullDistance.value / PULL_THRESHOLD) * 180 + spin.value}deg`,
      },
    ],
  }));

  return (
    <GestureDetector gesture={pullGesture}>
      <View className={`relative flex-1 ${className ?? ""}`} style={style}>
        <GestureDetector gesture={nativeGesture}>
          {children({
            ...SCROLL_DEFAULTS,
            onScroll,
            accessibilityActions: actions,
            onAccessibilityAction: handleAccessibilityAction,
          })}
        </GestureDetector>
        <View
          className="elevation-[100] absolute inset-0 z-[100] items-center overflow-hidden"
          pointerEvents="none"
        >
          <Animated.View
            accessible={refreshing}
            accessibilityElementsHidden={!refreshing}
            accessibilityLabel="Refreshing content"
            accessibilityRole="progressbar"
            accessibilityState={{ busy: refreshing }}
            className="h-[48px] w-[48px] items-center justify-center rounded-full bg-whitePrimary"
            importantForAccessibility={
              refreshing ? "yes" : "no-hide-descendants"
            }
            style={indicatorStyle}
          >
            <Animated.View style={iconStyle}>
              <Ionicons name="refresh" color={colors.primary} size={28} />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}
