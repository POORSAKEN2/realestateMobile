import { Text, View } from "react-native";

import type {
  EditableProfileField,
  ProfileForm,
  ProfileValidationErrors,
} from "../../types";
import { ProfileField, type ProfileFieldProps } from "./ProfileField";

type ProfileFieldDefinition = Omit<
  ProfileFieldProps,
  "error" | "onChangeText" | "value"
> & {
  field: EditableProfileField;
};

const PROFILE_FIELDS: ProfileFieldDefinition[] = [
  {
    field: "fullName",
    icon: "person-outline",
    label: "Full name",
    placeholder: "Enter your full name",
    autoCapitalize: "words",
    autoComplete: "name",
    textContentType: "name",
    maxLength: 80,
    required: true,
  },
  {
    field: "companyName",
    icon: "business-outline",
    label: "Company",
    placeholder: "Enter your company name",
    autoCapitalize: "words",
    autoComplete: "organization",
    maxLength: 100,
  },
  {
    field: "phoneNumber",
    icon: "call-outline",
    label: "Phone number",
    placeholder: "Enter your phone number",
    autoComplete: "tel",
    keyboardType: "phone-pad",
    textContentType: "telephoneNumber",
    maxLength: 24,
  },
];

type ProfileDetailsFormProps = {
  errors: ProfileValidationErrors;
  onChange: (field: EditableProfileField, value: string) => void;
  values: Pick<ProfileForm, EditableProfileField>;
};

export function ProfileDetailsForm({
  errors,
  onChange,
  values,
}: ProfileDetailsFormProps) {
  return (
    <View className="mt-5 rounded-[28px] border border-primary/20 bg-white p-5 shadow-sm shadow-primary/10">
      <Text className="font-ralewayBold text-lg text-textPrimary">
        Professional details
      </Text>
      <Text className="mt-1 text-sm leading-5 text-description">
        Information shown across your account and documents.
      </Text>

      <View className="mt-6 gap-5">
        {PROFILE_FIELDS.map(({ field, ...fieldProps }) => (
          <ProfileField
            key={field}
            {...fieldProps}
            value={values[field]}
            error={errors[field]}
            onChangeText={(value) => onChange(field, value)}
          />
        ))}
      </View>
    </View>
  );
}
