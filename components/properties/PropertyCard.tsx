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
import { formatDateTime } from "../../utils/formatters";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import {
  getPropertyImages,
  getPropertyStatusTone,
} from "../../utils/properties/propertyPresentation";
import PropertyImageGallery from "./PropertyImageGallery";

function PropertyFact({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-8 max-w-full flex-row flex-wrap items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5">
      <Text className="font-ralewaySemiBold text-xs text-description">
        {label}
      </Text>
      <Text className="min-w-0 shrink font-ralewayBold text-xs text-textPrimary">
        {value}
      </Text>
    </View>
  );
}

export function PropertyCard({
  property,
  onOpenDetails,
  onManage,
}: {
  property: Property;
  onOpenDetails: () => void;
  onManage?: () => void;
}) {
  const occupancy = property.occupancy ?? 0;
  const propertyImages = getPropertyImages(property);
  const statusTone = getPropertyStatusTone(property.status);
  const palette = useThemeColors();
  const [imageWidth, setImageWidth] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  return (
    <TouchableOpacity
      accessible={false}
      activeOpacity={0.9}
      className="w-full overflow-hidden rounded-3xl border border-primary/20 bg-panel shadow-sm shadow-primary/10"
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
        className="relative h-28 w-full bg-surface"
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
              color={palette.description}
              size={30}
            />
            <Text
              className="mt-2 px-4 text-center font-ralewayBold text-xs text-description"
              style={{ maxWidth: "100%" }}
            >
              No property image
            </Text>
          </View>
        )}

        <View
          className="absolute left-3 top-3 rounded-full bg-panel/95 px-3 py-1.5 shadow-sm"
          style={{ maxWidth: "80%" }}
        >
          <Text className="font-ralewayBold text-xs text-textPrimary">
            {property.type ?? "Property"}
          </Text>
        </View>

        {propertyImages.length > 1 ? (
          <View className="absolute bottom-3 right-3 rounded-full bg-overlay/80 px-2.5 py-1.5">
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
        <View className="flex-row flex-wrap items-start gap-2">
          <TouchableOpacity
            accessibilityLabel={`View overview for ${property.title}`}
            accessibilityRole="button"
            activeOpacity={0.8}
            className="min-w-0 flex-1"
            onPress={(event) => {
              event.stopPropagation();
              onOpenDetails();
            }}
            style={{ minWidth: 160 }}
          >
            <Text className="font-ralewayBold text-lg text-textPrimary">
              {property.title}
            </Text>
            <View className="mt-1 flex-row items-start gap-1.5">
              <MaterialCommunityIcons
                name="map-marker-outline"
                color={palette.description}
                size={16}
              />
              <Text className="min-w-0 flex-1 font-ralewaySemiBold text-sm text-description">
                {property.location}
              </Text>
            </View>
          </TouchableOpacity>

          <View
            className={`max-w-full flex-row flex-wrap items-center gap-1.5 rounded-full px-2.5 py-1.5 ${statusTone.backgroundClassName}`}
          >
            <View
              className={`h-2 w-2 rounded-full ${statusTone.dotClassName}`}
            />
            <Text
              className={`font-ralewayBold text-xs ${statusTone.textClassName}`}
            >
              {formatStatus(property.status)}
            </Text>
          </View>
        </View>

        <View className="mt-4 border-t border-primary/20 pt-4">
          <Text className="font-ralewayBold text-xs uppercase text-description">
            Value
          </Text>
          <Text className="mt-1 font-ralewayExtraBold text-2xl text-textPrimary">
            {formatPeso(property.value)}
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <PropertyFact label="ROI" value={`${property.roi.toFixed(1)}%`} />
            <PropertyFact label="Occupancy" value={`${occupancy}%`} />
          </View>
          {property.bedrooms !== undefined ||
          property.bathrooms !== undefined ? (
            <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
              {property.bedrooms !== undefined ? (
                <View
                  accessible
                  accessibilityLabel={`${property.bedrooms} ${property.bedrooms === 1 ? "bedroom" : "bedrooms"}`}
                  className="flex-row items-center gap-1.5"
                >
                  <MaterialCommunityIcons
                    name="bed-king-outline"
                    color={palette.description}
                    size={18}
                  />
                  <Text className="font-ralewaySemiBold text-sm text-description">
                    {property.bedrooms}
                  </Text>
                </View>
              ) : null}
              {property.bathrooms !== undefined ? (
                <View
                  accessible
                  accessibilityLabel={`${property.bathrooms} ${property.bathrooms === 1 ? "bathroom" : "bathrooms"}`}
                  className="flex-row items-center gap-1.5"
                >
                  <MaterialCommunityIcons
                    name="shower"
                    color={palette.description}
                    size={18}
                  />
                  <Text className="font-ralewaySemiBold text-sm text-description">
                    {property.bathrooms}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {property.archivedAt ? (
          <Text className="mt-4 font-ralewaySemiBold text-xs text-description">
            Archived {formatDateTime(property.archivedAt)}
          </Text>
        ) : null}

        {onManage ? (
          <TouchableOpacity
            accessibilityLabel={`Manage ${property.title}`}
            accessibilityRole="button"
            activeOpacity={0.82}
            className="mt-4 min-h-11 max-w-full flex-row items-center justify-center gap-1.5 self-end rounded-2xl bg-primary px-3 py-2"
            onPress={(event) => {
              event.stopPropagation();
              onManage();
            }}
          >
            <MaterialCommunityIcons
              name="dots-horizontal"
              color={palette.whitePrimary}
              size={17}
            />
            <Text className="shrink text-center font-ralewayExtraBold text-xs text-whitePrimary">
              Manage
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
