export type AppleCredentialState =
  | "authorized"
  | "revoked"
  | "not_found"
  | "transferred"
  | "unknown";

export type AppleInvalidationReason =
  | "apple_credential_revoked"
  | "apple_credential_not_found"
  | "apple_revocation_notification";

export async function readAppleCredentialState(
  isDevice: boolean,
  read: () => Promise<AppleCredentialState>,
): Promise<AppleCredentialState> {
  if (!isDevice) return "unknown";
  try {
    return await read();
  } catch {
    return "unknown";
  }
}

export function createAppleCredentialMonitor({
  token,
  currentToken,
  read,
  onInvalidate,
}: {
  token: string;
  currentToken: () => string | undefined;
  read: () => Promise<AppleCredentialState>;
  onInvalidate: (reason: AppleInvalidationReason) => void;
}) {
  let disposed = false;
  let checking = false;
  let invalidated = false;
  const active = () => !disposed && !invalidated && currentToken() === token;
  const invalidate = (reason: AppleInvalidationReason) => {
    if (!active()) return;
    invalidated = true;
    onInvalidate(reason);
  };

  return {
    async check() {
      if (checking || !active()) return;
      checking = true;
      try {
        const state = await read();
        if (state === "revoked") invalidate("apple_credential_revoked");
        else if (state === "not_found")
          invalidate("apple_credential_not_found");
      } catch {
        // A failed lookup does not establish that Apple revoked access.
      } finally {
        checking = false;
      }
    },
    revoke: () => invalidate("apple_revocation_notification"),
    dispose: () => {
      disposed = true;
    },
  };
}
