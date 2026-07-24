import { useCallback, useState } from "react";

import {
  INITIAL_REGISTRATION_DRAFT,
  type RegistrationFeedback,
  type RegistrationStep,
} from "../../../constants/registration";
import type { RegistrationDraft } from "../../../types";

export function useRegistrationState() {
  const [draft, setDraft] = useState(INITIAL_REGISTRATION_DRAFT);
  const [step, setStep] = useState<RegistrationStep>("credentials");
  const [feedback, setFeedback] = useState<RegistrationFeedback | null>(null);

  const updateField = useCallback(
    <Field extends keyof RegistrationDraft>(
      field: Field,
      value: RegistrationDraft[Field],
    ) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setFeedback(null);
    },
    [],
  );

  const showError = useCallback((message: string) => {
    setFeedback({ message, tone: "error" });
  }, []);

  return {
    draft,
    feedback,
    setFeedback,
    setStep,
    showError,
    step,
    updateField,
  };
}
