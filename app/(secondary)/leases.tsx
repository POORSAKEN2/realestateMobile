import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { PullToRefreshScrollView } from "../../components/ui/PullToRefreshScrollView";
import { Screen } from "../../components/ui/Screen";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../components/ui/ModuleState";
import { TenantDetailsModal } from "../../components/tenants/TenantDetailsModal";
import { LeaseCard } from "../../components/leases/LeaseCard";
import { LeaseEditModeFields } from "../../components/leases/LeaseEditModeFields";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { ChoiceField } from "../../components/ui/fields/ChoiceField";
import { DateTimePickerModal } from "../../components/ui/fields/DateTimePickerModal";
import { PickerField } from "../../components/ui/fields/PickerField";
import { DropdownField } from "../../components/ui/fields/DropdownField";
import { FormSection } from "../../components/ui/forms/FormSection";
import AddButton from "../../components/ui/buttons/AddButton";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { OverviewMetricCard } from "../../components/ui/OverviewMetricCard";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
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
import { renewLease } from "../../api/leases";
import { LeaseRenewalModal } from "../../components/leases/LeaseRenewalModal";
import { useQueryClient } from "@tanstack/react-query";
import type { Lease } from "../../types";

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
    bedspaceOptions,
    bedspaces,
    bedspacesQuery,
    changeEditMode,
    closeAmendmentDatePicker,
    closeForm,
    closeStartDatePicker,
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
    isLoading,
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
  const queryClient = useQueryClient();
  const [renewingLease, setRenewingLease] = useState<Lease | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  async function handleRenewSubmit(
    leaseId: string,
    payload: {
      end_date?: string;
      term_length_months?: number;
      monthly_rent?: number;
    },
  ) {
    setIsRenewing(true);
    try {
      await renewLease(leaseId, payload);
      await queryClient.invalidateQueries({ queryKey: ["leases"] });
      setRenewingLease(null);
      leaseSnackbar.show("Lease renewed successfully.");
    } finally {
      setIsRenewing(false);
    }
  }

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
            action={<AddButton permission="leases.create" onPress={() => openCreateForm()} />}
            eyebrow="Operations"
            leading={
              <SecondaryBackButton
                accessibilityLabel="Back from leases"
                variant="secondary"
              />
            }
            title="Leases"
          />
        </View>

        <OverviewMetricCard
          icon="cash-outline"
          isLoading={isLoading}
          label="Monthly revenue"
          layout="split"
          metrics={[
            {
              detail: `${activeLeaseCount} active`,
              icon: "document-text",
              label: "Total lease files",
              value: String(leases.length),
            },
            {
              detail: `${Math.round(activeLeasePercentage)}%`,
              icon: "checkmark-circle",
              label: "Active leases",
              progress: activeLeasePercentage,
              value: `${activeLeaseCount} of ${leases.length}`,
            },
          ]}
          supportingText="Combined monthly rent across all lease files."
          value={formatCurrency(monthlyRevenue)}
        />

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
          <PullToRefreshScrollView
            className="flex-1"
            onRefresh={refresh}
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
                    onRenew={() => setRenewingLease(lease)}
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
          </PullToRefreshScrollView>
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

      <AddEditModal permission={editingLease ? "leases.update" : "leases.create"} propertyId={form.propertyId || undefined}
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
        {editingLease ? (
          <FormSection
            description="Choose whether this update corrects a typo or changes the contract terms."
            icon="file-edit-outline"
            title="Lease update"
            variant="card"
          >
            <LeaseEditModeFields
              amendmentDateLabel={formatLeaseDateLabel(form.amendmentDate)}
              form={form}
              onChangeMode={changeEditMode}
              onChangeReason={(reason) => updateForm("amendmentReason", reason)}
              onOpenAmendmentDate={openAmendmentDatePicker}
            />
          </FormSection>
        ) : null}

        <FormSection
          description="Choose the property and tenant connected by this lease."
          icon="account-switch-outline"
          title="Lease parties"
          variant="card"
        >
          <ChoiceField
            emptyText="Create a property first before adding leases."
            label="Property"
            onChange={(value) => selectProperty(value as string)}
            options={propertyOptions}
            value={form.propertyId}
            variant="filled"
          />
          <DropdownField
            disabled={!form.propertyId || roomsQuery.isLoading}
            label="Room"
            onSelect={selectRoom}
            options={roomOptions}
            placeholder={roomsQuery.isLoading ? "Loading rooms" : "Select room"}
            subtitle="Choose a room before assigning an individual bedspace."
            value={form.roomId}
            variant="filled"
          />
          {form.roomId ? (
            bedspacesQuery.isLoading ? (
              <View className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <Text className="font-ralewayBold text-sm text-textPrimary">
                  Loading rental inventory
                </Text>
                <Text className="mt-1 text-xs leading-5 text-description">
                  Checking whole-room and individual bedspace availability.
                </Text>
              </View>
            ) : bedspaceOptions.length ? (
              <DropdownField
                label="Rental scope"
                onSelect={selectBedspace}
                options={bedspaceOptions}
                placeholder="Whole room or bedspace"
                subtitle="Whole-room leases block all bedspaces for overlapping dates."
                value={form.bedspaceId}
                variant="filled"
              />
            ) : (
              <View className="rounded-2xl border border-warning/25 bg-warningSurface p-4">
                <Text className="font-ralewayBold text-sm text-warning">
                  No leaseable inventory
                </Text>
                <Text className="mt-1 text-xs leading-5 text-warning">
                  This room contains maintenance inventory. Update its bedspaces
                  before creating a whole-room lease.
                </Text>
              </View>
            )
          ) : null}
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
          {editingLease && form.editMode === "typo" ? (
            <View className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3.5">
              <Text className="font-ralewaySemiBold text-xs leading-5 text-description">
                Contract dates and monthly rent stay locked for typo fixes.
                Select Amend Contract to update those terms.
              </Text>
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <PickerField
              className="min-w-0 flex-1 gap-2"
              disabled={Boolean(editingLease && form.editMode === "typo")}
              label="Start Date"
              value={formatLeaseDateLabel(form.startDate)}
              placeholder="Select date"
              onPress={openStartDatePicker}
              variant="filled"
            />
            <BaseField
              className="min-w-0 flex-1 gap-2"
              editable={!editingLease || form.editMode === "amendment"}
              keyboardType="number-pad"
              label="Duration (Months)"
              onChangeText={(value) =>
                updateForm("durationMonths", value.replace(/\D/g, ""))
              }
              placeholder="12"
              value={form.durationMonths}
              variant="filled"
              wrapperClassName={
                editingLease && form.editMode === "typo" ? "opacity-60" : ""
              }
            />
          </View>

          {form.startDate && Number(form.durationMonths) >= 1 ? (
            <View className="flex-row items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3.5">
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
            editable={!editingLease || form.editMode === "amendment"}
            keyboardType="decimal-pad"
            label="Monthly Rent"
            onChangeText={(value) =>
              updateForm("monthlyRent", cleanNumber(value))
            }
            placeholder="0"
            value={form.monthlyRent}
            variant="filled"
            wrapperClassName={
              editingLease && form.editMode === "typo" ? "opacity-60" : ""
            }
          />
          {!form.roomId ? (
            <BaseField
              label="Room label"
              onChangeText={(value) => updateForm("roomNumber", value)}
              placeholder="Optional legacy room reference"
              value={form.roomNumber}
              variant="filled"
            />
          ) : form.bedspaceId ? (
            <View className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3.5">
              <Text className="font-ralewayBold text-xs uppercase tracking-wider text-secondary">
                Assigned bedspace
              </Text>
              <Text className="mt-1 font-ralewaySemiBold text-sm text-textPrimary">
                {bedspaces.find((item) => item.id === form.bedspaceId)
                  ?.bedspaceNumber ?? "Loading assignment"}
              </Text>
            </View>
          ) : null}
          <ChoiceField
            label="Status"
            onChange={(value) => updateForm("status", value as string)}
            options={statusOptions}
            value={form.status}
            variant="segmented"
          />
        </FormSection>

        {isAmendmentDatePickerOpen ? (
          <DateTimePickerModal
            mode="date"
            onClose={closeAmendmentDatePicker}
            onConfirm={handleAmendmentDateConfirm}
            title="Select Amendment Date"
            value={parseLeaseDateValue(form.amendmentDate)}
          />
        ) : null}

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

      <LeaseRenewalModal
        isPending={isRenewing}
        isVisible={Boolean(renewingLease)}
        lease={renewingLease}
        onClose={() => setRenewingLease(null)}
        onSubmit={handleRenewSubmit}
      />

      <TenantDetailsModal
        leases={
          selectedTenant
            ? leases.filter((lease) => lease.lesseeId === selectedTenant.id)
            : []
        }
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
