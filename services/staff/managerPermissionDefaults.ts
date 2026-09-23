import type { ManagerPermissionGroup } from "../../types/domain/staff";

const DEFAULT_MANAGER_PERMISSIONS = [
  "properties.viewAny",
  "properties.view",
  "clients.viewAny",
  "clients.view",
  "billing.viewEntitlement",
  "notifications.viewAny",
] as const;

/** Defaults apply only until a new invitation's selections are edited. */
export function resolveManagerEditorPermissions(
  groups: ManagerPermissionGroup[],
  selectedPermissions?: string[],
): string[] {
  if (selectedPermissions !== undefined) return selectedPermissions;

  const available = new Set(
    groups.flatMap((group) => group.options.flatMap((option) => option.grants)),
  );
  return DEFAULT_MANAGER_PERMISSIONS.filter((grant) => available.has(grant));
}
