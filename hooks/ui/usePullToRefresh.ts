import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const PULL_THRESHOLD = 72;
export const MAX_PULL_DISTANCE = 112;
const PULL_RESISTANCE = 0.5;
const DIRECTION_SLOP = 8;
const SETTLE_DURATION = 180;

export type PullToRefreshOptions = {
  onRefresh: () => Promise<unknown>;
};

/** Owns gesture arbitration and one refresh request; scrolling stays on the UI thread. */
export function usePullToRefresh({
  onRefresh,
  scrollEnabled = true,
}: PullToRefreshOptions & { scrollEnabled?: boolean }) {
  // Keep gesture callbacks stable when a parent recreates its refresh function.
  const refreshCallback = useRef(onRefresh);
  useLayoutEffect(() => {
    refreshCallback.current = onRefresh;
  }, [onRefresh]);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const scrollOffset = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const refreshLocked = useSharedValue(false);
  const pulling = useSharedValue(false);
  const touchStart = useSharedValue({ x: 0, y: 0 });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelAnimation(pullDistance);
    };
  }, [pullDistance]);

  const refresh = useCallback(async () => {
    if (!scrollEnabled || inFlight.current || !mounted.current) return;

    inFlight.current = true;
    refreshLocked.value = true;
    pullDistance.value = withTiming(PULL_THRESHOLD, {
      duration: SETTLE_DURATION,
    });
    setRefreshing(true);
    AccessibilityInfo.announceForAccessibility("Refreshing content");

    try {
      await refreshCallback.current();
    } catch (error) {
      // Query callers render their error state; always release the gesture too.
      console.warn("Unable to refresh content", error);
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setRefreshing(false);
        pullDistance.value = withTiming(
          0,
          { duration: SETTLE_DURATION },
          (finished) => {
            if (finished) refreshLocked.value = false;
          },
        );
      }
    }
  }, [pullDistance, refreshLocked, scrollEnabled]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = Math.max(0, event.contentOffset.y);
    },
  });

  const nativeGesture = useMemo(() => Gesture.Native(), []);
  const pullGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(scrollEnabled)
        .manualActivation(true)
        .maxPointers(1)
        // Let ordinary scrolling win as soon as direction/top checks fail.
        .blocksExternalGesture(nativeGesture)
        .onTouchesDown((event, manager) => {
          if (
            refreshLocked.value ||
            scrollOffset.value > 1 ||
            event.numberOfTouches !== 1
          ) {
            manager.fail();
            return;
          }
          const touch = event.allTouches[0];
          touchStart.value = { x: touch.absoluteX, y: touch.absoluteY };
          pulling.value = false;
        })
        .onTouchesMove((event, manager) => {
          if (pulling.value) return;
          if (
            refreshLocked.value ||
            scrollOffset.value > 1 ||
            event.numberOfTouches !== 1
          ) {
            manager.fail();
            return;
          }

          const touch = event.allTouches[0];
          const dx = Math.abs(touch.absoluteX - touchStart.value.x);
          const dy = touch.absoluteY - touchStart.value.y;
          if (
            dy < -DIRECTION_SLOP ||
            (dx > DIRECTION_SLOP && dx > Math.abs(dy))
          ) {
            manager.fail();
          } else if (dy > DIRECTION_SLOP) {
            manager.activate();
          }
        })
        .onStart(() => {
          pulling.value = true;
          cancelAnimation(pullDistance);
        })
        .onUpdate((event) => {
          pullDistance.value = Math.min(
            MAX_PULL_DISTANCE,
            Math.max(0, event.translationY * PULL_RESISTANCE),
          );
        })
        .onEnd((_event, success) => {
          if (
            success &&
            pullDistance.value >= PULL_THRESHOLD &&
            !refreshLocked.value
          ) {
            refreshLocked.value = true;
            runOnJS(refresh)();
          }
        })
        .onFinalize(() => {
          pulling.value = false;
          if (!refreshLocked.value) {
            pullDistance.value = withTiming(0, { duration: SETTLE_DURATION });
          }
        }),
    [
      nativeGesture,
      pullDistance,
      pulling,
      refresh,
      refreshLocked,
      scrollEnabled,
      scrollOffset,
      touchStart,
    ],
  );

  return {
    nativeGesture,
    pullGesture,
    onScroll,
    pullDistance,
    refresh,
    refreshing,
  };
}
