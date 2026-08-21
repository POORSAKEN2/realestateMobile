import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { BottomSheetModal } from "./BottomSheetModal";
import { RadioOptionList, type RadioOption } from "./groups/RadioOptionList";

export function SearchFilterSheet({
  children,
  description,
  footer,
  onClose,
  title,
  visible,
}: {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <BottomSheetModal
      backdropAccessibilityLabel={`Close ${title.toLowerCase()}`}
      backdropClassName="bg-textPrimary/45"
      onClose={onClose}
      visible={visible}
    >
      <View className="max-h-[90%] rounded-t-[30px] bg-white">
        <View className="pt-3">
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-secondary/30" />
        </View>

        <View className="flex-row items-center justify-between border-b border-secondary/20 px-5 pb-4">
          <View className="min-w-0 flex-1 pr-4">
            <Text className="font-ralewayExtraBold text-xl text-textPrimary">
              {title}
            </Text>
            <Text className="mt-1 text-sm text-slate-600">{description}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={`Close ${title.toLowerCase()}`}
            accessibilityRole="button"
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-full bg-secondary/10"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#634CE4" size={21} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerClassName={`gap-5 px-5 pt-5 ${
            footer ? "pb-5" : "pb-20"
          }`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {footer}
      </View>
    </BottomSheetModal>
  );
}

export function SearchFilterSection({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <View className="gap-3">
      <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
        {label}
      </Text>
      {children}
    </View>
  );
}

export function SearchFilterActions({
  onApply,
  onReset,
}: {
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <View className="flex-row gap-3 border-t border-secondary/20 px-4 pb-20 pt-4">
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.82}
        className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-secondary/10"
        onPress={onReset}
      >
        <Text className="font-ralewayExtraBold text-sm text-textPrimary">
          Reset
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.82}
        className="min-h-12 flex-[2] items-center justify-center rounded-2xl bg-secondary"
        onPress={onApply}
      >
        <Text className="font-ralewayExtraBold text-sm text-white">
          Apply filters
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function SingleChoiceFilterSheet<T extends string>({
  description,
  onChange,
  onClose,
  options,
  title,
  value,
  visible,
}: {
  description: string;
  onChange: (value: T) => void;
  onClose: () => void;
  options: readonly RadioOption<T>[];
  title: string;
  value: T;
  visible: boolean;
}) {
  return (
    <SearchFilterSheet
      description={description}
      onClose={onClose}
      title={title}
      visible={visible}
    >
      <RadioOptionList
        onSelect={(nextValue) => {
          onChange(nextValue);
          onClose();
        }}
        options={options}
        value={value}
      />
    </SearchFilterSheet>
  );
}
