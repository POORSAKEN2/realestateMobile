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
            label="Check-in Date"
            onPress={() => setActivePickerField("startDate")}
            placeholder="Select date"
            value={form.startDate}
          />
        </View>
        <View className="w-32">
          <PickerField
            iconName="time-outline"
            label="Check-in Time"
            onPress={() => setActivePickerField("checkInTime")}
            placeholder="Select time"
            value={form.checkInTime}
          />
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <PickerField
            label="Check-out Date"
            onPress={() => setActivePickerField("endDate")}
            placeholder="Select date"
            value={form.endDate}
          />
        </View>
        <View className="w-32">
          <PickerField
            iconName="time-outline"
            label="Check-out Time"
            onPress={() => setActivePickerField("checkOutTime")}
            placeholder="Select time"
            value={form.checkOutTime}
          />
        </View>
      </View>

      {activePickerField ? (
        <BookingDateTimePicker
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
          <DateTimePicker
            display={
              Platform.OS === "ios"
                ? field === "startDate" || field === "endDate"
                  ? "inline"
                  : "spinner"
                : "default"
            }
            minimumDate={
              field === "endDate" && form.startDate
                ? new Date(`${form.startDate}T12:00:00`)
                : undefined
            }
            mode={
              field === "startDate" || field === "endDate" ? "date" : "time"
            }
            onChange={(event, selectedValue) => {
              if (Platform.OS === "android") onClose();
              const selection = getBookingPickerChange(
                event.type,
                field,
                selectedValue,
              );
              if (selection) onUpdateForm(selection.field, selection.value);
            }}
            value={getBookingPickerValue(form, field)}
          />
        </View>
      </View>
    </Modal>
  );
}
