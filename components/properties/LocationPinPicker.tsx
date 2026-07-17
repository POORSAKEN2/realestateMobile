import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import MapView, {
  Marker,
  type MapPressEvent,
  type Region,
} from "react-native-maps";

import { MapKitJsWebView } from "./MapKitJsWebView";
import {
  formatCoordinate,
  parseNumber,
} from "../../utils/properties/propertyForm";

const PHILIPPINES_REGION: Region = {
  latitude: 12.8797,
  longitude: 121.774,
  latitudeDelta: 12,
  longitudeDelta: 12,
};
const PINNED_LOCATION_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };
const MAPKIT_JS_TOKEN = process.env.EXPO_PUBLIC_MAPKIT_JS_TOKEN ?? "";
const MAPKIT_JS_BASE_URL = process.env.EXPO_PUBLIC_MAPKIT_JS_BASE_URL;

export function LocationPinPicker({
  lat,
  lng,
  onChange,
}: {
  lat: string;
  lng: string;
  onChange: (coordinates: { lat: string; lng: string }) => void;
}) {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const latitude = parseNumber(lat);
  const longitude = parseNumber(lng);
  const markerCoordinate =
    latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : undefined;
  const mapRegion = markerCoordinate
    ? { ...markerCoordinate, ...PINNED_LOCATION_DELTA }
    : PHILIPPINES_REGION;
  const setPinnedLocation = (latitudeValue: number, longitudeValue: number) =>
    onChange({
      lat: formatCoordinate(latitudeValue),
      lng: formatCoordinate(longitudeValue),
    });
  const handleMapPress = (event: MapPressEvent) => {
    const { latitude: nextLatitude, longitude: nextLongitude } =
      event.nativeEvent.coordinate;
    setPinnedLocation(nextLatitude, nextLongitude);
  };
  const coordinateLabel = markerCoordinate
    ? `${formatCoordinate(markerCoordinate.latitude)}, ${formatCoordinate(markerCoordinate.longitude)}`
    : "No pin selected";
  return (
    <View className="gap-3 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
            Pin Location
          </Text>
          <Text className="mt-1 text-sm font-bold text-[#1d1d1f]">
            {coordinateLabel}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]"
          onPress={() => setIsMapVisible(true)}
        >
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            color="#FFFFFF"
            size={22}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#2563EB]/10"
        onPress={() => setIsMapVisible(true)}
      >
        <MaterialCommunityIcons name="map-search" color="#2563EB" size={19} />
        <Text className="text-sm font-bold text-[#2563EB]">
          {markerCoordinate ? "Update Pin on Map" : "Pin Property on Map"}
        </Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
        visible={isMapVisible}
      >
        <View className="flex-1 bg-[#FFFFFF]">
          {Platform.OS === "android" ? (
            <MapKitJsWebView
              baseUrl={MAPKIT_JS_BASE_URL}
              coordinate={markerCoordinate}
              mapsToken={MAPKIT_JS_TOKEN}
              onPinSelected={({
                latitude: nextLatitude,
                longitude: nextLongitude,
              }) => setPinnedLocation(nextLatitude, nextLongitude)}
            />
          ) : (
            <MapView
              initialRegion={mapRegion}
              onPress={handleMapPress}
              style={{ flex: 1 }}
            >
              {markerCoordinate ? (
                <Marker
                  coordinate={markerCoordinate}
                  draggable
                  onDragEnd={(event) => {
                    const { latitude: nextLatitude, longitude: nextLongitude } =
                      event.nativeEvent.coordinate;
                    setPinnedLocation(nextLatitude, nextLongitude);
                  }}
                />
              ) : null}
            </MapView>
          )}
          <View className="absolute left-5 right-5 top-14 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                  Property Pin
                </Text>
                <Text className="mt-1 text-sm font-bold text-[#1d1d1f]">
                  {markerCoordinate
                    ? coordinateLabel
                    : "Tap the map to place the pin"}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/10"
                onPress={() => setIsMapVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#1d1d1f"
                  size={20}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View className="absolute bottom-8 left-5 right-5">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 items-center justify-center rounded-2xl bg-[#2563EB]"
              onPress={() => setIsMapVisible(false)}
            >
              <Text className="text-base font-bold text-[#FFFFFF]">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
