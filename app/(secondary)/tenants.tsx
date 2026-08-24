import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Screen, type ScreenBottomInset } from "../../components/ui/Screen";
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
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { OverviewMetricCard } from "../../components/ui/OverviewMetricCard";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
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
      <View className="flex-1 gap-6">
        {/* --- TOP HEADER: Title & Global Action --- */}
        <View className="px-1">
          <ModuleHeader
            action={<AddButton onPress={openCreateForm} />}
            eyebrow="CRM Dashboard"
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

        <OverviewMetricCard
          icon="cash-outline"
          isLoading={isLoading}
          label="Monthly revenue"
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
            isLoading,
            singular: "tenant",
            totalCount: tenants.length,
          })}
          value={searchQuery}
        />

        {isLoading ? (
          <ModuleLoadingState
            description="Organizing tenant profiles and linked lease activity."
            title="Loading tenants"
          />
        ) : (
          <ScrollView
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
            <View className="gap-4 pb-8">
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
          </ScrollView>
        )}
      </View>

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
