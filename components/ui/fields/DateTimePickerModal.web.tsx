import { createElement, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";

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

const inputStyle: CSSProperties = {
  backgroundColor: "#FAF9F9",
  border: "1px solid #BEE3DB",
  borderRadius: 16,
  color: colors.text,
  fontSize: 16,
  minHeight: 56,
  padding: "12px 16px",
  width: "100%",
};

function formatInputValue(value: Date, mode: "date" | "time") {
  if (mode === "time") {
    return `${String(value.getHours()).padStart(2, "0")}:${String(
      value.getMinutes(),
    ).padStart(2, "0")}`;
  }

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(value.getDate()).padStart(2, "0")}`;
}

function parseInputValue(
  inputValue: string,
  mode: "date" | "time",
  currentValue: Date,
) {
  if (!inputValue) return currentValue;

  if (mode === "time") {
    const [hours, minutes] = inputValue.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return currentValue;
    }
    const nextValue = new Date(currentValue);
    nextValue.setHours(hours, minutes, 0, 0);
    return nextValue;
  }

  const [year, month, day] = inputValue.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return currentValue;
  return new Date(year, month - 1, day, 12);
}

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

  return (
    <PickerModalShell
      onClose={onClose}
      onConfirm={() => {
        onConfirm(draftValue);
        onClose();
      }}
      title={title}
    >
      {createElement("input", {
        "aria-label": title,
        max:
          mode === "date" && maximumDate
            ? formatInputValue(maximumDate, mode)
            : undefined,
        min:
          mode === "date" && minimumDate
            ? formatInputValue(minimumDate, mode)
            : undefined,
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          setDraftValue((currentValue) =>
            parseInputValue(event.target.value, mode, currentValue),
          ),
        step: mode === "time" ? 60 : undefined,
        style: inputStyle,
        type: mode,
        value: formatInputValue(draftValue, mode),
      })}
    </PickerModalShell>
  );
}
