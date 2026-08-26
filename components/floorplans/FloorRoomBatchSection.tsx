import { Text, View } from "react-native";

import { BaseField } from "../ui/fields/BaseField";
import { FormActionRow } from "../ui/forms/FormActionRow";
import { FormSection } from "../ui/forms/FormSection";

export function FloorRoomBatchSection({
  canCreateRooms,
  canGenerate,
  count,
  isBusy,
  isCreating,
  onChangeCount,
  onChangePrefix,
  onChangeStart,
  onClose,
  onGenerate,
  prefix,
  start,
}: {
  canCreateRooms: boolean;
  canGenerate: boolean;
  count: string;
  isBusy: boolean;
  isCreating: boolean;
  onChangeCount: (value: string) => void;
  onChangePrefix: (value: string) => void;
  onChangeStart: (value: string) => void;
  onClose: () => void;
  onGenerate: () => void;
  prefix: string;
  start: string;
}) {
  return (
    <FormSection
      description="Create sequential room numbers and assign them directly to this area."
      icon="creation"
      title="Batch add rooms"
    >
      {canCreateRooms ? (
        <>
          <BaseField
            label="Room number prefix (optional)"
            onChangeText={onChangePrefix}
            placeholder="e.g. Unit-, 10-, Office-"
            value={prefix}
            variant="filled"
          />
          <View className="flex-row gap-3">
            <BaseField
              keyboardType="number-pad"
              label="Start number"
              onChangeText={(value) =>
                onChangeStart(value.replace(/[^0-9]/g, ""))
              }
              placeholder="e.g. 101"
              required
              value={start}
              variant="filled"
              wrapperClassName="flex-1"
            />
            <BaseField
              keyboardType="number-pad"
              label="Room count"
              onChangeText={(value) =>
                onChangeCount(value.replace(/[^0-9]/g, ""))
              }
              placeholder="e.g. 15"
              required
              value={count}
              variant="filled"
              wrapperClassName="flex-1"
            />
          </View>
        </>
      ) : (
        <View className="rounded-2xl border border-warning/25 bg-warningSurface p-4">
          <Text className="font-ralewayBold text-sm text-warning">
            New rooms unavailable
          </Text>
          <Text className="mt-1 text-xs leading-5 text-warning">
            Existing rooms remain available to link, review, or unlink.
          </Text>
        </View>
      )}

      {canCreateRooms ? (
        <FormActionRow
          appearance="card"
          disabled={isBusy || !canGenerate}
          isPending={isCreating}
          onCancel={onClose}
          onSubmit={onGenerate}
          showCancelAction={false}
          submitText="Generate rooms"
        />
      ) : null}
    </FormSection>
  );
}
