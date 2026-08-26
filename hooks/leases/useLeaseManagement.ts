import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

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
  const params = useLocalSearchParams<{ action?: string }>();
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
  const { useList } = useProperties();
  const propertiesQuery = useList();
  const properties = propertiesQuery.data;

  const saveMutation = useMutation({
    mutationFn: (payload: LeasePayload) =>
      editingLease
        ? updateLease(editingLease.id, payload, accessToken)
        : createLease(payload, accessToken),
    onSuccess: async () => {
      const operation: LeaseSaveOperation = editingLease
        ? "updated"
        : "created";
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
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
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
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
  const filteredLeases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return leases.filter((lease) => {
      const property = properties.find((item) => item.id === lease.propertyId);
      const lessee =
        lease.lessee ?? lessees.find((item) => item.id === lease.lesseeId);
      return (
        !query ||
        [property?.title, lessee?.name, lease.roomNumber, lease.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [leases, lessees, properties, searchQuery]);

  useEffect(() => {
    if (params.action === "add") openCreateForm();
  }, [params.action]);

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

  function openCreateForm() {
    setEditingLease(null);
    setForm({
      ...createEmptyLeaseForm(),
      propertyId: properties[0]?.id ?? "",
      lesseeId: lessees[0]?.id ?? "",
    });
    setFormError("");
    setIsAmendmentDatePickerOpen(false);
    setIsStartDatePickerOpen(false);
    setIsFormOpen(true);
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
      await Promise.all([
        leasesQuery.refetch(),
        lesseesQuery.refetch(),
        propertiesQuery.refetch(),
      ]);
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
    refresh,
    saveMutation,
    searchQuery,
    selectedTenant,
    setDeleteTarget,
    setSearchQuery,
    setSelectedTenant,
    closeForm,
    submit,
    updateForm,
  };
}
