/** Configure only routes confirmed by the backend. No speculative endpoint calls. */
export interface StaffApiContract {
  creationMode: "invitation";
  create: string;
  list?: string;
  catalog?: string;
  updateInvitation?: (id: string) => string;
  resendInvitation?: (id: string) => string;
  revokeInvitation?: (id: string) => string;
  update?: (id: string) => string;
  setEnabled?: (id: string) => string;
  remove?: (id: string) => string;
  supportsAssignments: boolean;
  supportsPermissions: boolean;
}
export const staffApiContract: StaffApiContract = {
  creationMode: "invitation",
  create: "/staff/invitations",
  list: "/users",
  catalog: "/staff/access-catalog",
  updateInvitation: (id) => `/staff/invitations/${id}`,
  resendInvitation: (id) => `/staff/invitations/${id}/resend`,
  revokeInvitation: (id) => `/staff/invitations/${id}`,
  update: (id) => `/users/${id}`,
  setEnabled: (id) => `/users/${id}`,
  remove: (id) => `/users/${id}`,
  supportsAssignments: true,
  supportsPermissions: true,
};
