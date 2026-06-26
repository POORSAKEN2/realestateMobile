import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, type LatLng, type Region } from "react-native-maps";

import { useProperties } from "../../hooks/api/useProperties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import type { Property } from "../../types";

const PHILIPPINES_REGION: Region = {
  latitude: 12.8797,
  longitude: 121.774,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

const SELECTED_PROPERTY_DELTA = {
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};
const MAX_PROPERTY_IMAGES = 5;

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPeso(value = 0) {
  if (value >= 1_000_000_000)
    return `PHP ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  return `PHP ${value.toLocaleString()}`;
}

function hasMapCoordinate(property: Property): property is Property & {
  lat: number;
  lng: number;
} {
  return (
    typeof property.lat === "number" &&
    Number.isFinite(property.lat) &&
    typeof property.lng === "number" &&
    Number.isFinite(property.lng)
  );
}

function getPropertyCoordinate(property: Property & { lat: number; lng: number }) {
  return {
    latitude: property.lat,
    longitude: property.lng,
  };
}

function getMarkerColor(status: Property["status"]) {
  if (status === "UNDER_CONSTRUCTION") return "#EA580C";
  if (status === "PRE_LEASED") return "#0891B2";
  if (status === "REVENUE_GENERATING") return "#16A34A";
  if (status === "PERSONAL_USE") return "#C026D3";
  return "#2563EB";
}

function getPropertyImages(property: Property) {
  const images = property.images?.length ? property.images : [property.image];
  return Array.from(new Set(images.filter(Boolean))).slice(0, MAX_PROPERTY_IMAGES);
}

export default function MapCanvasScreen() {
  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );

  const { useList } = useProperties();
  const {
    data: properties = [],
    isError,
    isLoading,
    refetch,
  } = useList();

  const mappedProperties = useMemo(
    () => properties.filter(hasMapCoordinate),
    [properties],
  );

  const unmappedPropertyCount = properties.length - mappedProperties.length;

  useEffect(() => {
    if (!isMapReady || mappedProperties.length === 0) return;

    const timer = setTimeout(() => {
      if (mappedProperties.length === 1) {
        const coordinate = getPropertyCoordinate(mappedProperties[0]);
        mapRef.current?.animateToRegion(
          { ...coordinate, ...SELECTED_PROPERTY_DELTA },
          700,
        );
        return;
      }

      mapRef.current?.fitToCoordinates(
        mappedProperties.map(getPropertyCoordinate),
        {
          animated: true,
          edgePadding: { top: 110, right: 70, bottom: 220, left: 70 },
        },
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [isMapReady, mappedProperties]);

  function handleRecenter() {
    setSelectedProperty(null);

    if (mappedProperties.length === 0) {
      mapRef.current?.animateToRegion(PHILIPPINES_REGION, 800);
      return;
    }

    if (mappedProperties.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...getPropertyCoordinate(mappedProperties[0]),
          ...SELECTED_PROPERTY_DELTA,
        },
        800,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(mappedProperties.map(getPropertyCoordinate), {
      animated: true,
      edgePadding: { top: 110, right: 70, bottom: 220, left: 70 },
    });
  }

  function handleMarkerPress(property: Property & { lat: number; lng: number }) {
    setSelectedProperty(property);
    mapRef.current?.animateToRegion(
      {
        latitude: property.lat,
        longitude: property.lng,
        ...SELECTED_PROPERTY_DELTA,
      },
      500,
    );
  }

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
                onPress={() => handleMarkerPress(property)}
                pinColor={isSelected ? "#0F172A" : getMarkerColor(property.status)}
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
            <Text style={styles.summaryLabel}>Portfolio Map</Text>
            <Text style={styles.summaryValue}>
              {mappedProperties.length} mapped{" "}
              {mappedProperties.length === 1 ? "property" : "properties"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRecenter}
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
          <View style={styles.unmappedNotice}>
            <MaterialCommunityIcons
              name="information-outline"
              color="#2563EB"
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
          <View style={styles.propertyCard}>
            <View style={styles.propertyImageFrame}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
              >
                {getPropertyImages(selectedProperty).map((image, index) => (
                  <Image
                    key={`${image}:${index}`}
                    source={{ uri: image }}
                    style={styles.propertyImage}
                  />
                ))}
              </ScrollView>
              {getPropertyImages(selectedProperty).length > 1 ? (
                <View style={styles.imageCountBadge}>
                  <Text style={styles.imageCountText}>
                    {getPropertyImages(selectedProperty).length}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.propertyDetails}>
              <Text numberOfLines={1} style={styles.propertyTitle}>
                {selectedProperty.title}
              </Text>
              <Text numberOfLines={1} style={styles.propertyLocation}>
                {selectedProperty.location}
                {selectedProperty.country ? `, ${selectedProperty.country}` : ""}
              </Text>
              <View style={styles.propertyMetaRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>
                    {formatStatus(selectedProperty.status)}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.propertyValue}>
                  {formatPeso(selectedProperty.value)}
                </Text>
              </View>
            </View>
          </View>
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
    top: 12,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    elevation: 5,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
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
    fontSize: 16,
    fontWeight: "800",
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
    fontSize: 13,
    fontWeight: "800",
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
    fontSize: 12,
    fontWeight: "700",
  },
  propertyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    bottom: 104,
    elevation: 8,
    flexDirection: "row",
    gap: 12,
    left: 16,
    padding: 12,
    position: "absolute",
    right: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
  },
  propertyImageFrame: {
    backgroundColor: "#E2E8F0",
    borderRadius: 18,
    height: 74,
    overflow: "hidden",
    width: 74,
  },
  propertyImage: {
    height: 74,
    width: 74,
  },
  imageCountBadge: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: 999,
    bottom: 6,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
    right: 6,
  },
  imageCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  propertyDetails: {
    flex: 1,
    minWidth: 0,
  },
  propertyTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  propertyLocation: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  propertyMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  statusPill: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  propertyValue: {
    color: "#0F172A",
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
});
