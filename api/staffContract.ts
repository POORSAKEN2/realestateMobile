/** Configure only routes confirmed by the backend. No speculative endpoint calls. */
export interface StaffApiContract {
  creationMode: "account" | "invitation";
  create: string;
  list?: string;
  update?: (id: string) => string;
  setEnabled?: (id: string) => string;
  remove?: (id: string) => string;
  supportsAssignments: boolean;
  supportsPermissions: boolean;
}
export const staffApiContract: StaffApiContract = {
  creationMode: "account",
  create: "/users",
  supportsAssignments: false,
  supportsPermissions: false,
};
