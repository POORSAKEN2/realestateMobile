import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { AuditFilters } from "../../types/domain/audit";
import { SearchFilterSheet } from "../ui/SearchFilterSheet";

const fields: Array<[keyof AuditFilters, string, string]> = [
  ["actor_id", "Actor ID", "Actor ID"],
  ["action", "Action", "e.g. property.published"],
  ["entity", "Entity", "e.g. Property"],
  ["property_id", "Property ID", "Property ID"],
  ["start_date", "From date", "YYYY-MM-DD"],
  ["end_date", "To date", "YYYY-MM-DD"],
];
const buttonStyle = "rounded-xl bg-primary/10 px-4 py-3";

export function AuditFilterSheet({
  visible,
  draft,
  onChange,
  onClose,
  onApply,
}: {
  visible: boolean;
  draft: AuditFilters;
  onChange: (draft: AuditFilters) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <SearchFilterSheet
      title="Audit filters"
      description="Combine filters to narrow your investigation."
      visible={visible}
      onClose={onClose}
    >
      {fields.map(([key, label, placeholder]) => (
        <View key={key} className="gap-2">
          <Text className="font-ralewayBold text-textPrimary">{label}</Text>
          <TextInput
            accessibilityLabel={label}
            autoCapitalize="none"
            value={draft[key] ?? ""}
            onChangeText={(value) =>
              onChange({ ...draft, [key]: value.trim() || undefined })
            }
            placeholder={placeholder}
            className="rounded-xl bg-surface px-4 py-3 text-textPrimary"
          />
        </View>
      ))}
      <Text className="font-ralewayBold text-textPrimary">Result</Text>
      <View className="flex-row flex-wrap gap-2">
        {["", "success", "failure", "denied"].map((result) => (
          <TouchableOpacity
            key={result}
            accessibilityRole="radio"
            accessibilityState={{ selected: (draft.result ?? "") === result }}
            className={buttonStyle}
            onPress={() => onChange({ ...draft, result: result || undefined })}
          >
            <Text className="text-primary">
              {result || "All"}
              {(draft.result ?? "") === result ? " ✓" : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        className={buttonStyle}
        onPress={onApply}
      >
        <Text className="text-center font-ralewayBold text-primary">
          Apply filters
        </Text>
      </TouchableOpacity>
    </SearchFilterSheet>
  );
}
