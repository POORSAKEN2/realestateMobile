export type StaffManagerStatus =
  | "active"
  | "disabled"
  | "pending"
  | "delivery_failed"
  | "expired"
  | "unknown";
export type StaffRecordKind = "account" | "invitation";
export type StaffManager = {
  id: string;
  name: string;
  email: string;
  role: "MANAGER";
  status: StaffManagerStatus;
  kind: StaffRecordKind;
  propertyIds: string[];
  permissions: string[];
  deliveryStatus?: "queued" | "sent" | "failed";
  expiresAt?: string;
  createdAt?: string;
};
export type StaffManagerDetails = {
  name: string;
  email: string;
  propertyIds?: string[];
  permissions?: string[];
};
export type CreateStaffManagerPayload = StaffManagerDetails;
export type StaffCapacity = {
  limit: number | null;
  accountsUsed: number;
  invitationsReserved: number;
  remaining: number | null;
  accessMode: string;
};
export type ManagerPermissionOption = { label: string; grants: string[] };
export type ManagerPermissionGroup = {
  label: string;
  options: ManagerPermissionOption[];
};
export type StaffRoster = {
  managers: StaffManager[];
  invitations: StaffManager[];
  records: StaffManager[];
  total: number;
  complete: boolean;
  capacity: StaffCapacity;
};

/** Optional operations express actual server support instead of pretending success. */
export interface StaffGateway {
  creationMode: "invitation";
  supportsAssignments: boolean;
  supportsPermissions: boolean;
  create(
    payload: CreateStaffManagerPayload,
    token?: string,
  ): Promise<StaffManager>;
  list?(token?: string): Promise<StaffRoster>;
  catalog?(token?: string): Promise<ManagerPermissionGroup[]>;
  update?(
    id: string,
    payload: StaffManagerDetails,
    token?: string,
  ): Promise<StaffManager>;
  updateInvitation?(
    id: string,
    payload: StaffManagerDetails,
    token?: string,
  ): Promise<StaffManager>;
  resendInvitation?(id: string, token?: string): Promise<StaffManager>;
  revokeInvitation?(id: string, token?: string): Promise<void>;
  setEnabled?(
    id: string,
    enabled: boolean,
    token?: string,
  ): Promise<StaffManager>;
  remove?(id: string, token?: string): Promise<void>;
}
