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
    backgroundColor: "#FAF9F9",
    color: "#634CE4",
    label: "LEASE",
  },
  Compliance: {
    backgroundColor: "#BEE3DB",
    color: "#1E1F45",
    label: "COMPLIANCE",
  },
  Maintenance: {
    backgroundColor: "#8A77F4",
    color: "#FFFFFF",
    label: "MAINTENANCE",
  },
  Contracts: {
    backgroundColor: "#634CE4",
    color: "#FFFFFF",
    label: "CONTRACT",
  },
};

export function getCategoryPresentation(category: string) {
  return (
    categoryPresentation[category as DocumentCategory] ?? {
      backgroundColor: "#FAF9F9",
      color: "#1E1F45",
      label: category.toUpperCase(),
    }
  );
}

const documentTypePresentation = {
  PDF: {
    backgroundColor: "#FDECEC",
    color: "#D32F2F",
    icon: "file-pdf-box",
  },
  DOCX: {
    backgroundColor: "#E8F0FB",
    color: "#2B579A",
    icon: "file-word-outline",
  },
  JPG: {
    backgroundColor: "#FEF3C7",
    color: "#B45309",
    icon: "file-jpg-box",
  },
  PNG: {
    backgroundColor: "#D1FAE5",
    color: "#047857",
    icon: "file-png-box",
  },
} as const satisfies Record<
  PropertyDocument["type"],
  { backgroundColor: string; color: string; icon: string }
>;

export function getDocumentTypePresentation(type: PropertyDocument["type"]) {
  return documentTypePresentation[type];
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
