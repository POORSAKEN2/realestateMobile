import { PermissionGate } from "../auth/PermissionGate";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  type GestureResponderEvent,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Property } from "../../types";
import { formatPeso, formatStatus } from "../../utils/properties/propertyForm";
import {
  getPropertyImages,
  getPropertyStatusTone,
} from "../../utils/properties/propertyPresentation";
import { resolveFloorManagerPolicy } from "../../utils/properties/floorManagerPolicy";
import PropertyImageGallery from "./PropertyImageGallery";

function PropertyMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="font-ralewaySemiBold text-xs text-description">
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="mt-1 font-ralewayBold text-sm text-textPrimary"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function PropertyAction({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityLabel={`${label} property`}
      accessibilityRole="button"
      activeOpacity={0.8}
      className={`min-h-11 flex-row items-center justify-center gap-1.5 rounded-2xl px-3 ${
        primary ? "bg-primary" : "bg-primary/10"
      }`}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        color={primary ? "#FFFFFF" : "#8A77F4"}
        size={17}
      />
      <Text
        className={`font-ralewayExtraBold text-xs ${
          primary ? "text-white" : "text-primary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function PropertyCard({
  property,
  onEdit,
  onOpenDetails,
  onOpenFloorPlans,
  onOpenBedspaces,
  onOpenBookings,
}: {
  property: Property;
  onEdit: () => void;
  onOpenDetails: () => void;
  onOpenFloorPlans: () => void;
  onOpenBedspaces: () => void;
  onOpenBookings?: () => void;
}) {
  const occupancy = property.occupancy ?? 0;
  const propertyImages = getPropertyImages(property);
  const statusTone = getPropertyStatusTone(property.status);
  const [imageWidth, setImageWidth] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const floorPlans = property.floorplans ?? [];
  const floorAreaCount = floorPlans.reduce(
    (total, floor) => total + floor.areas.length,
    0,
  );
  const floorManagerPolicy = resolveFloorManagerPolicy({
    backendCapabilities: property.spatialCapabilities,
    hasFloorPlans: floorPlans.length > 0,
    propertyType: property.type,
  });

  return (
    <TouchableOpacity
      accessibilityLabel={`View overview for ${property.title}`}
      accessibilityRole="button"
      activeOpacity={0.9}
      className="w-full overflow-hidden rounded-3xl border border-primary/20 bg-white shadow-sm shadow-primary/10"
      onPress={onOpenDetails}
    >
      <TouchableOpacity
        accessibilityLabel={
          propertyImages.length
            ? `View images for ${property.title}`
            : `No images available for ${property.title}`
        }
        accessibilityRole="button"
        activeOpacity={propertyImages.length ? 0.92 : 1}
        className="relative h-40 w-full bg-surface"
        disabled={!propertyImages.length}
        onLayout={(event) => setImageWidth(event.nativeEvent.layout.width)}
        onPress={(event: GestureResponderEvent) => {
          event.stopPropagation();
          setIsGalleryVisible(true);
        }}
      >
        {propertyImages.length ? (
          <ScrollView
            horizontal
            onMomentumScrollEnd={(event) => {
              if (!imageWidth) return;
              setActiveImageIndex(
                Math.round(event.nativeEvent.contentOffset.x / imageWidth),
              );
            }}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {propertyImages.map((image, index) => (
              <Image
                className="h-full bg-surface"
                key={`${image}:${index}`}
                resizeMode="cover"
                source={{ uri: image }}
                style={{ width: imageWidth || 1 }}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialCommunityIcons
              name="image-off-outline"
              color="#6F6D6D"
              size={30}
            />
            <Text className="mt-2 font-ralewayBold text-xs text-description">
              No property image
            </Text>
          </View>
        )}

        <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 shadow-sm">
          <Text className="font-ralewayBold text-xs text-textPrimary">
            {property.type ?? "Property"}
          </Text>
        </View>

        {propertyImages.length > 1 ? (
          <View className="absolute bottom-3 right-3 rounded-full bg-blackPrimary/60 px-2.5 py-1.5">
            <Text className="font-ralewayBold text-xs text-white">
              {activeImageIndex + 1} of {propertyImages.length}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <PropertyImageGallery
        images={propertyImages}
        onClose={() => setIsGalleryVisible(false)}
        title={property.title}
        visible={isGalleryVisible}
      />

      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text
              className="font-ralewayBold text-lg text-textPrimary"
              numberOfLines={1}
            >
              {property.title}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="map-marker-outline"
                color="#6F6D6D"
                size={16}
              />
              <Text
                className="min-w-0 flex-1 font-ralewaySemiBold text-sm text-description"
                numberOfLines={1}
              >
                {property.location}
              </Text>
            </View>
          </View>

          <View
            className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 ${statusTone.backgroundClassName}`}
          >
            <View
              className={`h-2 w-2 rounded-full ${statusTone.dotClassName}`}
            />
            <Text
              className={`font-ralewayBold text-xs ${statusTone.textClassName}`}
              numberOfLines={1}
            >
              {formatStatus(property.status)}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3 rounded-2xl bg-primary/5 p-3.5">
          <PropertyMetric label="Value" value={formatPeso(property.value)} />
          <View className="w-px bg-primary/10" />
          <PropertyMetric label="ROI" value={`${property.roi.toFixed(1)}%`} />
          <View className="w-px bg-primary/10" />
          <PropertyMetric label="Occupancy" value={`${occupancy}%`} />
        </View>

        <TouchableOpacity
          accessibilityLabel={`Manage bedspaces for ${property.title}`}
          accessibilityRole="button"
          activeOpacity={0.82}
          className="mt-4 flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3.5"
          onPress={(event) => {
            event.stopPropagation();
            onOpenBedspaces();
          }}
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <MaterialCommunityIcons
              name="bed-single-outline"
              color="#8A77F4"
              size={21}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayBold text-xs uppercase text-secondary">
              Bedspace inventory
            </Text>
            <Text className="mt-1 text-xs text-description">
              {property.bedspaceCount > 0
                ? `${property.bedspaceCount} total · ${property.vacantBedspaceCount} vacant · ${property.occupiedBedspaceCount} occupied`
                : property.roomCount > 0
                  ? `${property.roomCount} ${property.roomCount === 1 ? "room" : "rooms"} available · Set up bedspaces`
                  : "No rooms available · Add a room first"}
            </Text>
            {property.maintenanceBedspaceCount > 0 ? (
              <Text className="mt-0.5 text-[11px] text-warning">
                {property.maintenanceBedspaceCount} under maintenance
              </Text>
            ) : null}
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            color="#8A77F4"
            size={21}
          />
        </TouchableOpacity>

        {floorManagerPolicy.showFloorSummary ? (
          <TouchableOpacity
            accessibilityLabel={`Manage floor plans for ${property.title}`}
            accessibilityRole="button"
            activeOpacity={0.82}
            className={`mt-3 flex-row items-center gap-3 rounded-2xl border p-3.5 ${
              floorManagerPolicy.floorSummaryProminence === "primary"
                ? "border-primary/25 bg-primary/10"
                : "border-primary/20 bg-white"
            }`}
            onPress={(event) => {
              event.stopPropagation();
              onOpenFloorPlans();
            }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <MaterialCommunityIcons
                name="floor-plan"
                color={
                  floorManagerPolicy.floorSummaryProminence === "primary"
                    ? "#8A77F4"
                    : "#6F6D6D"
                }
                size={21}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className={`font-ralewayBold text-xs uppercase ${
                  floorManagerPolicy.floorSummaryProminence === "primary"
                    ? "text-secondary"
                    : "text-description"
                }`}
              >
                {floorManagerPolicy.floorSummaryProminence === "primary"
                  ? "Floor summary"
                  : "Optional layout"}
              </Text>
              <Text className="mt-1 text-xs text-description">
                {floorPlans.length
                  ? `${floorPlans.length} ${floorPlans.length === 1 ? "floor" : "floors"} · ${floorAreaCount} ${floorAreaCount === 1 ? "area" : "areas"}`
                  : floorManagerPolicy.floorSummaryProminence === "primary"
                    ? "No floors added yet"
                    : "Usually not needed · Add anyway"}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={
                floorManagerPolicy.floorSummaryProminence === "primary"
                  ? "#8A77F4"
                  : "#6F6D6D"
              }
              size={21}
            />
          </TouchableOpacity>
        ) : null}

        <View className="mt-4 flex-row items-center gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-3">
            {property.bedrooms !== undefined ? (
              <View
                accessibilityLabel={`${property.bedrooms} bedrooms`}
                className="flex-row items-center gap-1.5"
              >
                <MaterialCommunityIcons
                  name="bed-king-outline"
                  color="#6F6D6D"
                  size={18}
                />
                <Text className="font-ralewayBold text-sm text-textPrimary">
                  {property.bedrooms}
                </Text>
              </View>
            ) : null}
            {property.bathrooms !== undefined ? (
              <View
                accessibilityLabel={`${property.bathrooms} bathrooms`}
                className="flex-row items-center gap-1.5"
              >
                <MaterialCommunityIcons
                  name="shower"
                  color="#6F6D6D"
                  size={18}
                />
                <Text className="font-ralewayBold text-sm text-textPrimary">
                  {property.bathrooms}
                </Text>
              </View>
            ) : null}
          </View>

          {onOpenBookings ? (
            <PermissionGate permission="bookings.viewAny" propertyId={property.id}><PropertyAction
              icon="calendar-clock"
              label="Bookings"
              onPress={onOpenBookings}
            /></PermissionGate>
          ) : null}
          <PermissionGate permission="properties.update" propertyId={property.id}><PropertyAction
            icon="pencil-outline"
            label="Edit"
            onPress={onEdit}
            primary
          /></PermissionGate>
        </View>
      </View>
    </TouchableOpacity>
  );
}
