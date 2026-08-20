import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, TextInput } from "react-native";

import { DEFAULT_PHILIPPINES_REGION } from "../../constants/defaultLocation";
import { useMapKitGeocoding } from "../maps/useMapKitGeocoding";
import type { LocationSearchResult, ReverseGeocodeResult } from "../../types";
import type { MapCoordinate, MapRegion } from "../../types/maps";
import {
  formatCoordinate,
  parseNumber,
} from "../../utils/properties/propertyForm";

export const LOCATION_PICKER_REGION: MapRegion = DEFAULT_PHILIPPINES_REGION;
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
  const { reverseGeocodeLocation, searchLocations } = useMapKitGeocoding();
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
  const [viewportRevision, setViewportRevision] = useState(0);
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
  }, [lat, lng, reverseGeocodeLocation]);

  const markerCoordinate = useMemo(() => {
    const latitude = parseNumber(lat);
    const longitude = parseNumber(lng);
    return latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : undefined;
  }, [lat, lng]);
  const mapRegion = useMemo(
    () =>
      markerCoordinate
        ? { ...markerCoordinate, ...PIN_DELTA }
        : LOCATION_PICKER_REGION,
    [markerCoordinate],
  );
  const coordinateLabel = markerCoordinate
    ? `${formatCoordinate(markerCoordinate.latitude)}, ${formatCoordinate(markerCoordinate.longitude)}`
    : "No pin selected";

  const setPinnedLocation = useCallback(
    (latitudeValue: number, longitudeValue: number) => {
      onChange({
        lat: formatCoordinate(latitudeValue),
        lng: formatCoordinate(longitudeValue),
      });
    },
    [onChange],
  );

  const handleMapCoordinateChange = useCallback(
    ({ latitude, longitude }: MapCoordinate) => {
      setSearchResults([]);
      Keyboard.dismiss();
      setPinnedLocation(latitude, longitude);
    },
    [setPinnedLocation],
  );

  const changeSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
    setSearchError("");
    if (!value.trim()) setSearchResults([]);
  }, []);

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

  const selectSearchResult = useCallback(
    (result: LocationSearchResult) => {
      setSearchQuery(result.label);
      setSearchResults([]);
      setSearchError("");
      setPinnedLocation(result.latitude, result.longitude);
      setViewportRevision((revision) => revision + 1);
    },
    [setPinnedLocation],
  );

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
    handleMapCoordinateChange,
    isMapVisible,
    isResolvingPinLocation,
    isSearchFocused,
    isSearching,
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
    usePinLocation,
    viewportRevision,
  };
}
