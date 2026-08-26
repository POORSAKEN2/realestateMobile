import { Text, TouchableOpacity, View } from "react-native";

import type {
  LeaseEditMode,
  LeaseFormState,
} from "../../utils/leases/leaseForm";
import { BaseField } from "../ui/fields/BaseField";
import { PickerField } from "../ui/fields/PickerField";

const editModes: Array<{
  label: string;
  value: LeaseEditMode;
}> = [
  { label: "Fix a Typo", value: "typo" },
  { label: "Amend Contract", value: "amendment" },
];

export function LeaseEditModeFields({
  form,
  amendmentDateLabel,
  onChangeMode,
  onChangeReason,
  onOpenAmendmentDate,
}: {
  form: LeaseFormState;
  amendmentDateLabel: string;
  onChangeMode: (mode: LeaseEditMode) => void;
  onChangeReason: (reason: string) => void;
  onOpenAmendmentDate: () => void;
}) {
  return (
    <>
      <View
        accessibilityRole="radiogroup"
        className="flex-row gap-2 rounded-2xl bg-primary/10 p-1.5"
      >
        {editModes.map((mode) => {
          const selected = form.editMode === mode.value;

          return (
            <TouchableOpacity
              accessibilityLabel={mode.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              activeOpacity={0.8}
              className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border ${
                selected
                  ? "border-primary/20 bg-white"
                  : "border-transparent bg-transparent"
              }`}
              key={mode.value}
              onPress={() => onChangeMode(mode.value)}
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-description/50"
                }`}
              >
                {selected ? (
                  <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                ) : null}
              </View>
              <Text
                className={`font-ralewayBold text-xs ${
                  selected ? "text-textPrimary" : "text-description"
                }`}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {form.editMode === "amendment" ? (
        <View className="gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View>
            <Text className="font-ralewayExtraBold text-sm text-textPrimary">
              Amendment details
            </Text>
            <Text className="mt-1 text-xs leading-5 text-description">
              Record why the contract is changing and when it takes effect.
            </Text>
          </View>

          <BaseField
            label="Reason of Amendment"
            multiline
            numberOfLines={3}
            onChangeText={onChangeReason}
            placeholder="e.g. Rent increase or lease extension"
            required
            value={form.amendmentReason}
            variant="filled"
          />
          <PickerField
            label="Amendment Date"
            onPress={onOpenAmendmentDate}
            placeholder="Select date"
            required
            value={amendmentDateLabel}
            variant="filled"
          />
        </View>
      ) : (
        <Text className="text-xs leading-5 text-description">
          Fix party, room, status, or spelling details without creating a new
          contract revision. Use Amend Contract for rent or date changes.
        </Text>
      )}
    </>
  );
}
