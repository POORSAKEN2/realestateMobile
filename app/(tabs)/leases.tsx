import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Feather from "@expo/vector-icons/Feather";
import { Platform, ScrollView, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../components/ui/ModuleState";
import { TenantDetailsModal } from "../../components/tenants/TenantDetailsModal";
import { LeaseCard } from "../../components/leases/LeaseCard";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { ChoiceField } from "../../components/ui/fields/ChoiceField";
import {
  PickerField,
  PickerModalShell,
} from "../../components/ui/fields/PickerField";
import { FormSection } from "../../components/ui/forms/FormSection";
import AddButton from "../../components/ui/buttons/AddButton";
import {
  calculateLeaseEndDate,
  formatLeaseDateLabel,
} from "../../utils/leases/leaseForm";
import { formatCurrency } from "../../utils/formatters";
import { useLeaseManagement } from "../../hooks/leases/useLeaseManagement";

type Option = {
  label: string;
  value: string;
};

const statusOptions: Option[] = [
  { label: "Active", value: "Active" },
  { label: "Expired", value: "Expired" },
  { label: "Terminated", value: "Terminated" },
];

function cleanNumber(value: string) {
  return value.replace(/[^\d.]/g, "");
}

export default function LeasesScreen() {
  const {
    activeLeaseCount,
    activeLeasePercentage,
    closeForm,
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
    isLoading,
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
    submit,
    updateForm,
  } = useLeaseManagement();

  return (
    <Screen className="bg-[#2563EB]/5">
      <View className="flex-1 gap-5">
        {/* --- TOP HEADER: Title & Primary Action --- */}
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="text-[11px] font-ralewayExtraBold uppercase tracking-[2px] text-slate-400">
              Contract Management
            </Text>
            <Text className="font-ralewayBold text-3xl tracking-tight text-[#1d1d1f]">
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
            <Text className="text-xs font-ralewayExtraBold uppercase tracking-widest text-white/60">
              Contracted Revenue
            </Text>
          </View>

          <View className="mt-5">
            <Text className="font-ralewayBold text-4xl text-white">
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
              <Text className="text-[10px] font-ralewayExtraBold uppercase tracking-wider text-slate-400">
                Total
              </Text>
            </View>
            <View className="mt-3 flex-row items-end gap-1">
              <Text className="font-ralewayBold text-2xl text-[#1d1d1f]">
                {leases.length}
              </Text>
              <Text className="mb-1 text-xs font-ralewaySemiBold text-slate-400">
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
                <Text className="text-[10px] font-ralewayExtraBold uppercase tracking-wider text-slate-400">
                  Active
                </Text>
              </View>
              {/* Simple Health % */}
              <Text className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-ralewayExtraBold text-blue-600">
                {Math.round(activeLeasePercentage)}%
              </Text>
            </View>

            <View className="mt-3">
              <Text className="font-ralewayBold text-2xl text-[#1d1d1f]">
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
              <Text className="mb-0.5 font-ralewayBold text-[11px] uppercase text-[#1d1d1f]">
                Find lease
              </Text>

              <TextInput
                accessibilityLabel="Search leases"
                className="h-10 p-0 font-ralewaySemiBold text-sm text-zinc-950"
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
          <ModuleLoadingState
            description="Syncing contracts, tenants, and property records."
            title="Loading leases"
          />
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
                <ModuleEmptyState
                  description="Create a lease once a property and tenant are available."
                  icon="document-text-outline"
                  title="No leases found"
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
        title={editingLease ? "Edit Lease" : "Add Lease"}
        subtitle="Link a property with a tenant."
        isPending={saveMutation.isPending}
        submitText={editingLease ? "Save Lease" : "Create Lease"}
        onSubmit={submit}
        formError={formError}
        showCancelAction
      >
        <FormSection
          description="Choose the property and tenant connected by this lease."
          icon="account-switch-outline"
          title="Lease parties"
          variant="card"
        >
          <ChoiceField
            emptyText="Create a property first before adding leases."
            label="Property"
            onChange={(value) => updateForm("propertyId", value as string)}
            options={propertyOptions}
            value={form.propertyId}
            variant="filled"
          />
          <ChoiceField
            emptyText="Create a tenant first before adding leases."
            label="Tenant"
            onChange={(value) => updateForm("lesseeId", value as string)}
            options={lesseeOptions}
            value={form.lesseeId}
            variant="filled"
          />
        </FormSection>

        <FormSection
          description="Set the lease period, rent, unit, and current status."
          icon="calendar-range"
          title="Terms & status"
          variant="card"
        >
          <View className="flex-row gap-3">
            <PickerField
              className="min-w-0 flex-1 gap-2"
              label="Start Date"
              value={formatLeaseDateLabel(form.startDate)}
              placeholder="Select date"
              onPress={openStartDatePicker}
              variant="filled"
            />
            <BaseField
              className="min-w-0 flex-1 gap-2"
              keyboardType="number-pad"
              label="Duration (Months)"
              onChangeText={(value) =>
                updateForm("durationMonths", value.replace(/\D/g, ""))
              }
              placeholder="12"
              value={form.durationMonths}
              variant="filled"
            />
          </View>

          {form.startDate && Number(form.durationMonths) >= 1 ? (
            <View className="flex-row items-center justify-between rounded-2xl border border-[#2563EB]/15 bg-[#2563EB]/5 px-4 py-3.5">
              <Text className="text-xs font-ralewayExtraBold uppercase tracking-wider text-[#2563EB]">
                Calculated End Date
              </Text>
              <Text className="font-ralewayBold text-sm text-[#1d1d1f]">
                {formatLeaseDateLabel(
                  calculateLeaseEndDate(
                    form.startDate,
                    Number(form.durationMonths),
                  ),
                )}
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
            variant="filled"
          />
          <BaseField
            label="Room Number"
            onChangeText={(value) => updateForm("roomNumber", value)}
            placeholder="Optional"
            value={form.roomNumber}
            variant="filled"
          />
          <ChoiceField
            label="Status"
            onChange={(value) => updateForm("status", value as string)}
            options={statusOptions}
            value={form.status}
            variant="segmented"
          />
        </FormSection>

        {isStartDatePickerOpen ? (
          <PickerModalShell
            onClose={confirmDatePicker}
            title="Select Start Date"
          >
            <DateTimePicker
              display={Platform.OS === "ios" ? "inline" : "default"}
              mode="date"
              onChange={handleDateChange}
              value={datePickerValue}
            />
          </PickerModalShell>
        ) : null}
      </AddEditModal>

      <TenantDetailsModal
        onClose={() => setSelectedTenant(null)}
        tenant={selectedTenant}
      />

      <ConfirmationModal
        description="This lease will be removed permanently."
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Lease"
        visible={Boolean(deleteTarget)}
      />
    </Screen>
  );
}
