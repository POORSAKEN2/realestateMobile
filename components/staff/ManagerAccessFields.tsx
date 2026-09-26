import { Text, View } from "react-native";
import type { ManagerPermissionGroup } from "../../types/domain/staff";
import { PropertyMultiSelect } from "../properties/PropertyMultiSelect";
import { SelectionCheckbox } from "../ui/SelectionCheckbox";
export function PropertyAssignmentFields({
  properties,
  selectedIds,
  onChange,
  disabled = false,
}: {
  properties: Array<{ id: string; title: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <PropertyMultiSelect
      disabled={disabled}
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
  disabled = false,
}: {
  groups: ManagerPermissionGroup[];
  permissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}) {
  const selectedPermissions = new Set(permissions);
  return (
    <View className="gap-4">
      <Text className="font-ralewayExtraBold text-lg text-textPrimary">
        Allowed actions
      </Text>
      <Text className="text-description">
        Review allowed actions. Property access also requires assignments; no
        selected actions means no access to those modules.
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
                <SelectionCheckbox
                  disabled={disabled}
                  key={option.label}
                  label={`${group.label}: ${option.label}`}
                  selected={selected}
                  onPress={() =>
                    onChange(
                      selected
                        ? permissions.filter(
                            (grant) => !option.grants.includes(grant),
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
