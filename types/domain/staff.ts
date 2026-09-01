export type StaffManagerStatus = "active" | "pending";

export type StaffManager = {
  id: string;
  name: string;
  email: string;
  status: StaffManagerStatus;
  createdAt?: string;
};

export type StaffOverview = {
  managers: StaffManager[];
  managerCount: number;
  managerLimit: number;
  canInvite: boolean;
};
