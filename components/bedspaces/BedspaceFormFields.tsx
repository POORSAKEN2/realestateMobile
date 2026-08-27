import { Text, View } from "react-native";

import { BaseField } from "../ui/fields/BaseField";
import { ChoiceField } from "../ui/fields/ChoiceField";
import { FormSection } from "../ui/forms/FormSection";
import type { BedspaceFormState } from "../../utils/bedspaces/bedspaceForm";

const STATUS_OPTIONS = [
  { label: "Vacant", value: "Vacant" },
  { label: "Maintenance", value: "Maintenance" },
] as const;

export function BedspaceFormFields({
  form,
  onUpdate,
}: {
  form: BedspaceFormState;
  onUpdate: <K extends keyof BedspaceFormState>(
    key: K,
    value: BedspaceFormState[K],
  ) => void;
}) {
  return (
    <FormSection
      description="Set the room-level identifier, monthly asking price, and availability."
      icon="bed-single-outline"
      title="Bedspace details"
      variant="card"
    >
      <BaseField
        label="Bedspace number"
        maxLength={255}
        onChangeText={(value) => onUpdate("bedspaceNumber", value)}
        placeholder="e.g. B-01"
        required
        value={form.bedspaceNumber}
        variant="filled"
      />
      <BaseField
        keyboardType="decimal-pad"
        label="Monthly price"
        onChangeText={(value) =>
          onUpdate("monthlyPrice", value.replace(/[^\d.]/g, ""))
        }
        placeholder="0"
        required
        value={form.monthlyPrice}
        variant="filled"
      />

      {form.status === "Occupied" ? (
        <View className="rounded-2xl border border-info/20 bg-infoSurface p-4">
          <Text className="font-ralewayBold text-sm text-info">
            Occupied through an active lease
          </Text>
          <Text className="mt-1 text-xs leading-5 text-info">
            End or terminate the lease to return this bedspace to Vacant.
          </Text>
        </View>
      ) : (
        <ChoiceField
          label="Availability"
          onChange={(value) =>
            onUpdate("status", value as BedspaceFormState["status"])
          }
          options={[...STATUS_OPTIONS]}
          value={form.status}
          variant="segmented"
        />
      )}

      <BaseField
        label="Notes"
        multiline
        onChangeText={(value) => onUpdate("notes", value)}
        placeholder="Optional bed location, bunk level, or instructions"
        value={form.notes}
        variant="filled"
      />
    </FormSection>
  );
}
