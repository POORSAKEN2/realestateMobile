import { useMemo } from "react";
import { normalizeAccess } from "../../utils/auth/accessAdapter";
import { canAccessProperty, permits, type AppPermission } from "../../utils/auth/accessPolicy";
import { useAuth } from "../useAuth";
export function useAccess() {
  const { session } = useAuth();
  const access = useMemo(() => normalizeAccess(session?.user), [session?.user]);
  return {
    access,
    can: (permission: AppPermission, propertyId?: string) => permits(access, permission, propertyId),
    canAccessProperty: (propertyId: string) => canAccessProperty(access, propertyId),
    hasAssignments: access.role === "ADMIN" || Boolean(access.propertyIds?.length),
  };
}
