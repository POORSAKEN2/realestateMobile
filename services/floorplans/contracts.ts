import type { FloorPlanImageUpload } from "../../types";

export type FloorPlanImageSelection =
  | { status: "cancelled" }
  | { status: "permission-denied" }
  | { status: "selected"; image: FloorPlanImageUpload };

export interface FloorPlanImagePicker {
  select(): Promise<FloorPlanImageSelection>;
}

export interface FloorPlanVisibilityRepository {
  load(propertyId: string): Promise<Set<string>>;
  save(propertyId: string, hiddenAreaIds: Set<string>): Promise<void>;
}

export interface FloorPlanFeedback {
  showError(title: string, message: string): void;
}

export type FloorPlanManagerDependencies = {
  feedback: FloorPlanFeedback;
  imagePicker: FloorPlanImagePicker;
  visibilityRepository: FloorPlanVisibilityRepository;
};
