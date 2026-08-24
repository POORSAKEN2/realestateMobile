import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheetModal } from "./BottomSheetModal";
import { FormActionRow } from "./forms/FormActionRow";
import { RadioOptionList, type RadioOption } from "./groups/RadioOptionList";
import { ModalActionFooter } from "./ModalActionFooter";

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
      <SafeAreaView
        className="max-h-[90%] rounded-t-[30px] bg-white"
        edges={footer ? [] : ["bottom"]}
      >
        <View className="pt-3">
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-primary/30" />
        </View>

        <View className="flex-row items-center justify-between border-b border-primary/20 px-5 pb-4">
          <View className="min-w-0 flex-1 pr-4">
            <Text className="font-ralewayExtraBold text-xl text-textPrimary">
              {title}
            </Text>
            <Text className="mt-1 text-sm text-description">{description}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={`Close ${title.toLowerCase()}`}
            accessibilityRole="button"
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/10"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#8A77F4" size={21} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerClassName="gap-5 px-5 pb-5 pt-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {footer}
      </SafeAreaView>
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
    <ModalActionFooter>
      <FormActionRow
        appearance="card"
        cancelText="Reset"
        isPending={false}
        onCancel={onReset}
        onSubmit={onApply}
        submitText="Apply filters"
      />
    </ModalActionFooter>
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
