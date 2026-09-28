import { useState } from "react";
import { Text, View } from "react-native";
import type { PropertyVerificationState } from "../../../types/domain/propertyVerification";
import { formatDate } from "../../../utils/formatters";
import {
  formatDateValue,
  parseDateValue,
} from "../../../utils/expenses/expenseForm";
import { Button } from "../../ui/buttons/Button";
import { PickerField } from "../../ui/fields/PickerField";
import { DateTimePickerModal } from "../../ui/fields/DateTimePickerModal";

export function VerificationAvailability({
  availability,
  pending,
  onSave,
}: {
  availability: PropertyVerificationState["availability"];
  pending: boolean;
  onSave: (from: string, until: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [picker, setPicker] = useState<"from" | "until" | null>(null);
  const invalidRange = Boolean(from && until && until < from);
  const changed =
    from !== (availability.from ?? "") || until !== (availability.until ?? "");
  function edit() {
    setFrom(availability.from ?? "");
    setUntil(availability.until ?? "");
    setEditing(true);
  }
  return (
    <View className="gap-3 rounded-xl bg-surface p-3">
      <Text className="font-ralewayBold text-sm text-textPrimary">
        Listing availability
      </Text>
      {editing ? (
        <>
          <PickerField
            label="Available from"
            required
            value={from ? formatDate(parseDateValue(from)) : undefined}
            placeholder="Choose a start date"
            onPress={() => setPicker("from")}
            disabled={pending}
          />
          <PickerField
            label="Available until (optional)"
            value={until ? formatDate(parseDateValue(until)) : undefined}
            placeholder="No end date"
            onPress={() => setPicker("until")}
            disabled={pending}
          />
          {until ? (
            <Button
              title="Remove end date"
              variant="secondary"
              disabled={pending}
              onPress={() => setUntil("")}
            />
          ) : null}
          {invalidRange ? (
            <Text accessibilityRole="alert" className="text-xs text-danger">
              End date must be on or after the start date.
            </Text>
          ) : null}
          <Button
            title="Save availability"
            disabled={!from || invalidRange || !changed}
            isLoading={pending}
            onPress={() => {
              void onSave(from, until).then((saved) => {
                if (saved) setEditing(false);
              });
            }}
          />
          <Button
            title="Cancel"
            variant="secondary"
            disabled={pending}
            onPress={() => {
              setPicker(null);
              setEditing(false);
            }}
          />
        </>
      ) : (
        <>
          <Text className="text-sm leading-5 text-description">
            {availability.from
              ? `From ${formatDate(parseDateValue(availability.from))}${availability.until ? ` until ${formatDate(parseDateValue(availability.until))}` : " · No end date"}`
              : "Set a start date before publishing this listing."}
          </Text>
          <Button
            title={availability.from ? "Edit availability" : "Set availability"}
            variant="secondary"
            disabled={pending}
            onPress={edit}
          />
        </>
      )}
      {picker ? (
        <DateTimePickerModal
          key={picker}
          mode="date"
          title={picker === "from" ? "Available from" : "Available until"}
          value={parseDateValue(picker === "from" ? from : until || from)}
          minimumDate={
            picker === "until" && from ? parseDateValue(from) : undefined
          }
          onClose={() => setPicker(null)}
          onConfirm={(date) => {
            const value = formatDateValue(date);
            if (picker === "from") setFrom(value);
            else setUntil(value);
            setPicker(null);
          }}
        />
      ) : null}
    </View>
  );
}
