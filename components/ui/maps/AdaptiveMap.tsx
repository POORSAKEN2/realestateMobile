import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { AdaptiveMapProps } from "./AdaptiveMap.types";

export type { AdaptiveMapPin, AdaptiveMapProps } from "./AdaptiveMap.types";

export const AdaptiveMap = memo(function AdaptiveMap({
  style,
}: AdaptiveMapProps) {
  return (
    <View
      className="bg-surface"
      style={[styles.container, styles.unsupported, style]}
    >
      <Text className="text-description" style={styles.unsupportedText}>
        Map view is available in the Android and iOS apps.
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  unsupported: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  unsupportedText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
