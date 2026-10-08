import { useEffect, useRef, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import {
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";
import { RadioOptionList } from "../ui/groups/RadioOptionList";
import { ModalActionFooter } from "../ui/ModalActionFooter";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import {
  DEFAULT_TICKET_FILTERS,
  TICKET_SORT_OPTIONS,
  type TicketListFilters,
} from "../../utils/support/ticketList";

type FilterOption = { label: string; value: string };

export function SupportTicketFilterSheet({
  filters,
  statuses,
  priorities,
  visible,
  onApply,
  onClose,
}: {
  filters: TicketListFilters;
  statuses: FilterOption[];
  priorities: FilterOption[];
  visible: boolean;
  onApply: (filters: TicketListFilters) => void;
  onClose: () => void;
}) {
  const palette = useThemeColors();
  const [draft, setDraft] = useState(filters);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const previousFocus = document.activeElement;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeRef.current();
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("keydown", closeOnEscape, true);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [visible]);

  return (
    <SearchFilterSheet
      title="Sort & Filter Tickets"
      description="Choose a status, priority, and display order."
      visible={visible}
      onClose={onClose}
      footer={
        <ModalActionFooter>
          <View className="flex-row gap-3">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Reset ticket filters"
              className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-primary bg-panel px-3 py-3"
              onPress={() => setDraft(DEFAULT_TICKET_FILTERS)}
            >
              <Text className="text-center font-ralewayBold text-base text-primaryContent">
                Reset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Apply ticket filters"
              className="min-h-14 flex-1 items-center justify-center rounded-2xl px-3 py-3"
              style={{ backgroundColor: palette.primaryStrong }}
              onPress={() => onApply(draft)}
            >
              <Text className="text-center font-ralewayBold text-base text-whitePrimary">
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </ModalActionFooter>
      }
    >
      <SearchFilterSection label="Status">
        <RadioOptionList
          options={statuses}
          value={draft.status}
          onSelect={(status) => setDraft((current) => ({ ...current, status }))}
        />
      </SearchFilterSection>
      <SearchFilterSection label="Priority">
        <RadioOptionList
          options={priorities}
          value={draft.priority}
          onSelect={(priority) =>
            setDraft((current) => ({ ...current, priority }))
          }
        />
      </SearchFilterSection>
      <SearchFilterSection label="Sort by">
        <RadioOptionList
          options={TICKET_SORT_OPTIONS}
          value={draft.sort}
          onSelect={(sort) => setDraft((current) => ({ ...current, sort }))}
        />
      </SearchFilterSection>
    </SearchFilterSheet>
  );
}
