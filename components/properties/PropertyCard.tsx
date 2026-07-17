import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Property } from "../../types";
import {
  formatPeso,
  formatStatus,
  MAX_PROPERTY_IMAGES,
} from "../../utils/properties/propertyForm";
import PropertyImageGallery from "./PropertyImageGallery";

function getPropertyImages(property: Property) {
  const images = property.images?.length ? property.images : [property.image];
  return Array.from(new Set(images.filter(Boolean))).slice(
    0,
    MAX_PROPERTY_IMAGES,
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
  const isActive = property.status === "REVENUE_GENERATING";
  const propertyImages = getPropertyImages(property);
  const [imageWidth, setImageWidth] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
    >
      <TouchableOpacity
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={`View images for ${property.title}`}
        className="relative h-52 w-full"
        onLayout={(event) => setImageWidth(event.nativeEvent.layout.width)}
        onPress={() => setIsGalleryVisible(true)}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={true}
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
        <View className="absolute inset-x-4 top-4 flex-row items-center justify-between">
          <View className="rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
              {property.type ?? "Property"}
            </Text>
          </View>
          <View className="rounded-full bg-[#2563EB] px-3 py-1.5 shadow-md">
            <Text className="text-[11px] font-bold text-white">
              {property.roi.toFixed(1)}% ROI
            </Text>
          </View>
        </View>
        <View className="absolute bottom-0 h-16 w-full bg-gradient-to-t from-black/20 to-transparent" />
        {propertyImages.length > 1 ? (
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
            {propertyImages.map((image, index) => (
              <View
                className="h-1.5 w-1.5 rounded-full bg-white/85"
                key={`${image}:dot:${index}`}
              />
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
      <PropertyImageGallery
        images={propertyImages}
        onClose={() => setIsGalleryVisible(false)}
        title={property.title}
        visible={isGalleryVisible}
      />
      <View className="p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-soraSemiBold text-xl tracking-tight text-[#1d1d1f]">
              {property.title}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="map-marker"
                color="#94A3B8"
                size={14}
              />
              <Text
                className="text-sm font-medium text-slate-500"
                numberOfLines={1}
              >
                {property.location}
              </Text>
            </View>
          </View>
          <View
            className={`rounded-lg px-2.5 py-1 ${isActive ? "bg-emerald-50" : "bg-amber-50"}`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "text-emerald-600" : "text-amber-600"}`}
            >
              {formatStatus(property.status)}
            </Text>
          </View>
        </View>
        <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Property Value
            </Text>
            <Text className="mt-1 font-soraSemiBold text-lg text-[#1d1d1f]">
              {formatPeso(property.value)}
            </Text>
          </View>
          <View className="mx-4 h-8 w-[1px] bg-slate-200" />
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Occupancy
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="font-soraSemiBold text-lg text-[#1d1d1f]">
                {occupancy}%
              </Text>
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <View
                  className="h-full bg-[#2563EB]"
                  style={{ width: `${occupancy}%` }}
                />
              </View>
            </View>
          </View>
        </View>
        <View className="mt-5 flex-row items-center gap-4">
          {property.bedrooms !== undefined && (
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="bed-king-outline"
                color="#64748B"
                size={18}
              />
              <Text className="text-sm font-bold text-slate-600">
                {property.bedrooms}
              </Text>
            </View>
          )}
          {property.bathrooms !== undefined && (
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="shower" color="#64748B" size={18} />
              <Text className="text-sm font-bold text-slate-600">
                {property.bathrooms}
              </Text>
            </View>
          )}
          <View className="flex-1" />
          {onOpenBookings ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/5"
              onPress={onOpenBookings}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                color="#2563EB"
                size={17}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.8}
            className="h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/5"
            onPress={onEdit}
          >
            <MaterialCommunityIcons name="pencil" color="#2563EB" size={17} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
