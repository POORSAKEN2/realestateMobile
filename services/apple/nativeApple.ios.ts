import * as AppleAuthentication from "expo-apple-authentication";
import { isDevice } from "expo-device";
import { readAppleCredentialState } from "./appleCredentialState";
import type { AppleChallenge, NativeAppleCredential } from "./nativeApple";

export const nativeApple = {
  isAvailable: AppleAuthentication.isAvailableAsync,
  async signIn(challenge: AppleChallenge): Promise<NativeAppleCredential> {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
      nonce: challenge.nonce,
      state: challenge.state,
    });
    if (
      credential.state !== challenge.state ||
      !credential.identityToken ||
      !credential.authorizationCode
    ) {
      throw new Error(
        "Apple did not return valid credentials. Please try again.",
      );
    }
    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      state: credential.state,
      name: credential.fullName
        ? AppleAuthentication.formatFullName(credential.fullName)
        : undefined,
    };
  },
  getCredentialState(user: string) {
    return readAppleCredentialState(isDevice, async () => {
      const state = await AppleAuthentication.getCredentialStateAsync(user);
      switch (state) {
        case AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED:
          return "authorized";
        case AppleAuthentication.AppleAuthenticationCredentialState.REVOKED:
          return "revoked";
        case AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND:
          return "not_found";
        case AppleAuthentication.AppleAuthenticationCredentialState.TRANSFERRED:
          return "transferred";
        default:
          return "unknown";
      }
    });
  },
  onRevoke(listener: () => void): () => void {
    const subscription = AppleAuthentication.addRevokeListener(listener);
    return () => subscription.remove();
  },
};
