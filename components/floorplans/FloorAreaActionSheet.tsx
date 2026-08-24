import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";
import type { FloorPlanDrawingMode } from "../../types";

export type FloorAreaActionView = "shape" | "actions";

export function FloorAreaActionSheet({
  onClose,
  onDelete,
  onDraw,
  onRename,
  view,
}: {
  onClose: () => void;
  onDelete: () => void;
  onDraw: (mode: FloorPlanDrawingMode) => void;
  onRename: () => void;
  view: FloorAreaActionView | null;
}) {
  const actions: ActionSheetItem[] =
    view === "shape"
      ? [
          {
            description: "Draw a four-corner rectangular area.",
            icon: "vector-square",
            label: "Rectangle",
            onPress: () => onDraw("rectangle"),
          },
          {
            description: "Trace a custom area with multiple corners.",
            icon: "vector-polygon",
            label: "Polygon",
            onPress: () => onDraw("polygon"),
          },
        ]
      : [
          {
            icon: "pencil-outline",
            label: "Rename area",
            onPress: onRename,
          },
          {
            destructive: true,
            icon: "trash-can-outline",
            label: "Delete area",
            onPress: onDelete,
          },
        ];

  return (
    <ActionSheet
      actions={actions}
      bottomInsetMode="safe-area"
      comfortableBottomPadding={view === "shape"}
      onClose={onClose}
      subtitle={
        view === "shape"
          ? "Choose how to trace this area on the floor plan."
          : "Rename this area or remove it from the floor."
      }
      title={view === "shape" ? "Choose shape" : "Area actions"}
      visible={Boolean(view)}
    />
  );
}
