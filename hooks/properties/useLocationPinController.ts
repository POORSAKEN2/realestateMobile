import { useEffect, useRef, useState } from "react";
import { Keyboard, TextInput } from "react-native";
import MapView, { type MapPressEvent, type Region } from "react-native-maps";

import {
  reverseGeocodeLocation,
  searchLocations,
  type LocationSearchResult,
  type ReverseGeocodeResult,
} from "../../api/geocoding";
import {
  formatCoordinate,
  parseNumber,
} from "../../utils/properties/propertyForm";

export const LOCATION_PICKER_REGION: Region = {
  latitude: 12.8797,
  longitude: 121.774,
  latitudeDelta: 12,
  longitudeDelta: 12,
};
const PIN_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

export function useLocationPinController({
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
  const requestRef = useRef(0);
  const reverseGeocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const resolvedPinRef = useRef<
    { coordinateKey: string; location: ReverseGeocodeResult } | undefined
  >(undefined);

  useEffect(() => {
    if (isSearchFocused) searchInputRef.current?.focus();
  }, [isSearchFocused]);

  useEffect(() => {
    requestRef.current += 1;
    const request = requestRef.current;
    const latitude = parseNumber(lat);
    const longitude = parseNumber(lng);
    const coordinateKey = `${lat}:${lng}`;

    if (reverseGeocodeTimerRef.current)
      clearTimeout(reverseGeocodeTimerRef.current);
    resolvedPinRef.current = undefined;
    setPinLocationError("");
    setIsResolvingPinLocation(false);
    if (latitude === undefined || longitude === undefined) return;

    reverseGeocodeTimerRef.current = setTimeout(async () => {
      try {
        const location = await reverseGeocodeLocation(latitude, longitude);
        if (requestRef.current !== request) return;
        resolvedPinRef.current = { coordinateKey, location };
        if (location.country) onCountryChange(location.country);
        if (location.city) onLocationChange(location.city);
      } catch {
        // Best-effort synchronization; pin selection remains usable.
      }
    }, 1000);

    return () => {
      if (reverseGeocodeTimerRef.current)
        clearTimeout(reverseGeocodeTimerRef.current);
    };
  }, [lat, lng]);

  const latitude = parseNumber(lat);
  const longitude = parseNumber(lng);
  const markerCoordinate =
    latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : undefined;
  const mapRegion = markerCoordinate
    ? { ...markerCoordinate, ...PIN_DELTA }
    : LOCATION_PICKER_REGION;
  const coordinateLabel = markerCoordinate
    ? `${formatCoordinate(markerCoordinate.latitude)}, ${formatCoordinate(markerCoordinate.longitude)}`
    : "No pin selected";

  function setPinnedLocation(latitudeValue: number, longitudeValue: number) {
    onChange({
      lat: formatCoordinate(latitudeValue),
      lng: formatCoordinate(longitudeValue),
    });
  }

  function handleMapPress(event: MapPressEvent) {
    const { latitude: nextLatitude, longitude: nextLongitude } =
      event.nativeEvent.coordinate;
    setSearchResults([]);
    Keyboard.dismiss();
    setPinnedLocation(nextLatitude, nextLongitude);
  }

  function changeSearchQuery(value: string) {
    setSearchQuery(value);
    setSearchError("");
    if (!value.trim()) setSearchResults([]);
  }

  async function search() {
    if (!searchQuery.trim() || isSearching) return;
    Keyboard.dismiss();
    setIsSearching(true);
    setSearchError("");
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      if (!results.length)
        setSearchError("No matching locations found in the Philippines.");
    } catch {
      setSearchResults([]);
      setSearchError("Location search is unavailable. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function selectSearchResult(result: LocationSearchResult) {
    setSearchQuery(result.label);
    setSearchResults([]);
    setSearchError("");
    setPinnedLocation(result.latitude, result.longitude);
    mapRef.current?.animateToRegion(
      { latitude: result.latitude, longitude: result.longitude, ...PIN_DELTA },
      450,
    );
  }

  async function usePinLocation() {
    if (!markerCoordinate || isResolvingPinLocation) return;
    const coordinateKey = `${lat}:${lng}`;
    const cached =
      resolvedPinRef.current?.coordinateKey === coordinateKey
        ? resolvedPinRef.current.location
        : undefined;
    if (cached?.city) {
      if (cached.country) onCountryChange(cached.country);
      onLocationChange(cached.city);
      return;
    }

    const request = requestRef.current + 1;
    requestRef.current = request;
    if (reverseGeocodeTimerRef.current)
      clearTimeout(reverseGeocodeTimerRef.current);
    setIsResolvingPinLocation(true);
    setPinLocationError("");
    try {
      const location = await reverseGeocodeLocation(
        markerCoordinate.latitude,
        markerCoordinate.longitude,
      );
      if (requestRef.current !== request) return;
      resolvedPinRef.current = { coordinateKey, location };
      if (location.country) onCountryChange(location.country);
      if (!location.city) {
        setPinLocationError("No city was found for this pin.");
        return;
      }
      onLocationChange(location.city);
    } catch {
      if (requestRef.current === request) {
        setPinLocationError("Could not find the pin's city. Please try again.");
      }
    } finally {
      if (requestRef.current === request) setIsResolvingPinLocation(false);
    }
  }

  return {
    changeSearchQuery,
    coordinateLabel,
    handleMapPress,
    isMapVisible,
    isResolvingPinLocation,
    isSearchFocused,
    isSearching,
    mapRef,
    mapRegion,
    markerCoordinate,
    pinLocationError,
    search,
    searchError,
    searchInputRef,
    searchQuery,
    searchResults,
    selectSearchResult,
    setIsMapVisible,
    setIsSearchFocused,
    setPinnedLocation,
    usePinLocation,
  };
}
