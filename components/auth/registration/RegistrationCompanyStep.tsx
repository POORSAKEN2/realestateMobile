import { Text, View } from "react-native";

import { RegistrationField } from "./RegistrationField";

type RegistrationCompanyStepProps = {
  company: string;
  onCompanyChange: (value: string) => void;
};

export function RegistrationCompanyStep({
  company,
  onCompanyChange,
}: RegistrationCompanyStepProps) {
  return (
    <View>
      <RegistrationField
        autoCapitalize="words"
        autoComplete="organization"
        icon="briefcase"
        label="Company name"
        onChangeText={onCompanyChange}
        placeholder="Metropolitan Properties"
        returnKeyType="done"
        textContentType="organizationName"
        value={company}
      />
      <Text className="mt-3 text-xs leading-5 text-[#708080]">
        This will be used as the name of your real estate workspace.
      </Text>
    </View>
  );
}
