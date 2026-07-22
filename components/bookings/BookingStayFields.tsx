import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";

import {
  getBookingPickerChange,
  getBookingPickerTitle,
  getBookingPickerValue,
  type BookingFormState,
  type BookingFormUpdater,
  type BookingPickerField,
} from "../../utils/bookings/bookingCalendar";
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
  const isDateField = field === "startDate" || field === "endDate";
  const minimumDate =
    field === "endDate" && form.startDate
      ? new Date(`${form.startDate}T12:00:00`)
      : undefined;
  const pickerValue = getBookingPickerValue(form, field);
  const safePickerValue =
    minimumDate && pickerValue.getTime() < minimumDate.getTime()
      ? minimumDate
      : pickerValue;

  function handleChange(eventType: string, selectedValue?: Date) {
    if (Platform.OS === "android") onClose();
    const selection = getBookingPickerChange(eventType, field, selectedValue);
    if (selection) onUpdateForm(selection.field, selection.value);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View className="flex-1 justify-center bg-black/40 px-5">
        <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-5 shadow-xl">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-[#1d1d1f]">
              {getBookingPickerTitle(field)}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-full bg-[#2563EB]/5 px-3 py-1.5"
              onPress={onClose}
            >
              <Text className="text-xs font-bold text-[#2563EB]">Done</Text>
            </TouchableOpacity>
          </View>
          {isDateField ? (
            <DateTimePicker
              key={`booking-date-${field}`}
              display={Platform.OS === "ios" ? "inline" : "default"}
              {...(minimumDate ? { minimumDate } : {})}
              mode="date"
              onChange={(event, selectedValue) =>
                handleChange(event.type, selectedValue)
              }
              value={safePickerValue}
            />
          ) : (
            <DateTimePicker
              key={`booking-time-${field}`}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              mode="time"
              onChange={(event, selectedValue) =>
                handleChange(event.type, selectedValue)
              }
              value={pickerValue}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
