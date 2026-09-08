import type { AccessSnapshot, AppRole } from "../../types/auth/access";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function strings(value: unknown): string[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
}

/** Server authorization field names live here. Never read grants from form values. */
export function normalizeAccess(user: unknown): AccessSnapshot {
  const source = record(user);
  const access = record(source.access);
  const rawRole = String(source.role ?? "").trim().toUpperCase();
  const role: AppRole | undefined = rawRole === "OWNER" || rawRole === "ADMIN"
    ? "ADMIN" : rawRole === "MANAGER" ? "MANAGER" : undefined;
  const rawIds = access.propertyIds ?? source.assigned_property_ids;
  const propertyIds = rawIds === undefined ? null : Array.isArray(rawIds)
    ? [...new Set(rawIds.filter((id) => typeof id === "string" || typeof id === "number").map(String).filter(Boolean))] : [];
  const propertyPermissions = Object.fromEntries(Object.entries(
    record(access.propertyPermissions ?? source.property_permissions),
  ).map(([id, grants]) => [id, strings(grants) ?? []]));
  return { role, permissions: strings(access.permissions === null ? undefined : access.permissions ?? source.permissions), propertyIds, propertyPermissions };
}
