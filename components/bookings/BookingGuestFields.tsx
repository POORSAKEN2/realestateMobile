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
    <View className="gap-3 rounded-xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4">
      <DropdownField
        label="Guest"
        onSelect={onSelectGuest}
        options={guestOptions}
        placeholder={
          guests.length ? "Select an existing guest" : "No guests available"
        }
        subtitle="Select a saved guest or add a new one."
        value={selectedGuestId}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        className="self-start rounded-full bg-[#2563EB]/10 px-4 py-2.5"
        onPress={onToggleAddingGuest}
      >
        <Text className="text-xs font-bold text-[#2563EB]">
          {isAddingGuest ? "Cancel Add Guest" : "Add Guest"}
        </Text>
      </TouchableOpacity>

      {isAddingGuest ? (
        <View className="gap-4 border-t border-[#1d1d1f]/10 pt-4">
          <BaseField
            label="Guest Name"
            onChangeText={(value) => onUpdateForm("guestName", value)}
            value={form.guestName}
          />
          <BaseField
            keyboardType="phone-pad"
            label="Guest Phone"
            onChangeText={(value) => onUpdateForm("guestPhone", value)}
            value={form.guestPhone}
          />
          <BaseField
            keyboardType="email-address"
            label="Guest Email"
            onChangeText={(value) => onUpdateForm("guestEmail", value)}
            value={form.guestEmail}
          />
        </View>
      ) : null}
    </View>
  );
}
