import { RegistrationStepContent } from "../../components/auth/registration/RegistrationStepContent";
import { RegistrationStepLayout } from "../../components/auth/registration/RegistrationStepLayout";
import { REGISTRATION_STEP_CONTENT } from "../../constants/registration";
import { useRegistrationFlow } from "../../hooks/auth/registration/useRegistrationFlow";

export default function RegisterScreen() {
  const {
    codeDigits,
    continueRegistration,
    draft,
    feedback,
    goBack,
    isContinueDisabled,
    isRegistering,
    isRequestingCode,
    passwordWarning,
    requestVerificationCode,
    secondsRemaining,
    step,
    stepIndex,
    updateCodeDigits,
    updateField,
  } = useRegistrationFlow();
  const content = REGISTRATION_STEP_CONTENT[step];

  return (
    <RegistrationStepLayout
      buttonDisabled={isContinueDisabled}
      buttonLabel={content.buttonLabel}
      feedback={feedback}
      isLoading={isRegistering}
      onBack={goBack}
      onContinue={continueRegistration}
      stepIndex={stepIndex}
      subtitle={content.subtitle}
      title={content.title}
    >
      <RegistrationStepContent
        codeDigits={codeDigits}
        draft={draft}
        isRequestingCode={isRequestingCode}
        onCodeDigitsChange={updateCodeDigits}
        onFieldChange={updateField}
        onResendCode={() => void requestVerificationCode()}
        passwordWarning={passwordWarning}
        secondsRemaining={secondsRemaining}
        step={step}
      />
    </RegistrationStepLayout>
  );
}
