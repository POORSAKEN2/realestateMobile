import { SearchToolbar } from "../ui/SearchToolbar";

export function DocumentsToolbar({
  activeFilterCount,
  onChangeSearch,
  onOpenFilters,
  searchQuery,
}: {
  activeFilterCount: number;
  onChangeSearch: (query: string) => void;
  onOpenFilters: () => void;
  searchQuery: string;
}) {
  return (
    <SearchToolbar
      accessibilityLabel="Search documents, properties, or tenants"
      activeFilterCount={activeFilterCount}
      clearAccessibilityLabel="Clear document search"
      filterAccessibilityLabel={
        activeFilterCount
          ? `More document filters, ${activeFilterCount} active`
          : "More document filters"
      }
      onChangeText={onChangeSearch}
      onFilterPress={onOpenFilters}
      placeholder="Search documents, properties, tenants"
      value={searchQuery}
    />
  );
}
