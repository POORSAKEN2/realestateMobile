import type { RegistrationStep } from "../../../constants/registration";
import type { RegistrationDraft } from "../../../types";
import { RegistrationCompanyStep } from "./RegistrationCompanyStep";
import { RegistrationCredentialsStep } from "./RegistrationCredentialsStep";
import { RegistrationNameStep } from "./RegistrationNameStep";
import { RegistrationVerificationStep } from "./RegistrationVerificationStep";

type RegistrationStepContentProps = {
  codeDigits: string[];
  draft: RegistrationDraft;
  isRequestingCode: boolean;
  onCodeDigitsChange: (digits: string[]) => void;
  onFieldChange: <Field extends keyof RegistrationDraft>(
    field: Field,
    value: RegistrationDraft[Field],
  ) => void;
  onResendCode: () => void;
  passwordWarning: string;
  secondsRemaining: number;
  step: RegistrationStep;
};

export function RegistrationStepContent({
  codeDigits,
  draft,
  isRequestingCode,
  onCodeDigitsChange,
  onFieldChange,
  onResendCode,
  passwordWarning,
  secondsRemaining,
  step,
}: RegistrationStepContentProps) {
  switch (step) {
    case "credentials":
      return (
        <RegistrationCredentialsStep
          email={draft.email}
          onEmailChange={(value) => onFieldChange("email", value)}
          onPasswordChange={(value) => onFieldChange("password", value)}
          password={draft.password}
          passwordWarning={passwordWarning}
        />
      );
    case "verification":
      return (
        <RegistrationVerificationStep
          digits={codeDigits}
          email={draft.email}
          isRequestingCode={isRequestingCode}
          onDigitsChange={onCodeDigitsChange}
          onResend={onResendCode}
          secondsRemaining={secondsRemaining}
        />
      );
    case "name":
      return (
        <RegistrationNameStep
          firstName={draft.firstName}
          lastName={draft.lastName}
          onFirstNameChange={(value) => onFieldChange("firstName", value)}
          onLastNameChange={(value) => onFieldChange("lastName", value)}
        />
      );
    case "company":
      return (
        <RegistrationCompanyStep
          company={draft.company}
          onCompanyChange={(value) => onFieldChange("company", value)}
        />
      );
  }
}
