import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import { useLocationPinController } from "../../hooks/properties/useLocationPinController";

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
  } = useLocationPinController({
    lat,
    lng,
    onChange,
    onCountryChange,
    onLocationChange,
  });

  return (
    <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-ralewayBold text-slate-600">
            Pin Location
          </Text>
          <Text className="mt-1 text-sm font-ralewayExtraBold text-[#1d1d1f]">
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
        <Text className="text-sm font-ralewayExtraBold text-[#2563EB]">
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
        onPress={usePinLocation}
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
          className={`text-sm font-ralewayExtraBold ${
            markerCoordinate ? "text-[#FFFFFF]" : "text-[#8E8E93]"
          }`}
        >
          {isResolvingPinLocation ? "Finding City..." : "Set Location from Pin"}
        </Text>
      </TouchableOpacity>
      {pinLocationError ? (
        <Text className="text-center text-xs font-ralewayBold text-[#B42318]">
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
                <Text className="text-xs font-ralewayBold text-slate-600">
                  Property Pin
                </Text>
                <Text className="m-1 text-sm font-ralewayExtraBold text-[#1d1d1f]">
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
                  onChangeText={changeSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onSubmitEditing={search}
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
              <Text className="mt-2 text-xs font-ralewayBold text-[#B42318]">
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
              <Text className="text-base font-ralewayExtraBold text-[#FFFFFF]">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
