import type { PropsWithChildren, ReactNode } from "react";
import type { AppPermission } from "../../types/auth/access";
import { useAccess } from "../../hooks/auth/useAccess";
export function PermissionGate({ permission, propertyId, fallback = null, children }: PropsWithChildren<{
  permission: AppPermission; propertyId?: string; fallback?: ReactNode;
}>) {
  const { can } = useAccess();
  return can(permission, propertyId) ? children : fallback;
}
