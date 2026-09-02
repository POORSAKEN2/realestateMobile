export type StaffManager = {
  id: string;
  name: string;
  email: string;
  role: "MANAGER";
  createdAt?: string;
};

export type CreateStaffManagerPayload = {
  name: string;
  email: string;
  password: string;
};
