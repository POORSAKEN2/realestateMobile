import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Feather from "@expo/vector-icons/Feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  createLease,
  deleteLease,
  fetchLeases,
  fetchLessees,
  updateLease,
} from "../../api/propertyDetails";
import { useProperties } from "../../hooks/api/useProperties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import type { Lease, LeasePayload, Lessee, Property } from "../../types";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { ChoiceField } from "../../components/ui/fields/ChoiceField";
import { PickerField } from "../../components/ui/fields/PickerField";
import AddButton from "../../components/ui/buttons/AddButton";

type LeaseFormState = {
  propertyId: string;
  lesseeId: string;
  startDate: string;
  endDate: string;
  durationMonths: string;
  monthlyRent: string;
  roomNumber: string;
  status: string;
};

type DateFieldKey = "startDate" | "endDate";

type Option = {
  label: string;
  value: string;
};

const emptyLeaseForm: LeaseFormState = {
  propertyId: "",
  lesseeId: "",
  startDate: formatDateValue(new Date()),
  endDate: "",
  durationMonths: "12",
  monthlyRent: "",
  roomNumber: "",
  status: "Active",
};

const statusOptions: Option[] = [
  { label: "Active", value: "Active" },
  { label: "Expired", value: "Expired" },
  { label: "Terminated", value: "Terminated" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function cleanNumber(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateValue(value: string) {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getDateLabel(value: string) {
  if (!value) return "";

  return getDateValue(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateEndDate(startDateStr: string, months: number): string {
  if (!startDateStr || months < 1) return "";
  const [year, month, day] = startDateStr.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + Number(months));
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calculateDurationMonths(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 12;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 12;
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth() + years * 12;
  return months >= 1 ? months : 1;
}

function toLeaseForm(lease: Lease): LeaseFormState {
  const duration = calculateDurationMonths(lease.startDate, lease.endDate);
  return {
    propertyId: lease.propertyId,
    lesseeId: lease.lesseeId,
    startDate: lease.startDate,
    endDate: lease.endDate ?? "",
    durationMonths: String(duration),
    monthlyRent: String(lease.monthlyRent || ""),
    roomNumber: lease.roomNumber ?? "",
    status: lease.status || "Active",
  };
}

// function DateField({
//   label,
//   value,
//   placeholder,
//   onPress,
// }: {
//   label: string;
//   value: string;
//   placeholder: string;
//   onPress: () => void;
// }) {
//   return (
//     <View className="gap-2">
//       <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
//         {label}
//       </Text>
//       <TouchableOpacity
//         activeOpacity={0.85}
//         className="h-14 flex-row items-center justify-between rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 shadow-sm"
//         onPress={onPress}
//       >
//         <Text
//           className={`text-base ${value ? "text-[#1d1d1f]" : "text-[#6F6D6D]"}`}
//         >
//           {getDateLabel(value) || placeholder}
//         </Text>
//         <Ionicons name="calendar-outline" color="#2563EB" size={20} />
//       </TouchableOpacity>
//     </View>
//   );
// }

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB]/10">
        <Ionicons name={icon} color="#2563EB" size={19} />
      </View>
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>
      <Text className="mt-1 text-lg font-bold text-[#1d1d1f]">{value}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View className="flex-1 justify-center rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-6 shadow-sm">
      <View className="items-center">
        <ActivityIndicator color="#2563EB" />
        <Text className="mt-3 text-sm font-semibold text-[#1d1d1f]">
          Loading leases
        </Text>
        <Text className="mt-1 text-center text-xs leading-5 text-[#6F6D6D]">
          Syncing contracts, tenants, and property records.
        </Text>
      </View>
      <View className="mt-6 gap-3">
        <View className="h-16 rounded-2xl bg-[#1d1d1f]/5" />
        <View className="h-16 rounded-2xl bg-[#1d1d1f]/5" />
        <View className="h-16 rounded-2xl bg-[#1d1d1f]/5" />
      </View>
    </View>
  );
}

function LeaseCard({
  lease,
  property,
  lessee,
  onEdit,
  onDelete,
  onOpenTenant,
}: {
  lease: Lease;
  property?: Property;
  lessee?: Lessee;
  onEdit: () => void;
  onDelete: () => void;
  onOpenTenant: () => void;
}) {
  const isActive = lease.status === "Active";
  const isExpired = lease.status === "Expired";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onOpenTenant}
      className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-300/30"
    >
      <View className="p-5">
        {/* --- HEADER: Identity, Status & Actions --- */}
        <View className="flex-row items-start justify-between gap-3">
          {/* Identity & Location */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className="min-w-0 flex-1 font-soraSemiBold text-lg tracking-tight text-[#1d1d1f]"
                numberOfLines={1}
              >
                {lessee?.name ?? lease.lessee?.name ?? "Unknown Tenant"}
              </Text>

              {/* Semantic Status Pill */}
              <View
                className={`shrink-0 rounded-md px-2 py-0.5 ${
                  isActive
                    ? "bg-emerald-50"
                    : isExpired
                      ? "bg-rose-50"
                      : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? "text-emerald-600"
                      : isExpired
                        ? "text-rose-600"
                        : "text-slate-600"
                  }`}
                >
                  {lease.status}
                </Text>
              </View>
            </View>

            {/* Grouped Property Details */}
            <View className="mt-1 flex-row items-center gap-1.5">
              <Ionicons name="business-outline" size={14} color="#94A3B8" />
              <Text
                className="min-w-0 flex-1 text-sm font-medium text-slate-500"
                numberOfLines={1}
              >
                {property?.title ?? "Unknown Property"}
                {lease.roomNumber ? ` • Room ${lease.roomNumber}` : ""}
              </Text>
            </View>
          </View>

          {/* Quick Actions (Top Right to match Tenant Card) */}
          <View className="shrink-0 flex-row items-center gap-1 rounded-full border border-slate-100 bg-slate-50 p-1">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEdit}
              className="rounded-full p-1.5 hover:bg-slate-200"
            >
              <Ionicons name="pencil" size={16} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDelete}
              className="rounded-full p-1.5 hover:bg-red-50"
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- DIVIDER --- */}
        <View className="my-4 h-[1px] w-full bg-slate-100" />

        {/* --- METRICS GRID: Rent & Terms Side-by-Side --- */}
        <View className="flex-row items-center justify-between gap-4">
          {/* Financials */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="wallet-outline" color="#94A3B8" size={14} />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Monthly Rent
              </Text>
            </View>
            <Text
              className="mt-1.5 font-soraSemiBold text-xl tracking-tight text-[#2563EB]"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(lease.monthlyRent)}
            </Text>
          </View>

          {/* Vertical Separator */}
          <View className="h-10 w-[1px] bg-slate-100" />

          {/* Lease Term */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="calendar-outline" color="#94A3B8" size={14} />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lease Term
              </Text>
            </View>
            <Text
              className="mt-1.5 text-sm font-medium leading-5 text-[#1d1d1f]"
              numberOfLines={1}
            >
              {lease.startDate} to {lease.endDate}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LeasesScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ action?: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<LeaseFormState>(emptyLeaseForm);
  const [formError, setFormError] = useState("");
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Lessee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lease | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateFieldKey | null>(
    null,
  );
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
      setIsFormOpen(false);
      setEditingLease(null);
      setForm(emptyLeaseForm);
      setFormError("");
      setActiveDateField(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Failed to save lease.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (leaseId: string) => deleteLease(leaseId, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      setDeleteTarget(null);
    },
  });

  const propertyOptions = useMemo(
    () =>
      properties.map((property) => ({
        label: property.title,
        value: property.id,
      })),
    [properties],
  );
  const lesseeOptions = useMemo(
    () => lessees.map((lessee) => ({ label: lessee.name, value: lessee.id })),
    [lessees],
  );

  const filteredLeases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return leases.filter((lease) => {
      const property = properties.find((item) => item.id === lease.propertyId);
      const lessee =
        lease.lessee ?? lessees.find((item) => item.id === lease.lesseeId);
      const haystack = [
        property?.title,
        lessee?.name,
        lease.roomNumber,
        lease.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || haystack.includes(query);
    });
  }, [leases, lessees, properties, searchQuery]);

  useEffect(() => {
    if (params.action === "add") {
      openCreateForm();
    }
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
      ...emptyLeaseForm,
      propertyId: properties[0]?.id ?? "",
      lesseeId: lessees[0]?.id ?? "",
    });
    setFormError("");
    setActiveDateField(null);
    setIsFormOpen(true);
  }

  function openEditForm(lease: Lease) {
    setEditingLease(lease);
    setForm(toLeaseForm(lease));
    setFormError("");
    setActiveDateField(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingLease(null);
    setForm(emptyLeaseForm);
    setFormError("");
    setActiveDateField(null);
  }

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (event.type === "dismissed" || !activeDateField || !selectedDate) {
      if (Platform.OS === "android") setActiveDateField(null);
      return;
    }

    // Keep latest calendar selection synchronously for a quick Done tap.
    datePickerValueRef.current = selectedDate;
    setDatePickerValue(selectedDate);

    if (Platform.OS === "android") {
      updateForm(activeDateField, formatDateValue(selectedDate));
      setActiveDateField(null);
    }
  }

  function openDatePicker(field: DateFieldKey) {
    const initialDate = getDateValue(form[field]);
    datePickerValueRef.current = initialDate;
    setDatePickerValue(initialDate);
    setActiveDateField(field);
  }

  function confirmDatePicker() {
    if (!activeDateField) return;

    updateForm(activeDateField, formatDateValue(datePickerValueRef.current));
    setActiveDateField(null);
  }

  function handleSubmit() {
    setFormError("");

    const monthlyRent = Number(form.monthlyRent || 0);
    const durationMonths = parseInt(form.durationMonths, 10);

    if (!form.propertyId) {
      setFormError("Please select a property.");
      return;
    }

    if (!form.lesseeId) {
      setFormError("Please select a tenant.");
      return;
    }

    if (!form.startDate) {
      setFormError("Start date is required.");
      return;
    }

    if (Number.isNaN(durationMonths) || durationMonths < 1) {
      setFormError("Lease duration must be at least 1 month.");
      return;
    }

    if (Number.isNaN(monthlyRent) || monthlyRent <= 0) {
      setFormError("Monthly rent must be a valid amount greater than 0.");
      return;
    }

    const calculatedEndDate = calculateEndDate(form.startDate, durationMonths);

    saveMutation.mutate({
      propertyId: form.propertyId,
      lesseeId: form.lesseeId,
      startDate: form.startDate,
      endDate: calculatedEndDate,
      monthlyRent,
      roomNumber: form.roomNumber.trim(),
      status: form.status,
    });
  }

  const isLoading = isLoadingLeases || isLoadingLessees || isLoadingProperties;
  const activeLeaseCount = useMemo(
    () => leases.filter((lease) => lease.status === "Active").length,
    [leases],
  );
  const monthlyRevenue = useMemo(
    () => leases.reduce((sum, lease) => sum + lease.monthlyRent, 0),
    [leases],
  );
  const activeLeasePercentage =
    leases.length === 0 ? 0 : (activeLeaseCount / leases.length) * 100;

  return (
    <Screen className="bg-[#2563EB]/5">
      <View className="flex-1 gap-5">
        {/* --- TOP HEADER: Title & Primary Action --- */}
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
              Contract Management
            </Text>
            <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
              Leases
            </Text>
          </View>

          <AddButton onPress={openCreateForm} />
        </View>

        {/* --- THE HERO: REVENUE SNAPSHOT --- */}
        <View className="relative overflow-hidden rounded-[32px] bg-[#1d1d1f] p-6 shadow-xl shadow-slate-900/20">
          {/* Decorative Background Accent */}
          <View className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/5" />

          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="cash-outline" color="#FFFFFF" size={20} />
            </View>
            <Text className="text-xs font-bold uppercase tracking-widest text-white/60">
              Contracted Revenue
            </Text>
          </View>

          <View className="mt-5">
            <Text className="font-soraSemiBold text-4xl text-white">
              {formatCurrency(monthlyRevenue)}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-white/50">
              Total monthly value across {activeLeaseCount} active contracts.
            </Text>
          </View>
        </View>

        {/* --- METRIC GRID: Status & Volume --- */}
        <View className="flex-row gap-4 px-1">
          {/* Total Leases */}
          <View className="flex-1 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-slate-50">
                <Ionicons name="document-text" color="#2563EB" size={16} />
              </View>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total
              </Text>
            </View>
            <View className="mt-3 flex-row items-end gap-1">
              <Text className="font-soraSemiBold text-2xl text-[#1d1d1f]">
                {leases.length}
              </Text>
              <Text className="mb-1 text-xs font-medium text-slate-400">
                Files
              </Text>
            </View>
          </View>

          {/* Active Health */}
          <View className="flex-1 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                  <Ionicons name="checkmark-circle" color="#2563EB" size={16} />
                </View>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active
                </Text>
              </View>
              {/* Simple Health % */}
              <Text className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                {Math.round(activeLeasePercentage)}%
              </Text>
            </View>

            <View className="mt-3">
              <Text className="font-soraSemiBold text-2xl text-[#1d1d1f]">
                {activeLeaseCount}
              </Text>
              {/* Visual Progress toward 100% active capacity */}
              <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <View
                  className="h-full bg-blue-500"
                  style={{ width: `${activeLeasePercentage}%` }}
                />
              </View>
            </View>
          </View>
        </View>

        <View className="rounded-[22px] border border-[#1d1d1f]/10 bg-white px-3 py-3 shadow-xl shadow-slate-900/10">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/10">
              <Feather name="search" size={20} color="#2563EB" />
            </View>

            <View className="min-w-0 flex-1">
              <Text className="mb-0.5 font-soraSemiBold text-[11px] uppercase text-[#1d1d1f]">
                Find lease
              </Text>

              <TextInput
                accessibilityLabel="Search leases"
                className="h-10 p-0 font-soraMedium text-sm text-zinc-950"
                placeholder="Tenant, unit, property, or lease"
                placeholderTextColor="#94a3b8"
                returnKeyType="search"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-8">
              {filteredLeases.map((lease) => {
                const property = properties.find(
                  (item) => item.id === lease.propertyId,
                );
                const lessee =
                  lease.lessee ??
                  lessees.find((item) => item.id === lease.lesseeId);

                return (
                  <LeaseCard
                    key={lease.id}
                    lease={lease}
                    lessee={lessee}
                    onDelete={() => setDeleteTarget(lease)}
                    onEdit={() => openEditForm(lease)}
                    onOpenTenant={() => lessee && setSelectedTenant(lessee)}
                    property={property}
                  />
                );
              })}

              {filteredLeases.length === 0 ? (
                <View className="items-center rounded-[28px] border border-dashed border-[#1d1d1f]/20 bg-[#FFFFFF]/95 p-8 shadow-sm">
                  <Ionicons
                    name="document-text-outline"
                    color="#2563EB"
                    size={38}
                  />
                  <Text className="mt-3 text-base font-bold text-[#1d1d1f]">
                    No leases found
                  </Text>
                  <Text className="mt-1 text-center text-sm leading-5 text-[#6F6D6D]">
                    Create a lease once a property and tenant are available.
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>

      <AddEditModal
        isVisible={isFormOpen}
        onClose={closeForm}
        title={editingLease ? "Edit Lease" : "Add Lease"}
        subtitle="Link a property with a tenant."
        isPending={saveMutation.isPending}
        submitText={editingLease ? "Save Lease" : "Create Lease"}
        onSubmit={handleSubmit}
        formError={formError}
      >
        <ChoiceField
          emptyText="Create a property first before adding leases."
          label="Property"
          onChange={(value) => updateForm("propertyId", value as string)}
          options={propertyOptions}
          value={form.propertyId}
        />
        <ChoiceField
          emptyText="Create a tenant first before adding leases."
          label="Tenant"
          onChange={(value) => updateForm("lesseeId", value as string)}
          options={lesseeOptions}
          value={form.lesseeId}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <PickerField
              label="Start Date"
              value={form.startDate}
              placeholder="Select date"
              onPress={() => openDatePicker("startDate")}
            />
          </View>
          <View className="flex-1">
            <BaseField
              keyboardType="number-pad"
              label="Duration (Months)"
              onChangeText={(value) =>
                updateForm("durationMonths", cleanNumber(value))
              }
              placeholder="12"
              value={form.durationMonths}
            />
          </View>
        </View>

        {form.startDate && Number(form.durationMonths) >= 1 ? (
          <View className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-slate-500">Inferred End Date</Text>
            <Text className="text-xs font-bold text-slate-900">
              {getDateLabel(calculateEndDate(form.startDate, Number(form.durationMonths)))}
            </Text>
          </View>
        ) : null}

        {Number(form.durationMonths) >= 1 && Number(form.monthlyRent) > 0 ? (
          <View className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Estimated Total Cost
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                {formatCurrency(Number(form.monthlyRent))} × {form.durationMonths} month{Number(form.durationMonths) > 1 ? "s" : ""}
              </Text>
            </View>
            <Text className="font-soraSemiBold text-lg text-blue-600">
              {formatCurrency(Number(form.monthlyRent) * Number(form.durationMonths))}
            </Text>
          </View>
        ) : null}

        <BaseField
          keyboardType="decimal-pad"
          label="Monthly Rent"
          onChangeText={(value) =>
            updateForm("monthlyRent", cleanNumber(value))
          }
          placeholder="0"
          value={form.monthlyRent}
        />
        <BaseField
          label="Room Number"
          onChangeText={(value) => updateForm("roomNumber", value)}
          placeholder="Optional"
          value={form.roomNumber}
        />
        <ChoiceField
          label="Status"
          onChange={(value) => updateForm("status", value as string)}
          options={statusOptions}
          value={form.status}
        />

        {activeDateField ? (
          <Modal
            animationType="fade"
            onRequestClose={() => setActiveDateField(null)}
            transparent
            visible
          >
            <View className="flex-1 justify-center bg-black/40 px-5">
              <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-5 shadow-xl">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-[#1d1d1f]">
                    {activeDateField === "startDate"
                      ? "Select Start Date"
                      : "Select End Date"}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="rounded-full bg-[#2563EB]/5 px-3 py-1.5"
                    onPress={confirmDatePicker}
                  >
                    <Text className="text-xs font-bold text-[#2563EB]">
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={
                    activeDateField === "endDate" && form.startDate
                      ? getDateValue(form.startDate)
                      : undefined
                  }
                  mode="date"
                  onChange={handleDateChange}
                  value={datePickerValue}
                />
              </View>
            </View>
          </Modal>
        ) : null}
      </AddEditModal>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(selectedTenant)}
        onRequestClose={() => setSelectedTenant(null)}
      >
        <View className="flex-1 justify-end bg-[#1d1d1f]/40">
          <View className="rounded-t-[32px] bg-[#FFFFFF] p-6">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-[#1d1d1f]">
                  {selectedTenant?.name}
                </Text>
                <Text className="mt-1 text-sm text-[#6F6D6D]">
                  {selectedTenant?.contactEmail || "No email on file"}
                </Text>
                <Text className="mt-1 text-sm text-[#6F6D6D]">
                  {selectedTenant?.phone || "No phone on file"}
                </Text>
              </View>
              <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/5"
                onPress={() => setSelectedTenant(null)}
              >
                <Ionicons name="close" color="#1d1d1f" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(deleteTarget)}
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View className="flex-1 items-center justify-center bg-[#1d1d1f]/40 px-6">
          <View className="w-full rounded-[28px] bg-[#FFFFFF] p-6">
            <Text className="text-xl font-bold text-[#1d1d1f]">
              Delete Lease
            </Text>
            <Text className="mt-2 text-sm leading-5 text-[#6F6D6D]">
              This lease will be removed permanently.
            </Text>
            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                className="h-12 flex-1 items-center justify-center rounded-2xl border border-[#1d1d1f]/10"
                onPress={() => setDeleteTarget(null)}
              >
                <Text className="font-bold text-[#1d1d1f]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="h-12 flex-1 items-center justify-center rounded-2xl bg-[#1d1d1f]"
                disabled={deleteMutation.isPending}
                onPress={() =>
                  deleteTarget && deleteMutation.mutate(deleteTarget.id)
                }
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-[#FFFFFF]">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
