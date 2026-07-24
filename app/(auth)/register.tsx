import { RegistrationCompanyStep } from "../../components/auth/registration/RegistrationCompanyStep";
import { RegistrationCredentialsStep } from "../../components/auth/registration/RegistrationCredentialsStep";
import { RegistrationNameStep } from "../../components/auth/registration/RegistrationNameStep";
import { RegistrationStepLayout } from "../../components/auth/registration/RegistrationStepLayout";
import { RegistrationVerificationStep } from "../../components/auth/registration/RegistrationVerificationStep";
import { useRegister } from "../../hooks/useRegister";

const STEP_CONTENT = {
  credentials: {
    buttonLabel: "Continue",
    subtitle:
      "Use the email address you want connected to your R.E.M. workspace.",
    title: "Create your account",
  },
  verification: {
    buttonLabel: "Verify & continue",
    subtitle:
      "Enter the six-digit verification code we sent when this step opened.",
    title: "Check your email",
  },
  name: {
    buttonLabel: "Continue",
    subtitle:
      "Add your legal first and last name. We’ll combine them for your account profile.",
    title: "What’s your name?",
  },
  company: {
    buttonLabel: "Create account",
    subtitle:
      "Tell us the company or real estate business this workspace belongs to.",
    title: "Name your company",
  },
} as const;

export default function RegisterScreen() {
  const {
    codeDigits,
    continueFromCredentials,
    continueFromName,
    continueFromVerification,
    draft,
    feedback,
    goBack,
    isRegistering,
    isRequestingCode,
    passwordWarning,
    register,
    requestVerificationCode,
    secondsRemaining,
    step,
    stepIndex,
    updateCodeDigits,
    updateField,
  } = useRegister();
  const content = STEP_CONTENT[step];

  function getContinueAction() {
    switch (step) {
      case "credentials":
        return continueFromCredentials;
      case "verification":
        return continueFromVerification;
      case "name":
        return continueFromName;
      case "company":
        return register;
    }
  }

  return (
    <RegistrationStepLayout
      buttonDisabled={
        step === "verification" &&
        (isRequestingCode || draft.verificationCode.length !== 6)
      }
      buttonLabel={content.buttonLabel}
      feedback={feedback}
      isLoading={isRegistering}
      onBack={goBack}
      onContinue={getContinueAction()}
      stepIndex={stepIndex}
      subtitle={content.subtitle}
      title={content.title}
    >
      {step === "credentials" ? (
        <RegistrationCredentialsStep
          email={draft.email}
          onEmailChange={(value) => updateField("email", value)}
          onPasswordChange={(value) => updateField("password", value)}
          password={draft.password}
          passwordWarning={passwordWarning}
        />
      ) : null}

      {step === "verification" ? (
        <RegistrationVerificationStep
          digits={codeDigits}
          email={draft.email}
          isRequestingCode={isRequestingCode}
          onDigitsChange={updateCodeDigits}
          onResend={() => void requestVerificationCode()}
          secondsRemaining={secondsRemaining}
        />
      ) : null}

      {step === "name" ? (
        <RegistrationNameStep
          firstName={draft.firstName}
          lastName={draft.lastName}
          onFirstNameChange={(value) => updateField("firstName", value)}
          onLastNameChange={(value) => updateField("lastName", value)}
        />
      ) : null}

      {step === "company" ? (
        <RegistrationCompanyStep
          company={draft.company}
          onCompanyChange={(value) => updateField("company", value)}
        />
      ) : null}
    </RegistrationStepLayout>
  );
}
