import {
  FloorPlanEntityNameModal,
  type FloorPlanEntityNameModalProps,
} from "./FloorPlanEntityNameModal";

export function AreaNameModal(props: FloorPlanEntityNameModalProps) {
  return (
    <FloorPlanEntityNameModal
      {...props}
      createTitle="Add floor area"
      entityLabel="area"
      fieldLabel="Area name"
      placeholder="e.g. South Wing"
      subtitle="Each area has one unique name and one plan shape."
    />
  );
}
