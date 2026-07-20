import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type { Lessee, Property, TransientBooking } from "../../types";
import type {
  BookingFormMode,
  BookingFormState,
  BookingFormUpdater,
} from "../../utils/bookings/bookingCalendar";
import { AddEditModal } from "../ui/AddEditModal";
import { BaseField } from "../ui/fields/BaseField";
import { DropdownField } from "../ui/fields/DropdownField";
import { BookingAvailabilityMessage } from "./BookingAvailabilityMessage";
import { BookingGuestFields } from "./BookingGuestFields";
import { BookingStayFields } from "./BookingStayFields";

type BookingFormModalProps = {
  buildings: Property[];
  conflict?: TransientBooking;
  editingBooking: TransientBooking | null;
  form: BookingFormState;
  formError: string;
  guests: Lessee[];
  isAddingGuest: boolean;
  isCancelling: boolean;
  isSaving: boolean;
  isVisible: boolean;
  mode: BookingFormMode;
  selectedBuilding?: Property;
  selectedGuestId: string;
  onCancelBooking: () => void;
  onClose: () => void;
  onSelectBuilding: (id: string) => void;
  onSelectGuest: (id: string) => void;
  onSubmit: () => void;
  onToggleAddingGuest: () => void;
  onUpdateForm: BookingFormUpdater;
};

export function BookingFormModal({
  buildings,
  conflict,
  editingBooking,
  form,
  formError,
  guests,
  isAddingGuest,
  isCancelling,
  isSaving,
  isVisible,
  mode,
  selectedBuilding,
  selectedGuestId,
  onCancelBooking,
  onClose,
  onSelectBuilding,
  onSelectGuest,
  onSubmit,
  onToggleAddingGuest,
  onUpdateForm,
}: BookingFormModalProps) {
  return (
    <AddEditModal
      formError={formError}
      isPending={isSaving}
      isVisible={isVisible}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={mode === "create" ? "Save Booking" : "Update Booking"}
      title={mode === "create" ? "Create a booking" : "Edit booking"}
    >
      <DropdownField
        label="Building"
        options={buildings.map((building) => ({
          label: building.title,
          value: building.id,
        }))}
        onSelect={onSelectBuilding}
        value={form.propertyId}
      />

      <BaseField
        keyboardType="number-pad"
        label="Room Number"
        onChangeText={(value) => onUpdateForm("roomNumber", value)}
        placeholder="e.g. 101"
        value={form.roomNumber}
      />

      <BaseField
        keyboardType="decimal-pad"
        label="Daily Rate"
        onChangeText={(value) => onUpdateForm("dailyRate", value)}
        placeholder="e.g. 2500"
        value={form.dailyRate}
      />

      {selectedBuilding && form.roomNumber ? (
        <View className="rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
          <Text className="text-xs font-medium text-[#6F6D6D]">
            <Text className="font-bold text-[#1d1d1f]">
              {selectedBuilding.title}
            </Text>
            {` - ${form.roomNumber}`}
          </Text>
        </View>
      ) : null}

      <BookingGuestFields
        form={form}
        guests={guests}
        isAddingGuest={isAddingGuest}
        selectedGuestId={selectedGuestId}
        onSelectGuest={onSelectGuest}
        onToggleAddingGuest={onToggleAddingGuest}
        onUpdateForm={onUpdateForm}
      />

      <BookingStayFields
        form={form}
        isFormVisible={isVisible}
        onUpdateForm={onUpdateForm}
      />

      {form.propertyId && form.roomNumber && form.startDate && form.endDate ? (
        <BookingAvailabilityMessage conflict={conflict} />
      ) : null}

      <BaseField
        label="Notes"
        multiline
        onChangeText={(value) => onUpdateForm("notes", value)}
        placeholder="Optional booking notes"
        value={form.notes}
      />

      {mode === "edit" && editingBooking?.status === "Booked" ? (
        <TouchableOpacity
          activeOpacity={0.85}
          className="mb-3 h-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-50"
          disabled={isCancelling}
          onPress={onCancelBooking}
        >
          {isCancelling ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Text className="font-bold text-rose-600">Cancel Booking</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </AddEditModal>
  );
}
