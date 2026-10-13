import type { AuthSession } from "../../types";

export type ProfileAccountPresentation = {
  provider: "apple" | null;
  isPrivateEmail: boolean;
  accountEmail?: string;
  accountName?: string;
  summaryEmail?: string;
};

export function getProfileAccountPresentation(
  authMethod: AuthSession["authMethod"],
  email?: string,
  name?: string,
): ProfileAccountPresentation {
  const accountEmail = email?.trim() || undefined;
  const provider = authMethod === "apple" ? "apple" : null;
  const domain = accountEmail
    ?.slice(accountEmail.lastIndexOf("@") + 1)
    .toLowerCase();
  const isPrivateEmail = Boolean(
    provider &&
    accountEmail?.includes("@") &&
    (domain === "privaterelay.appleid.com" || domain === "private.icloud.com"),
  );

  return {
    provider,
    isPrivateEmail,
    accountEmail,
    ...(name?.trim() ? { accountName: name.trim() } : {}),
    summaryEmail: isPrivateEmail ? undefined : accountEmail,
  };
}
