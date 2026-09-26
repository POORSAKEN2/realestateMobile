import { Text, View } from "react-native";
import { SelectionCheckbox } from "../ui/SelectionCheckbox";

export function PropertyMultiSelect({
  properties,
  selectedIds,
  onChange,
  disabled = false,
  title = "Assigned properties",
  description = "Select the properties linked to this record.",
}: {
  properties: Array<{ id: string; title: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}) {
  const available = new Set(properties.map((property) => property.id));
  const selected = new Set(selectedIds);
  return (
    <View className="gap-3">
      <Text className="font-ralewayExtraBold text-lg text-textPrimary">
        {title}
      </Text>
      <Text className="text-description">{description}</Text>
      {!properties.length && !selectedIds.length ? (
        <Text className="rounded-2xl bg-primary/5 p-4 text-sm text-description">
          No properties available to assign.
        </Text>
      ) : null}
      {properties.map((property) => (
        <SelectionCheckbox
          disabled={disabled}
          key={property.id}
          label={property.title}
          selected={selected.has(property.id)}
          onPress={() =>
            onChange(
              selected.has(property.id)
                ? selectedIds.filter((id) => id !== property.id)
                : [...selectedIds, property.id],
            )
          }
        />
      ))}
      {selectedIds
        .filter((id) => !available.has(id))
        .map((id) => (
          <SelectionCheckbox
            disabled={disabled}
            key={id}
            label={`Unavailable property (${id})`}
            selected
            onPress={() => onChange(selectedIds.filter((item) => item !== id))}
          />
        ))}
    </View>
  );
}
