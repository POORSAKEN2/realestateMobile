import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { TextInput, View } from "react-native";

export type EmailVerificationCodeInputHandle = {
  focusFirst: () => void;
};

type EmailVerificationCodeInputProps = {
  onChange: (values: string[]) => void;
  values: readonly string[];
};

export const EmailVerificationCodeInput = forwardRef<
  EmailVerificationCodeInputHandle,
  EmailVerificationCodeInputProps
>(({ onChange, values }, forwardedRef) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focusFirst: () => inputRefs.current[0]?.focus(),
    }),
    [],
  );

  function updateDigit(index: number, value: string) {
    const numericValue = value.replace(/\D/g, "");
    const nextValues = [...values];

    if (!numericValue) {
      nextValues[index] = "";
      onChange(nextValues);
      return;
    }

    numericValue
      .slice(0, values.length - index)
      .split("")
      .forEach((digit, offset) => {
        nextValues[index + offset] = digit;
      });

    onChange(nextValues);

    const nextIndex = Math.min(index + numericValue.length, values.length - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  function handleBackspace(index: number) {
    if (values[index] || index === 0) return;

    const nextValues = [...values];
    nextValues[index - 1] = "";
    onChange(nextValues);
    inputRefs.current[index - 1]?.focus();
  }

  return (
    <View className="flex-row gap-2">
      {values.map((digit, index) => (
        <TextInput
          key={index}
          ref={(input) => {
            inputRefs.current[index] = input;
          }}
          accessibilityLabel={`Email verification code digit ${index + 1}`}
          autoComplete="off"
          caretHidden={Boolean(digit)}
          className={`h-14 flex-1 rounded-[12px] border-[1.5px] text-center font-ralewayBold text-xl text-[#151717] ${
            focusedIndex === index
              ? "border-[#2563EB] bg-[#eff6ff]"
              : digit
                ? "border-[#0f766e] bg-[#f0fdfa]"
                : "border-[#dfe3e3] bg-white"
          }`}
          keyboardType="number-pad"
          maxLength={values.length}
          onBlur={() =>
            setFocusedIndex((current) => (current === index ? null : current))
          }
          onChangeText={(value) => updateDigit(index, value)}
          onFocus={() => setFocusedIndex(index)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace") {
              handleBackspace(index);
            }
          }}
          returnKeyType={index === values.length - 1 ? "done" : "next"}
          selectTextOnFocus
          style={{
            includeFontPadding: false,
            paddingBottom: 0,
            paddingTop: 0,
            textAlignVertical: "center",
          }}
          textContentType={index === 0 ? "oneTimeCode" : "none"}
          value={digit}
        />
      ))}
    </View>
  );
});

EmailVerificationCodeInput.displayName = "EmailVerificationCodeInput";
