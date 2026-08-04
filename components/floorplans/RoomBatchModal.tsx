import { FloorRoomBatchSection } from "./FloorRoomBatchSection";
import { FloorRoomLinkSection } from "./FloorRoomLinkSection";
import { AddEditModal } from "../ui/AddEditModal";
import AddButton from "../ui/buttons/AddButton";
import type { FloorArea, FloorPlan, PropertyRoom } from "../../types";

export type RoomBatchModalProps = {
  area?: FloorArea;
  assignedRoomCount: number;
  availableRooms: PropertyRoom[];
  canCreateRooms: boolean;
  canGenerate: boolean;
  count: string;
  floor?: FloorPlan;
  isBusy: boolean;
  isCreating: boolean;
  isLinking: boolean;
  onChangeCount: (value: string) => void;
  onChangePrefix: (value: string) => void;
  onChangeStart: (value: string) => void;
  onClose: () => void;
  onGenerate: () => void;
  onLinkRoom: () => void;
  onOpenAssignedRooms: () => void;
  onSelectRoom: (roomId: string) => void;
  prefix: string;
  selectedRoomId: string;
  start: string;
};

export function RoomBatchModal(props: RoomBatchModalProps) {
  return (
    <AddEditModal
      appearance="card"
      footer={
        <AddButton
          className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-5"
          disabled={props.isBusy}
          iconName="door-open"
          onPress={props.onOpenAssignedRooms}
          title={`Assigned Rooms (${props.assignedRoomCount})`}
        />
      }
      formError={null}
      isPending={props.isBusy}
      isVisible={Boolean(props.area)}
      onClose={props.onClose}
      onSubmit={props.onGenerate}
      showSubmitAction={false}
      submitText="Generate rooms"
      subtitle={`${props.floor?.name ?? ""} · ${props.area?.label ?? ""}`}
      title="Manage rooms"
    >
      <FloorRoomBatchSection
        canCreateRooms={props.canCreateRooms}
        canGenerate={props.canGenerate}
        count={props.count}
        isBusy={props.isBusy}
        isCreating={props.isCreating}
        onChangeCount={props.onChangeCount}
        onChangePrefix={props.onChangePrefix}
        onChangeStart={props.onChangeStart}
        onClose={props.onClose}
        onGenerate={props.onGenerate}
        prefix={props.prefix}
        start={props.start}
      />
      <FloorRoomLinkSection
        availableRooms={props.availableRooms}
        floorName={props.floor?.name}
        isBusy={props.isBusy}
        isLinking={props.isLinking}
        onLink={props.onLinkRoom}
        onSelect={props.onSelectRoom}
        selectedRoomId={props.selectedRoomId}
      />
    </AddEditModal>
  );
}
