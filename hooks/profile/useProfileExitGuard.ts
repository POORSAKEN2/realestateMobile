import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type ProfileConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export function useProfileExitGuard({
  hasChanges,
  isSaving,
  onDiscard,
}: {
  hasChanges: boolean;
  isSaving: boolean;
  onDiscard: () => void;
}) {
  const navigation = useNavigation();
  const [confirmation, setConfirmation] = useState<ProfileConfirmation | null>(
    null,
  );
  const [allowLeaving, setAllowLeaving] = useState(false);
  const departure = useRef<(() => void) | null>(null);

  function leave(onLeave: () => void) {
    departure.current = onLeave;
    setAllowLeaving(true);
  }

  useEffect(() => {
    if (!allowLeaving) return;
    const action = departure.current;
    departure.current = null;
    action?.();
  }, [allowLeaving]);

  function requestDiscard(onDiscarded = onDiscard) {
    if (isSaving) return;
    if (!hasChanges) {
      onDiscarded();
      return;
    }
    setConfirmation({
      title: "Discard changes?",
      description:
        "Your unsaved profile edits and photo selection will be removed.",
      confirmLabel: "Discard",
      onConfirm: onDiscarded,
    });
  }

  usePreventRemove((hasChanges || isSaving) && !allowLeaving, ({ data }) => {
    requestDiscard(() => {
      onDiscard();
      leave(() => navigation.dispatch(data.action));
    });
  });

  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      typeof window === "undefined" ||
      allowLeaving ||
      (!hasChanges && !isSaving)
    )
      return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [hasChanges, isSaving, allowLeaving]);

  function requestSignOut(onSignOut: () => void) {
    if (isSaving) return;
    setConfirmation({
      title: "Sign out?",
      description: hasChanges
        ? "Signing out will discard your unsaved profile edits and photo selection. Your account and workspace will remain."
        : "Sign out of Terrane on this device? Your account and workspace will remain.",
      confirmLabel: "Sign out",
      onConfirm: () => leave(onSignOut),
    });
  }

  return {
    confirmation,
    requestDiscard,
    requestSignOut,
    cancel: () => setConfirmation(null),
    confirm: () => {
      if (isSaving || !confirmation) return;
      setConfirmation(null);
      confirmation.onConfirm();
    },
  };
}
