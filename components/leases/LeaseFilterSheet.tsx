import { useEffect, useState } from "react";

import {
  SearchFilterActions,
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";
import { RadioOptionList } from "../ui/groups/RadioOptionList";
import type { Lessee, Property } from "../../types";

export type LeaseFilters = {
  lesseeId: string;
  propertyId: string;
  status: "ALL" | "Active" | "Expired" | "Terminated";
};

export const EMPTY_LEASE_FILTERS: LeaseFilters = {
  lesseeId: "ALL",
  propertyId: "ALL",
  status: "ALL",
};

const statusOptions = [
  { label: "All statuses", value: "ALL" },
  { label: "Active", value: "Active" },
  { label: "Expired", value: "Expired" },
  { label: "Terminated", value: "Terminated" },
] as const;

export function LeaseFilterSheet({
  filters,
  lessees,
  onApply,
  onClose,
  properties,
  visible,
}: {
  filters: LeaseFilters;
  lessees: Lessee[];
  onApply: (filters: LeaseFilters) => void;
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
      description="Narrow contracts by property, tenant, and status."
      footer={
        <SearchFilterActions
          onApply={() => onApply(draft)}
          onReset={() => setDraft(EMPTY_LEASE_FILTERS)}
        />
      }
      onClose={onClose}
      title="Filter leases"
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

      <SearchFilterSection label="Tenant">
        <RadioOptionList
          onSelect={(lesseeId) =>
            setDraft((current) => ({ ...current, lesseeId }))
          }
          options={[
            { label: "All tenants", value: "ALL" },
            ...lessees.map((lessee) => ({
              label: lessee.name,
              value: lessee.id,
            })),
          ]}
          value={draft.lesseeId}
        />
      </SearchFilterSection>

      <SearchFilterSection label="Status">
        <RadioOptionList
          onSelect={(status) => setDraft((current) => ({ ...current, status }))}
          options={statusOptions}
          value={draft.status}
        />
      </SearchFilterSection>
    </SearchFilterSheet>
  );
}
