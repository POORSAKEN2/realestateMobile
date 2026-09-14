export type LegalDocument = "privacy" | "terms";

export const LEGAL_DOCUMENT_URLS: Record<LegalDocument, string | null> = {
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || null,
  terms: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || null,
};
