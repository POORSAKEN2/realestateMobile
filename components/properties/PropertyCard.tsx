import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { Property } from "../../types";
import { formatPeso, formatStatus } from "../../utils/properties/propertyForm";
import {
  getPropertyImages,
  getPropertyStatusTone,
} from "../../utils/properties/propertyPresentation";
import PropertyImageGallery from "./PropertyImageGallery";

function PropertyMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-xs font-medium text-slate-600">{label}</Text>
      <Text
        adjustsFontSizeToFit
        className="mt-1 font-soraSemiBold text-sm text-[#1d1d1f]"
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
        primary ? "bg-[#2563EB]" : "bg-[#2563EB]/10"
      }`}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        color={primary ? "#FFFFFF" : "#2563EB"}
        size={17}
      />
      <Text
        className={`text-xs font-bold ${
          primary ? "text-white" : "text-[#2563EB]"
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
  onOpenBookings,
}: {
  property: Property;
  onEdit: () => void;
  onOpenBookings?: () => void;
}) {
  const occupancy = property.occupancy ?? 0;
  const propertyImages = getPropertyImages(property);
  const statusTone = getPropertyStatusTone(property.status);
  const [imageWidth, setImageWidth] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  return (
    <View className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <TouchableOpacity
        accessibilityLabel={
          propertyImages.length
            ? `View images for ${property.title}`
            : `No images available for ${property.title}`
        }
        accessibilityRole="button"
        activeOpacity={propertyImages.length ? 0.92 : 1}
        className="relative h-40 w-full bg-slate-100"
        disabled={!propertyImages.length}
        onLayout={(event) => setImageWidth(event.nativeEvent.layout.width)}
        onPress={() => setIsGalleryVisible(true)}
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
                className="h-full bg-slate-100"
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
              color="#64748B"
              size={30}
            />
            <Text className="mt-2 text-xs font-semibold text-slate-600">
              No property image
            </Text>
          </View>
        )}

        <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 shadow-sm">
          <Text className="text-xs font-semibold text-slate-800">
            {property.type ?? "Property"}
          </Text>
        </View>

        {propertyImages.length > 1 ? (
          <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1.5">
            <Text className="text-xs font-semibold text-white">
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
              className="font-soraSemiBold text-lg text-[#1d1d1f]"
              numberOfLines={1}
            >
              {property.title}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="map-marker-outline"
                color="#64748B"
                size={16}
              />
              <Text
                className="min-w-0 flex-1 text-sm font-medium text-slate-600"
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
              className={`text-xs font-semibold ${statusTone.textClassName}`}
              numberOfLines={1}
            >
              {formatStatus(property.status)}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3 rounded-2xl bg-slate-50 p-3.5">
          <PropertyMetric label="Value" value={formatPeso(property.value)} />
          <View className="w-px bg-slate-200" />
          <PropertyMetric label="ROI" value={`${property.roi.toFixed(1)}%`} />
          <View className="w-px bg-slate-200" />
          <PropertyMetric label="Occupancy" value={`${occupancy}%`} />
        </View>

        <View className="mt-4 flex-row items-center gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-3">
            {property.bedrooms !== undefined ? (
              <View
                accessibilityLabel={`${property.bedrooms} bedrooms`}
                className="flex-row items-center gap-1.5"
              >
                <MaterialCommunityIcons
                  name="bed-king-outline"
                  color="#475569"
                  size={18}
                />
                <Text className="text-sm font-semibold text-slate-700">
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
                  color="#475569"
                  size={18}
                />
                <Text className="text-sm font-semibold text-slate-700">
                  {property.bathrooms}
                </Text>
              </View>
            ) : null}
          </View>

          {onOpenBookings ? (
            <PropertyAction
              icon="calendar-clock"
              label="Bookings"
              onPress={onOpenBookings}
            />
          ) : null}
          <PropertyAction
            icon="pencil-outline"
            label="Edit"
            onPress={onEdit}
            primary
          />
        </View>
      </View>
    </View>
  );
}
