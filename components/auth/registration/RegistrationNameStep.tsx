import { View } from "react-native";

import { RegistrationField } from "./RegistrationField";

type RegistrationNameStepProps = {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
};

export function RegistrationNameStep({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}: RegistrationNameStepProps) {
  return (
    <View className="gap-5">
      <RegistrationField
        autoCapitalize="words"
        autoComplete="name-given"
        icon="user"
        label="First name"
        onChangeText={onFirstNameChange}
        placeholder="Alex"
        returnKeyType="next"
        textContentType="givenName"
        value={firstName}
      />
      <RegistrationField
        autoCapitalize="words"
        autoComplete="name-family"
        icon="user"
        label="Last name"
        onChangeText={onLastNameChange}
        placeholder="Smith"
        returnKeyType="done"
        textContentType="familyName"
        value={lastName}
      />
    </View>
  );
}
