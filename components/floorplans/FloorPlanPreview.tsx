import { FloorPlanCanvas } from "./FloorPlanCanvas";
import type { FloorPlan } from "../../types";

const noop = () => undefined;

export function FloorPlanPreview({
  floor,
  hiddenAreaIds,
  onPickImage,
  showAreaShapes,
}: {
  floor: FloorPlan;
  hiddenAreaIds: Set<string>;
  onPickImage: () => void;
  showAreaShapes: boolean;
}) {
  return (
    <FloorPlanCanvas
      areas={floor.areas}
      drawingArea={null}
      drawingMode={null}
      focusedAreaId={null}
      hiddenAreaIds={hiddenAreaIds}
      image={floor.image}
      isSaving={false}
      onCancelDrawing={noop}
      onEmptyImagePress={onPickImage}
      onSaveShape={noop}
      showAreaShapes={showAreaShapes}
      showShapeCaption={false}
    />
  );
}
