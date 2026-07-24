import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { Property } from "../../types";
import { formatPeso, formatStatus } from "../../utils/properties/propertyForm";
import { getPropertyImages } from "../../utils/properties/propertyPresentation";

export function MapPropertyPreview({
  onClose,
  property,
}: {
  onClose: () => void;
  property: Property;
}) {
  const images = getPropertyImages(property);

  return (
    <View className="absolute bottom-6 left-4 right-4 flex-row items-center gap-3 rounded-3xl bg-white p-3 shadow-xl shadow-slate-900/20">
      <View className="h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[18px] bg-slate-200">
        {images.length ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {images.map((image, index) => (
              <Image
                className="h-[74px] w-[74px]"
                key={`${image}:${index}`}
                source={{ uri: image }}
              />
            ))}
          </ScrollView>
        ) : (
          <MaterialCommunityIcons
            name="home-city-outline"
            color="#64748B"
            size={30}
          />
        )}
        {images.length > 1 ? (
          <View className="absolute bottom-1.5 right-1.5 min-w-5 rounded-full bg-slate-900/75 px-1.5 py-0.5">
            <Text className="text-center text-[10px] font-ralewayBlack text-white">
              {images.length}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="min-w-0 flex-1 text-base font-ralewayBlack text-slate-900"
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <TouchableOpacity
            accessibilityLabel="Close selected property"
            activeOpacity={0.8}
            className="h-7 w-7 items-center justify-center rounded-full bg-slate-100"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#64748B" size={18} />
          </TouchableOpacity>
        </View>
        <Text
          className="mt-1 text-xs font-ralewayBold text-slate-500"
          numberOfLines={1}
        >
          {property.location}
          {property.country ? `, ${property.country}` : ""}
        </Text>
        <View className="mt-2.5 flex-row items-center gap-2">
          <View className="rounded-full bg-blue-100 px-2.5 py-1">
            <Text className="text-[10px] font-ralewayBlack uppercase text-blue-600">
              {formatStatus(property.status)}
            </Text>
          </View>
          <Text
            className="min-w-0 flex-1 text-xs font-ralewayBlack text-slate-900"
            numberOfLines={1}
          >
            {formatPeso(property.value)}
          </Text>
        </View>
        <Text
          className="mt-1 text-[11px] font-ralewayExtraBold text-slate-500"
          numberOfLines={1}
        >
          {property.type ?? "Property"}
        </Text>
      </View>
    </View>
  );
}
