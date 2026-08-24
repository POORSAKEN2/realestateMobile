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
    <View className="absolute bottom-6 left-4 right-4 flex-row items-center gap-3 rounded-3xl border border-primary/20 bg-white p-3 shadow-xl shadow-primary/20">
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
            <Text className="text-center font-ralewayBlack text-[10px] text-white">
              {images.length}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="min-w-0 flex-1 font-ralewayBlack text-base text-textPrimary"
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <TouchableOpacity
            accessibilityLabel="Close selected property"
            activeOpacity={0.8}
            className="h-7 w-7 items-center justify-center rounded-full bg-primary/10"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#8A77F4" size={18} />
          </TouchableOpacity>
        </View>
        <Text
          className="mt-1 font-ralewayBold text-xs text-slate-500"
          numberOfLines={1}
        >
          {property.location}
          {property.country ? `, ${property.country}` : ""}
        </Text>
        <View className="mt-2.5 flex-row items-center gap-2">
          <View className="rounded-full bg-secondary px-2.5 py-1">
            <Text className="font-ralewayBlack text-[10px] uppercase text-white">
              {formatStatus(property.status)}
            </Text>
          </View>
          <Text
            className="min-w-0 flex-1 font-ralewayBlack text-xs text-textPrimary"
            numberOfLines={1}
          >
            {formatPeso(property.value)}
          </Text>
        </View>
        <Text
          className="mt-1 font-ralewayExtraBold text-[11px] text-slate-500"
          numberOfLines={1}
        >
          {property.type ?? "Property"}
        </Text>
      </View>
    </View>
  );
}
