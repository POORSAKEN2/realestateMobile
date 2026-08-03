import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { FloorAssignedRoomsSection } from "./FloorAssignedRoomsSection";
import { FloorRoomBatchSection } from "./FloorRoomBatchSection";
import { FloorRoomLinkSection } from "./FloorRoomLinkSection";
import { AddEditModal } from "../ui/AddEditModal";
import AddButton from "../ui/buttons/AddButton";
import type {
  FloorArea,
  FloorPlan,
  PropertyRoom,
  PropertyRoomStatus,
} from "../../types";

export type RoomBatchModalProps = {
  area?: FloorArea;
  assignedRooms: PropertyRoom[];
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
  onSelectRoom: (roomId: string) => void;
  onUpdateRoomStatus: (room: PropertyRoom, status: PropertyRoomStatus) => void;
  onUnassignRoom: (room: PropertyRoom) => void;
  prefix: string;
  selectedRoomId: string;
  start: string;
};

export function RoomBatchModal(props: RoomBatchModalProps) {
  const [section, setSection] = useState<"manage" | "assigned">("manage");
  const isAssignedSection = section === "assigned";

  useEffect(() => {
    setSection("manage");
  }, [props.area?.id]);

  return (
    <AddEditModal
      appearance="card"
      backAccessibilityLabel="Back to room management"
      footer={
        isAssignedSection ? undefined : (
          <AddButton
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-5"
            disabled={props.isBusy}
            iconName="door-open"
            onPress={() => setSection("assigned")}
            title="Assigned Rooms"
          />
        )
      }
      formError={null}
      headerAccessory={
        isAssignedSection ? (
          <View className="min-w-8 items-center justify-center rounded-full bg-secondary/20 px-2.5 py-1">
            <Text className="font-ralewayBold text-sm text-primary">
              {props.assignedRooms.length}
            </Text>
          </View>
        ) : undefined
      }
      isPending={props.isBusy}
      isVisible={Boolean(props.area)}
      onBack={isAssignedSection ? () => setSection("manage") : undefined}
      onClose={props.onClose}
      onSubmit={props.onGenerate}
      showSubmitAction={false}
      submitText="Generate rooms"
      subtitle={
        isAssignedSection
          ? undefined
          : `${props.floor?.name ?? ""} · ${props.area?.label ?? ""}`
      }
      title={isAssignedSection ? "Assigned rooms" : "Manage rooms"}
    >
      {isAssignedSection ? (
        <FloorAssignedRoomsSection
          isBusy={props.isBusy}
          onStatusChange={props.onUpdateRoomStatus}
          onUnassign={props.onUnassignRoom}
          rooms={props.assignedRooms}
        />
      ) : (
        <>
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
        </>
      )}
    </AddEditModal>
  );
}
