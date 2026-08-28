import type { PropertyDocument } from "../../types";

export function getSelectableTenantDocuments(
  documents: PropertyDocument[],
  query = "",
) {
  const normalizedQuery = query.trim().toLowerCase();

  return documents.filter((document) => {
    if (document.lesseeId) return false;
    if (!normalizedQuery) return true;

    return [document.name, document.category, document.type, document.size]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}
