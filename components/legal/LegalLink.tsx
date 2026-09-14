import type { PropsWithChildren } from "react";
import { Alert, Linking, Text } from "react-native";

import { LEGAL_DOCUMENT_URLS, type LegalDocument } from "../../constants/legal";

export function LegalLink({
  children,
  className,
  document,
}: PropsWithChildren<{ className?: string; document: LegalDocument }>) {
  async function openDocument() {
    const url = LEGAL_DOCUMENT_URLS[document];
    const title = document === "terms" ? "Terms of Service" : "Privacy Policy";

    if (!url) {
      Alert.alert(
        `${title} unavailable`,
        "This build is missing its legal URL.",
      );
      return;
    }

    try {
      if (!(await Linking.canOpenURL(url))) throw new Error("Unsupported URL");
      await Linking.openURL(url);
    } catch {
      Alert.alert(`${title} unavailable`, "Please try again later.");
    }
  }

  return (
    <Text
      accessibilityRole="link"
      className={className}
      onPress={() => void openDocument()}
    >
      {children}
    </Text>
  );
}
