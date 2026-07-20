import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

import {
  getDocumentType,
  MAX_PROPERTY_IMAGES,
  toSelectedImage,
  type SelectedDocument,
  type SelectedImage,
} from "../../utils/properties/propertyForm";

const MAX_PROPERTY_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_PROPERTY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function usePropertyAttachments(onError: (message: string) => void) {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<
    SelectedDocument[]
  >([]);

  function clearAttachments() {
    setSelectedImages([]);
    setSelectedDocuments([]);
  }

  async function pickImages() {
    onError("");
    if (selectedImages.length >= MAX_PROPERTY_IMAGES) {
      onError(`You can upload up to ${MAX_PROPERTY_IMAGES} property images.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onError("Photo library permission is required to add an image.");
      return;
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ["images"],
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 0.85,
        selectionLimit: MAX_PROPERTY_IMAGES - selectedImages.length,
      });
    } catch {
      onError("Photo library could not open. Please try again.");
      return;
    }

    if (result.canceled || !result.assets?.length) return;
    const invalidImage = result.assets.find((asset) => {
      const type = asset.mimeType?.toLowerCase();
      return (
        !type ||
        !SUPPORTED_PROPERTY_IMAGE_TYPES.has(type) ||
        (asset.fileSize ?? 0) > MAX_PROPERTY_IMAGE_SIZE
      );
    });
    if (invalidImage) {
      onError("Choose JPG, PNG, or WEBP images smaller than 5 MB.");
      return;
    }

    const pickedImages = result.assets.map(toSelectedImage);
    setSelectedImages((current) => {
      const existingUris = new Set(current.map((image) => image.uri));
      const newImages = pickedImages.filter(
        (image) => !existingUris.has(image.uri),
      );
      const nextImages = [...current, ...newImages].slice(
        0,
        MAX_PROPERTY_IMAGES,
      );
      if (current.length + newImages.length > MAX_PROPERTY_IMAGES) {
        onError(`Only ${MAX_PROPERTY_IMAGES} property images can be uploaded.`);
      }
      return nextImages;
    });
  }

  function removeImage(index: number) {
    setSelectedImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  async function pickDocuments() {
    onError("");
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ],
    });
    if (result.canceled || !result.assets?.length) return;

    const pickedDocuments = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      type: getDocumentType(asset),
      size: asset.size,
      file: asset.file,
    }));
    setSelectedDocuments((current) => {
      const existingKeys = new Set(
        current.map((document) => `${document.name}:${document.size ?? ""}`),
      );
      return [
        ...current,
        ...pickedDocuments.filter(
          (document) =>
            !existingKeys.has(`${document.name}:${document.size ?? ""}`),
        ),
      ];
    });
  }

  function removeDocument(index: number) {
    setSelectedDocuments((current) =>
      current.filter((_, documentIndex) => documentIndex !== index),
    );
  }

  return {
    clearAttachments,
    pickDocuments,
    pickImages,
    removeDocument,
    removeImage,
    selectedDocuments,
    selectedImages,
  };
}
