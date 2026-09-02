import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BedspaceActionsSheet } from "../../components/bedspaces/BedspaceActionsSheet";
import { BedspaceCard } from "../../components/bedspaces/BedspaceCard";
import { BedspaceFormFields } from "../../components/bedspaces/BedspaceFormFields";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../components/ui/ModuleState";
import { OverviewMetricCard } from "../../components/ui/OverviewMetricCard";
import { Screen } from "../../components/ui/Screen";
import {
  formatSearchResultLabel,
  SearchToolbar,
} from "../../components/ui/SearchToolbar";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { SwipeActionCard } from "../../components/ui/SwipeActionCard";
import AddButton from "../../components/ui/buttons/AddButton";
import { DropdownField } from "../../components/ui/fields/DropdownField";
import { appRoutes } from "../../constants/navigation";
import { colors } from "../../constants/colors";
import { usePropertyRoomsQuery } from "../../hooks/api/useFloorPlans";
import { useBedspaceManagement } from "../../hooks/bedspaces/useBedspaceManagement";
import { useAuth } from "../../hooks/useAuth";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { Bedspace } from "../../types";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export default function BedspacesScreen() {
  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    propertyTitle?: string | string[];
    roomId?: string | string[];
    roomNumber?: string | string[];
  }>();
  const propertyId = firstParam(params.propertyId);
  const propertyTitle = firstParam(params.propertyTitle) || "Property";
  const initialRoomId = firstParam(params.roomId);
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const snackbar = useSnackbar();
  const roomsQuery = usePropertyRoomsQuery(propertyId, accessToken);
  const rooms = roomsQuery.data ?? [];
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [actionTarget, setActionTarget] = useState<Bedspace | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const management = useBedspaceManagement({
    accessToken,
    onError: snackbar.show,
    onSaved: (operation) =>
      snackbar.show(
        operation === "created"
          ? "Bedspace added."
          : operation === "deleted"
            ? "Bedspace deleted."
            : "Bedspace updated.",
      ),
    propertyId,
    roomId: selectedRoomId,
  });
  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: `Room ${room.roomNumber} · ${room.bedspaceCount} bedspaces`,
        value: room.id,
      })),
    [rooms],
  );
  const filteredBedspaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return management.bedspaces;

    return management.bedspaces.filter((bedspace) =>
      [bedspace.bedspaceNumber, bedspace.status, bedspace.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [management.bedspaces, searchQuery]);

  useEffect(() => {
    if (!rooms.length) {
      setSelectedRoomId("");
      return;
    }
    if (!rooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  async function refresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([roomsQuery.refetch(), management.query.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  function openLeaseAssignment(bedspace: Bedspace) {
    router.push({
      pathname: appRoutes.secondary.leases,
      params: {
        action: "add",
        bedspaceId: bedspace.id,
        propertyId,
        roomId: selectedRoomId,
      },
    });
  }

  if (!propertyId) {
    return (
      <Screen className="bg-surface">
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons
            name="bed-empty"
            color={colors.description}
            size={34}
          />
          <Text className="mt-3 font-ralewayBold text-lg text-textPrimary">
            Bedspaces unavailable
          </Text>
          <Text className="mt-1 text-center text-sm text-description">
            Open Bedspaces from a property or room.
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

  const isLoading = roomsQuery.isLoading || management.query.isLoading;
  const isError = roomsQuery.isError || management.query.isError;

  return (
    <Screen className="bg-surface">
      <View className="flex-1 gap-5">
        <ModuleHeader
          action={
            <AddButton
              disabled={!selectedRoomId || isLoading || isError}
              onPress={management.openCreateForm}
              title="Add"
            />
          }
          eyebrow="Portfolio Intelligence"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from bedspaces"
              variant="secondary"
            />
          }
          supportingText={propertyTitle}
          title="Bedspaces"
        />

        {rooms.length ? (
          <DropdownField
            label="Room"
            onSelect={(roomId) => {
              setSelectedRoomId(roomId);
              setActionTarget(null);
              setSearchQuery("");
            }}
            options={roomOptions}
            required
            subtitle="Bedspaces are managed within a room."
            value={selectedRoomId}
            variant="filled"
          />
        ) : null}

        {selectedRoomId ? (
          <OverviewMetricCard
            icon="bed-outline"
            isLoading={isLoading}
            label={`Room ${selectedRoom?.roomNumber ?? firstParam(params.roomNumber)} inventory`}
            metrics={[
              {
                detail: `${management.summary.maintenance} maintenance`,
                icon: "checkmark-circle-outline",
                label: "Vacant",
                value: String(management.summary.vacant),
              },
              {
                detail:
                  management.summary.total > 0
                    ? `${Math.round((management.summary.occupied / management.summary.total) * 100)}% of all bedspaces`
                    : "No occupancy yet",
                icon: "people-outline",
                label: "Occupied",
                value: String(management.summary.occupied),
              },
            ]}
            value={String(management.summary.total)}
          />
        ) : null}

        {management.bedspaces.length ? (
          <SearchToolbar
            accessibilityLabel="Search bedspaces"
            clearAccessibilityLabel="Clear bedspace search"
            onChangeText={setSearchQuery}
            placeholder="Number, status, or notes"
            resultLabel={formatSearchResultLabel({
              filteredCount: filteredBedspaces.length,
              isLoading,
              singular: "bedspace",
              totalCount: management.bedspaces.length,
            })}
            value={searchQuery}
          />
        ) : null}

        {isLoading ? (
          <ModuleLoadingState
            description="Loading room inventory and lease assignments."
            title="Loading bedspaces"
          />
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-6">
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              color={colors.description}
              size={32}
            />
            <Text className="mt-3 font-ralewayBold text-lg text-textPrimary">
              Bedspaces unavailable
            </Text>
            <Text className="mt-1 text-center text-sm text-description">
              Check your connection and try again.
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-xl bg-primary px-5 py-3"
              onPress={() => void refresh()}
            >
              <Text className="font-ralewayBold text-white">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : !rooms.length ? (
          <View className="gap-4">
            <ModuleEmptyState
              description="Create a room first, then add individual rentable bedspaces."
              icon="business-outline"
              title="No rooms available"
            />
            <TouchableOpacity
              className="h-12 items-center justify-center rounded-2xl bg-primary"
              onPress={() =>
                router.replace({
                  pathname: appRoutes.secondary.floorPlans,
                  params: { propertyId, propertyTitle },
                })
              }
            >
              <Text className="font-ralewayBold text-white">Manage rooms</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            className="-mx-6 flex-1"
            contentContainerStyle={{
              paddingBottom: 48,
              paddingHorizontal: 24,
            }}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                onRefresh={refresh}
                refreshing={isRefreshing}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredBedspaces.length ? (
              <View className="gap-3">
                {filteredBedspaces.map((bedspace) => (
                  <SwipeActionCard
                    actionAccessibilityLabel={`More actions for bedspace ${bedspace.bedspaceNumber}`}
                    actionIcon="dots-horizontal"
                    actionLabel="More"
                    disabled={management.isBusy}
                    key={bedspace.id}
                    onAction={() => setActionTarget(bedspace)}
                  >
                    <BedspaceCard bedspace={bedspace} />
                  </SwipeActionCard>
                ))}
              </View>
            ) : (
              <View className="gap-4">
                <ModuleEmptyState
                  description={
                    management.bedspaces.length
                      ? "Try a different number, status, or note."
                      : `Add the first individual rental space to Room ${selectedRoom?.roomNumber ?? ""}.`
                  }
                  icon={
                    management.bedspaces.length
                      ? "search-outline"
                      : "bed-outline"
                  }
                  title={
                    management.bedspaces.length
                      ? "No matching bedspaces"
                      : "No bedspaces yet"
                  }
                />
                {!management.bedspaces.length ? (
                  <AddButton
                    className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary"
                    onPress={management.openCreateForm}
                    title="Add first bedspace"
                  />
                ) : null}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <BedspaceActionsSheet
        bedspace={actionTarget}
        isBusy={management.isBusy}
        onAssignLease={(bedspace) => openLeaseAssignment(bedspace)}
        onClose={() => setActionTarget(null)}
        onDelete={(bedspace) => {
          setActionTarget(null);
          management.setDeleteTarget(bedspace);
        }}
        onEdit={(bedspace) => {
          setActionTarget(null);
          management.openEditForm(bedspace);
        }}
        onViewLease={(bedspace) =>
          router.push({
            pathname: appRoutes.secondary.leases,
            params: { bedspaceId: bedspace.id },
          })
        }
      />

      <AddEditModal
        appearance="card"
        formError={management.formError}
        isPending={management.isBusy}
        isVisible={management.isFormOpen}
        onClose={management.closeForm}
        onSubmit={() => void management.submit()}
        showCancelAction
        submitText={
          management.editingBedspace ? "Save Bedspace" : "Add Bedspace"
        }
        subtitle={`Room ${selectedRoom?.roomNumber ?? ""}`}
        title={management.editingBedspace ? "Edit bedspace" : "Add bedspace"}
      >
        <BedspaceFormFields
          form={management.form}
          onUpdate={management.updateForm}
        />
      </AddEditModal>

      <ConfirmationModal
        description={`Delete Bedspace ${management.deleteTarget?.bedspaceNumber ?? ""}? Bedspaces with lease history are protected by the backend.`}
        isPending={management.isDeleting}
        onCancel={() => management.setDeleteTarget(null)}
        onConfirm={() => void management.confirmDelete()}
        title="Delete bedspace?"
        visible={Boolean(management.deleteTarget)}
      />

      <ScreenSnackbar
        icon="information-outline"
        message={snackbar.message}
        onDismiss={snackbar.dismiss}
        placement="screen-bottom"
      />
    </Screen>
  );
}
