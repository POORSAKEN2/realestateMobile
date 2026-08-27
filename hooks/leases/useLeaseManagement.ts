import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createLease,
  deleteLease,
  fetchLeases,
  updateLease,
} from "../../api/propertyDetails";
import type { Lease, LeasePayload, Lessee } from "../../types";
import {
  createEmptyLeaseForm,
  createLeaseForm,
  formatLeaseDateValue,
  getLeaseFormResult,
  type LeaseEditMode,
  type LeaseFormState,
} from "../../utils/leases/leaseForm";
import { useProperties } from "../api/useProperties";
import { useClients } from "../api/useClients";
import { usePropertyRoomsQuery } from "../api/useFloorPlans";
import { useRoomBedspacesQuery } from "../api/useBedspaces";
import { useAuth } from "../useAuth";

export type LeaseSaveOperation = "created" | "updated";

export function useLeaseManagement({
  onSaved,
}: {
  onSaved?: (operation: LeaseSaveOperation) => void;
} = {}) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    action?: string;
    bedspaceId?: string;
    propertyId?: string;
    roomId?: string;
  }>();
  const handledActionRef = useRef("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<LeaseFormState>(createEmptyLeaseForm);
  const [formError, setFormError] = useState("");
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Lessee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lease | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAmendmentDatePickerOpen, setIsAmendmentDatePickerOpen] =
    useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);

  const leasesQuery = useQuery({
    queryKey: ["leases", accessToken],
    queryFn: () => fetchLeases(accessToken),
    enabled: Boolean(accessToken),
  });
  const leases = leasesQuery.data ?? [];
  const lesseesQuery = useClients(accessToken);
  const lessees = lesseesQuery.data ?? [];
  const { useList } = useProperties(accessToken);
  const propertiesQuery = useList();
  const properties = propertiesQuery.data;
  const roomsQuery = usePropertyRoomsQuery(form.propertyId, accessToken);
  const rooms = roomsQuery.data ?? [];
  const bedspacesQuery = useRoomBedspacesQuery(form.roomId, accessToken);
  const bedspaces = bedspacesQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: LeasePayload) =>
      editingLease
        ? updateLease(editingLease.id, payload, accessToken)
        : createLease(payload, accessToken),
    onSuccess: async () => {
      const operation: LeaseSaveOperation = editingLease
        ? "updated"
        : "created";
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leases"] }),
        queryClient.invalidateQueries({ queryKey: ["bedspaces"] }),
        queryClient.invalidateQueries({ queryKey: ["floorplans"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
      ]);
      closeForm();
      onSaved?.(operation);
    },
    onError: (error) =>
      setFormError(
        error instanceof Error ? error.message : "Failed to save lease.",
      ),
  });
  const deleteMutation = useMutation({
    mutationFn: (leaseId: string) => deleteLease(leaseId, accessToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leases"] }),
        queryClient.invalidateQueries({ queryKey: ["bedspaces"] }),
        queryClient.invalidateQueries({ queryKey: ["floorplans"] }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
      ]);
      setDeleteTarget(null);
    },
  });

  const propertyOptions = useMemo(
    () => properties.map(({ id, title }) => ({ label: title, value: id })),
    [properties],
  );
  const lesseeOptions = useMemo(
    () => lessees.map(({ id, name }) => ({ label: name, value: id })),
    [lessees],
  );
  const roomOptions = useMemo(
    () => [
      { label: "Property only (no room)", value: "" },
      ...rooms.map((room) => ({
        label: `Room ${room.roomNumber}`,
        value: room.id,
      })),
    ],
    [rooms],
  );
  const selectedRoom = rooms.find((room) => room.id === form.roomId);
  const canLeaseWholeRoom =
    !selectedRoom ||
    selectedRoom.maintenanceBedspaceCount === 0 ||
    Boolean(editingLease && !editingLease.bedspaceId);
  const bedspaceOptions = useMemo(
    () => [
      ...(canLeaseWholeRoom ? [{ label: "Whole room", value: "" }] : []),
      ...bedspaces
        .filter(
          (bedspace) =>
            bedspace.status !== "Maintenance" ||
            bedspace.id === editingLease?.bedspaceId,
        )
        .map((bedspace) => ({
          label: `${bedspace.bedspaceNumber} · ${bedspace.status}`,
          value: bedspace.id,
        })),
    ],
    [bedspaces, canLeaseWholeRoom, editingLease],
  );
  const filteredLeases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return leases.filter((lease) => {
      if (
        params.bedspaceId &&
        params.action !== "add" &&
        lease.bedspaceId !== params.bedspaceId
      ) {
        return false;
      }
      const property = properties.find((item) => item.id === lease.propertyId);
      const lessee =
        lease.lessee ?? lessees.find((item) => item.id === lease.lesseeId);
      return (
        !query ||
        [
          property?.title,
          lessee?.name,
          lease.roomNumber,
          lease.bedspace?.bedspaceNumber,
          lease.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    leases,
    lessees,
    params.action,
    params.bedspaceId,
    properties,
    searchQuery,
  ]);

  useEffect(() => {
    if (params.action !== "add" || !properties.length) return;
    const signature = [
      params.action,
      params.propertyId,
      params.roomId,
      params.bedspaceId,
    ].join(":");
    if (handledActionRef.current === signature) return;
    handledActionRef.current = signature;
    openCreateForm({
      bedspaceId: params.bedspaceId ?? "",
      propertyId: params.propertyId ?? properties[0]?.id ?? "",
      roomId: params.roomId ?? "",
    });
  }, [
    params.action,
    params.bedspaceId,
    params.propertyId,
    params.roomId,
    properties,
  ]);

  useEffect(() => {
    if (editingLease || !form.bedspaceId || form.monthlyRent) return;
    const selectedBedspace = bedspaces.find(
      (bedspace) => bedspace.id === form.bedspaceId,
    );
    if (selectedBedspace) {
      updateForm("monthlyRent", String(selectedBedspace.monthlyPrice));
    }
  }, [bedspaces, editingLease, form.bedspaceId, form.monthlyRent]);

  function updateForm<K extends keyof LeaseFormState>(
    key: K,
    value: LeaseFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeEditMode(mode: LeaseEditMode) {
    setForm((current) => {
      if (mode !== "typo" || !editingLease) {
        return { ...current, editMode: mode };
      }

      const original = createLeaseForm(editingLease);
      return {
        ...current,
        durationMonths: original.durationMonths,
        editMode: mode,
        monthlyRent: original.monthlyRent,
        startDate: original.startDate,
      };
    });
    setFormError("");
    setIsAmendmentDatePickerOpen(false);
    setIsStartDatePickerOpen(false);
  }

  function openCreateForm(
    defaults: Partial<
      Pick<LeaseFormState, "bedspaceId" | "propertyId" | "roomId">
    > = {},
  ) {
    setEditingLease(null);
    setForm({
      ...createEmptyLeaseForm(),
      propertyId: defaults.propertyId ?? properties[0]?.id ?? "",
      lesseeId: lessees[0]?.id ?? "",
      roomId: defaults.roomId ?? "",
      bedspaceId: defaults.bedspaceId ?? "",
    });
    setFormError("");
    setIsAmendmentDatePickerOpen(false);
    setIsStartDatePickerOpen(false);
    setIsFormOpen(true);
  }

  function selectProperty(propertyId: string) {
    setForm((current) => ({
      ...current,
      bedspaceId: "",
      propertyId,
      roomId: "",
      roomNumber: "",
    }));
    setFormError("");
  }

  function selectRoom(roomId: string) {
    const room = rooms.find((item) => item.id === roomId);
    setForm((current) => ({
      ...current,
      bedspaceId: "",
      roomId,
      roomNumber: room?.roomNumber ?? "",
    }));
    setFormError("");
  }

  function selectBedspace(bedspaceId: string) {
    const bedspace = bedspaces.find((item) => item.id === bedspaceId);
    setForm((current) => ({
      ...current,
      bedspaceId,
      ...(!editingLease && bedspace
        ? { monthlyRent: String(bedspace.monthlyPrice) }
        : {}),
    }));
    setFormError("");
  }

  function openEditForm(lease: Lease) {
    setEditingLease(lease);
    setForm(createLeaseForm(lease));
    setFormError("");
    setIsAmendmentDatePickerOpen(false);
    setIsStartDatePickerOpen(false);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingLease(null);
    setForm(createEmptyLeaseForm());
    setFormError("");
    setIsAmendmentDatePickerOpen(false);
    setIsStartDatePickerOpen(false);
  }

  function handleAmendmentDateConfirm(selectedDate: Date) {
    updateForm("amendmentDate", formatLeaseDateValue(selectedDate));
  }

  function handleStartDateConfirm(selectedDate: Date) {
    updateForm("startDate", formatLeaseDateValue(selectedDate));
  }

  function openStartDatePicker() {
    setIsAmendmentDatePickerOpen(false);
    setIsStartDatePickerOpen(true);
  }

  function openAmendmentDatePicker() {
    setIsStartDatePickerOpen(false);
    setIsAmendmentDatePickerOpen(true);
  }

  function submit() {
    setFormError("");
    const result = getLeaseFormResult(form, editingLease);
    if (!result.isValid) {
      setFormError(result.error);
      return;
    }
    saveMutation.mutate(result.payload);
  }

  async function refresh() {
    setIsRefreshing(true);
    try {
      const refreshes = [
        leasesQuery.refetch(),
        lesseesQuery.refetch(),
        propertiesQuery.refetch(),
      ];
      if (form.propertyId) refreshes.push(roomsQuery.refetch());
      if (form.roomId) refreshes.push(bedspacesQuery.refetch());
      await Promise.all(refreshes);
    } finally {
      setIsRefreshing(false);
    }
  }

  const activeLeaseCount = leases.filter(
    (lease) => lease.status === "Active",
  ).length;
  const monthlyRevenue = leases.reduce(
    (sum, lease) => sum + lease.monthlyRent,
    0,
  );

  return {
    activeLeaseCount,
    activeLeasePercentage:
      leases.length === 0 ? 0 : (activeLeaseCount / leases.length) * 100,
    changeEditMode,
    bedspaceOptions,
    bedspaces,
    bedspacesQuery,
    closeAmendmentDatePicker: () => setIsAmendmentDatePickerOpen(false),
    closeStartDatePicker: () => setIsStartDatePickerOpen(false),
    deleteMutation,
    deleteTarget,
    editingLease,
    filteredLeases,
    form,
    formError,
    handleAmendmentDateConfirm,
    handleStartDateConfirm,
    isAmendmentDatePickerOpen,
    isFormOpen,
    isLoading:
      leasesQuery.isLoading ||
      lesseesQuery.isLoading ||
      propertiesQuery.isLoading,
    isRefreshing,
    isStartDatePickerOpen,
    leases,
    lesseeOptions,
    lessees,
    monthlyRevenue,
    openAmendmentDatePicker,
    openCreateForm,
    openEditForm,
    openStartDatePicker,
    properties,
    propertyOptions,
    roomOptions,
    rooms,
    roomsQuery,
    refresh,
    saveMutation,
    searchQuery,
    selectedTenant,
    setDeleteTarget,
    setSearchQuery,
    setSelectedTenant,
    selectBedspace,
    selectProperty,
    selectRoom,
    closeForm,
    submit,
    updateForm,
  };
}
