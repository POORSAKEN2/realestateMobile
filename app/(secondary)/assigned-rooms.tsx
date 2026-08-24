import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FloorAssignedRoomsSection } from "../../components/floorplans/FloorAssignedRoomsSection";
import { BackButton } from "../../components/ui/buttons/BackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleLoadingState } from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";
import {
  usePropertyRoomCommands,
  usePropertyRoomsQuery,
} from "../../hooks/api/useFloorPlans";
import { useAuth } from "../../hooks/useAuth";
import { nativeFloorPlanFeedback } from "../../services/floorplans/deviceFloorPlanServices";
import type { PropertyRoom, PropertyRoomStatus } from "../../types";
import {
  getErrorMessage,
  getRoomStatusLabel,
} from "../../utils/floorplans/floorPlanPresentation";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export default function AssignedRoomsScreen() {
  const params = useLocalSearchParams<{
    areaId?: string | string[];
    areaLabel?: string | string[];
    floorName?: string | string[];
    propertyId?: string | string[];
    propertyTitle?: string | string[];
  }>();
  const areaId = firstParam(params.areaId);
  const areaLabel = firstParam(params.areaLabel) || "Area";
  const floorName = firstParam(params.floorName) || "Floor";
  const propertyId = firstParam(params.propertyId);
  const propertyTitle = firstParam(params.propertyTitle) || "Property";
  const { session } = useAuth();
  const roomsQuery = usePropertyRoomsQuery(propertyId, session?.accessToken);
  const commands = usePropertyRoomCommands(propertyId, session?.accessToken);
  const [notice, setNotice] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rooms = useMemo(
    () => (roomsQuery.data ?? []).filter((room) => room.areaId === areaId),
    [areaId, roomsQuery.data],
  );
  const isBusy = commands.update.isPending;

  async function refreshRooms() {
    setIsRefreshing(true);
    try {
      await roomsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function updateStatus(room: PropertyRoom, status: PropertyRoomStatus) {
    if (room.status === status) return;

    try {
      await commands.update.mutateAsync({
        id: room.id,
        payload: { status },
      });
      setNotice(
        `Room ${room.roomNumber} status updated to ${getRoomStatusLabel(status)}.`,
      );
    } catch (error) {
      nativeFloorPlanFeedback.showError(
        "Room status could not be updated",
        getErrorMessage(error),
      );
    }
  }

  async function unassign(room: PropertyRoom) {
    try {
      await commands.update.mutateAsync({
        id: room.id,
        payload: { areaId: null },
      });
      setNotice(`Room ${room.roomNumber} unassigned.`);
    } catch (error) {
      nativeFloorPlanFeedback.showError(
        "Room could not be unassigned",
        getErrorMessage(error),
      );
    }
  }

  if (!propertyId || !areaId) {
    return (
      <Screen className="bg-[#F5F7FC]">
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons
            name="door-closed-cancel"
            color="#94A3B8"
            size={32}
          />
          <Text className="mt-3 font-ralewayBold text-lg text-textPrimary">
            Assigned rooms unavailable
          </Text>
          <TouchableOpacity
            className="mt-4 rounded-xl bg-primary px-5 py-3"
            onPress={() => router.back()}
          >
            <Text className="font-ralewayBold text-white">Go back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-[#F5F7FC]">
      <View className="flex-1">
        <ModuleHeader
          action={
            <View className="min-w-11 items-center justify-center rounded-full bg-primary/10 px-3 py-2">
              <Text className="font-ralewayBold text-sm text-primary">
                {rooms.length}
              </Text>
            </View>
          }
          eyebrow={`${floorName} · ${areaLabel}`}
          leading={
            <BackButton
              accessibilityLabel="Back to floor plans"
              onPress={() => router.back()}
              variant="primary"
            />
          }
          supportingText={propertyTitle}
          title="Assigned Rooms"
        />

        {notice ? (
          <TouchableOpacity
            activeOpacity={0.8}
            className="mt-4 flex-row items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3"
            onPress={() => setNotice("")}
          >
            <Feather name="check-circle" color="#0D9488" size={16} />
            <Text className="min-w-0 flex-1 font-ralewayBold text-xs text-teal-800">
              {notice}
            </Text>
            <Feather name="x" color="#0D9488" size={15} />
          </TouchableOpacity>
        ) : null}

        {roomsQuery.isLoading ? (
          <View className="mt-5 flex-1">
            <ModuleLoadingState
              description={`Loading rooms assigned to ${areaLabel}.`}
              title="Loading assigned rooms"
            />
          </View>
        ) : roomsQuery.isError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="cloud-off" color="#64748B" size={30} />
            <Text className="mt-3 font-ralewayBold text-lg text-textPrimary">
              Assigned rooms unavailable
            </Text>
            <Text className="mt-1 text-center text-sm text-slate-500">
              Check connection and try again.
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-xl bg-primary px-5 py-3"
              onPress={() => roomsQuery.refetch()}
            >
              <Text className="font-ralewayBold text-white">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            className="-mx-6 mt-5 flex-1"
            contentContainerStyle={{
              paddingBottom: 48,
              paddingHorizontal: 24,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                colors={["#8A77F4"]}
                onRefresh={refreshRooms}
                refreshing={isRefreshing}
                tintColor="#8A77F4"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <FloorAssignedRoomsSection
              isBusy={isBusy}
              onStatusChange={updateStatus}
              onUnassign={unassign}
              rooms={rooms}
            />
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
