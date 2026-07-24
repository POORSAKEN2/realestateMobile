export type EmailVerificationService = {
  requestNewCode: () => Promise<string>;
  verify: (code: string) => Promise<string>;
};

const PREVIEW_DELAY_MS = 700;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export const previewEmailVerificationService: EmailVerificationService = {
  async requestNewCode() {
    await wait(PREVIEW_DELAY_MS);
    return "A new verification email has been requested.";
  },
  async verify(_code) {
    await wait(PREVIEW_DELAY_MS);
    return "Email verification code captured. Connect the verification service to complete this step.";
  },
};
