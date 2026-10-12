import type { AppleCredentialState } from "./appleCredentialState";

export type AppleChallenge = {
  challenge_id: string;
  nonce: string;
  state: string;
};
export type NativeAppleCredential = {
  identityToken: string;
  authorizationCode: string;
  state: string;
  name?: string;
};

export const nativeApple = {
  async isAvailable(): Promise<boolean> {
    return false;
  },
  async signIn(_challenge: AppleChallenge): Promise<NativeAppleCredential> {
    throw new Error("Apple sign-in requires the iOS app.");
  },
  async getCredentialState(_user: string): Promise<AppleCredentialState> {
    return "unknown";
  },
  onRevoke(_listener: () => void): () => void {
    return () => {};
  },
};
