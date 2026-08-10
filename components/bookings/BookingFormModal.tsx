import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type {
  Lessee,
  Property,
  PropertyRoom,
  TransientBooking,
} from "../../types";
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
  rooms: PropertyRoom[];
  conflict?: TransientBooking;
  editingBooking: TransientBooking | null;
  form: BookingFormState;
  formError: string;
  guests: Lessee[];
  isAddingGuest: boolean;
  isCancelling: boolean;
  isLoadingRooms: boolean;
  isSaving: boolean;
  isVisible: boolean;
  mode: BookingFormMode;
  selectedBuilding?: Property;
  selectedRoom?: PropertyRoom;
  selectedGuestId: string;
  onCancelBooking: () => void;
  onClose: () => void;
  onSelectBuilding: (id: string) => void;
  onSelectRoom: (id: string) => void;
  onSelectGuest: (id: string) => void;
  onSubmit: () => void;
  onToggleAddingGuest: () => void;
  onUpdateForm: BookingFormUpdater;
};

export function BookingFormModal({
  buildings,
  rooms,
  conflict,
  editingBooking,
  form,
  formError,
  guests,
  isAddingGuest,
  isCancelling,
  isLoadingRooms,
  isSaving,
  isVisible,
  mode,
  selectedBuilding,
  selectedRoom,
  selectedGuestId,
  onCancelBooking,
  onClose,
  onSelectBuilding,
  onSelectRoom,
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
      <View className="flex-row items-start gap-3 rounded-2xl border border-secondary bg-secondary/20 px-4 py-3.5">
        <MaterialCommunityIcons
          name="information-outline"
          color="#634CE4"
          size={20}
        />
        <Text className="min-w-0 flex-1 font-ralewayMedium text-sm leading-5 text-primary">
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
            <DropdownField
              label="Room"
              options={rooms.map((room) => ({
                label: room.roomNumber,
                value: room.id,
              }))}
              disabled={
                !form.propertyId || isLoadingRooms || rooms.length === 0
              }
              onSelect={onSelectRoom}
              placeholder={
                !form.propertyId
                  ? "Select a building first"
                  : isLoadingRooms
                    ? "Loading rooms..."
                    : rooms.length === 0
                      ? "No rooms available"
                      : "Select a room"
              }
              required
              value={form.roomId}
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
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary/20">
              <MaterialCommunityIcons
                name="door-open"
                color="#634CE4"
                size={20}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-ralewayBold text-xs text-slate-500">
                Booking location
              </Text>
              <Text className="mt-0.5 font-ralewayExtraBold text-sm text-textPrimary">
                {selectedBuilding.title}
                {selectedRoom ? ` · Room ${selectedRoom.roomNumber}` : ""}
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

        {form.propertyId && form.roomId && form.startDate && form.endDate ? (
          <BookingAvailabilityMessage conflict={conflict} />
        ) : (
          <View className="rounded-2xl bg-slate-100 p-4">
            <Text className="text-sm leading-5 text-slate-600">
              Select a room and stay window to check availability.
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
            <Text className="font-ralewayExtraBold text-sm text-rose-700">
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
              <Text className="font-ralewayExtraBold text-rose-600">
                Cancel Booking
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </AddEditModal>
  );
}
