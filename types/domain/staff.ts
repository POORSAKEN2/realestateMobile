export type StaffManagerStatus = "active" | "invited" | "disabled" | "unknown";
export type StaffManager = {
  id: string;
  name: string;
  email: string;
  role: "MANAGER";
  status: StaffManagerStatus;
  propertyIds: string[];
  permissions: string[] | null;
  createdAt?: string;
};
export type StaffManagerDetails = {
  name: string;
  email: string;
  propertyIds?: string[];
  permissions?: string[];
};
export type CreateStaffManagerPayload = StaffManagerDetails & { password?: string };
export type StaffRoster = { managers: StaffManager[]; total: number; complete: boolean };

/** Optional operations express actual server support instead of pretending success. */
export interface StaffGateway {
  creationMode: "account" | "invitation";
  supportsAssignments: boolean;
  supportsPermissions: boolean;
  create(payload: CreateStaffManagerPayload, token?: string): Promise<StaffManager>;
  list?(token?: string): Promise<StaffRoster>;
  update?(id: string, payload: StaffManagerDetails, token?: string): Promise<StaffManager>;
  setEnabled?(id: string, enabled: boolean, token?: string): Promise<StaffManager>;
  remove?(id: string, token?: string): Promise<void>;
}
