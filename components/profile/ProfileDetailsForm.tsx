import { View } from "react-native";

import type {
  EditableProfileField,
  ProfileForm,
  ProfileValidationErrors,
} from "../../types";
import { ProfileField, type ProfileFieldProps } from "./ProfileField";
import { FormSection } from "../ui/forms/FormSection";

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
  disabled?: boolean;
};

export function ProfileDetailsForm({
  errors,
  onChange,
  values,
  disabled = false,
}: ProfileDetailsFormProps) {
  return (
    <View className="mt-5">
      <FormSection
        icon="account-edit-outline"
        title="Professional details"
        description="Used across your account and documents. Only your name is required."
        variant="card"
      >
        <View className="gap-4">
          {PROFILE_FIELDS.map(({ field, ...fieldProps }) => (
            <ProfileField
              key={field}
              {...fieldProps}
              value={values[field]}
              error={errors[field]}
              editable={!disabled}
              onChangeText={(value) => onChange(field, value)}
            />
          ))}
        </View>
      </FormSection>
    </View>
  );
}
