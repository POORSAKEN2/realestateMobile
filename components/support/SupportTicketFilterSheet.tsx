import { useEffect, useRef, useState } from "react";
import { Platform, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import {
  SearchFilterActions,
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";
import ChoiceChips from "../ui/chips/ChoiceChips";
import {
  DEFAULT_TICKET_FILTERS,
  TICKET_SORT_OPTIONS,
  selectTicketSort,
  ticketSortSummary,
  type TicketListFilters,
} from "../../utils/support/ticketList";

type FilterOption = { label: string; value: string };

function selectedFilterValues(current: string[], next: string[]) {
  if (current.length > 0 && next.includes("ALL")) return [];
  return next.filter((value) => value !== "ALL");
}

const CHIP_STYLES = {
  activeClassName: "border-primary bg-iconSurface",
  activeTextClassName: "text-primaryContent",
  showSelectionIndicator: true,
};

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
      description="Choose statuses, priorities, and a display order."
      visible={visible}
      onClose={onClose}
      footer={
        <SearchFilterActions
          onApply={() => onApply(draft)}
          onReset={() => setDraft(DEFAULT_TICKET_FILTERS)}
        />
      }
    >
      <SearchFilterSection label="Status">
        <ChoiceChips
          {...CHIP_STYLES}
          isMultiSelect
          options={statuses}
          value={draft.statuses.length ? draft.statuses : ["ALL"]}
          onSelect={(next) =>
            setDraft((current) => ({
              ...current,
              statuses: selectedFilterValues(current.statuses, next),
            }))
          }
        />
      </SearchFilterSection>
      <SearchFilterSection label="Priority">
        <ChoiceChips
          {...CHIP_STYLES}
          isMultiSelect
          options={priorities}
          value={draft.priorities.length ? draft.priorities : ["ALL"]}
          onSelect={(next) =>
            setDraft((current) => ({
              ...current,
              priorities: selectedFilterValues(current.priorities, next),
            }))
          }
        />
      </SearchFilterSection>
      <SearchFilterSection label="Sort by">
        <ChoiceChips
          {...CHIP_STYLES}
          options={TICKET_SORT_OPTIONS.map((option) => ({
            ...option,
            trailingIcon: (
              <Feather
                name={
                  draft.sort.directions[option.value] === "asc"
                    ? "arrow-up"
                    : "arrow-down"
                }
                size={14}
                color={
                  draft.sort.field === option.value
                    ? colors.primaryContent
                    : colors.text
                }
              />
            ),
            accessibilityLabel: `${ticketSortSummary(draft.sort, option.value)}, ${draft.sort.directions[option.value] === "asc" ? "ascending" : "descending"}`,
            accessibilityHint:
              draft.sort.field === option.value
                ? "Tap again to reverse the sorting order."
                : "Select this sorting option. Tap again to reverse its order.",
          }))}
          value={draft.sort.field}
          onSelect={(field) =>
            setDraft((current) => ({
              ...current,
              sort: selectTicketSort(current.sort, field),
            }))
          }
        />
        <Text className="font-raleway text-xs text-description">
          Tap the selected option again to reverse its order.
        </Text>
      </SearchFilterSection>
    </SearchFilterSheet>
  );
}
