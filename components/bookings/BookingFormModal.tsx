import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { FormSection } from "../ui/forms/FormSection";
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
      appearance="card"
      formError={formError}
      isPending={isSaving}
      isVisible={isVisible}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={mode === "create" ? "Save Booking" : "Update Booking"}
      subtitle={
        mode === "create"
          ? "Add the room, guest, and stay details."
          : "Review and update this reservation."
      }
      title={mode === "create" ? "Create a booking" : "Edit booking"}
      showCancelAction
    >
      <View className="flex-row items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5">
        <MaterialCommunityIcons
          name="information-outline"
          color="#2563EB"
          size={20}
        />
        <Text className="min-w-0 flex-1 font-sora text-sm leading-5 text-[#1E40AF]">
          Fields marked with * are required. Availability updates as you enter
          the room and stay dates.
        </Text>
      </View>

      <FormSection
        description="Choose the property and identify the room being reserved."
        icon="office-building-outline"
        title="Reservation details"
        variant="card"
      >
        <DropdownField
          label="Building"
          options={buildings.map((building) => ({
            label: building.title,
            value: building.id,
          }))}
          onSelect={onSelectBuilding}
          placeholder="Select a building"
          required
          value={form.propertyId}
          variant="filled"
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <BaseField
              label="Room number"
              onChangeText={(value) => onUpdateForm("roomNumber", value)}
              placeholder="e.g. 101"
              required
              value={form.roomNumber}
              variant="filled"
            />
          </View>
          <View className="flex-1">
            <BaseField
              keyboardType="decimal-pad"
              label="Daily rate (PHP)"
              onChangeText={(value) => onUpdateForm("dailyRate", value)}
              placeholder="e.g. 2500"
              required
              value={form.dailyRate}
              variant="filled"
            />
          </View>
        </View>

        {selectedBuilding ? (
          <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10">
              <MaterialCommunityIcons
                name="door-open"
                color="#2563EB"
                size={20}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xs font-semibold text-slate-500">
                Booking location
              </Text>
              <Text className="mt-0.5 text-sm font-bold text-[#1d1d1f]">
                {selectedBuilding.title}
                {form.roomNumber ? ` · Room ${form.roomNumber}` : ""}
              </Text>
            </View>
          </View>
        ) : null}
      </FormSection>

      <FormSection
        description="Select a saved guest or add their contact details now."
        icon="account-outline"
        title="Guest"
        variant="card"
      >
        <BookingGuestFields
          form={form}
          guests={guests}
          isAddingGuest={isAddingGuest}
          selectedGuestId={selectedGuestId}
          onSelectGuest={onSelectGuest}
          onToggleAddingGuest={onToggleAddingGuest}
          onUpdateForm={onUpdateForm}
        />
      </FormSection>

      <FormSection
        description="Set the arrival and departure window for this stay."
        icon="calendar-range"
        title="Stay schedule"
        variant="card"
      >
        <BookingStayFields
          form={form}
          isFormVisible={isVisible}
          onUpdateForm={onUpdateForm}
        />

        {form.propertyId &&
        form.roomNumber &&
        form.startDate &&
        form.endDate ? (
          <BookingAvailabilityMessage conflict={conflict} />
        ) : (
          <View className="rounded-2xl bg-slate-100 p-4">
            <Text className="text-sm leading-5 text-slate-600">
              Add a room number and stay window to check availability.
            </Text>
          </View>
        )}
      </FormSection>

      <FormSection
        description="Add requests or context the operations team should know."
        icon="note-text-outline"
        title="Additional notes"
        variant="card"
      >
        <BaseField
          label="Notes"
          multiline
          numberOfLines={4}
          onChangeText={(value) => onUpdateForm("notes", value)}
          placeholder="Add optional booking notes"
          value={form.notes}
          variant="filled"
        />
      </FormSection>

      {mode === "edit" && editingBooking?.status === "Booked" ? (
        <View className="gap-3 rounded-[24px] border border-rose-500/20 bg-rose-50 p-4">
          <View>
            <Text className="text-sm font-bold text-rose-700">
              Cancel this booking
            </Text>
            <Text className="mt-1 text-xs leading-5 text-rose-700/80">
              The reservation will remain in your records as cancelled.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            className="h-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-white"
            disabled={isCancelling}
            onPress={onCancelBooking}
          >
            {isCancelling ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <Text className="font-bold text-rose-600">Cancel Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </AddEditModal>
  );
}
