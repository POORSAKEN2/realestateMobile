import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useLocationPinController } from "../../hooks/properties/useLocationPinController";
import type { MapCoordinate } from "../../types/maps";
import { AdaptiveMap } from "../ui/maps/AdaptiveMap";

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
  const {
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
  } = useLocationPinController({
    lat,
    lng,
    onChange,
    onCountryChange,
    onLocationChange,
  });
  const pins = useMemo(
    () =>
      markerCoordinate
        ? [
            {
              id: "property-pin",
              coordinate: markerCoordinate,
              title: "Property Pin",
              color: "#8A77F4",
              draggable: true,
            },
          ]
        : [],
    [markerCoordinate],
  );
  const handlePinDragEnd = useCallback(
    (_: string, coordinate: MapCoordinate) =>
      handleMapCoordinateChange(coordinate),
    [handleMapCoordinateChange],
  );

  return (
    <View className="gap-3 rounded-2xl border border-primary/20 bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayBold text-xs text-description">
            Pin Location
          </Text>
          <Text className="mt-1 font-ralewayExtraBold text-sm text-textPrimary">
            {coordinateLabel}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Open property pin map"
          accessibilityRole="button"
          activeOpacity={0.85}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
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
        className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary/10"
        onPress={() => setIsMapVisible(true)}
      >
        <MaterialCommunityIcons name="map-search" color="#8A77F4" size={19} />
        <Text className="font-ralewayExtraBold text-sm text-primary">
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
          markerCoordinate ? "bg-primary" : "bg-textPrimary/10"
        }`}
        disabled={!markerCoordinate || isResolvingPinLocation}
        onPress={usePinLocation}
      >
        {isResolvingPinLocation ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <MaterialCommunityIcons
            name="map-marker-check-outline"
            color={markerCoordinate ? "#FFFFFF" : "#6F6D6D"}
            size={19}
          />
        )}
        <Text
          className={`font-ralewayExtraBold text-sm ${
            markerCoordinate ? "text-whitePrimary" : "text-description"
          }`}
        >
          {isResolvingPinLocation ? "Finding City..." : "Set Location from Pin"}
        </Text>
      </TouchableOpacity>
      {pinLocationError ? (
        <Text className="text-center font-ralewayBold text-xs text-danger">
          {pinLocationError}
        </Text>
      ) : null}
      <Modal
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
        visible={isMapVisible}
      >
        <View className="flex-1 bg-whitePrimary">
          {isMapVisible ? (
            <AdaptiveMap
              onMapPress={handleMapCoordinateChange}
              onPinDragEnd={handlePinDragEnd}
              pins={pins}
              region={mapRegion}
              viewportRevision={viewportRevision}
            />
          ) : null}
          <View className="absolute left-5 right-8 top-16 rounded-3xl border border-primary/20 bg-whitePrimary px-4 py-6 shadow-sm shadow-primary/10">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-ralewayBold text-xs text-description">
                  Property Pin
                </Text>
                <Text className="m-1 font-ralewayExtraBold text-sm text-textPrimary">
                  {markerCoordinate
                    ? coordinateLabel
                    : "Tap the map to place the pin"}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Close property pin map"
                accessibilityRole="button"
                activeOpacity={0.85}
                className="h-11 w-11 items-center justify-center rounded-full bg-primary/10"
                onPress={() => setIsMapVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#8A77F4"
                  size={20}
                />
              </TouchableOpacity>
            </View>
            <View className="mt-3 h-14 flex-row items-center gap-2 overflow-hidden rounded-2xl bg-surface px-3">
              <MaterialCommunityIcons
                name="magnify"
                color="#6F6D6D"
                size={20}
              />
              {isSearchFocused || !searchQuery ? (
                <TextInput
                  autoCapitalize="words"
                  className="mb-1 min-w-0 flex-1 self-center text-sm text-textPrimary"
                  multiline={false}
                  numberOfLines={1}
                  onBlur={() => setIsSearchFocused(false)}
                  onChangeText={changeSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onSubmitEditing={search}
                  placeholder="Search address or place"
                  placeholderTextColor="#6F6D6D"
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
                    className="text-sm leading-5 text-textPrimary"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {searchQuery}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.8}
                className="h-9 w-9 items-center justify-center rounded-xl bg-primary"
                disabled={!searchQuery.trim() || isSearching}
                onPress={search}
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
              <Text className="mt-2 font-ralewayBold text-xs text-danger">
                {searchError}
              </Text>
            ) : null}
            {searchResults.length > 0 ? (
              <View className="mt-2 overflow-hidden rounded-2xl border border-primary/20 bg-whitePrimary">
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    className={`flex-row items-start gap-3 px-3 py-3 ${
                      index < searchResults.length - 1
                        ? "border-b border-textPrimary/10"
                        : ""
                    }`}
                    key={result.id}
                    onPress={() => selectSearchResult(result)}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      color="#8A77F4"
                      size={19}
                    />
                    <Text
                      className="min-w-0 flex-1 text-xs leading-5 text-textPrimary"
                      numberOfLines={2}
                    >
                      {result.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <Text className="mt-2 text-xs text-description">
              Search and geocoding provided by Apple Maps
            </Text>
          </View>
          <View className="absolute bottom-8 left-5 right-5">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 items-center justify-center rounded-2xl bg-primary"
              onPress={() => setIsMapVisible(false)}
            >
              <Text className="font-ralewayExtraBold text-base text-whitePrimary">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
