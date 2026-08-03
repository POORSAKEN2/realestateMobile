import {
  FloorPlanEntityNameModal,
  type FloorPlanEntityNameModalProps,
} from "./FloorPlanEntityNameModal";

export function FloorNameModal(props: FloorPlanEntityNameModalProps) {
  return (
    <FloorPlanEntityNameModal
      {...props}
      entityLabel="floor"
      fieldLabel="Floor name"
      placeholder="e.g. Ground Floor"
      subtitle="Floor names appear in property summary and room records."
    />
  );
}
