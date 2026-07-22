import { Ionicons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { ScrollView, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../components/ui/ModuleState";
import { TenantDetailsModal } from "../../components/tenants/TenantDetailsModal";
import { TenantCard } from "../../components/tenants/TenantCard";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { FormSection } from "../../components/ui/forms/FormSection";
import AddButton from "../../components/ui/buttons/AddButton";
import { formatCurrency } from "../../utils/formatters";
import { useTenantManagement } from "../../hooks/tenants/useTenantManagement";

export default function TenantsScreen() {
  const {
    closeForm,
    deleteMutation,
    deleteTarget,
    editingTenant,
    filteredTenants,
    form,
    formError,
    getLinkedProperties,
    getTenantLeases,
    isFormOpen,
    isLoading,
    linkedTenantCount,
    linkedTenantPercentage,
    openCreateForm,
    openEditForm,
    saveMutation,
    searchQuery,
    selectedTenant,
    setDeleteTarget,
    setSearchQuery,
    setSelectedTenant,
    submit,
    tenantMonthlyRent,
    tenants,
    updateForm,
  } = useTenantManagement();

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

          <AddButton onPress={openCreateForm} />
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
            <Text className="mt-2 text-sm leading-5 text-white/50">
              Monthly recurring revenue from {linkedTenantCount} active lease
              agreements.
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
              <Text className="mb-1 text-xs font-medium text-slate-400">
                Profiles
              </Text>
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
              <Text className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                {Math.round(linkedTenantPercentage)}%
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
                  style={{
                    width: `${linkedTenantPercentage}%`,
                  }}
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
          <ModuleLoadingState
            description="Organizing tenant profiles and linked lease activity."
            title="Loading tenants"
          />
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
                <ModuleEmptyState
                  description="Add a tenant profile to start linking leases."
                  icon="people-outline"
                  title="No tenants found"
                />
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>

      <AddEditModal
        appearance="card"
        isVisible={isFormOpen}
        onClose={closeForm}
        title={editingTenant ? "Edit Tenant" : "Add Tenant"}
        subtitle="Keep tenant contact details current."
        isPending={saveMutation.isPending}
        submitText={editingTenant ? "Save Tenant" : "Create Tenant"}
        onSubmit={submit}
        formError={formError}
        showCancelAction
      >
        <FormSection
          description="Add the contact information used across leases and property records."
          icon="account-details-outline"
          title="Contact details"
          variant="card"
        >
          <BaseField
            label="Full Name"
            onChangeText={(value) => updateForm("name", value)}
            placeholder="e.g. Juan Dela Cruz"
            value={form.name}
            variant="filled"
          />
          <BaseField
            keyboardType="email-address"
            label="Email"
            onChangeText={(value) => updateForm("contactEmail", value)}
            placeholder="tenant@example.com"
            value={form.contactEmail}
            variant="filled"
          />
          <BaseField
            keyboardType="phone-pad"
            label="Phone"
            onChangeText={(value) => updateForm("phone", value)}
            placeholder="+63..."
            value={form.phone}
            variant="filled"
          />
        </FormSection>
      </AddEditModal>

      <TenantDetailsModal
        linkedLeaseCount={
          selectedTenant ? getTenantLeases(selectedTenant.id).length : undefined
        }
        onClose={() => setSelectedTenant(null)}
        tenant={selectedTenant}
      />

      <ConfirmationModal
        description="This tenant profile will be removed permanently."
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Tenant"
        visible={Boolean(deleteTarget)}
      />
    </Screen>
  );
}
