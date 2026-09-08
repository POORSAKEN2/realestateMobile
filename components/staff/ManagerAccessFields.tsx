import { Text, TouchableOpacity, View } from "react-native";
import { MANAGER_PERMISSION_GROUPS } from "../../utils/staff/managerPermissions";
function Check({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={label}
    onPress={onPress} className={`min-h-11 justify-center rounded-xl border px-3 py-2 ${selected ? "border-primary bg-primary/10" : "border-primary/20"}`}>
    <Text className={selected ? "font-ralewayBold text-primary" : "text-description"}>{selected ? "✓ " : ""}{label}</Text>
  </TouchableOpacity>;
}
export function PropertyAssignmentFields({ properties, selectedIds, onChange }: {
  properties: Array<{ id: string; title: string }>; selectedIds: string[]; onChange: (ids: string[]) => void;
}) {
  const missing = selectedIds.filter((id) => !properties.some((property) => property.id === id));
  return <View className="gap-3"><Text className="font-ralewayExtraBold text-lg">Assigned properties</Text>
    <Text className="text-description">Managers can access only selected properties. No selection means no property access.</Text>
    {properties.map((property) => <Check key={property.id} label={property.title} selected={selectedIds.includes(property.id)}
      onPress={() => onChange(selectedIds.includes(property.id) ? selectedIds.filter((id) => id !== property.id) : [...selectedIds, property.id])} />)}
    {missing.map((id) => <Check key={id} label={`Unavailable property (${id})`} selected onPress={() => onChange(selectedIds.filter((item) => item !== id))} />)}
  </View>;
}
export function ManagerPermissionFields({ permissions, onChange }: { permissions: string[]; onChange: (permissions: string[]) => void }) {
  return <View className="gap-4"><Text className="font-ralewayExtraBold text-lg">Allowed actions</Text>
    {MANAGER_PERMISSION_GROUPS.map((group) => <View key={group.label} className="gap-2">
      <Text className="font-ralewayBold text-textPrimary">{group.label}</Text><View className="flex-row flex-wrap gap-2">
        {group.options.map((option) => {
          const selected = option.grants.every((grant) => permissions.includes(grant));
          return <Check key={option.label} label={`${group.label}: ${option.label}`} selected={selected} onPress={() =>
            onChange(selected ? permissions.filter((grant) => !option.grants.includes(grant as never)) : [...new Set([...permissions, ...option.grants])])} />;
        })}
      </View></View>)}
  </View>;
}
