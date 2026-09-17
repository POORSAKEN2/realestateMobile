export function tokenFromInvitationUrl(url?: string | null): string {
  if (!url) return "";
  const match = url.match(/[#?&]token=([^&]+)/);
  try {
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

export function invitationPasswordError(
  password: string,
  confirmation: string,
): string {
  if (password.length < 8)
    return "Password must contain at least 8 characters.";
  if (password !== confirmation) return "Passwords do not match.";
  return "";
}
