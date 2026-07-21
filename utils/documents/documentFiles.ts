import * as DocumentPicker from "expo-document-picker";

import type { DocumentUpload } from "../../types";

const allowedDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const allowedDocumentExtensions = new Set([
  "pdf",
  "doc",
  "docx",
  "jpg",
  "jpeg",
  "png",
]);
const maximumDocumentSize = 10 * 1024 * 1024;

export type DocumentFileResult =
  | { file: DocumentUpload; ok: true }
  | { error: string; ok: false }
  | null;

export async function chooseDocumentFile(): Promise<DocumentFileResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      // Android providers can disable valid files when a MIME filter is used.
      // Select broadly, then validate consistently here.
      type: "*/*",
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    if (!isSupportedDocument(asset)) {
      return {
        error: "Choose a PDF, DOC, DOCX, JPG, or PNG file.",
        ok: false,
      };
    }
    if ((asset.size ?? 0) > maximumDocumentSize) {
      return { error: "Choose a file smaller than 10 MB.", ok: false };
    }

    return {
      file: {
        file: asset.file,
        name: asset.name,
        size: asset.size,
        type: getDocumentType(asset),
        uri: asset.uri,
      },
      ok: true,
    };
  } catch {
    return {
      error: "File picker could not open. Please try again.",
      ok: false,
    };
  }
}

function getDocumentExtension(asset: DocumentPicker.DocumentPickerAsset) {
  return asset.name.split(".").pop()?.toLowerCase();
}

function isSupportedDocument(asset: DocumentPicker.DocumentPickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase();
  return Boolean(
    (mimeType && allowedDocumentTypes.includes(mimeType)) ||
    allowedDocumentExtensions.has(getDocumentExtension(asset) ?? ""),
  );
}

function getDocumentType(asset: DocumentPicker.DocumentPickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType && allowedDocumentTypes.includes(mimeType)) return mimeType;

  const extension = getDocumentExtension(asset);
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}
