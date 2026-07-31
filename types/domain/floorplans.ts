export type FloorPlanPoint = {
  x: number;
  y: number;
};

export type FloorPlanDrawingMode = "polygon" | "rectangle";

export type FloorArea = {
  id: string;
  floorplanId: string;
  label: string;
  points: FloorPlanPoint[];
  sortOrder: number;
  roomIds: string[];
};

export type FloorPlan = {
  id: string;
  propertyId: string;
  name: string;
  sortOrder: number;
  image?: string;
  areas: FloorArea[];
};

export type PropertyRoomStatus = "Vacant" | "Occupied" | "Maintenance";

export type PropertyRoom = {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor?: string | null;
  areaId?: string | null;
  points: FloorPlanPoint[];
  type?: string | null;
  status: PropertyRoomStatus;
  notes?: string | null;
};

export type FloorPlanImageUpload = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export type FloorPlanPayload = {
  name: string;
};

export type FloorAreaPayload = {
  label?: string;
  points?: FloorPlanPoint[];
};

export type PropertyRoomPayload = {
  propertyId: string;
  roomNumber: string;
  floor?: string;
  areaId?: string | null;
  points?: FloorPlanPoint[];
  type?: string;
  status?: PropertyRoomStatus;
  notes?: string;
};
