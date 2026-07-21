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
  reverseGeocodeLocation,
  searchLocations,
  type ReverseGeocodeResult,
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
  onCountryChange,
  onLocationChange,
}: {
  lat: string;
  lng: string;
  onChange: (coordinates: { lat: string; lng: string }) => void;
  onCountryChange: (country: string) => void;
  onLocationChange: (location: string) => void;
}) {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>(
    [],
  );
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingPinLocation, setIsResolvingPinLocation] = useState(false);
  const [pinLocationError, setPinLocationError] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const pinCityRequestRef = useRef(0);
  const pinCountryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedPinRef = useRef<
    { coordinateKey: string; location: ReverseGeocodeResult } | undefined
  >(undefined);

  useEffect(() => {
    if (isSearchFocused) searchInputRef.current?.focus();
  }, [isSearchFocused]);
  useEffect(() => {
    pinCityRequestRef.current += 1;
    const request = pinCityRequestRef.current;
    const latitude = parseNumber(lat);
    const longitude = parseNumber(lng);
    const coordinateKey = `${lat}:${lng}`;

    if (pinCountryTimerRef.current) {
      clearTimeout(pinCountryTimerRef.current);
      pinCountryTimerRef.current = null;
    }
    resolvedPinRef.current = undefined;
    setPinLocationError("");
    setIsResolvingPinLocation(false);

    if (latitude === undefined || longitude === undefined) return;

    pinCountryTimerRef.current = setTimeout(async () => {
      try {
        const location = await reverseGeocodeLocation(latitude, longitude);
        if (pinCityRequestRef.current !== request) return;

        resolvedPinRef.current = { coordinateKey, location };
        if (location.country) onCountryChange(location.country);
        if (location.city) onLocationChange(location.city);
      } catch {
        // Location synchronization is best-effort and does not block pinning.
      }
    }, 1000);

    return () => {
      if (pinCountryTimerRef.current) {
        clearTimeout(pinCountryTimerRef.current);
        pinCountryTimerRef.current = null;
      }
    };
  }, [lat, lng]);
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
  const handleUsePinLocation = async () => {
    if (!markerCoordinate || isResolvingPinLocation) return;

    const coordinateKey = `${lat}:${lng}`;
    const cachedLocation =
      resolvedPinRef.current?.coordinateKey === coordinateKey
        ? resolvedPinRef.current.location
        : undefined;

    if (cachedLocation?.city) {
      if (cachedLocation.country) onCountryChange(cachedLocation.country);
      onLocationChange(cachedLocation.city);
      return;
    }

    const request = pinCityRequestRef.current + 1;
    pinCityRequestRef.current = request;
    if (pinCountryTimerRef.current) {
      clearTimeout(pinCountryTimerRef.current);
      pinCountryTimerRef.current = null;
    }
    setIsResolvingPinLocation(true);
    setPinLocationError("");

    try {
      const location = await reverseGeocodeLocation(
        markerCoordinate.latitude,
        markerCoordinate.longitude,
      );
      if (pinCityRequestRef.current !== request) return;

      resolvedPinRef.current = { coordinateKey, location };
      if (location.country) onCountryChange(location.country);

      if (!location.city) {
        setPinLocationError("No city was found for this pin.");
        return;
      }

      onLocationChange(location.city);
    } catch {
      if (pinCityRequestRef.current === request) {
        setPinLocationError("Could not find the pin's city. Please try again.");
      }
    } finally {
      if (pinCityRequestRef.current === request) {
        setIsResolvingPinLocation(false);
      }
    }
  };
  const coordinateLabel = markerCoordinate
    ? `${formatCoordinate(markerCoordinate.latitude)}, ${formatCoordinate(markerCoordinate.longitude)}`
    : "No pin selected";
  return (
    <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-semibold text-slate-600">
            Pin Location
          </Text>
          <Text className="mt-1 text-sm font-bold text-[#1d1d1f]">
            {coordinateLabel}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Open property pin map"
          accessibilityRole="button"
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
        accessibilityRole="button"
        activeOpacity={0.85}
        className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#2563EB]/10"
        onPress={() => setIsMapVisible(true)}
      >
        <MaterialCommunityIcons name="map-search" color="#2563EB" size={19} />
        <Text className="text-sm font-bold text-[#2563EB]">
          {markerCoordinate ? "Update Pin on Map" : "Pin Property on Map"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{
          disabled: !markerCoordinate || isResolvingPinLocation,
        }}
        activeOpacity={0.85}
        className={`h-12 flex-row items-center justify-center gap-2 rounded-2xl ${
          markerCoordinate ? "bg-[#2563EB]" : "bg-[#1d1d1f]/10"
        }`}
        disabled={!markerCoordinate || isResolvingPinLocation}
        onPress={handleUsePinLocation}
      >
        {isResolvingPinLocation ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <MaterialCommunityIcons
            name="map-marker-check-outline"
            color={markerCoordinate ? "#FFFFFF" : "#8E8E93"}
            size={19}
          />
        )}
        <Text
          className={`text-sm font-bold ${
            markerCoordinate ? "text-[#FFFFFF]" : "text-[#8E8E93]"
          }`}
        >
          {isResolvingPinLocation ? "Finding City..." : "Set Location from Pin"}
        </Text>
      </TouchableOpacity>
      {pinLocationError ? (
        <Text className="text-center text-xs font-semibold text-[#B42318]">
          {pinLocationError}
        </Text>
      ) : null}
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
                <Text className="text-xs font-semibold text-slate-600">
                  Property Pin
                </Text>
                <Text className="m-1 text-sm font-bold text-[#1d1d1f]">
                  {markerCoordinate
                    ? coordinateLabel
                    : "Tap the map to place the pin"}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Close property pin map"
                accessibilityRole="button"
                activeOpacity={0.85}
                className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
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
            <Text className="mt-2 text-xs text-slate-600">
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
