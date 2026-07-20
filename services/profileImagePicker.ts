import * as ImagePicker from "expo-image-picker";

import type { ProfileImageSelection } from "../types";

function getImageName(asset: ImagePicker.ImagePickerAsset) {
  if (asset.fileName) return asset.fileName;

  const [nameFromUri] = asset.uri.split("/").slice(-1);
  return nameFromUri || `profile-${Date.now()}.jpg`;
}

function getImageType(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType) return asset.mimeType;
  if (asset.uri.toLowerCase().endsWith(".png")) return "image/png";
  if (asset.uri.toLowerCase().endsWith(".webp")) return "image/webp";

  return "image/jpeg";
}

export async function selectProfileImage(): Promise<ProfileImageSelection> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { status: "permission-denied" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ["images"],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { status: "cancelled" };
  }

  const asset = result.assets[0];

  return {
    status: "selected",
    image: {
      uri: asset.uri,
      name: getImageName(asset),
      type: getImageType(asset),
      file: asset.file,
    },
  };
}
