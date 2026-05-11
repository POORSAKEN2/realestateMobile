import { Ionicons } from "@expo/vector-icons";
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
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  createLessee,
  deleteLessee,
  fetchLeases,
  fetchLessees,
  type Lessee,
  type LesseePayload,
  updateLessee,
} from "../../api/propertyDetails";
import { fetchProperties, type Property } from "../../api/properties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";

type TenantFormState = {
  name: string;
  contactEmail: string;
  phone: string;
};

const emptyTenantForm: TenantFormState = {
  name: "",
  contactEmail: "",
  phone: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
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
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>
      <TextInput
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
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
          Loading tenants
        </Text>
        <Text className="mt-1 text-center text-xs leading-5 text-[#6F6D6D]">
          Organizing tenant profiles and linked lease activity.
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

function TenantCard({
  tenant,
  leaseCount,
  monthlyRent,
  propertyNames,
  onDelete,
  onEdit,
  onOpen,
}: {
  tenant: Lessee;
  leaseCount: number;
  monthlyRent: number;
  propertyNames: string[];
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <View className="gap-4 rounded-[30px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-5 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <TouchableOpacity
          activeOpacity={0.75}
          className="flex-1 flex-row items-start gap-3"
          onPress={onOpen}
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB]/10">
            <Ionicons name="person-outline" color="#2563EB" size={21} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-[#1d1d1f]">
              {tenant.name}
            </Text>
            <Text className="mt-1 text-sm text-[#6F6D6D]">
              {tenant.contactEmail || "No email on file"}
            </Text>
            <Text className="mt-1 text-sm text-[#6F6D6D]">
              {tenant.phone || "No phone on file"}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="rounded-full bg-[#2563EB]/5 px-3 py-1.5">
          <Text className="text-xs font-bold text-[#2563EB]">
            {leaseCount} lease{leaseCount === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View className="rounded-2xl bg-[#2563EB]/5 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
              Monthly Rent
            </Text>
            <Text className="mt-1 text-base font-bold text-[#1d1d1f]">
              {formatCurrency(monthlyRent)}
            </Text>
          </View>
          <Ionicons name="wallet-outline" color="#2563EB" size={21} />
        </View>
      </View>

      {propertyNames.length > 0 ? (
        <Text className="text-xs font-medium leading-5 text-[#6F6D6D]">
          Linked to {propertyNames.join(", ")}
        </Text>
      ) : (
        <Text className="text-xs font-medium leading-5 text-[#6F6D6D]">
          No linked properties yet.
        </Text>
      )}

      <View className="flex-row justify-end gap-2">
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
  );
}

export default function TenantsScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ action?: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<TenantFormState>(emptyTenantForm);
  const [formError, setFormError] = useState("");
  const [editingTenant, setEditingTenant] = useState<Lessee | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Lessee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lessee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ["lessees", accessToken],
    queryFn: () => fetchLessees(accessToken),
    enabled: Boolean(accessToken),
  });
  const { data: leases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["leases", accessToken],
    queryFn: () => fetchLeases(accessToken),
    enabled: Boolean(accessToken),
  });
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties", accessToken],
    queryFn: () => fetchProperties(accessToken),
    enabled: Boolean(accessToken),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: LesseePayload) =>
      editingTenant
        ? updateLessee(editingTenant.id, payload, accessToken)
        : createLessee(payload, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lessees"] });
      closeForm();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Failed to save tenant.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tenantId: string) => deleteLessee(tenantId, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lessees"] });
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      setDeleteTarget(null);
    },
  });

  const filteredTenants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tenants.filter((tenant) => {
      const haystack = [tenant.name, tenant.contactEmail, tenant.phone]
        .join(" ")
        .toLowerCase();

      return !query || haystack.includes(query);
    });
  }, [searchQuery, tenants]);

  useEffect(() => {
    if (params.action === "add") {
      openCreateForm();
    }
  }, [params.action]);

  function updateForm<K extends keyof TenantFormState>(
    key: K,
    value: TenantFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateForm() {
    setEditingTenant(null);
    setForm(emptyTenantForm);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(tenant: Lessee) {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      phone: tenant.phone,
    });
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingTenant(null);
    setForm(emptyTenantForm);
    setFormError("");
  }

  function getTenantLeases(tenantId: string) {
    return leases.filter((lease) => lease.lesseeId === tenantId);
  }

  function getLinkedProperties(tenantId: string) {
    const tenantLeases = getTenantLeases(tenantId);
    const names = tenantLeases
      .map((lease) =>
        properties.find((property) => property.id === lease.propertyId),
      )
      .filter((property): property is Property => Boolean(property))
      .map((property) => property.title);

    return Array.from(new Set(names));
  }

  function handleSubmit() {
    setFormError("");

    const name = form.name.trim();
    const contactEmail = form.contactEmail.trim();
    const phone = form.phone.trim();

    if (!name) {
      setFormError("Tenant name is required.");
      return;
    }

    if (!contactEmail) {
      setFormError("Tenant email is required.");
      return;
    }

    if (!phone) {
      setFormError("Tenant phone is required.");
      return;
    }

    saveMutation.mutate({ name, contactEmail, phone });
  }

  const isLoading = isLoadingTenants || isLoadingLeases || isLoadingProperties;
  const linkedTenantCount = useMemo(
    () =>
      tenants.filter((tenant) =>
        leases.some((lease) => lease.lesseeId === tenant.id),
      ).length,
    [leases, tenants],
  );
  const tenantMonthlyRent = useMemo(
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
                  <Ionicons name="people-outline" color="#FFFFFF" size={18} />
                </View>
                <Text className="text-xs font-bold uppercase tracking-wide text-[#FFFFFF]/70">
                  Tenant Desk
                </Text>
              </View>
              <Text className="text-3xl font-bold text-[#FFFFFF]">Tenants</Text>
              <Text className="mt-2 text-sm leading-5 text-[#FFFFFF]/70">
                Manage lessee records, contact details, and linked lease
                activity.
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
            icon="people-outline"
            label="Tenants"
            value={String(tenants.length)}
          />
          <MetricCard
            icon="link-outline"
            label="Linked"
            value={String(linkedTenantCount)}
          />
        </View>

        <View className="rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                Tenant-Linked Monthly Rent
              </Text>
              <Text className="mt-1 text-xl font-bold text-[#1d1d1f]">
                {formatCurrency(tenantMonthlyRent)}
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/10">
              <Ionicons name="business-outline" color="#2563EB" size={21} />
            </View>
          </View>
        </View>

        <View className="h-14 flex-row items-center rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 shadow-sm">
          <Ionicons name="search-outline" color="#2563EB" size={20} />
          <TextInput
            autoCapitalize="none"
            className="ml-2 flex-1 text-base text-[#1d1d1f]"
            onChangeText={setSearchQuery}
            placeholder="Search tenants"
            placeholderTextColor="#6F6D6D"
            value={searchQuery}
          />
        </View>

        {isLoading ? (
          <LoadingState />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-8">
              {filteredTenants.map((tenant) => {
                const tenantLeases = getTenantLeases(tenant.id);
                const monthlyRent = tenantLeases.reduce(
                  (sum, lease) => sum + lease.monthlyRent,
                  0,
                );

                return (
                  <TenantCard
                    key={tenant.id}
                    leaseCount={tenantLeases.length}
                    monthlyRent={monthlyRent}
                    onDelete={() => setDeleteTarget(tenant)}
                    onEdit={() => openEditForm(tenant)}
                    onOpen={() => setSelectedTenant(tenant)}
                    propertyNames={getLinkedProperties(tenant.id)}
                    tenant={tenant}
                  />
                );
              })}

              {filteredTenants.length === 0 ? (
                <View className="items-center rounded-[28px] border border-dashed border-[#1d1d1f]/20 bg-[#FFFFFF]/95 p-8 shadow-sm">
                  <Ionicons name="people-outline" color="#2563EB" size={38} />
                  <Text className="mt-3 text-base font-bold text-[#1d1d1f]">
                    No tenants found
                  </Text>
                  <Text className="mt-1 text-center text-sm leading-5 text-[#6F6D6D]">
                    Add a tenant profile to start linking leases.
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
                  {editingTenant ? "Edit Tenant" : "Add Tenant"}
                </Text>
                <Text className="mt-1 text-sm text-[#FFFFFF]/70">
                  Keep tenant contact details current.
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
            <Field
              label="Full Name"
              onChangeText={(value) => updateForm("name", value)}
              placeholder="e.g. Juan Dela Cruz"
              value={form.name}
            />
            <Field
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) => updateForm("contactEmail", value)}
              placeholder="tenant@example.com"
              value={form.contactEmail}
            />
            <Field
              keyboardType="phone-pad"
              label="Phone"
              onChangeText={(value) => updateForm("phone", value)}
              placeholder="+63..."
              value={form.phone}
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
                    {editingTenant ? "Save Tenant" : "Create Tenant"}
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
                <View className="mt-5 rounded-2xl bg-[#2563EB]/5 p-4">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                    Active Records
                  </Text>
                  <Text className="mt-1 text-base font-bold text-[#1d1d1f]">
                    {selectedTenant
                      ? getTenantLeases(selectedTenant.id).length
                      : 0}{" "}
                    linked leases
                  </Text>
                </View>
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
              Delete Tenant
            </Text>
            <Text className="mt-2 text-sm leading-5 text-[#6F6D6D]">
              This tenant profile will be removed permanently.
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
