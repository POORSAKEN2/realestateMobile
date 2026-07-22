import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import {
  getBookingPickerChange,
  getBookingPickerMinimumDate,
  getBookingPickerTitle,
  getBookingPickerValue,
  isDatePickerField,
  type BookingFormState,
  type BookingFormUpdater,
  type BookingPickerField,
} from "../../utils/bookings/bookingCalendar";
import { PickerField, PickerModalShell } from "../ui/fields/PickerField";

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

  function handleChange(event: DateTimePickerEvent, selectedValue?: Date) {
    if (Platform.OS === "android") onClose();
    const selection = getBookingPickerChange(event.type, field, selectedValue);
    if (selection) onUpdateForm(selection.field, selection.value);
  }

  return (
    <PickerModalShell onClose={onClose} title={getBookingPickerTitle(field)}>
      {isDateField ? (
        <DateTimePicker
          key={`booking-date-${field}`}
          display={Platform.OS === "ios" ? "inline" : "default"}
          {...(minimumDate ? { minimumDate } : {})}
          mode="date"
          onChange={handleChange}
          value={pickerValue}
        />
      ) : (
        <DateTimePicker
          key={`booking-time-${field}`}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          mode="time"
          onChange={handleChange}
          value={pickerValue}
        />
      )}
    </PickerModalShell>
  );
}
