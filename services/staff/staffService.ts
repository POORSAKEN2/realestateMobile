import type { AccessSnapshot } from "../../types/auth/access";
import type { CreateStaffManagerPayload, StaffGateway, StaffManagerDetails } from "../../types/domain/staff";
import { permits } from "../../utils/auth/accessPolicy";
import { ApiError } from "../../api/errors";
import type { BillingEntitlement } from "../../types/domain/billing";
export function canAddManager(entitlement?: BillingEntitlement) {
  const users = entitlement?.limits?.users;
  if (!users || entitlement?.access_mode === "read_only") return false;
  return users.limit === null || users.used < users.limit;
}
export function validateManagerDetails(payload: StaffManagerDetails) {
  if (!payload.name.trim()) throw new Error("Enter the manager's full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) throw new Error("Enter a valid manager email address.");
}
/** Business rules depend on a small gateway, never Axios, router, or a React component. */
export function createStaffService(gateway: StaffGateway, getAccess: () => AccessSnapshot, token?: string) {
  function authorize() {
    if (!permits(getAccess(), "staff.manage")) throw new ApiError("Only account owners can manage staff.", 403);
  }
  function available<T>(operation: T | undefined): T {
    if (!operation) throw new ApiError("This staff action is not available for your account yet.", 501, "STAFF_ACTION_UNAVAILABLE");
    return operation;
  }
  return {
    async list() { authorize(); return available(gateway.list)(token); },
    async create(payload: CreateStaffManagerPayload) {
      authorize(); validateManagerDetails(payload);
      if (gateway.creationMode === "account" && (payload.password?.length ?? 0) < 8) throw new Error("Password must contain at least 8 characters.");
      // Refresh server usage, including the owner and disabled accounts.
      const entitlement = await available(gateway.billing)(token);
      authorize();
      if (!canAddManager(entitlement)) throw new ApiError("User limit reached or subscription inactive. Review Plan & Billing before adding a manager.", 403, "USER_LIMIT_REACHED");
      return gateway.create(payload, token);
    },
    async update(id: string, payload: StaffManagerDetails) {
      authorize(); validateManagerDetails(payload);
      return available(gateway.update)(id, payload, token);
    },
    async setEnabled(id: string, enabled: boolean) { authorize(); return available(gateway.setEnabled)(id, enabled, token); },
    async remove(id: string) { authorize(); return available(gateway.remove)(id, token); },
  };
}
