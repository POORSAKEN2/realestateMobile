import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  type MapPressEvent,
  type Region,
} from "react-native-maps";

import {
  searchLocations,
  type LocationSearchResult,
} from "../../api/geocoding";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>(
    [],
  );
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (isSearchFocused) searchInputRef.current?.focus();
  }, [isSearchFocused]);
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
    setSearchResults([]);
    Keyboard.dismiss();
    setPinnedLocation(nextLatitude, nextLongitude);
  };
  const handleLocationSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    Keyboard.dismiss();
    setIsSearching(true);
    setSearchError("");

    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("No matching locations found in the Philippines.");
      }
    } catch {
      setSearchResults([]);
      setSearchError("Location search is unavailable. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  const selectSearchResult = (result: LocationSearchResult) => {
    setSearchQuery(result.label);
    setSearchResults([]);
    setSearchError("");
    setPinnedLocation(result.latitude, result.longitude);
    mapRef.current?.animateToRegion(
      {
        latitude: result.latitude,
        longitude: result.longitude,
        ...PINNED_LOCATION_DELTA,
      },
      450,
    );
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
          <MapView
            initialRegion={mapRegion}
            onPress={handleMapPress}
            ref={mapRef}
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
          <View className="absolute left-5 right-8 top-16 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 py-6 shadow-sm">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                  Property Pin
                </Text>
                <Text className="m-1 text-sm font-bold text-[#1d1d1f]">
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
            <View className="mt-3 h-14 flex-row items-center gap-2 overflow-hidden rounded-2xl bg-[#F4F4F5] px-3">
              <MaterialCommunityIcons
                name="magnify"
                color="#6F6D6D"
                size={20}
              />
              {isSearchFocused || !searchQuery ? (
                <TextInput
                  autoCapitalize="words"
                  className="mb-1 min-w-0 flex-1 self-center text-sm text-[#1d1d1f]"
                  multiline={false}
                  numberOfLines={1}
                  onBlur={() => setIsSearchFocused(false)}
                  onChangeText={(value) => {
                    setSearchQuery(value);
                    setSearchError("");
                    if (!value.trim()) setSearchResults([]);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onSubmitEditing={handleLocationSearch}
                  placeholder="Search address or place"
                  placeholderTextColor="#8E8E93"
                  ref={searchInputRef}
                  returnKeyType="search"
                  value={searchQuery}
                />
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="h-14 min-w-0 flex-1 justify-center"
                  onPress={() => setIsSearchFocused(true)}
                >
                  <Text
                    className="text-sm leading-5 text-[#1d1d1f]"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {searchQuery}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.8}
                className="h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]"
                disabled={!searchQuery.trim() || isSearching}
                onPress={handleLocationSearch}
              >
                {isSearching ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <MaterialCommunityIcons
                    name="arrow-right"
                    color="#FFFFFF"
                    size={19}
                  />
                )}
              </TouchableOpacity>
            </View>
            {searchError ? (
              <Text className="mt-2 text-xs font-semibold text-[#B42318]">
                {searchError}
              </Text>
            ) : null}
            {searchResults.length > 0 ? (
              <View className="mt-2 overflow-hidden rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF]">
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    className={`flex-row items-start gap-3 px-3 py-3 ${
                      index < searchResults.length - 1
                        ? "border-b border-[#1d1d1f]/10"
                        : ""
                    }`}
                    key={result.id}
                    onPress={() => selectSearchResult(result)}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      color="#2563EB"
                      size={19}
                    />
                    <Text
                      className="min-w-0 flex-1 text-xs leading-5 text-[#1d1d1f]"
                      numberOfLines={2}
                    >
                      {result.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <Text className="mt-2 text-[10px] text-[#8E8E93]">
              Search data © OpenStreetMap contributors
            </Text>
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
