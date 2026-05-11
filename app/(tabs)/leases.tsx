import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
  type Lease,
  type LeasePayload,
  type Lessee,
  updateLease,
} from "../../api/propertyDetails";
import { fetchProperties, type Property } from "../../api/properties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";

type LeaseFormState = {
  propertyId: string;
  lesseeId: string;
  startDate: string;
  endDate: string;
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
  startDate: "",
  endDate: "",
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

function toLeaseForm(lease: Lease): LeaseFormState {
  return {
    propertyId: lease.propertyId,
    lesseeId: lease.lesseeId,
    startDate: lease.startDate,
    endDate: lease.endDate,
    monthlyRent: String(lease.monthlyRent || ""),
    roomNumber: lease.roomNumber ?? "",
    status: lease.status || "Active",
  };
}

function DateField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        className="h-14 flex-row items-center justify-between rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 shadow-sm"
        onPress={onPress}
      >
        <Text
          className={`text-base ${value ? "text-[#1d1d1f]" : "text-[#6F6D6D]"}`}
        >
          {getDateLabel(value) || placeholder}
        </Text>
        <Ionicons name="calendar-outline" color="#2563EB" size={20} />
      </TouchableOpacity>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
}) {
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>
      <TextInput
        className="h-14 rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 text-base text-[#1d1d1f] shadow-sm"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6F6D6D"
        value={value}
      />
    </View>
  );
}

function ChoiceField({
  label,
  options,
  value,
  onChange,
  emptyText,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  emptyText?: string;
}) {
  return (
    <View className="gap-3">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>
      {options.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-[#1d1d1f]/20 bg-[#FFFFFF]/90 p-4">
          <Text className="text-sm font-medium text-[#6F6D6D]">
            {emptyText ?? "No options available."}
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.8}
                className={`rounded-full border px-3.5 py-2.5 ${
                  selected
                    ? "border-[#2563EB] bg-[#2563EB]"
                    : "border-[#1d1d1f]/10 bg-[#FFFFFF]"
                }`}
                onPress={() => onChange(option.value)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selected ? "text-[#FFFFFF]" : "text-[#1d1d1f]"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

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
    <View className="flex-1 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
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
    <View className="gap-4 rounded-[30px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-5 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <TouchableOpacity activeOpacity={0.75} onPress={onOpenTenant}>
            <Text className="text-lg font-bold text-[#1d1d1f]">
              {lessee?.name ?? lease.lessee?.name ?? "Unknown Tenant"}
            </Text>
          </TouchableOpacity>
          <Text className="mt-1 text-sm font-medium text-[#6F6D6D]">
            {property?.title ?? "Unknown Property"}
          </Text>
          <Text className="mt-1 text-xs text-[#6F6D6D]">
            {lease.startDate} to {lease.endDate}
          </Text>
        </View>

        <View
          className={`rounded-full px-3 py-1.5 ${
            isActive
              ? "bg-[#2563EB]/10"
              : isExpired
                ? "bg-[#2563EB]/10"
                : "bg-[#1d1d1f]/5"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isActive
                ? "text-[#2563EB]"
                : isExpired
                  ? "text-[#2563EB]"
                  : "text-[#1d1d1f]"
            }`}
          >
            {lease.status}
          </Text>
        </View>
      </View>

      <View className="rounded-2xl bg-[#2563EB]/5 p-4">
        <View className="flex-row items-center justify-between gap-4">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
              Monthly Rent
            </Text>
            <Text className="mt-1 text-base font-bold text-[#1d1d1f]">
              {formatCurrency(lease.monthlyRent)}
            </Text>
          </View>
          {lease.roomNumber ? (
            <View className="rounded-full bg-[#FFFFFF] px-3 py-1.5">
              <Text className="text-xs font-bold text-[#2563EB]">
                Room {lease.roomNumber}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" color="#2563EB" size={16} />
            <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
              Term
            </Text>
          </View>
          <Text className="mt-1 text-xs font-semibold text-[#1d1d1f]">
            {lease.startDate} - {lease.endDate}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/5"
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={18} color="#1d1d1f" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/5"
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#1d1d1f" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties", accessToken],
    queryFn: () => fetchProperties(accessToken),
    enabled: Boolean(accessToken),
  });

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
    if (Platform.OS === "android") {
      setActiveDateField(null);
    }

    if (event.type === "dismissed" || !activeDateField || !selectedDate) {
      return;
    }

    updateForm(activeDateField, formatDateValue(selectedDate));
  }

  function handleSubmit() {
    setFormError("");

    const monthlyRent = Number(form.monthlyRent || 0);

    if (!form.propertyId) {
      setFormError("Please select a property.");
      return;
    }

    if (!form.lesseeId) {
      setFormError("Please select a tenant.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setFormError("Start date and end date are required.");
      return;
    }

    if (getDateValue(form.endDate) <= getDateValue(form.startDate)) {
      setFormError("End date must be after the start date.");
      return;
    }

    if (Number.isNaN(monthlyRent) || monthlyRent < 0) {
      setFormError("Monthly rent must be a valid amount.");
      return;
    }

    saveMutation.mutate({
      propertyId: form.propertyId,
      lesseeId: form.lesseeId,
      startDate: form.startDate,
      endDate: form.endDate,
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

  return (
    <Screen className="bg-[#2563EB]/5">
      <View className="flex-1 gap-5">
        <View className="overflow-hidden rounded-[32px] bg-[#1d1d1f] p-5 shadow-sm">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF]/15">
                  <Ionicons
                    name="document-text-outline"
                    color="#FFFFFF"
                    size={18}
                  />
                </View>
                <Text className="text-xs font-bold uppercase tracking-wide text-[#FFFFFF]/70">
                  Lease Desk
                </Text>
              </View>
              <Text className="text-3xl font-bold text-[#FFFFFF]">Leases</Text>
              <Text className="mt-2 text-sm leading-5 text-[#FFFFFF]/70">
                Track contracts, rental terms, rooms, and linked tenants.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 w-14 items-center justify-center rounded-2xl bg-[#FFFFFF]"
              onPress={openCreateForm}
            >
              <Ionicons name="add" color="#2563EB" size={25} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row gap-3">
          <MetricCard
            icon="document-text-outline"
            label="Leases"
            value={String(leases.length)}
          />
          <MetricCard
            icon="checkmark-circle-outline"
            label="Active"
            value={String(activeLeaseCount)}
          />
        </View>

        <View className="rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                Contracted Monthly Rent
              </Text>
              <Text className="mt-1 text-xl font-bold text-[#1d1d1f]">
                {formatCurrency(monthlyRevenue)}
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/10">
              <Ionicons name="cash-outline" color="#2563EB" size={21} />
            </View>
          </View>
        </View>

        <View className="h-14 flex-row items-center rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 shadow-sm">
          <Ionicons name="search-outline" color="#2563EB" size={20} />
          <TextInput
            className="ml-2 flex-1 text-base text-[#1d1d1f]"
            onChangeText={setSearchQuery}
            placeholder="Search leases"
            placeholderTextColor="#6F6D6D"
            value={searchQuery}
          />
        </View>

        {isLoading ? (
          <LoadingState />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
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

      <Modal
        animationType="slide"
        visible={isFormOpen}
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-[#2563EB]/5"
        >
          <View className="bg-[#1d1d1f] px-6 pb-5 pt-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-[#FFFFFF]">
                  {editingLease ? "Edit Lease" : "Add Lease"}
                </Text>
                <Text className="mt-1 text-sm text-[#FFFFFF]/70">
                  Link a property with a tenant.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#FFFFFF]/15"
                onPress={closeForm}
              >
                <Ionicons name="close" color="#FFFFFF" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-5 px-6 py-6"
            keyboardShouldPersistTaps="handled"
          >
            <ChoiceField
              emptyText="Create a property first before adding leases."
              label="Property"
              onChange={(value) => updateForm("propertyId", value)}
              options={propertyOptions}
              value={form.propertyId}
            />
            <ChoiceField
              emptyText="Create a tenant first before adding leases."
              label="Tenant"
              onChange={(value) => updateForm("lesseeId", value)}
              options={lesseeOptions}
              value={form.lesseeId}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DateField
                  label="Start Date"
                  onPress={() => setActiveDateField("startDate")}
                  placeholder="YYYY-MM-DD"
                  value={form.startDate}
                />
              </View>
              <View className="flex-1">
                <DateField
                  label="End Date"
                  onPress={() => setActiveDateField("endDate")}
                  placeholder="YYYY-MM-DD"
                  value={form.endDate}
                />
              </View>
            </View>

            {activeDateField ? (
              <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-[#1d1d1f]">
                    {activeDateField === "startDate"
                      ? "Select Start Date"
                      : "Select End Date"}
                  </Text>
                  {Platform.OS === "ios" ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="rounded-full bg-[#2563EB]/5 px-3 py-1.5"
                      onPress={() => setActiveDateField(null)}
                    >
                      <Text className="text-xs font-bold text-[#2563EB]">
                        Done
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <DateTimePicker
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={
                    activeDateField === "endDate" && form.startDate
                      ? getDateValue(form.startDate)
                      : undefined
                  }
                  mode="date"
                  onChange={handleDateChange}
                  value={getDateValue(form[activeDateField])}
                />
              </View>
            ) : null}

            <Field
              keyboardType="decimal-pad"
              label="Monthly Rent"
              onChangeText={(value) =>
                updateForm("monthlyRent", cleanNumber(value))
              }
              placeholder="0"
              value={form.monthlyRent}
            />
            <Field
              label="Room Number"
              onChangeText={(value) => updateForm("roomNumber", value)}
              placeholder="Optional"
              value={form.roomNumber}
            />
            <ChoiceField
              label="Status"
              onChange={(value) => updateForm("status", value)}
              options={statusOptions}
              value={form.status}
            />

            {formError ? (
              <View className="rounded-2xl border border-[#1d1d1f]/15 bg-[#1d1d1f]/5 p-4">
                <Text className="text-sm font-medium text-[#1d1d1f]">
                  {formError}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="border-t border-[#1d1d1f]/10 bg-[#FFFFFF] p-6">
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 flex-1 items-center justify-center rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF]"
                onPress={closeForm}
              >
                <Text className="text-base font-bold text-[#1d1d1f]">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 flex-1 items-center justify-center rounded-2xl bg-[#2563EB]"
                disabled={saveMutation.isPending}
                onPress={handleSubmit}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-semibold text-[#FFFFFF]">
                    {editingLease ? "Save Lease" : "Create Lease"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
