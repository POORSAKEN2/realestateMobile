import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { colors } from "../../../constants/colors";
import { PickerModalShell } from "./PickerField";

type DateTimePickerModalProps = {
  maximumDate?: Date;
  minimumDate?: Date;
  mode: "date" | "time";
  onChange: (event: DateTimePickerEvent, selectedValue?: Date) => void;
  onClose: () => void;
  title: string;
  value: Date;
};

export function DateTimePickerModal({
  maximumDate,
  minimumDate,
  mode,
  onChange,
  onClose,
  title,
  value,
}: DateTimePickerModalProps) {
  const initialAndroidPicker = useRef({
    maximumDate,
    minimumDate,
    mode,
    onChange,
    onClose,
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
      negativeButton: { textColor: colors.primary },
      onChange: picker.onChange,
      onError: picker.onClose,
      positiveButton: { textColor: colors.primary },
      value: picker.value,
    });

    return () => {
      void DateTimePickerAndroid.dismiss(picker.mode);
    };
  }, []);

  if (Platform.OS === "android") return null;

  return (
    <PickerModalShell onClose={onClose} title={title}>
      <DateTimePicker
        accentColor={colors.primary}
        display={mode === "date" ? "inline" : "spinner"}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        mode={mode}
        onChange={onChange}
        textColor={colors.text}
        themeVariant="light"
        value={value}
      />
    </PickerModalShell>
  );
}
