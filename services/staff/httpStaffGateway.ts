import type { CreateStaffManagerPayload, StaffGateway, StaffManager, StaffManagerDetails, StaffRoster } from "../../types/domain/staff";
import type { StaffApiContract } from "../../api/staffContract";

export interface StaffTransport {
  get(path: string, token?: string): Promise<unknown>;
  post(path: string, payload: unknown, token?: string): Promise<unknown>;
  patch(path: string, payload: unknown, token?: string): Promise<unknown>;
  remove(path: string, token?: string): Promise<unknown>;
}
function unwrap(value: any): any { return value?.data ?? value; }
export function normalizeStaffManager(value: unknown): StaffManager {
  const manager = unwrap(value);
  if (!manager?.id || typeof manager.name !== "string" || typeof manager.email !== "string" || manager.role !== "MANAGER") {
    throw new Error("Manager information could not be verified. Refresh the manager list.");
  }
  const status = ["active", "invited", "disabled"].includes(manager.status) ? manager.status
    : typeof manager.is_active === "boolean" ? manager.is_active ? "active" : "disabled" : "unknown";
  return {
    id: String(manager.id), name: manager.name, email: manager.email, role: "MANAGER", status,
    propertyIds: Array.isArray(manager.assigned_property_ids) ? manager.assigned_property_ids.map(String) : [],
    permissions: Array.isArray(manager.permissions) ? manager.permissions.filter((item: unknown) => typeof item === "string") : null,
    createdAt: manager.created_at,
  };
}
export function normalizeStaffRoster(value: unknown): StaffRoster {
  const page = unwrap(value);
  const rows = Array.isArray(page) ? page : page?.data;
  if (!Array.isArray(rows)) throw new Error("Manager list could not be read. Please try again.");
  const managers = rows.map(normalizeStaffManager);
  const total = Number(page?.total ?? (value as any)?.meta?.total ?? managers.length);
  if (!Number.isInteger(total) || total < managers.length) throw new Error("Manager count could not be verified.");
  return { managers, total, complete: total === managers.length && !(page?.last_page > 1) };
}
function details(payload: StaffManagerDetails, contract: StaffApiContract) {
  // Explicit allowlist keeps role, owner IDs and unrelated profile fields out of requests.
  return {
    name: payload.name.trim(), email: payload.email.trim().toLowerCase(),
    ...(contract.supportsAssignments && payload.propertyIds !== undefined ? { assigned_property_ids: payload.propertyIds } : {}),
    ...(contract.supportsPermissions && payload.permissions !== undefined ? { permissions: payload.permissions } : {}),
  };
}
export function createHttpStaffGateway(transport: StaffTransport, contract: StaffApiContract): StaffGateway {
  return {
    creationMode: contract.creationMode,
    supportsAssignments: contract.supportsAssignments,
    supportsPermissions: contract.supportsPermissions,
    create: async (payload: CreateStaffManagerPayload, token) => normalizeStaffManager(await transport.post(contract.create, {
      ...details(payload, contract), role: "MANAGER",
      ...(contract.creationMode === "account" ? { password: payload.password } : {}),
    }, token)),
    ...(contract.list ? { list: async (token?: string) => normalizeStaffRoster(await transport.get(contract.list!, token)) } : {}),
    ...(contract.update ? { update: async (id: string, payload: StaffManagerDetails, token?: string) =>
      normalizeStaffManager(await transport.patch(contract.update!(encodeURIComponent(id)), details(payload, contract), token)) } : {}),
    ...(contract.setEnabled ? { setEnabled: async (id: string, enabled: boolean, token?: string) =>
      normalizeStaffManager(await transport.patch(contract.setEnabled!(encodeURIComponent(id)), { is_active: enabled }, token)) } : {}),
    ...(contract.remove ? { remove: async (id: string, token?: string) => { await transport.remove(contract.remove!(encodeURIComponent(id)), token); } } : {}),
  };
}
