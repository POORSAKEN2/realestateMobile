import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  createLease,
  deleteLease,
  fetchLeases,
  fetchLessees,
  updateLease,
} from "../../api/propertyDetails";
import type { Lease, LeasePayload, Lessee } from "../../types";
import {
  createEmptyLeaseForm,
  createLeaseForm,
  formatLeaseDateValue,
  getLeaseFormResult,
  parseLeaseDateValue,
  type LeaseFormState,
} from "../../utils/leases/leaseForm";
import { useProperties } from "../api/useProperties";
import { useAuth } from "../useAuth";

export function useLeaseManagement() {
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
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const datePickerValueRef = useRef(datePickerValue);

  const { data: leases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["leases", accessToken],
    queryFn: () => fetchLeases(accessToken),
    enabled: Boolean(accessToken),
  });
  const { data: lessees = [], isLoading: isLoadingLessees } = useQuery({
    queryKey: ["lessees", accessToken],
    queryFn: () => fetchLessees(accessToken),
    enabled: Boolean(accessToken),
  });
  const { useList } = useProperties();
  const { data: properties = [], isLoading: isLoadingProperties } = useList();

  const saveMutation = useMutation({
    mutationFn: (payload: LeasePayload) =>
      editingLease
        ? updateLease(editingLease.id, payload, accessToken)
        : createLease(payload, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      closeForm();
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

  function openCreateForm() {
    setEditingLease(null);
    setForm({
      ...createEmptyLeaseForm(),
      propertyId: properties[0]?.id ?? "",
      lesseeId: lessees[0]?.id ?? "",
    });
    setFormError("");
    setIsStartDatePickerOpen(false);
    setIsFormOpen(true);
  }

  function openEditForm(lease: Lease) {
    setEditingLease(lease);
    setForm(createLeaseForm(lease));
    setFormError("");
    setIsStartDatePickerOpen(false);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingLease(null);
    setForm(createEmptyLeaseForm());
    setFormError("");
    setIsStartDatePickerOpen(false);
  }

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (event.type === "dismissed" || !selectedDate) {
      if (Platform.OS === "android") setIsStartDatePickerOpen(false);
      return;
    }
    datePickerValueRef.current = selectedDate;
    setDatePickerValue(selectedDate);
    if (Platform.OS === "android") {
      updateForm("startDate", formatLeaseDateValue(selectedDate));
      setIsStartDatePickerOpen(false);
    }
  }

  function openStartDatePicker() {
    const initialDate = parseLeaseDateValue(form.startDate);
    datePickerValueRef.current = initialDate;
    setDatePickerValue(initialDate);
    setIsStartDatePickerOpen(true);
  }

  function confirmDatePicker() {
    updateForm("startDate", formatLeaseDateValue(datePickerValueRef.current));
    setIsStartDatePickerOpen(false);
  }

  function submit() {
    setFormError("");
    const result = getLeaseFormResult(form);
    if (!result.isValid) {
      setFormError(result.error);
      return;
    }
    saveMutation.mutate(result.payload);
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
    confirmDatePicker,
    datePickerValue,
    deleteMutation,
    deleteTarget,
    editingLease,
    filteredLeases,
    form,
    formError,
    handleDateChange,
    isFormOpen,
    isLoading: isLoadingLeases || isLoadingLessees || isLoadingProperties,
    isStartDatePickerOpen,
    leases,
    lesseeOptions,
    lessees,
    monthlyRevenue,
    openCreateForm,
    openEditForm,
    openStartDatePicker,
    properties,
    propertyOptions,
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
