import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapPropertyPreview } from "../../components/properties/MapPropertyPreview";
import { AdaptiveMap } from "../../components/ui/maps/AdaptiveMap";
import { SkeletonBlock, SkeletonGroup } from "../../components/ui/Skeleton";
import { colors } from "../../constants/colors";
import { useProperties } from "../../hooks/api/useProperties";
import { usePropertyMap } from "../../hooks/properties/usePropertyMap";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { getPropertyCoordinate } from "../../utils/properties/propertyPresentation";

const primaryTint = "rgba(138, 119, 244, 0.12)";
const primaryBorder = "rgba(138, 119, 244, 0.22)";

export default function MapCanvasScreen() {
  const insets = useSafeAreaInsets();
  const { useList } = useProperties();
  const { data: properties = [], isError, isLoading, refetch } = useList();
  const {
    clearSelection,
    mapRegion,
    mappedProperties,
    recenter,
    selectedProperty,
    selectPropertyById,
    unmappedPropertyCount,
    viewportRevision,
  } = usePropertyMap(properties);
  const pins = useMemo(
    () =>
      mappedProperties.map((property) => ({
        id: property.id,
        coordinate: getPropertyCoordinate(property),
        color:
          selectedProperty?.id === property.id
            ? colors.secondary
            : colors.primary,
        description: property.location,
        title: property.title,
      })),
    [mappedProperties, selectedProperty?.id],
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" style="dark" translucent />
      <AdaptiveMap
        onMapPress={clearSelection}
        onPinPress={selectPropertyById}
        pins={pins}
        region={mapRegion}
        showsCompass
        showsScale
        style={styles.map}
        viewportRevision={viewportRevision}
      />

      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <View style={styles.iconButton}>
          <SecondaryBackButton
            accessibilityLabel="Back from portfolio map"
            variant="overlay"
          />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <MaterialCommunityIcons
              color={colors.primary}
              name="map-marker-radius-outline"
              size={20}
            />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Portfolio Map</Text>
            {isLoading ? (
              <SkeletonBlock className="mt-2 h-4 w-28 bg-primary/20" />
            ) : (
              <Text style={styles.summaryValue}>
                {mappedProperties.length} mapped{" "}
                {mappedProperties.length === 1 ? "property" : "properties"}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          accessibilityLabel="Recenter portfolio map"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={recenter}
          style={[styles.iconButton, styles.primaryIconButton]}
        >
          <AntDesign name="aim" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerPanel}>
          <SkeletonGroup
            accessibilityLabel="Loading portfolio map"
            className="w-full items-center"
          >
            <SkeletonBlock className="h-12 w-12 rounded-2xl bg-primary/10" />
            <SkeletonBlock className="mt-4 h-5 w-40 bg-primary/20" />
            <SkeletonBlock className="mt-3 h-3 w-full" />
            <SkeletonBlock className="mt-2 h-3 w-3/4" />
          </SkeletonGroup>
        </View>
      ) : null}

      {isError ? (
        <View style={styles.centerPanel}>
          <MaterialCommunityIcons
            name="map-marker-alert-outline"
            color="#DC2626"
            size={34}
          />
          <Text style={styles.centerTitle}>Map data unavailable</Text>
          <Text style={styles.centerText}>
            We could not load your properties right now.
          </Text>
          <TouchableOpacity
            accessibilityLabel="Retry loading map properties"
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !isError && mappedProperties.length === 0 ? (
        <View style={styles.centerPanel}>
          <MaterialCommunityIcons
            name="map-marker-plus-outline"
            color={colors.primary}
            size={36}
          />
          <Text style={styles.centerTitle}>No pinned properties yet</Text>
          <Text style={styles.centerText}>
            Add a pin location to a property so it can appear here.
          </Text>
        </View>
      ) : null}

      {!isLoading && !isError && unmappedPropertyCount > 0 ? (
        <View
          style={[
            styles.unmappedNotice,
            {
              bottom: insets.bottom + (selectedProperty ? 186 : 88),
            },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            color={colors.primary}
            size={18}
          />
          <Text style={styles.unmappedText}>
            {unmappedPropertyCount}{" "}
            {unmappedPropertyCount === 1 ? "property needs" : "properties need"}{" "}
            a map pin.
          </Text>
        </View>
      ) : null}

      {selectedProperty ? (
        <MapPropertyPreview
          bottomInset={insets.bottom}
          onClose={clearSelection}
          property={selectedProperty}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  map: {
    height: "100%",
    width: "100%",
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    left: 16,
    position: "absolute",
    right: 16,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    elevation: 5,
    height: 48,
    justifyContent: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    width: 48,
  },
  primaryIconButton: {
    backgroundColor: colors.primary,
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: primaryBorder,
    borderWidth: 1,
    borderRadius: 22,
    elevation: 5,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: primaryTint,
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    color: "#64748B",
    fontFamily: "Raleway_900Black",
    fontSize: 11,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: colors.text,
    fontFamily: "Raleway_900Black",
    fontSize: 15,
    marginTop: 2,
  },
  centerPanel: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    bottom: "38%",
    elevation: 8,
    maxWidth: 320,
    padding: 20,
    position: "absolute",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    width: "84%",
  },
  centerTitle: {
    color: colors.text,
    fontFamily: "Raleway_900Black",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  centerText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: "Raleway_900Black",
    fontSize: 13,
  },
  unmappedNotice: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    elevation: 5,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  unmappedText: {
    color: colors.text,
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 12,
  },
});
