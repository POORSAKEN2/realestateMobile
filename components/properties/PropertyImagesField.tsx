import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { SelectedImage } from "../../utils/properties/propertyForm";

export function PropertyImagesField({
  images,
  maxImages,
  onPick,
  onRemove,
}: {
  images: SelectedImage[];
  maxImages: number;
  onPick: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View className="gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="bg-secondary/20 h-12 w-12 items-center justify-center rounded-2xl">
            <MaterialCommunityIcons
              name="image-outline"
              color="#634CE4"
              size={22}
            />
          </View>
          <View className="flex-1">
            <Text className="font-ralewayExtraBold text-textPrimary text-sm">
              Property images
            </Text>
            <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
              JPG, PNG, or WEBP. Upload up to {maxImages}.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityLabel={
            images.length ? "Add property images" : "Choose property images"
          }
          accessibilityRole="button"
          className="min-h-11 justify-center rounded-2xl bg-primary px-4 py-2.5"
          onPress={onPick}
        >
          <Text className="font-ralewayExtraBold text-xs text-[#FFFFFF]">
            {images.length ? "Add" : "Choose"}
          </Text>
        </TouchableOpacity>
      </View>

      {images.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 4 }}
        >
          {images.map((image, index) => (
            <View
              className="border-textPrimary/10 bg-secondary/20 w-64 overflow-hidden rounded-2xl border"
              key={`${image.uri}:${index}`}
            >
              <Image
                className="h-40 w-full"
                resizeMode="cover"
                source={{ uri: image.uri }}
              />
              <View className="flex-row items-center justify-between gap-3 p-3">
                <Text
                  className="text-textPrimary flex-1 font-ralewayBold text-xs"
                  numberOfLines={1}
                >
                  {index + 1}. {image.name}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  accessibilityLabel={`Remove ${image.name}`}
                  accessibilityRole="button"
                  className="h-11 w-11 items-center justify-center rounded-full bg-[#FFFFFF]"
                  onPress={() => onRemove(index)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    color="#6F6D6D"
                    size={17}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
