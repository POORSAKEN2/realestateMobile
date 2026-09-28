import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { API_BASE_URL } from "../../api/config";

/** Tokens stay in headers; evidence is removed from app cache after inspection. */
export async function openPrivateEvidence(
  path: string,
  name: string,
  token: string,
  isCurrent: () => boolean,
) {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
  });
  if (!response.ok)
    throw new Error(`Evidence unavailable (${response.status}).`);
  const bytes = await response.arrayBuffer();
  if (!isCurrent()) throw new Error("Session changed. Sign in again.");
  const mime =
    response.headers.get("content-type") ?? "application/octet-stream";
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File inspection is unavailable on this device.");
  const file = new File(
    Paths.cache,
    `verification-${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
  );
  try {
    file.write(new Uint8Array(bytes));
    if (!isCurrent()) throw new Error("Session changed. Sign in again.");
    await Sharing.shareAsync(file.uri, { mimeType: mime });
  } finally {
    if (file.exists) file.delete();
  }
}
