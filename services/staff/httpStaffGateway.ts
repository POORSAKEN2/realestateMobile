import type {
  CreateStaffManagerPayload,
  ManagerPermissionGroup,
  StaffCapacity,
  StaffGateway,
  StaffManager,
  StaffManagerDetails,
  StaffRoster,
} from "../../types/domain/staff";
import type { StaffApiContract } from "../../api/staffContract";

export interface StaffTransport {
  get(path: string, token?: string): Promise<unknown>;
  post(path: string, payload: unknown, token?: string): Promise<unknown>;
  patch(path: string, payload: unknown, token?: string): Promise<unknown>;
  remove(path: string, token?: string): Promise<unknown>;
}
function unwrap(value: any): any {
  return value?.data ?? value;
}
export function normalizeStaffManager(
  value: unknown,
  kind: "account" | "invitation" = "account",
): StaffManager {
  const manager = unwrap(value);
  if (
    !manager?.id ||
    typeof manager.name !== "string" ||
    typeof manager.email !== "string" ||
    manager.role !== "MANAGER"
  ) {
    throw new Error(
      "Manager information could not be verified. Refresh the manager list.",
    );
  }
  const invitationStatus =
    manager.status === "expired"
      ? "expired"
      : manager.delivery_status === "failed"
        ? "delivery_failed"
        : "pending";
  const status =
    kind === "invitation"
      ? invitationStatus
      : ["active", "disabled"].includes(manager.status)
        ? manager.status
        : typeof manager.is_active === "boolean"
          ? manager.is_active
            ? "active"
            : "disabled"
          : "unknown";
  return {
    id: String(manager.id),
    name: manager.name,
    email: manager.email,
    role: "MANAGER",
    status,
    kind,
    propertyIds: Array.isArray(manager.assigned_property_ids)
      ? manager.assigned_property_ids.map(String)
      : [],
    permissions:
      Array.isArray(manager.permissions) &&
      manager.permissions.every((item: unknown) => typeof item === "string")
        ? manager.permissions
        : [],
    deliveryStatus: ["queued", "sent", "failed"].includes(
      manager.delivery_status,
    )
      ? manager.delivery_status
      : undefined,
    expiresAt:
      typeof manager.expires_at === "string" ? manager.expires_at : undefined,
    createdAt: manager.created_at,
  };
}
export function normalizeStaffRoster(value: unknown): StaffRoster {
  const envelope = value as any;
  const page = unwrap(value);
  const rows = Array.isArray(page) ? page : page?.data;
  if (!Array.isArray(rows))
    throw new Error("Manager list could not be read. Please try again.");
  const managers = rows.map((row: unknown) => normalizeStaffManager(row));
  const invitations = Array.isArray(envelope?.invitations)
    ? envelope.invitations.map((row: unknown) =>
        normalizeStaffManager(row, "invitation"),
      )
    : [];
  const total = Number(
    page?.total ?? (value as any)?.meta?.total ?? managers.length,
  );
  if (!Number.isInteger(total) || total < managers.length)
    throw new Error("Manager count could not be verified.");
  const rawCapacity = envelope?.capacity;
  const validMode =
    rawCapacity?.access_mode === "active" ||
    rawCapacity?.access_mode === "read_only";
  const validCounts =
    Number.isInteger(rawCapacity?.accounts_used) &&
    rawCapacity.accounts_used >= 0 &&
    Number.isInteger(rawCapacity?.invitations_reserved) &&
    rawCapacity.invitations_reserved >= 0;
  const validLimit =
    rawCapacity?.limit === null ||
    (Number.isInteger(rawCapacity?.limit) && rawCapacity.limit >= 0);
  const validRemaining =
    rawCapacity?.remaining === null ||
    (Number.isInteger(rawCapacity?.remaining) && rawCapacity.remaining >= 0);
  const consistent =
    (rawCapacity?.limit === null && rawCapacity?.remaining === null) ||
    (Number.isInteger(rawCapacity?.limit) &&
      rawCapacity?.remaining ===
        Math.max(
          0,
          rawCapacity.limit -
            rawCapacity.accounts_used -
            rawCapacity.invitations_reserved,
        ));
  if (
    !rawCapacity ||
    !validMode ||
    !validCounts ||
    !validLimit ||
    !validRemaining ||
    !consistent
  )
    throw new Error("Staff capacity could not be verified.");
  const capacity: StaffCapacity = {
    limit: rawCapacity.limit,
    accountsUsed: rawCapacity.accounts_used,
    invitationsReserved: rawCapacity.invitations_reserved,
    remaining: rawCapacity.remaining,
    accessMode: rawCapacity.access_mode,
  };
  return {
    managers,
    invitations,
    records: [...managers, ...invitations],
    total,
    complete: total === managers.length && !(page?.last_page > 1),
    capacity,
  };
}
export function normalizePermissionCatalog(
  value: unknown,
): ManagerPermissionGroup[] {
  const groups = unwrap(value);
  if (!Array.isArray(groups) || !groups.length)
    throw new Error("Manager permissions could not be verified.");
  const valid = groups.every(
    (group: any) =>
      typeof group?.label === "string" &&
      group.label.trim() &&
      Array.isArray(group.options) &&
      group.options.length &&
      group.options.every(
        (option: any) =>
          typeof option?.label === "string" &&
          option.label.trim() &&
          Array.isArray(option.grants) &&
          option.grants.length &&
          option.grants.every(
            (grant: unknown) => typeof grant === "string" && grant.trim(),
          ),
      ),
  );
  if (!valid) throw new Error("Manager permissions could not be verified.");
  return groups.map((group: any) => ({
    label: group.label,
    options: group.options.map((option: any) => ({
      label: option.label,
      grants: [...new Set(option.grants)],
    })),
  }));
}
function details(payload: StaffManagerDetails, contract: StaffApiContract) {
  // Explicit allowlist keeps role, owner IDs and unrelated profile fields out of requests.
  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    ...(contract.supportsAssignments && payload.propertyIds !== undefined
      ? { assigned_property_ids: payload.propertyIds }
      : {}),
    ...(contract.supportsPermissions && payload.permissions !== undefined
      ? { permissions: payload.permissions }
      : {}),
  };
}
export function createHttpStaffGateway(
  transport: StaffTransport,
  contract: StaffApiContract,
): StaffGateway {
  return {
    creationMode: contract.creationMode,
    supportsAssignments: contract.supportsAssignments,
    supportsPermissions: contract.supportsPermissions,
    create: async (payload: CreateStaffManagerPayload, token) =>
      normalizeStaffManager(
        await transport.post(
          contract.create,
          {
            ...details(payload, contract),
          },
          token,
        ),
        "invitation",
      ),
    ...(contract.list
      ? {
          list: async (token?: string) =>
            normalizeStaffRoster(await transport.get(contract.list!, token)),
        }
      : {}),
    ...(contract.catalog
      ? {
          catalog: async (token?: string) =>
            normalizePermissionCatalog(
              await transport.get(contract.catalog!, token),
            ),
        }
      : {}),
    ...(contract.update
      ? {
          update: async (
            id: string,
            payload: StaffManagerDetails,
            token?: string,
          ) =>
            normalizeStaffManager(
              await transport.patch(
                contract.update!(encodeURIComponent(id)),
                details(payload, contract),
                token,
              ),
            ),
        }
      : {}),
    ...(contract.updateInvitation
      ? {
          updateInvitation: async (
            id: string,
            payload: StaffManagerDetails,
            token?: string,
          ) =>
            normalizeStaffManager(
              await transport.patch(
                contract.updateInvitation!(encodeURIComponent(id)),
                details(payload, contract),
                token,
              ),
              "invitation",
            ),
        }
      : {}),
    ...(contract.resendInvitation
      ? {
          resendInvitation: async (id: string, token?: string) =>
            normalizeStaffManager(
              await transport.post(
                contract.resendInvitation!(encodeURIComponent(id)),
                {},
                token,
              ),
              "invitation",
            ),
        }
      : {}),
    ...(contract.revokeInvitation
      ? {
          revokeInvitation: async (id: string, token?: string) => {
            await transport.remove(
              contract.revokeInvitation!(encodeURIComponent(id)),
              token,
            );
          },
        }
      : {}),
    ...(contract.setEnabled
      ? {
          setEnabled: async (id: string, enabled: boolean, token?: string) =>
            normalizeStaffManager(
              await transport.patch(
                contract.setEnabled!(encodeURIComponent(id)),
                { is_active: enabled },
                token,
              ),
            ),
        }
      : {}),
    ...(contract.remove
      ? {
          remove: async (id: string, token?: string) => {
            await transport.remove(
              contract.remove!(encodeURIComponent(id)),
              token,
            );
          },
        }
      : {}),
  };
}
