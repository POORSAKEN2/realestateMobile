import { Pressable, Text, View } from "react-native";

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
  isEditing: boolean;
  savedValues: Pick<ProfileForm, EditableProfileField>;
  onEdit: () => void;
};

export function ProfileDetailsForm({
  errors,
  onChange,
  values,
  disabled = false,
  isEditing,
  savedValues,
  onEdit,
}: ProfileDetailsFormProps) {
  return (
    <View className="mt-5">
      <FormSection
        icon="account-edit-outline"
        title="Professional details"
        description={isEditing ? "Only your full name is required." : undefined}
        variant="card"
        headerAction={
          !isEditing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit professional details"
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={onEdit}
              className="min-h-12 min-w-12 items-center justify-center rounded-lg px-2 active:bg-primary/10"
            >
              <Text className="font-ralewaySemiBold text-sm text-primaryContent">
                Edit
              </Text>
            </Pressable>
          ) : null
        }
      >
        <View className="gap-4">
          {PROFILE_FIELDS.map(({ field, ...fieldProps }) =>
            isEditing ? (
              <ProfileField
                key={field}
                {...fieldProps}
                value={values[field]}
                error={errors[field]}
                editable={!disabled}
                onChangeText={(value) => onChange(field, value)}
              />
            ) : (
              <View key={field} className="gap-1">
                <Text className="font-ralewaySemiBold text-sm text-description">
                  {fieldProps.label}
                </Text>
                <Text
                  className={`font-ralewayMedium text-base leading-6 ${savedValues[field].trim() ? "text-textPrimary" : "text-description"}`}
                >
                  {savedValues[field].trim() || "Not added"}
                </Text>
              </View>
            ),
          )}
        </View>
      </FormSection>
    </View>
  );
}
