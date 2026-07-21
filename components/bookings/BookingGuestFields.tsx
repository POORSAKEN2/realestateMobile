import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { Lessee } from "../../types";
import type {
  BookingFormState,
  BookingFormUpdater,
} from "../../utils/bookings/bookingCalendar";
import { BaseField } from "../ui/fields/BaseField";
import { DropdownField } from "../ui/fields/DropdownField";

type BookingGuestFieldsProps = {
  form: BookingFormState;
  guests: Lessee[];
  isAddingGuest: boolean;
  selectedGuestId: string;
  onSelectGuest: (id: string) => void;
  onToggleAddingGuest: () => void;
  onUpdateForm: BookingFormUpdater;
};

export function BookingGuestFields({
  form,
  guests,
  isAddingGuest,
  selectedGuestId,
  onSelectGuest,
  onToggleAddingGuest,
  onUpdateForm,
}: BookingGuestFieldsProps) {
  const guestOptions = guests.map((guest) => ({
    label: `${guest.name}${guest.contactEmail ? ` · ${guest.contactEmail}` : ""}`,
    value: guest.id,
  }));

  return (
    <View className="gap-4">
      {!isAddingGuest ? (
        <DropdownField
          label="Guest"
          onSelect={onSelectGuest}
          options={guestOptions}
          placeholder={
            guests.length ? "Select an existing guest" : "No guests available"
          }
          subtitle="Select a saved guest or add a new one."
          value={selectedGuestId}
          required
        />
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        className={`min-h-14 flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
          isAddingGuest
            ? "border-[#2563EB]/30 bg-[#2563EB]/10"
            : "border-slate-200 bg-white"
        }`}
        onPress={onToggleAddingGuest}
      >
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/10">
            <MaterialCommunityIcons
              name={
                isAddingGuest ? "account-check-outline" : "account-plus-outline"
              }
              color="#2563EB"
              size={19}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-[#1d1d1f]">
              {isAddingGuest ? "Entering a new guest" : "Guest not listed?"}
            </Text>
            <Text className="mt-0.5 text-xs leading-4 text-slate-600">
              {isAddingGuest
                ? "Use the fields below to add their details."
                : "Create a guest while making this booking."}
            </Text>
          </View>
        </View>
        <Text className="ml-3 text-xs font-bold text-[#2563EB]">
          {isAddingGuest ? "Cancel" : "Add"}
        </Text>
      </TouchableOpacity>

      {isAddingGuest ? (
        <View className="gap-4 rounded-2xl bg-[#F7F8FA] p-4">
          <BaseField
            label="Guest name"
            onChangeText={(value) => onUpdateForm("guestName", value)}
            placeholder="e.g. Alex Santos"
            required
            value={form.guestName}
          />
          <BaseField
            keyboardType="phone-pad"
            label="Phone number"
            onChangeText={(value) => onUpdateForm("guestPhone", value)}
            placeholder="e.g. 0917 123 4567"
            value={form.guestPhone}
          />
          <BaseField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email address"
            onChangeText={(value) => onUpdateForm("guestEmail", value)}
            placeholder="e.g. alex@example.com"
            required
            value={form.guestEmail}
          />
        </View>
      ) : null}
    </View>
  );
}
