import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, type LatLng } from "react-native-maps";

import { MapPropertyPreview } from "../../components/properties/MapPropertyPreview";
import { useProperties } from "../../hooks/api/useProperties";
import {
  PHILIPPINES_REGION,
  usePropertyMap,
} from "../../hooks/properties/usePropertyMap";
import { Screen } from "../../components/ui/Screen";
import {
  getPropertyCoordinate,
  getPropertyMarkerColor,
} from "../../utils/properties/propertyPresentation";

export default function MapCanvasScreen() {
  const router = useRouter();
  const { useList } = useProperties();
  const { data: properties = [], isError, isLoading, refetch } = useList();
  const {
    mapRef,
    mappedProperties,
    recenter,
    selectedProperty,
    selectProperty,
    setIsMapReady,
    setSelectedProperty,
    unmappedPropertyCount,
  } = usePropertyMap(properties);

  return (
    <Screen className="bg-[#EFF6FF]">
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          initialRegion={PHILIPPINES_REGION}
          onMapReady={() => setIsMapReady(true)}
          onPress={() => setSelectedProperty(null)}
          showsCompass
          showsScale
          style={styles.map}
        >
          {mappedProperties.map((property) => {
            const coordinate: LatLng = getPropertyCoordinate(property);
            const isSelected = selectedProperty?.id === property.id;

            return (
              <Marker
                key={property.id}
                coordinate={coordinate}
                description={property.location}
                identifier={property.id}
                onPress={() => selectProperty(property)}
                pinColor={
                  isSelected
                    ? "#0F172A"
                    : getPropertyMarkerColor(property.status)
                }
                title={property.title}
              />
            );
          })}
        </MapView>

        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <AntDesign name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons
                color="#2563EB"
                name="map-marker-radius-outline"
                size={20}
              />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Portfolio Map</Text>
              <Text style={styles.summaryValue}>
                {mappedProperties.length} mapped{" "}
                {mappedProperties.length === 1 ? "property" : "properties"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={recenter}
            style={[styles.iconButton, styles.primaryIconButton]}
          >
            <AntDesign name="aim" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerPanel}>
            <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.centerTitle}>Loading properties</Text>
            <Text style={styles.centerText}>
              Fetching your listed properties for the map.
            </Text>
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
              color="#2563EB"
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
              selectedProperty && styles.unmappedNoticeRaised,
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              color="#2563EB"
              size={18}
            />
            <Text style={styles.unmappedText}>
              {unmappedPropertyCount}{" "}
              {unmappedPropertyCount === 1
                ? "property needs"
                : "properties need"}{" "}
              a map pin.
            </Text>
          </View>
        ) : null}

        {selectedProperty ? (
          <MapPropertyPreview
            onClose={() => setSelectedProperty(null)}
            property={selectedProperty}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
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
    top: 16,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    elevation: 5,
    height: 48,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    width: 48,
  },
  primaryIconButton: {
    backgroundColor: "#2563EB",
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    elevation: 5,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: "#EFF6FF",
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
    color: "#0F172A",
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
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    width: "84%",
  },
  centerTitle: {
    color: "#0F172A",
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
    backgroundColor: "#2563EB",
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
    bottom: 112,
    elevation: 5,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  unmappedText: {
    color: "#334155",
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 12,
  },
  unmappedNoticeRaised: {
    bottom: 210,
  },
});
