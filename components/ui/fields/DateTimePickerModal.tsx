import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { colors } from "../../../constants/colors";
import { PickerModalShell } from "./PickerField";

type DateTimePickerModalProps = {
  maximumDate?: Date;
  minimumDate?: Date;
  mode: "date" | "time";
  onClose: () => void;
  onConfirm: (selectedValue: Date) => void;
  title: string;
  value: Date;
};

export function DateTimePickerModal({
  maximumDate,
  minimumDate,
  mode,
  onClose,
  onConfirm,
  title,
  value,
}: DateTimePickerModalProps) {
  const [draftValue, setDraftValue] = useState(value);
  const initialAndroidPicker = useRef({
    maximumDate,
    minimumDate,
    mode,
    onClose,
    onConfirm,
    value,
  });

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const picker = initialAndroidPicker.current;
    DateTimePickerAndroid.open({
      display: "default",
      maximumDate: picker.maximumDate,
      minimumDate: picker.minimumDate,
      mode: picker.mode,
      negativeButton: { textColor: colors.secondary },
      onChange: (event: DateTimePickerEvent, selectedValue?: Date) => {
        if (event.type === "set" && selectedValue) {
          picker.onConfirm(selectedValue);
        }
        picker.onClose();
      },
      onError: picker.onClose,
      positiveButton: { textColor: colors.secondary },
      value: picker.value,
    });

    return () => {
      void DateTimePickerAndroid.dismiss(picker.mode);
    };
  }, []);

  if (Platform.OS === "android") return null;

  return (
    <PickerModalShell
      onClose={onClose}
      onConfirm={() => {
        onConfirm(draftValue);
        onClose();
      }}
      title={title}
    >
      <DateTimePicker
        accentColor={colors.secondary}
        display="spinner"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        mode={mode}
        onChange={(event, selectedValue) => {
          if (event.type === "set" && selectedValue) {
            setDraftValue(selectedValue);
          }
        }}
        textColor={colors.text}
        themeVariant="light"
        value={draftValue}
      />
    </PickerModalShell>
  );
}
