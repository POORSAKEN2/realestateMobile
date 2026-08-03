import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";
import type { AssignedRoomActionView } from "../../hooks/floorplans/useAssignedRoomsViewModel";
import type { PropertyRoom, PropertyRoomStatus } from "../../types";
import {
  getRoomStatusLabel,
  ROOM_STATUS_OPTIONS,
} from "../../utils/floorplans/floorPlanPresentation";

export function FloorAssignedRoomActionsSheet({
  isBusy,
  onClose,
  onShowStatus,
  onStatusChange,
  onUnlink,
  room,
  view,
}: {
  isBusy: boolean;
  onClose: () => void;
  onShowStatus: () => void;
  onStatusChange: (room: PropertyRoom, status: PropertyRoomStatus) => void;
  onUnlink: (room: PropertyRoom) => void;
  room?: PropertyRoom;
  view: AssignedRoomActionView | null;
}) {
  const actions: ActionSheetItem[] = room
    ? view === "status"
      ? ROOM_STATUS_OPTIONS.map((option) => ({
          description:
            option.value === room.status ? "Current status" : undefined,
          disabled: isBusy,
          icon:
            option.value === room.status ? "check-circle" : "circle-outline",
          label: option.label,
          onPress: () => onStatusChange(room, option.value),
          selected: option.value === room.status,
        }))
      : [
          {
            description: `Currently ${getRoomStatusLabel(room.status).toLowerCase()}.`,
            disabled: isBusy,
            icon: "pencil-outline",
            label: "Edit status",
            onPress: onShowStatus,
          },
          {
            description: "Remove this room's assignment from the area.",
            disabled: isBusy,
            icon: "link-variant-off",
            label: "Unlink",
            onPress: () => onUnlink(room),
          },
        ]
    : [];

  return (
    <ActionSheet
      actions={actions}
      onClose={onClose}
      subtitle={
        view === "status"
          ? "Choose this room's current availability."
          : "Update this room or remove its area assignment."
      }
      title={
        view === "status"
          ? `Edit ${room?.roomNumber ?? "room"} status`
          : `${room?.roomNumber ?? "Room"} actions`
      }
      visible={Boolean(room && view)}
    />
  );
}
