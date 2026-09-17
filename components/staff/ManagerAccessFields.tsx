import { Text, TouchableOpacity, View } from "react-native";
import type { ManagerPermissionGroup } from "../../types/domain/staff";
import { PropertyMultiSelect } from "../properties/PropertyMultiSelect";
function Check({
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
      accessibilityLabel={label}
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
export function PropertyAssignmentFields({
  properties,
  selectedIds,
  onChange,
}: {
  properties: Array<{ id: string; title: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <PropertyMultiSelect
      properties={properties}
      selectedIds={selectedIds}
      onChange={onChange}
      description="Managers can access only selected properties. No selection means no property access."
    />
  );
}
export function ManagerPermissionFields({
  groups,
  permissions,
  onChange,
}: {
  groups: ManagerPermissionGroup[];
  permissions: string[];
  onChange: (permissions: string[]) => void;
}) {
  const selectedPermissions = new Set(permissions);
  return (
    <View className="gap-4">
      <Text className="font-ralewayExtraBold text-lg">Allowed actions</Text>
      <Text className="text-description">
        New managers start with no operational access. Select only the actions
        they need.
      </Text>
      {groups.map((group) => (
        <View key={group.label} className="gap-2">
          <Text className="font-ralewayBold text-textPrimary">
            {group.label}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {group.options.map((option) => {
              const selected = option.grants.every((grant) =>
                selectedPermissions.has(grant),
              );
              return (
                <Check
                  key={option.label}
                  label={`${group.label}: ${option.label}`}
                  selected={selected}
                  onPress={() =>
                    onChange(
                      selected
                        ? permissions.filter(
                            (grant) => !option.grants.includes(grant as never),
                          )
                        : [...new Set([...permissions, ...option.grants])],
                    )
                  }
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
