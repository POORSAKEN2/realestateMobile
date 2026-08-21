import { useEffect, useState } from "react";

import {
  SearchFilterActions,
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";
import { RadioOptionList } from "../ui/groups/RadioOptionList";
import type { Expense } from "../../types/domain/expenses";
import { formatExpenseCategory } from "../../utils/expenses/expenseDashboard";

export type ExpenseFilters = {
  category: string;
  propertyId: string;
  status: "ALL" | Expense["status"];
};

export const EMPTY_EXPENSE_FILTERS: ExpenseFilters = {
  category: "ALL",
  propertyId: "ALL",
  status: "ALL",
};

const statusOptions: Array<{
  label: string;
  value: ExpenseFilters["status"];
}> = [
  { label: "All statuses", value: "ALL" },
  { label: "Pending", value: "Pending" },
  { label: "Paid", value: "Paid" },
  { label: "Cancelled", value: "Cancelled" },
];

export function ExpenseFilterSheet({
  categories,
  filters,
  onApply,
  onClose,
  properties,
  visible,
}: {
  categories: string[];
  filters: ExpenseFilters;
  onApply: (filters: ExpenseFilters) => void;
  onClose: () => void;
  properties: Array<{ label: string; value: string }>;
  visible: boolean;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  return (
    <SearchFilterSheet
      description="Narrow transactions by property, category, and status."
      footer={
        <SearchFilterActions
          onApply={() => onApply(draft)}
          onReset={() => setDraft(EMPTY_EXPENSE_FILTERS)}
        />
      }
      onClose={onClose}
      title="Filter expenses"
      visible={visible}
    >
      <SearchFilterSection label="Property">
        <RadioOptionList
          onSelect={(propertyId) =>
            setDraft((current) => ({ ...current, propertyId }))
          }
          options={[{ label: "All properties", value: "ALL" }, ...properties]}
          value={draft.propertyId}
        />
      </SearchFilterSection>

      <SearchFilterSection label="Category">
        <RadioOptionList
          onSelect={(category) =>
            setDraft((current) => ({ ...current, category }))
          }
          options={[
            { label: "All categories", value: "ALL" },
            ...categories.map((category) => ({
              label: formatExpenseCategory(category),
              value: category,
            })),
          ]}
          value={draft.category}
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
