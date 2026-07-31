import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { IconButton } from "./FloorAreaCard";
import { AddEditModal } from "../ui/AddEditModal";
import { BaseField } from "../ui/fields/BaseField";
import type { FloorArea, FloorPlan, PropertyRoom } from "../../types";

export function FloorNameModal({
  editing,
  isPending,
  onChange,
  onClose,
  onSubmit,
  value,
  visible,
}: {
  editing: boolean;
  isPending: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  value: string;
  visible: boolean;
}) {
  return (
    <AddEditModal
      appearance="card"
      formError={null}
      isPending={isPending}
      isVisible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      showCancelAction
      submitText={editing ? "Save name" : "Add floor"}
      subtitle="Floor names appear in property summary and room records."
      title={editing ? "Rename floor" : "Add floor"}
    >
      <BaseField
        autoFocus
        label="Floor name"
        onChangeText={onChange}
        placeholder="e.g. Ground Floor"
        required
        value={value}
        variant="filled"
      />
    </AddEditModal>
  );
}

export function AreaNameModal({
  editing,
  isPending,
  onChange,
  onClose,
  onSubmit,
  value,
  visible,
}: {
  editing: boolean;
  isPending: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  value: string;
  visible: boolean;
}) {
  return (
    <AddEditModal
      appearance="card"
      formError={null}
      isPending={isPending}
      isVisible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      showCancelAction
      submitText={editing ? "Save name" : "Add area"}
      subtitle="Each area has one unique name and one plan shape."
      title={editing ? "Rename area" : "Add floor area"}
    >
      <BaseField
        autoFocus
        label="Area name"
        onChangeText={onChange}
        placeholder="e.g. South Wing"
        required
        value={value}
        variant="filled"
      />
    </AddEditModal>
  );
}

export function RoomBatchModal({
  area,
  assignedRooms,
  canCreateRooms,
  count,
  floor,
  isBusy,
  isCreating,
  onChangeCount,
  onChangePrefix,
  onChangeStart,
  onClose,
  onDeleteRoom,
  onGenerate,
  onUnassignRoom,
  prefix,
  start,
}: {
  area?: FloorArea;
  assignedRooms: PropertyRoom[];
  canCreateRooms: boolean;
  count: string;
  floor?: FloorPlan;
  isBusy: boolean;
  isCreating: boolean;
  onChangeCount: (value: string) => void;
  onChangePrefix: (value: string) => void;
  onChangeStart: (value: string) => void;
  onClose: () => void;
  onDeleteRoom: (room: PropertyRoom) => void;
  onGenerate: () => void;
  onUnassignRoom: (room: PropertyRoom) => void;
  prefix: string;
  start: string;
}) {
  return (
    <AddEditModal
      appearance="card"
      formError={null}
      isPending={isCreating}
      isVisible={Boolean(area)}
      onClose={onClose}
      onSubmit={onGenerate}
      showCancelAction
      showSubmitAction={canCreateRooms}
      submitText="Generate rooms"
      subtitle={`${floor?.name ?? ""} · ${area?.label ?? ""}`}
      title="Manage rooms"
    >
      {canCreateRooms ? (
        <>
          <Text className="text-sm leading-6 text-slate-500">
            Create sequential room numbers and assign them directly to this
            area.
          </Text>
          <BaseField
            label="Room number prefix (optional)"
            onChangeText={onChangePrefix}
            placeholder="e.g. Unit-, 10-, Office-"
            value={prefix}
            variant="filled"
          />
          <View className="flex-row gap-3">
            <BaseField
              keyboardType="number-pad"
              label="Start number"
              onChangeText={(value) =>
                onChangeStart(value.replace(/[^0-9]/g, ""))
              }
              required
              value={start}
              variant="filled"
              wrapperClassName="flex-1"
            />
            <BaseField
              keyboardType="number-pad"
              label="Room count"
              onChangeText={(value) =>
                onChangeCount(value.replace(/[^0-9]/g, ""))
              }
              required
              value={count}
              variant="filled"
              wrapperClassName="flex-1"
            />
          </View>
        </>
      ) : (
        <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Text className="font-ralewayBold text-sm text-amber-800">
            New rooms unavailable
          </Text>
          <Text className="mt-1 text-xs leading-5 text-amber-700">
            Existing room assignments remain available to review, unassign, or
            delete.
          </Text>
        </View>
      )}

      <View className="mt-2 border-t border-slate-200 pt-5">
        <Text className="font-ralewayBold text-base text-textPrimary">
          Assigned rooms ({assignedRooms.length})
        </Text>
        <View className="mt-3 gap-2">
          {assignedRooms.length ? (
            assignedRooms.map((room) => (
              <View
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                key={room.id}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary/20">
                  <MaterialCommunityIcons
                    name="door"
                    color="#634CE4"
                    size={19}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-ralewayBold text-sm text-textPrimary">
                    Room {room.roomNumber}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {room.status}
                  </Text>
                </View>
                <TouchableOpacity
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  disabled={isBusy}
                  onPress={() => onUnassignRoom(room)}
                >
                  <Text className="font-ralewayBold text-[10px] text-slate-600">
                    Unassign
                  </Text>
                </TouchableOpacity>
                <IconButton
                  danger
                  icon="trash-can-outline"
                  label={`Delete room ${room.roomNumber}`}
                  onPress={() => onDeleteRoom(room)}
                />
              </View>
            ))
          ) : (
            <View className="items-center rounded-2xl border border-dashed border-slate-300 px-4 py-6">
              <Text className="font-ralewayBold text-sm text-slate-700">
                No rooms assigned
              </Text>
              <Text className="mt-1 text-center text-xs text-slate-500">
                Use batch generator above.
              </Text>
            </View>
          )}
        </View>
      </View>
    </AddEditModal>
  );
}
