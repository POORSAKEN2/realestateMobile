import { useCallback, useState } from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";

export function getDashboardSummaryLayout(
  width: number,
  fontScale: number,
  metricCount: number,
) {
  const isWide = width >= 720;
  const padding = isWide ? 24 : 16;
  const contentWidth = Math.max(0, width - padding * 2 - 2);
  const metricsWidth = isWide
    ? Math.max(0, contentWidth - 24) * 0.6
    : contentWidth;
  const minimumMetricWidth = 96 * fontScale;
  const stackMetrics =
    metricsWidth <
    metricCount * minimumMetricWidth + Math.max(0, metricCount - 1) * 12;

  return { isWide, padding, stackMetrics };
}

export function useDashboardSummaryLayout(metricCount: number) {
  const [width, setWidth] = useState(0);
  // Card text applies this scale to both font size and line height, avoiding double native scaling.
  const { fontScale } = useWindowDimensions();
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  return {
    ...getDashboardSummaryLayout(width, fontScale, metricCount),
    fontScale,
    onLayout,
  };
}
