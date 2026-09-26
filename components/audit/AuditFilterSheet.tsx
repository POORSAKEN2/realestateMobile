import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { AuditFilters } from "../../types/domain/audit";
import {
  auditFilterErrors,
  auditLabel,
  localAuditDate,
} from "../../utils/audit/presentation";
import {
  SearchFilterActions,
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";
import { BaseField } from "../ui/fields/BaseField";
import { DropdownField } from "../ui/fields/DropdownField";
import { PickerField } from "../ui/fields/PickerField";
import { DateTimePickerModal } from "../ui/fields/DateTimePickerModal";
import ChoiceChips from "../ui/chips/ChoiceChips";

const identityFields = [
  ["actor_id", "Actor ID", "Paste a complete actor ID"],
  ["property_id", "Property ID", "Paste a complete property ID"],
] as const;
const resultOptions = [
  { label: "All", value: "" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failure" },
  { label: "Denied", value: "denied" },
];
type DateKey = "start_date" | "end_date";
const dateLabels: Record<DateKey, string> = {
  start_date: "From date",
  end_date: "To date",
};

export function AuditFilterSheet({
  visible,
  draft,
  entities = [],
  onChange,
  onClose,
  onApply,
}: {
  visible: boolean;
  draft: AuditFilters;
  entities?: string[];
  onChange: (draft: AuditFilters) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const [attempted, setAttempted] = useState(false);
  const [dateKey, setDateKey] = useState<DateKey | null>(null);
  useEffect(() => {
    setAttempted(false);
    setDateKey(null);
  }, [visible]);
  const errors = attempted ? auditFilterErrors(draft) : {};
  const selectedDate =
    dateKey && draft[dateKey]
      ? new Date(`${draft[dateKey]}T12:00:00`)
      : new Date();
  function apply() {
    setAttempted(true);
    if (!Object.keys(auditFilterErrors(draft)).length) onApply();
  }
  return (
    <SearchFilterSheet
      title="Audit filters"
      description="Combine filters to narrow your investigation. IDs can be copied from event details."
      visible={visible}
      onClose={onClose}
      footer={
        <SearchFilterActions
          onApply={apply}
          onReset={() => {
            onChange({});
            setAttempted(false);
          }}
        />
      }
    >
      <SearchFilterSection label="Event">
        {entities.length ? (
          <DropdownField
            label="Entity"
            variant="filled"
            value={draft.entity ?? ""}
            options={[
              { label: "All entities", value: "" },
              ...entities.map((entity) => ({
                label: auditLabel(entity),
                value: entity,
              })),
            ]}
            onSelect={(entity) => onChange({ ...draft, entity })}
          />
        ) : (
          <BaseField
            label="Entity"
            variant="filled"
            value={draft.entity ?? ""}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="e.g. Property"
            onChangeText={(entity) => onChange({ ...draft, entity })}
          />
        )}
        <BaseField
          label="Action"
          variant="filled"
          value={draft.action ?? ""}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
          placeholder="e.g. property.published"
          onChangeText={(action) => onChange({ ...draft, action })}
        />
        <Text className="font-ralewaySemiBold text-sm text-description">
          Result
        </Text>
        <ChoiceChips
          options={resultOptions}
          value={draft.result ?? ""}
          onSelect={(result) => onChange({ ...draft, result })}
        />
      </SearchFilterSection>
      <SearchFilterSection label="Date range">
        {(["start_date", "end_date"] as const).map((key) => (
          <View key={key} className="gap-2">
            <PickerField
              label={dateLabels[key]}
              variant="filled"
              value={draft[key]}
              placeholder="Any date"
              onPress={() => setDateKey(key)}
            />
            {draft[key] ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Clear ${dateLabels[key]}`}
                className="min-h-11 justify-center"
                onPress={() => onChange({ ...draft, [key]: undefined })}
              >
                <Text className="font-ralewaySemiBold text-xs text-primary">
                  Clear date
                </Text>
              </TouchableOpacity>
            ) : null}
            {errors[key] ? (
              <Text accessibilityRole="alert" className="text-xs text-danger">
                {errors[key]}
              </Text>
            ) : null}
          </View>
        ))}
        <Text className="text-xs text-description">
          Your plan's retention limit still applies to this range. Reset removes
          all filters.
        </Text>
      </SearchFilterSection>
      <SearchFilterSection label="Actor and property">
        {identityFields.map(([key, label, placeholder]) => (
          <View key={key} className="gap-2">
            <BaseField
              label={label}
              variant="filled"
              value={draft[key] ?? ""}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={50}
              placeholder={placeholder}
              onChangeText={(value) => onChange({ ...draft, [key]: value })}
            />
            {errors[key] ? (
              <Text accessibilityRole="alert" className="text-xs text-danger">
                {errors[key]}
              </Text>
            ) : null}
          </View>
        ))}
      </SearchFilterSection>
      {visible && dateKey ? (
        <DateTimePickerModal
          key={dateKey}
          mode="date"
          title={dateLabels[dateKey]}
          value={
            Number.isNaN(selectedDate.getTime()) ? new Date() : selectedDate
          }
          onClose={() => setDateKey(null)}
          onConfirm={(date) =>
            onChange({ ...draft, [dateKey]: localAuditDate(date) })
          }
        />
      ) : null}
    </SearchFilterSheet>
  );
}
