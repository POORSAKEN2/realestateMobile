import Feather from "@expo/vector-icons/Feather";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { Property } from "../../types";
import {
  formatPesoValue,
  formatPropertyStatus,
  getPropertyImages,
} from "../../utils/dashboard/dashboardHelpers";

type PortfolioAssetCardProps = {
  property: Property;
  onOpen: (property: Property) => void;
  onOpenImages: (property: Property) => void;
};

export function PortfolioAssetCard({
  property,
  onOpen,
  onOpenImages,
}: PortfolioAssetCardProps) {
  const images = getPropertyImages(property);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`View ${property.title}`}
      onPress={() => onOpen(property)}
      className="flex-row gap-3 rounded-2xl border border-textPrimary/10 bg-white p-2.5"
    >
      <TouchableOpacity
        activeOpacity={0.86}
        accessibilityRole="button"
        accessibilityLabel={`View images for ${property.title}`}
        className="relative h-20 w-20 overflow-hidden rounded-xl bg-primary/10"
        onPress={(event) => {
          event.stopPropagation();
          onOpenImages(property);
        }}
      >
        <Image
          source={{ uri: images[0] }}
          className="h-full w-full"
          resizeMode="cover"
        />
        {images.length > 1 ? (
          <View className="absolute bottom-1.5 right-1.5 rounded-full bg-blackPrimary/55 px-1.5 py-0.5">
            <Text className="font-ralewayBold text-[9px] text-white">
              {images.length}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View className="min-w-0 flex-1 justify-between py-0.5">
        <View>
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="min-w-0 flex-1 font-ralewayBold text-sm text-textPrimary"
              numberOfLines={1}
            >
              {property.title}
            </Text>
            <Text className="rounded-full bg-accent px-2 py-0.5 font-ralewayBold text-[9px] uppercase text-textPrimary">
              {property.roi}% ROI
            </Text>
          </View>

          <View className="mt-1 flex-row items-center gap-1">
            <Feather name="map-pin" size={11} color={colors.description} />
            <Text
              className="min-w-0 flex-1 text-[11px] text-description"
              numberOfLines={1}
            >
              {property.location}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="font-ralewaySemiBold text-[11px] text-description">
            {formatPropertyStatus(property.status)}
          </Text>
          <Text className="font-ralewayBold text-xs text-textPrimary">
            {formatPesoValue(property.value)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
