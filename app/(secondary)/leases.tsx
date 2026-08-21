import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
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
import { DateTimePickerModal } from "../../components/ui/fields/DateTimePickerModal";
import { PickerField } from "../../components/ui/fields/PickerField";
import { FormSection } from "../../components/ui/forms/FormSection";
import AddButton from "../../components/ui/buttons/AddButton";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import {
  formatSearchResultLabel,
  SearchToolbar,
} from "../../components/ui/SearchToolbar";
import {
  EMPTY_LEASE_FILTERS,
  LeaseFilterSheet,
  type LeaseFilters,
} from "../../components/leases/LeaseFilterSheet";
import {
  calculateLeaseEndDate,
  formatLeaseDateLabel,
  parseLeaseDateValue,
} from "../../utils/leases/leaseForm";
import { formatCurrency } from "../../utils/formatters";
import { useLeaseManagement } from "../../hooks/leases/useLeaseManagement";
import { useSnackbar } from "../../hooks/useSnackbar";
import { colors } from "../../constants/colors";

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
  const leaseSnackbar = useSnackbar();
  const [filters, setFilters] = useState<LeaseFilters>(EMPTY_LEASE_FILTERS);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const {
    activeLeaseCount,
    activeLeasePercentage,
    closeForm,
    closeStartDatePicker,
    deleteMutation,
    deleteTarget,
    editingLease,
    filteredLeases,
    form,
    formError,
    handleStartDateConfirm,
    isFormOpen,
    isLoading,
    isRefreshing,
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
    refresh,
    saveMutation,
    searchQuery,
    selectedTenant,
    setDeleteTarget,
    setSearchQuery,
    setSelectedTenant,
    submit,
    updateForm,
  } = useLeaseManagement({
    onSaved: (operation) =>
      leaseSnackbar.show(
        operation === "created" ? "Lease added." : "Lease updated.",
      ),
  });
  const visibleLeases = useMemo(
    () =>
      filteredLeases.filter(
        (lease) =>
          (filters.status === "ALL" || lease.status === filters.status) &&
          (filters.propertyId === "ALL" ||
            lease.propertyId === filters.propertyId) &&
          (filters.lesseeId === "ALL" || lease.lesseeId === filters.lesseeId),
      ),
    [filteredLeases, filters],
  );
  const activeFilterCount = [
    filters.status !== "ALL",
    filters.propertyId !== "ALL",
    filters.lesseeId !== "ALL",
  ].filter(Boolean).length;
  const filterLabel = activeFilterCount
    ? `${activeFilterCount} active filters`
    : "All leases";

  return (
    <Screen className="bg-surface">
      <View className="flex-1 gap-5">
        {/* --- TOP HEADER: Title & Primary Action --- */}
        <View className="px-1">
          <ModuleHeader
            action={<AddButton onPress={openCreateForm} />}
            eyebrow="Contract Management"
            leading={
              <SecondaryBackButton
                accessibilityLabel="Back from leases"
                variant="secondary"
              />
            }
            title="Leases"
          />
        </View>

        {/* --- THE HERO: REVENUE SNAPSHOT --- */}
        <View className="relative overflow-hidden rounded-[32px] bg-secondary p-6 shadow-xl shadow-secondary/20">
          {/* Decorative Background Accent */}
          <View className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-primary/40" />

          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="cash-outline" color="#FFFFFF" size={20} />
            </View>
            <Text className="font-ralewayExtraBold text-xs uppercase tracking-widest text-white/60">
              Contracted Revenue
            </Text>
          </View>

          <View className="mt-5">
            {isLoading ? (
              <SkeletonBlock className="h-10 w-3/4 rounded-xl bg-white/20" />
            ) : (
              <Text className="font-ralewayBold text-4xl text-white">
                {formatCurrency(monthlyRevenue)}
              </Text>
            )}
            {isLoading ? (
              <SkeletonBlock className="mt-3 h-4 w-5/6 bg-white/20" />
            ) : (
              <Text className="mt-2 text-sm leading-5 text-white/50">
                Total monthly value across {activeLeaseCount} active contracts.
              </Text>
            )}
          </View>
        </View>

        {/* --- METRIC GRID: Status & Volume --- */}
        <View className="flex-row gap-4 px-1">
          {/* Total Leases */}
          <View className="flex-1 rounded-3xl border border-secondary/20 bg-white p-4 shadow-sm shadow-secondary/10">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-secondary/10">
                <Ionicons
                  name="document-text"
                  color={colors.secondary}
                  size={16}
                />
              </View>
              <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
                Total
              </Text>
            </View>
            <View className="mt-3 flex-row items-end gap-1">
              {isLoading ? (
                <SkeletonBlock className="h-7 w-12" />
              ) : (
                <Text className="font-ralewayBold text-2xl text-textPrimary">
                  {leases.length}
                </Text>
              )}
              <Text className="mb-1 font-ralewaySemiBold text-xs text-description">
                Files
              </Text>
            </View>
          </View>

          {/* Active Health */}
          <View className="flex-1 rounded-3xl border border-secondary/20 bg-white p-4 shadow-sm shadow-secondary/10">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-secondary/10">
                  <Ionicons
                    name="checkmark-circle"
                    color={colors.secondary}
                    size={16}
                  />
                </View>
                <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
                  Active
                </Text>
              </View>
              {/* Simple Health % */}
              {isLoading ? (
                <SkeletonBlock className="h-5 w-9 rounded-md" />
              ) : (
                <Text className="rounded-md bg-accent px-1.5 py-0.5 font-ralewayExtraBold text-[10px] text-textPrimary">
                  {Math.round(activeLeasePercentage)}%
                </Text>
              )}
            </View>

            <View className="mt-3">
              {isLoading ? (
                <SkeletonBlock className="h-7 w-12" />
              ) : (
                <Text className="font-ralewayBold text-2xl text-textPrimary">
                  {activeLeaseCount}
                </Text>
              )}
              {/* Visual Progress toward 100% active capacity */}
              <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary/10">
                <View
                  className="h-full bg-secondary"
                  style={{ width: `${activeLeasePercentage}%` }}
                />
              </View>
            </View>
          </View>
        </View>

        <SearchToolbar
          accessibilityLabel="Search leases"
          activeFilterCount={activeFilterCount}
          clearAccessibilityLabel="Clear lease search"
          filterAccessibilityLabel={`Filter leases, ${filterLabel}`}
          filterLabel={filterLabel}
          onChangeText={setSearchQuery}
          onFilterPress={() => setIsFilterVisible(true)}
          placeholder="Tenant, unit, property, or lease"
          resultLabel={formatSearchResultLabel({
            filteredCount: visibleLeases.length,
            isLoading,
            singular: "lease",
            totalCount: leases.length,
          })}
          value={searchQuery}
        />

        {isLoading ? (
          <ModuleLoadingState
            description="Syncing contracts, tenants, and property records."
            title="Loading leases"
          />
        ) : (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl
                colors={[colors.secondary]}
                onRefresh={refresh}
                refreshing={isRefreshing}
                tintColor={colors.secondary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-4 pb-8">
              {visibleLeases.map((lease) => {
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

              {visibleLeases.length === 0 ? (
                <ModuleEmptyState
                  description={
                    searchQuery.trim() || activeFilterCount
                      ? "Change the search or filters to see more leases."
                      : "Create a lease once a property and tenant are available."
                  }
                  icon="document-text-outline"
                  title={
                    searchQuery.trim() || activeFilterCount
                      ? "No matching leases"
                      : "No leases found"
                  }
                />
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>

      <LeaseFilterSheet
        filters={filters}
        lessees={lessees}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setIsFilterVisible(false);
        }}
        onClose={() => setIsFilterVisible(false)}
        properties={properties}
        visible={isFilterVisible}
      />

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
            <View className="flex-row items-center justify-between rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3.5">
              <Text className="font-ralewayExtraBold text-xs uppercase tracking-wider text-secondary">
                Calculated End Date
              </Text>
              <Text className="font-ralewayBold text-sm text-textPrimary">
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
          <DateTimePickerModal
            mode="date"
            onClose={closeStartDatePicker}
            onConfirm={handleStartDateConfirm}
            title="Select Start Date"
            value={parseLeaseDateValue(form.startDate)}
          />
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

      <ScreenSnackbar
        message={leaseSnackbar.message}
        onDismiss={leaseSnackbar.dismiss}
      />
    </Screen>
  );
}
