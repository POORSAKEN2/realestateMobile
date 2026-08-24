import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { AdaptiveMapProps } from "./AdaptiveMap.types";

export type { AdaptiveMapPin, AdaptiveMapProps } from "./AdaptiveMap.types";

export const AdaptiveMap = memo(function AdaptiveMap({
  style,
}: AdaptiveMapProps) {
  return (
    <View style={[styles.container, styles.unsupported, style]}>
      <Text style={styles.unsupportedText}>
        Map view is available in the Android and iOS apps.
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  unsupported: {
    alignItems: "center",
    backgroundColor: "#FAF9F9",
    justifyContent: "center",
    padding: 24,
  },
  unsupportedText: {
    color: "#6F6D6D",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
