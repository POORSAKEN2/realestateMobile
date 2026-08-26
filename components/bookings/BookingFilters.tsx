import { useEffect, useState } from "react";

import {
  SearchFilterActions,
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";
import { RadioOptionList } from "../ui/groups/RadioOptionList";
import type { Property } from "../../types";
import type { StatusFilter } from "../../utils/bookings/bookingCalendar";

const statusOptions = [
  { label: "Confirmed", value: "Booked" },
  { label: "All statuses", value: "All" },
] as const;

type BookingFilters = {
  propertyId: string;
  status: StatusFilter;
};

export function BookingFilterSheet({
  buildings,
  onApply,
  onClose,
  selectedBuildingId,
  selectedStatus,
  visible,
}: {
  buildings: Property[];
  onApply: (filters: BookingFilters) => void;
  onClose: () => void;
  selectedBuildingId: string;
  selectedStatus: StatusFilter;
  visible: boolean;
}) {
  const [draft, setDraft] = useState<BookingFilters>({
    propertyId: selectedBuildingId,
    status: selectedStatus,
  });

  useEffect(() => {
    if (!visible) return;
    setDraft({ propertyId: selectedBuildingId, status: selectedStatus });
  }, [selectedBuildingId, selectedStatus, visible]);

  return (
    <SearchFilterSheet
      description="Choose a property calendar and reservation status."
      footer={
        <SearchFilterActions
          onApply={() => onApply(draft)}
          onReset={() =>
            setDraft({
              propertyId: buildings[0]?.id ?? "",
              status: "Booked",
            })
          }
        />
      }
      onClose={onClose}
      title="Filter bookings"
      visible={visible}
    >
      <SearchFilterSection label="Property calendar">
        <RadioOptionList
          onSelect={(propertyId) =>
            setDraft((current) => ({ ...current, propertyId }))
          }
          options={buildings.map((building) => ({
            label: building.title,
            value: building.id,
          }))}
          value={draft.propertyId}
        />
      </SearchFilterSection>

      <SearchFilterSection label="Reservation status">
        <RadioOptionList
          onSelect={(status) => setDraft((current) => ({ ...current, status }))}
          options={statusOptions}
          value={draft.status}
        />
      </SearchFilterSection>
    </SearchFilterSheet>
  );
}
