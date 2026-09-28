import { useRef, useState } from "react";
import { Text, View } from "react-native";
import type { PropertyOwner } from "../../types";
import { useSaveOwner } from "../../hooks/api/useOwnerManagement";
import { getSessionAccess } from "../../services/access/sessionAccess";
import { BaseField } from "../ui/fields/BaseField";
import { Button } from "../ui/buttons/Button";

export function OwnerForm({
  owner,
  onSaved,
  onCancel,
  onBusyChange,
}: {
  owner?: PropertyOwner;
  onSaved: (owner: PropertyOwner) => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [name, setName] = useState(owner?.name ?? "");
  const [email, setEmail] = useState(owner?.contactEmail ?? "");
  const [phone, setPhone] = useState(owner?.phone ?? "");
  const [error, setError] = useState("");
  const mutation = useSaveOwner();
  const saving = useRef(false);
  async function submit() {
    if (saving.current) return;
    if (
      !name.trim() ||
      !phone.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Enter the owner name, valid email, and phone number.");
      return;
    }
    const revision = getSessionAccess().revision;
    saving.current = true;
    setError("");
    onBusyChange?.(true);
    try {
      const result = await mutation.mutateAsync({
        id: owner?.id,
        draft: {
          name: name.trim(),
          contact_email: email.trim(),
          phone: phone.trim(),
        },
      });
      if (getSessionAccess().revision === revision) onSaved(result);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Owner could not be saved.",
      );
    } finally {
      saving.current = false;
      onBusyChange?.(false);
    }
  }
  return (
    <View className="gap-3 rounded-2xl border border-primary/20 bg-panel p-4">
      <Text className="font-ralewayBold text-textPrimary">
        {owner ? "Edit property owner" : "Add property owner"}
      </Text>
      <BaseField
        label="Owner name"
        required
        value={name}
        onChangeText={setName}
        maxLength={255}
        editable={!mutation.isPending}
      />
      <BaseField
        label="Email"
        required
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        maxLength={255}
        editable={!mutation.isPending}
      />
      <BaseField
        label="Phone"
        required
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={255}
        editable={!mutation.isPending}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-red-600">
          {error}
        </Text>
      ) : null}
      <Button
        title="Save owner"
        isLoading={mutation.isPending}
        onPress={() => {
          void submit();
        }}
      />
      <Button
        title="Cancel owner changes"
        variant="secondary"
        disabled={mutation.isPending}
        onPress={onCancel}
      />
    </View>
  );
}
