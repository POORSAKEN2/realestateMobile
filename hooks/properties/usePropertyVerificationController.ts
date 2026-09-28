import { useState } from "react";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { uploadVerificationEvidence } from "../../api/propertyVerification";
import { usePropertyVerification } from "./usePropertyVerification";

export function usePropertyVerificationController(propertyId: string) {
  const [page, setPage] = useState(1);
  const { query, action } = usePropertyVerification(propertyId, page);
  const [feedback, setFeedback] = useState<{
    message: string;
    failed: boolean;
  } | null>(null);
  async function run(operation: () => Promise<unknown>, success?: string) {
    setFeedback(null);
    try {
      await action.mutateAsync(operation);
      if (success) setFeedback({ message: success, failed: false });
      return true;
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error
            ? error.message
            : "Verification action failed.",
        failed: true,
      });
      return false;
    }
  }
  async function upload(id: string, type: string) {
    let uploaded = false;
    const succeeded = await run(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (!file) throw new Error("No evidence selected.");
      try {
        if ((file.size ?? 0) > (query.data?.policy.max_file_kb ?? 0) * 1024)
          throw new Error("File exceeds the evidence upload limit.");
        const body = new FormData();
        body.append("type", type);
        if (Platform.OS === "web")
          body.append("file", await (await fetch(file.uri)).blob(), file.name);
        else
          body.append("file", {
            uri: file.uri,
            name: file.name,
            type: file.mimeType ?? "application/octet-stream",
          } as unknown as Blob);
        await uploadVerificationEvidence(propertyId, id, body);
        uploaded = true;
      } finally {
        if (Platform.OS !== "web") {
          const cache = new File(file.uri);
          if (cache.exists) cache.delete();
        }
      }
    });
    if (succeeded && uploaded)
      setFeedback({ message: "Evidence uploaded.", failed: false });
  }
  return { page, setPage, query, action, feedback, run, upload };
}
