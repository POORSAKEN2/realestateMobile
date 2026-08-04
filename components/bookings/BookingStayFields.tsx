import { useEffect, useState } from "react";
import { View } from "react-native";

import {
  getBookingPickerMinimumDate,
  getBookingPickerSelection,
  getBookingPickerTitle,
  getBookingPickerValue,
  isDatePickerField,
  type BookingFormState,
  type BookingFormUpdater,
  type BookingPickerField,
} from "../../utils/bookings/bookingCalendar";
import { DateTimePickerModal } from "../ui/fields/DateTimePickerModal";
import { PickerField } from "../ui/fields/PickerField";

type BookingStayFieldsProps = {
  form: BookingFormState;
  isFormVisible: boolean;
  onUpdateForm: BookingFormUpdater;
};

export function BookingStayFields({
  form,
  isFormVisible,
  onUpdateForm,
}: BookingStayFieldsProps) {
  const [activePickerField, setActivePickerField] =
    useState<BookingPickerField | null>(null);

  useEffect(() => {
    if (!isFormVisible) setActivePickerField(null);
  }, [isFormVisible]);

  return (
    <>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <PickerField
            label="Check-in date"
            onPress={() => setActivePickerField("startDate")}
            placeholder="Select date"
            required
            value={form.startDate}
            variant="filled"
          />
        </View>
        <View className="w-32">
          <PickerField
            iconName="time-outline"
            label="Time"
            onPress={() => setActivePickerField("checkInTime")}
            placeholder="Select time"
            required
            value={form.checkInTime}
            variant="filled"
          />
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <PickerField
            label="Check-out date"
            onPress={() => setActivePickerField("endDate")}
            placeholder="Select date"
            required
            value={form.endDate}
            variant="filled"
          />
        </View>
        <View className="w-32">
          <PickerField
            iconName="time-outline"
            label="Time"
            onPress={() => setActivePickerField("checkOutTime")}
            placeholder="Select time"
            required
            value={form.checkOutTime}
            variant="filled"
          />
        </View>
      </View>

      {activePickerField ? (
        <BookingDateTimePicker
          key={activePickerField}
          field={activePickerField}
          form={form}
          onClose={() => setActivePickerField(null)}
          onUpdateForm={onUpdateForm}
        />
      ) : null}
    </>
  );
}

function BookingDateTimePicker({
  field,
  form,
  onClose,
  onUpdateForm,
}: {
  field: BookingPickerField;
  form: BookingFormState;
  onClose: () => void;
  onUpdateForm: BookingFormUpdater;
}) {
  const isDateField = isDatePickerField(field);
  const minimumDate = getBookingPickerMinimumDate(form, field);
  const pickerValue = getBookingPickerValue(form, field);

  function handleConfirm(selectedValue: Date) {
    const selection = getBookingPickerSelection(field, selectedValue);
    onUpdateForm(selection.field, selection.value);
  }

  return (
    <DateTimePickerModal
      minimumDate={minimumDate}
      mode={isDateField ? "date" : "time"}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={getBookingPickerTitle(field)}
      value={pickerValue}
    />
  );
}
