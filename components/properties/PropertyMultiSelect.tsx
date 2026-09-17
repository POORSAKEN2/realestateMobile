import { Text, TouchableOpacity, View } from "react-native";

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-11 justify-center rounded-xl border px-3 py-2 ${selected ? "border-primary bg-primary/10" : "border-primary/20"}`}
    >
      <Text
        className={
          selected ? "font-ralewayBold text-primary" : "text-description"
        }
      >
        {selected ? "✓ " : ""}
        {label}
      </Text>
    </TouchableOpacity>
  );
}
export function PropertyMultiSelect({
  properties,
  selectedIds,
  onChange,
  title = "Assigned properties",
  description = "Select the properties linked to this record.",
}: {
  properties: Array<{ id: string; title: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  title?: string;
  description?: string;
}) {
  const available = new Set(properties.map((property) => property.id));
  const selected = new Set(selectedIds);
  return (
    <View className="gap-3">
      <Text className="font-ralewayExtraBold text-lg">{title}</Text>
      <Text className="text-description">{description}</Text>
      {properties.map((property) => (
        <Choice
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
          <Choice
            key={id}
            label={`Unavailable property (${id})`}
            selected
            onPress={() => onChange(selectedIds.filter((item) => item !== id))}
          />
        ))}
    </View>
  );
}
