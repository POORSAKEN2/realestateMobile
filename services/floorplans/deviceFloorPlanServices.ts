import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

import type {
  FloorPlanFeedback,
  FloorPlanImagePicker,
  FloorPlanManagerDependencies,
  FloorPlanVisibilityRepository,
} from "./contracts";

const VISIBILITY_KEY_PREFIX = "floorplans.hidden-areas";

function visibilityKey(propertyId: string) {
  return `${VISIBILITY_KEY_PREFIX}.${propertyId}`;
}

async function readDeviceValue(key: string) {
  if (await SecureStore.isAvailableAsync()) {
    return SecureStore.getItemAsync(key);
  }

  return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
}

async function writeDeviceValue(key: string, value: string) {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
}

export const deviceFloorPlanVisibilityRepository: FloorPlanVisibilityRepository =
  {
    async load(propertyId) {
      const value = await readDeviceValue(visibilityKey(propertyId));
      if (!value) return new Set<string>();

      try {
        const parsed = JSON.parse(value);
        return new Set<string>(Array.isArray(parsed) ? parsed.map(String) : []);
      } catch {
        return new Set<string>();
      }
    },
    async save(propertyId, hiddenAreaIds) {
      await writeDeviceValue(
        visibilityKey(propertyId),
        JSON.stringify([...hiddenAreaIds]),
      );
    },
  };

export const deviceFloorPlanImagePicker: FloorPlanImagePicker = {
  async select() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { status: "permission-denied" };

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ["images"],
      quality: 0.9,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return { status: "cancelled" };

    return {
      status: "selected",
      image: {
        uri: asset.uri,
        name:
          asset.fileName ??
          asset.uri.split("/").pop() ??
          `floor-plan-${Date.now()}.jpg`,
        type:
          asset.mimeType ??
          (asset.uri.toLowerCase().endsWith(".png")
            ? "image/png"
            : "image/jpeg"),
        file: asset.file,
      },
    };
  },
};

export const nativeFloorPlanFeedback: FloorPlanFeedback = {
  showError(title, message) {
    Alert.alert(title, message);
  },
};

export const deviceFloorPlanDependencies: FloorPlanManagerDependencies = {
  feedback: nativeFloorPlanFeedback,
  imagePicker: deviceFloorPlanImagePicker,
  visibilityRepository: deviceFloorPlanVisibilityRepository,
};
