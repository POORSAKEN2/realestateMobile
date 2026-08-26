import { useEffect, useState } from "react";

import {
  SearchFilterActions,
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";
import { RadioOptionList } from "../ui/groups/RadioOptionList";
import type { Property } from "../../types";

export type TenantFilters = {
  linkage: "ALL" | "LINKED" | "UNLINKED";
  propertyId: string;
};

export const EMPTY_TENANT_FILTERS: TenantFilters = {
  linkage: "ALL",
  propertyId: "ALL",
};

const linkageOptions = [
  { label: "All tenants", value: "ALL" },
  { label: "Linked to a lease", value: "LINKED" },
  { label: "Not linked", value: "UNLINKED" },
] as const;

export function getTenantFilterLabel(filters: TenantFilters) {
  if (filters.propertyId !== "ALL" && filters.linkage !== "ALL") {
    return "Property and linkage";
  }
  if (filters.propertyId !== "ALL") return "Selected property";
  return (
    linkageOptions.find((option) => option.value === filters.linkage)?.label ??
    "All tenants"
  );
}

export function TenantFilterSheet({
  filters,
  onApply,
  onClose,
  properties,
  visible,
}: {
  filters: TenantFilters;
  onApply: (filters: TenantFilters) => void;
  onClose: () => void;
  properties: Property[];
  visible: boolean;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  return (
    <SearchFilterSheet
      description="Narrow tenants by property and lease linkage."
      footer={
        <SearchFilterActions
          onApply={() => onApply(draft)}
          onReset={() => setDraft(EMPTY_TENANT_FILTERS)}
        />
      }
      onClose={onClose}
      title="Filter tenants"
      visible={visible}
    >
      <SearchFilterSection label="Property">
        <RadioOptionList
          onSelect={(propertyId) =>
            setDraft((current) => ({ ...current, propertyId }))
          }
          options={[
            { label: "All properties", value: "ALL" },
            ...properties.map((property) => ({
              label: property.title,
              value: property.id,
            })),
          ]}
          value={draft.propertyId}
        />
      </SearchFilterSection>

      <SearchFilterSection label="Lease linkage">
        <RadioOptionList
          onSelect={(linkage) =>
            setDraft((current) => ({ ...current, linkage }))
          }
          options={linkageOptions}
          value={draft.linkage}
        />
      </SearchFilterSection>
    </SearchFilterSheet>
  );
}
