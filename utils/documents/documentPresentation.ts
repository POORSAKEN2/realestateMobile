import type {
  DocumentCategory,
  Lessee,
  Property,
  PropertyDocument,
} from "../../types";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "Leases",
  "Compliance",
  "Maintenance",
  "Contracts",
];

export type DocumentCategoryFilter = DocumentCategory | "All";
export type DocumentTypeFilter = PropertyDocument["type"] | "All";
export type DocumentSort = "newest" | "oldest" | "name";

export type DocumentAdvancedFilters = {
  propertyId: string;
  lesseeId: string;
  type: DocumentTypeFilter;
};

export const EMPTY_DOCUMENT_FILTERS: DocumentAdvancedFilters = {
  propertyId: "",
  lesseeId: "",
  type: "All",
};

export const DOCUMENT_SORT_OPTIONS: Array<{
  label: string;
  value: DocumentSort;
}> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Name A–Z", value: "name" },
];

type CategoryPresentation = {
  backgroundColor: string;
  label: string;
  color: string;
};

const categoryPresentation: Record<DocumentCategory, CategoryPresentation> = {
  Leases: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    label: "LEASE",
  },
  Compliance: {
    backgroundColor: "#F0FDF4",
    color: "#15803D",
    label: "COMPLIANCE",
  },
  Maintenance: {
    backgroundColor: "#FFF7ED",
    color: "#C2410C",
    label: "MAINTENANCE",
  },
  Contracts: {
    backgroundColor: "#F5F3FF",
    color: "#7C3AED",
    label: "CONTRACT",
  },
};

export function getCategoryPresentation(category: string) {
  return (
    categoryPresentation[category as DocumentCategory] ?? {
      backgroundColor: "#F1F5F9",
      color: "#475569",
      label: category.toUpperCase(),
    }
  );
}

export function getDocumentIcon(type: PropertyDocument["type"]) {
  if (type === "DOCX") return "file-word-outline" as const;
  if (type === "JPG" || type === "PNG") return "file-image-outline" as const;
  return "file-pdf-box" as const;
}

export function formatDocumentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Date unavailable";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === new Date().getFullYear()
      ? {}
      : { year: "numeric" as const }),
  });
}

function getDateValue(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function buildDocumentLookup<T extends { id: string }>(items: T[]) {
  return items.reduce<Record<string, T>>((lookup, item) => {
    lookup[item.id] = item;
    return lookup;
  }, {});
}

export function countAdvancedFilters(filters: DocumentAdvancedFilters) {
  return [filters.propertyId, filters.lesseeId, filters.type !== "All"].filter(
    Boolean,
  ).length;
}

export function filterAndSortDocuments({
  category,
  documents,
  filters,
  lesseeLookup,
  propertyLookup,
  searchQuery,
  sort,
}: {
  category: DocumentCategoryFilter;
  documents: PropertyDocument[];
  filters: DocumentAdvancedFilters;
  lesseeLookup: Record<string, Lessee>;
  propertyLookup: Record<string, Property>;
  searchQuery: string;
  sort: DocumentSort;
}) {
  const query = searchQuery.trim().toLowerCase();

  const filtered = documents.filter((document) => {
    const property = document.propertyId
      ? propertyLookup[document.propertyId]
      : undefined;
    const lessee = document.lesseeId
      ? lesseeLookup[document.lesseeId]
      : undefined;
    const searchable = [
      document.name,
      document.category,
      document.type,
      property?.title,
      lessee?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (category === "All" || document.category === category) &&
      (!filters.propertyId || document.propertyId === filters.propertyId) &&
      (!filters.lesseeId || document.lesseeId === filters.lesseeId) &&
      (filters.type === "All" || document.type === filters.type) &&
      (!query || searchable.includes(query))
    );
  });

  return filtered.sort((left, right) => {
    if (sort === "name") return left.name.localeCompare(right.name);

    const difference = getDateValue(right.date) - getDateValue(left.date);
    return sort === "newest" ? difference : -difference;
  });
}
