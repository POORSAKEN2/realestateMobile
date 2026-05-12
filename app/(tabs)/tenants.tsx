import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
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
  <TouchableOpacity
  activeOpacity={0.7}
  onPress={onOpen}
  className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-300/30"
>
  <View className="p-5">
    {/* --- HEADER: Identity & Actions --- */}
    <View className="flex-row items-start justify-between gap-3">
      
      {/* Avatar & Info */}
      <View className="flex-1 min-w-0 flex-row gap-3.5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#2563EB]/10">
          <Ionicons name="person" color="#2563EB" size={20} />
        </View>

        <View className="flex-1 min-w-0 pt-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="font-soraSemiBold text-lg tracking-tight text-[#1d1d1f]" numberOfLines={1}>
              {tenant.name}
            </Text>
            {/* Subtle Inline Badge */}
            <View className="rounded-md bg-slate-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {leaseCount} Lease{leaseCount === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          {/* Contact Info (Simplified layout) */}
          <View className="mt-1 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5 min-w-0 flex-1">
              <Ionicons name="mail" size={12} color="#94A3B8" />
              <Text className="text-sm text-slate-500" numberOfLines={1}>
                {tenant.contactEmail || "No email"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions (Moved to top right to declutter bottom) */}
      <View className="flex-row items-center gap-1 bg-slate-50 rounded-full border border-slate-100 p-1">
        <TouchableOpacity activeOpacity={0.7} onPress={onEdit} className="p-1.5 rounded-full hover:bg-slate-200">
          <Ionicons name="pencil" size={16} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={onDelete} className="p-1.5 rounded-full hover:bg-red-50">
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>

    {/* --- DIVIDER --- */}
    <View className="my-4 h-[1px] w-full bg-slate-100" />

    {/* --- METRICS GRID: Rent & Properties Side-by-Side --- */}
    <View className="flex-row items-center justify-between gap-4">
      
      {/* Financials */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="wallet-outline" color="#94A3B8" size={14} />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Monthly Rent
          </Text>
        </View>
        <Text 
          className="mt-1.5 font-soraSemiBold text-2xl tracking-tight text-[#2563EB]" 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
          {formatCurrency(monthlyRent)}
        </Text>
      </View>

      {/* Vertical Separator */}
      <View className="h-10 w-[1px] bg-slate-100" />

      {/* Assets/Properties */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="business-outline" color="#94A3B8" size={14} />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Properties
          </Text>
        </View>
        <Text 
          className="mt-1.5 text-sm font-medium leading-5 text-[#1d1d1f]" 
          numberOfLines={2}
        >
          {propertyNames.length > 0 ? propertyNames.join(", ") : "Unassigned"}
        </Text>
      </View>

    </View>
  </View>
</TouchableOpacity>
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
     
       <View className="flex-1 gap-6">
  {/* --- TOP HEADER: Title & Global Action --- */}
  <View className="flex-row items-center justify-between px-1">
    <View>
      <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
        CRM Dashboard
      </Text>
      <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
        Tenants
      </Text>
    </View>

    <TouchableOpacity
      activeOpacity={0.8}
      onPress={openCreateForm}
      className="flex-row items-center gap-2 rounded-2xl bg-[#2563EB] py-3 px-4 shadow-md shadow-blue-200"
    >
      <Ionicons name="add" color="#FFFFFF" size={20} />
      <Text className="font-bold text-white text-sm">New Tenant</Text>
    </TouchableOpacity>
  </View>

  {/* --- THE HERO: REVENUE SNAPSHOT --- */}
  <View className="relative overflow-hidden rounded-[32px] bg-[#1d1d1f] p-6 shadow-xl shadow-slate-900/20">
    {/* Decorative Background Accent */}
    <View className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#2563EB]/10" />
    
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Ionicons name="wallet-outline" color="#FFFFFF" size={20} />
      </View>
      <Text className="text-xs font-bold uppercase tracking-widest text-white/60">
        Linked Revenue
      </Text>
    </View>

    <View className="mt-5">
      <Text className="font-soraSemiBold text-4xl text-white">
        {formatCurrency(tenantMonthlyRent)}
      </Text>
      <Text className="mt-2 text-sm text-white/50 leading-5">
        Monthly recurring revenue from {linkedTenantCount} active lease agreements.
      </Text>
    </View>
  </View>

  {/* --- METRIC ROW: Clean & Borderless --- */}
  <View className="flex-row gap-4 px-1">
    {/* Total Tenants */}
    <View className="flex-1 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-slate-50">
          <Ionicons name="people" color="#2563EB" size={16} />
        </View>
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Capacity
        </Text>
      </View>
      <View className="mt-3 flex-row items-end gap-1">
        <Text className="font-soraSemiBold text-2xl text-[#1d1d1f]">
          {tenants.length}
        </Text>
        <Text className="mb-1 text-xs font-medium text-slate-400">Profiles</Text>
      </View>
    </View>

    {/* Lease Linkage Health */}
    <View className="flex-1 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
            <Ionicons name="link" color="#10B981" size={16} />
          </View>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Linkage
          </Text>
        </View>
        {/* Simple Health Badge */}
        <Text className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
          {Math.round((linkedTenantCount / tenants.length) * 100)}%
        </Text>
      </View>
      
      <View className="mt-3">
        <Text className="font-soraSemiBold text-2xl text-[#1d1d1f]">
          {linkedTenantCount}
        </Text>
        {/* Mini Progress Bar for Linkage Health */}
        <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <View 
            className="h-full bg-emerald-500" 
            style={{ width: `${(linkedTenantCount / tenants.length) * 100}%` }} 
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
                Find tenant
              </Text>

              <TextInput
                accessibilityLabel="Search tenants"
                autoCapitalize="none"
                className="h-10 p-0 font-soraMedium text-sm text-zinc-950"
                placeholder="Name, email, phone, or unit"
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
