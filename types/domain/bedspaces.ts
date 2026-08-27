export type BedspaceStatus = "Vacant" | "Occupied" | "Maintenance";

export type Bedspace = {
  id: string;
  roomId: string;
  bedspaceNumber: string;
  monthlyPrice: number;
  status: BedspaceStatus;
  notes?: string | null;
  activeLeaseId?: string | null;
  clientId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BedspacePayload = {
  bedspaceNumber: string;
  monthlyPrice: number;
  status?: Exclude<BedspaceStatus, "Occupied">;
  notes?: string | null;
};
