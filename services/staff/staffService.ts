import type { AccessSnapshot } from "../../types/auth/access";
import type { CreateStaffManagerPayload, StaffGateway, StaffManagerDetails, StaffRoster } from "../../types/domain/staff";
import { permits } from "../../utils/auth/accessPolicy";
import { ApiError } from "../../api/errors";
export const MAX_MANAGERS = 2;
export function canAddManager(roster?: StaffRoster) { return !roster || roster.total < MAX_MANAGERS; }
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
    async create(payload: CreateStaffManagerPayload, knownRoster?: StaffRoster) {
      authorize(); validateManagerDetails(payload);
      if (gateway.creationMode === "account" && (payload.password?.length ?? 0) < 8) throw new Error("Password must contain at least 8 characters.");
      // Refresh the roster before provisioning; backend still owns the atomic limit.
      const roster = gateway.list ? await gateway.list(token) : knownRoster;
      authorize();
      if (!canAddManager(roster)) throw new ApiError("Manager limit reached (maximum 2).", 403, "MANAGER_LIMIT_REACHED");
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
