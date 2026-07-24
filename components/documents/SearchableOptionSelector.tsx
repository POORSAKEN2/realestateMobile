import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type SearchableOption = { id: string; label: string };

export function SelectionField({
  label,
  onPress,
  value,
}: {
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <View className="gap-2">
      <Text className="font-ralewaySemiBold text-sm text-slate-600">{label}</Text>
      <TouchableOpacity
        accessibilityLabel={`${label}, ${value}`}
        accessibilityRole="button"
        activeOpacity={0.8}
        className="min-h-14 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4"
        onPress={onPress}
      >
        <Text
          className="min-w-0 flex-1 font-ralewaySemiBold text-sm text-slate-800"
          numberOfLines={1}
        >
          {value}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          color="#64748B"
          size={21}
        />
      </TouchableOpacity>
    </View>
  );
}

export function SearchableOptionSelector({
  backAccessibilityLabel,
  emptyLabel,
  onBack,
  onChangeQuery,
  onSelect,
  options,
  query,
  selectedId,
  title,
}: {
  backAccessibilityLabel: string;
  emptyLabel: string;
  onBack: () => void;
  onChangeQuery: (query: string) => void;
  onSelect: (id: string) => void;
  options: SearchableOption[];
  query: string;
  selectedId: string;
  title: string;
}) {
  const visibleOptions = options.filter(({ label }) =>
    label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <View className="min-h-[500px] bg-[#F5F7FC]">
      <View className="flex-row items-center gap-3 bg-white px-5 pb-5 pt-2">
        <TouchableOpacity
          accessibilityLabel={backAccessibilityLabel}
          accessibilityRole="button"
          activeOpacity={0.75}
          className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
          onPress={onBack}
        >
          <MaterialCommunityIcons name="arrow-left" color="#334155" size={21} />
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          className="font-ralewayBold text-2xl tracking-tight text-slate-950"
        >
          {title}
        </Text>
      </View>
      <View className="px-5 pt-4">
        <View className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-slate-100 px-4">
          <MaterialCommunityIcons name="magnify" color="#64748B" size={20} />
          <TextInput
            accessibilityLabel={`Search ${title.toLowerCase()}`}
            autoFocus
            className="min-w-0 flex-1 py-3 font-ralewaySemiBold text-sm text-slate-950"
            onChangeText={onChangeQuery}
            placeholder="Search"
            placeholderTextColor="#94A3B8"
            value={query}
          />
        </View>
      </View>
      <ScrollView
        className="mt-3"
        contentContainerClassName="gap-2 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <OptionRow
          isSelected={!selectedId}
          label={emptyLabel}
          onPress={() => onSelect("")}
        />
        {visibleOptions.map((option) => (
          <OptionRow
            key={option.id}
            isSelected={option.id === selectedId}
            label={option.label}
            onPress={() => onSelect(option.id)}
          />
        ))}
        {visibleOptions.length === 0 ? (
          <Text className="py-8 text-center font-ralewayMedium text-sm text-slate-500">
            No matches found
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function OptionRow({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      activeOpacity={0.8}
      className={`min-h-14 flex-row items-center rounded-2xl border px-4 ${
        isSelected ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
      }`}
      onPress={onPress}
    >
      <Text
        className={`min-w-0 flex-1 font-ralewaySemiBold text-sm ${
          isSelected ? "text-blue-700" : "text-slate-700"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
      {isSelected ? (
        <MaterialCommunityIcons name="check-circle" color="#2563EB" size={21} />
      ) : null}
    </TouchableOpacity>
  );
}
