import type { AccessSnapshot } from "../../types/auth/access";
import type {
  CreateStaffManagerPayload,
  StaffCapacity,
  StaffGateway,
  StaffManager,
  StaffManagerDetails,
} from "../../types/domain/staff";
import { permits } from "../../utils/auth/accessPolicy";
import { ApiError } from "../../api/errors";
export function canAddManager(capacity?: StaffCapacity) {
  if (!capacity || capacity.accessMode !== "active") return false;
  return (
    capacity.limit === null ||
    (capacity.remaining !== null && capacity.remaining > 0)
  );
}
export function validateManagerDetails(payload: StaffManagerDetails) {
  if (!payload.name.trim()) throw new Error("Enter the manager's full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim()))
    throw new Error("Enter a valid manager email address.");
}
/** Business rules depend on a small gateway, never Axios, router, or a React component. */
export function createStaffService(
  gateway: StaffGateway,
  getAccess: () => AccessSnapshot,
  token?: string,
) {
  function authorize() {
    if (!permits(getAccess(), "staff.manage"))
      throw new ApiError("Only account owners can manage staff.", 403);
  }
  function available<T>(operation: T | undefined): T {
    if (!operation)
      throw new ApiError(
        "This staff action is not available for your account yet.",
        501,
        "STAFF_ACTION_UNAVAILABLE",
      );
    return operation;
  }
  return {
    async list() {
      authorize();
      return available(gateway.list)(token);
    },
    async create(payload: CreateStaffManagerPayload) {
      authorize();
      validateManagerDetails(payload);
      const roster = await available(gateway.list)(token);
      authorize();
      if (!canAddManager(roster.capacity))
        throw new ApiError(
          "Staff capacity reached or subscription inactive. Review Plan & Billing before inviting a manager.",
          403,
          "USER_LIMIT_REACHED",
        );
      return gateway.create(payload, token);
    },
    async update(record: StaffManager, payload: StaffManagerDetails) {
      authorize();
      validateManagerDetails(payload);
      return record.kind === "invitation"
        ? available(gateway.updateInvitation)(record.id, payload, token)
        : available(gateway.update)(record.id, payload, token);
    },
    async resend(id: string) {
      authorize();
      return available(gateway.resendInvitation)(id, token);
    },
    async revoke(id: string) {
      authorize();
      return available(gateway.revokeInvitation)(id, token);
    },
    async setEnabled(id: string, enabled: boolean) {
      authorize();
      return available(gateway.setEnabled)(id, enabled, token);
    },
    async remove(id: string) {
      authorize();
      return available(gateway.remove)(id, token);
    },
  };
}
