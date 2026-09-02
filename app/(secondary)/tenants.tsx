import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Screen, type ScreenBottomInset } from "../../components/ui/Screen";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import { TenantDetailsModal } from "../../components/tenants/TenantDetailsModal";
import { TenantCard } from "../../components/tenants/TenantCard";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { FormSection } from "../../components/ui/forms/FormSection";
import AddButton from "../../components/ui/buttons/AddButton";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { OverviewMetricCard } from "../../components/ui/OverviewMetricCard";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import {
  SkeletonBlock,
  SkeletonGroup,
  SkeletonList,
} from "../../components/ui/Skeleton";
import {
  formatSearchResultLabel,
  SearchToolbar,
} from "../../components/ui/SearchToolbar";
import {
  EMPTY_TENANT_FILTERS,
  getTenantFilterLabel,
  TenantFilterSheet,
  type TenantFilters,
} from "../../components/tenants/TenantFilterSheet";
import { formatCurrency } from "../../utils/formatters";
import { useTenantManagement } from "../../hooks/tenants/useTenantManagement";
import { useSnackbar } from "../../hooks/useSnackbar";
import { colors } from "../../constants/colors";

type TenantsScreenProps = {
  bottomInset?: ScreenBottomInset;
  showBackButton?: boolean;
};

function TenantCardSkeleton() {
  return (
    <View className="rounded-3xl border border-primary/20 bg-white p-5 shadow-sm shadow-primary/10">
      <View className="flex-row items-start gap-3.5">
        <SkeletonBlock className="h-12 w-12 rounded-full bg-primary/10" />
        <View className="min-w-0 flex-1 gap-2 pt-1">
          <SkeletonBlock className="h-5 w-3/5 bg-primary/15" />
          <SkeletonBlock className="h-3 w-4/5" />
        </View>
        <SkeletonBlock className="h-9 w-20 rounded-full bg-primary/10" />
      </View>

      <SkeletonBlock className="my-4 h-px w-full bg-primary/10" />

      <View className="flex-row gap-5">
        <View className="flex-1 gap-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-6 w-28 bg-primary/15" />
        </View>
        <SkeletonBlock className="h-10 w-px bg-primary/10" />
        <View className="flex-1 gap-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-full" />
        </View>
      </View>
    </View>
  );
}

function TenantLoadingState() {
  return (
    <SkeletonGroup accessibilityLabel="Loading tenant dashboard">
      <View className="mt-6 flex-row gap-3">
        <View className="min-h-[248px] flex-1 items-start justify-between overflow-hidden rounded-2xl border border-primary/25 bg-secondary p-4 shadow-sm shadow-secondary/25">
          <View className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/10" />
          <View className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-primary/25" />
          <SkeletonBlock className="h-14 w-14 rounded-2xl bg-accent/20" />
          <View className="w-full gap-3">
            <SkeletonBlock className="h-3 w-24 bg-accent/25" />
            <SkeletonBlock className="h-9 w-4/5 bg-white/30" />
            <SkeletonBlock className="h-12 w-full rounded-xl bg-accent/10" />
          </View>
        </View>

        <View className="flex-1 gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <View
              className="min-h-0 flex-1 justify-center rounded-2xl border border-textPrimary/10 bg-white p-3 shadow-sm shadow-textPrimary/10"
              key={index}
            >
              <View className="flex-row items-center gap-2">
                <SkeletonBlock className="h-8 w-8 rounded-full bg-primary/10" />
                <SkeletonBlock className="h-3 flex-1" />
              </View>
              <SkeletonBlock className="mt-2 h-5 w-3/4 bg-primary/15" />
              <SkeletonBlock className="mt-1 h-2.5 w-1/2" />
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6 rounded-3xl border border-primary/20 bg-white p-3 shadow-sm shadow-primary/10">
        <View className="flex-row gap-2">
          <SkeletonBlock className="h-12 flex-1 rounded-2xl" />
          <SkeletonBlock className="h-12 w-12 rounded-2xl bg-primary/10" />
        </View>
        <View className="mt-3 flex-row items-center justify-between px-1">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-3 w-20" />
        </View>
      </View>

      <View className="mt-6 gap-4">
        <SkeletonList count={3} renderItem={() => <TenantCardSkeleton />} />
      </View>
    </SkeletonGroup>
  );
}

export function TenantsScreen({
  bottomInset,
  showBackButton = true,
}: TenantsScreenProps) {
  const tenantSnackbar = useSnackbar();
  const [filters, setFilters] = useState<TenantFilters>(EMPTY_TENANT_FILTERS);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
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
    isRefreshing,
    leases,
    linkedTenantCount,
    linkedTenantPercentage,
    openCreateForm,
    openEditForm,
    properties,
    refresh,
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
  } = useTenantManagement({
    onSaved: (operation) =>
      tenantSnackbar.show(
        operation === "created" ? "Tenant added." : "Tenant updated.",
      ),
  });
  const visibleTenants = useMemo(
    () =>
      filteredTenants.filter((tenant) => {
        const isLinked = leases.some((lease) => lease.lesseeId === tenant.id);
        const matchesLinkage =
          filters.linkage === "ALL" ||
          (filters.linkage === "LINKED" ? isLinked : !isLinked);
        const matchesProperty =
          filters.propertyId === "ALL" ||
          leases.some(
            (lease) =>
              lease.lesseeId === tenant.id &&
              lease.propertyId === filters.propertyId,
          );
        return matchesLinkage && matchesProperty;
      }),
    [filteredTenants, filters, leases],
  );
  const activeFilterCount = [
    filters.linkage !== "ALL",
    filters.propertyId !== "ALL",
  ].filter(Boolean).length;
  const filterLabel = getTenantFilterLabel(filters);
  const selectedTenantLeases = selectedTenant
    ? getTenantLeases(selectedTenant.id)
    : [];
  const selectedTenantMonthlyRent = selectedTenantLeases.reduce(
    (sum, lease) => sum + lease.monthlyRent,
    0,
  );

  return (
    <Screen bottomInset={bottomInset} className="bg-surface">
      <View className="px-1">
        <ModuleHeader
          action={<AddButton onPress={openCreateForm} />}
          eyebrow="Operations"
          leading={
            showBackButton ? (
              <SecondaryBackButton
                accessibilityLabel="Back from tenants"
                variant="secondary"
              />
            ) : undefined
          }
          title="Tenants"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: bottomInset === "tab-bar" ? 116 : 32,
        }}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={refresh}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <TenantLoadingState />
        ) : (
          <View className="mt-6 gap-6">
            <OverviewMetricCard
              icon="cash-outline"
              isLoading={false}
              label="Monthly revenue"
              layout="split"
              metrics={[
                {
                  detail: `${linkedTenantCount} linked`,
                  icon: "people",
                  label: "Total capacity",
                  value: String(tenants.length),
                },
                {
                  detail: `${Math.round(linkedTenantPercentage)}%`,
                  icon: "link",
                  label: "Linked Tenants",
                  progress: linkedTenantPercentage,
                  value: `${linkedTenantCount} of ${tenants.length}`,
                },
              ]}
              supportingText="Combined monthly rent from linked leases."
              value={formatCurrency(tenantMonthlyRent)}
            />

            <SearchToolbar
              accessibilityLabel="Search tenants"
              activeFilterCount={activeFilterCount}
              clearAccessibilityLabel="Clear tenant search"
              filterAccessibilityLabel={`Filter tenants, ${filterLabel}`}
              filterLabel={filterLabel}
              onChangeText={setSearchQuery}
              onFilterPress={() => setIsFilterVisible(true)}
              placeholder="Name, email, phone, or unit"
              resultLabel={formatSearchResultLabel({
                filteredCount: visibleTenants.length,
                singular: "tenant",
                totalCount: tenants.length,
              })}
              value={searchQuery}
            />

            <View className="gap-4">
              {visibleTenants.map((tenant) => {
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

              {visibleTenants.length === 0 ? (
                <ModuleEmptyState
                  description={
                    searchQuery.trim() || activeFilterCount
                      ? "Change the search or filters to see more tenants."
                      : "Add a tenant profile to start linking leases."
                  }
                  icon="people-outline"
                  title={
                    searchQuery.trim() || activeFilterCount
                      ? "No matching tenants"
                      : "No tenants found"
                  }
                />
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      <TenantFilterSheet
        filters={filters}
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
        leases={selectedTenantLeases}
        linkedLeaseCount={
          selectedTenant ? selectedTenantLeases.length : undefined
        }
        monthlyRent={selectedTenant ? selectedTenantMonthlyRent : undefined}
        onClose={() => setSelectedTenant(null)}
        propertyNames={
          selectedTenant ? getLinkedProperties(selectedTenant.id) : []
        }
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

      <ScreenSnackbar
        message={tenantSnackbar.message}
        onDismiss={tenantSnackbar.dismiss}
      />
    </Screen>
  );
}

export default TenantsScreen;
