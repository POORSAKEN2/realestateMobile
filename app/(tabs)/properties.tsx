import { useAccess } from "../../hooks/auth/useAccess";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { PropertyCard } from "../../components/properties/PropertyCard";
import { getPropertyManageActions } from "../../components/properties/getPropertyManageActions";
import { PropertyCoreFields } from "../../components/properties/PropertyCoreFields";
import { PropertyDetailsModal } from "../../components/properties/PropertyDetailsModal";
import { OwnerForm } from "../../components/owners/OwnerForm";
import { PropertyDocumentsField } from "../../components/properties/PropertyDocumentsField";
import { PropertyImagesField } from "../../components/properties/PropertyImagesField";
import {
  PropertyListMessage,
  PropertyListSkeleton,
} from "../../components/properties/PropertyListState";
import { PropertyListToolbar } from "../../components/properties/PropertyListToolbar";
import { AddEditModal } from "../../components/ui/AddEditModal";
import {
  ActionSheet,
  type ActionSheetItem,
} from "../../components/ui/ActionSheet";
import { Screen } from "../../components/ui/Screen";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useProperties } from "../../hooks/api/useProperties";
import { usePropertyFormController } from "../../hooks/properties/usePropertyFormController";
import { useAuth } from "../../hooks/useAuth";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { Property } from "../../types";
import {
  getPropertyTypeChoices,
  MAX_PROPERTY_IMAGES,
  StatusFilter,
  suggestedLocations,
} from "../../utils/properties/propertyForm";
import AddButton from "../../components/ui/buttons/AddButton";
import { appRoutes } from "../../constants/navigation";
import { DeletionImpactSheet } from "../../components/governance/DeletionImpactSheet";
import {
  useDeletionGovernance,
  useRestoreGovernedRecord,
} from "../../hooks/useDeletionGovernance";

type PropertyListItem =
  | { kind: "property"; property: Property }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" };

export default function PropertiesScreen() {
  const { session } = useAuth();
  const { can, access } = useAccess();
  const accessToken = session?.accessToken;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [archiveState, setArchiveState] = useState<"active" | "archived">(
    "active",
  );
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [managedProperty, setManagedProperty] = useState<{
    property: Property;
    actions: ActionSheetItem[];
  } | null>(null);

  const { useList } = useProperties(accessToken);
  const {
    data: properties = [],
    isError,
    isLoading,
    refetch,
    error,
  } = useList({ archiveState });
  const propertySnackbar = useSnackbar();
  const governance = useDeletionGovernance(() =>
    propertySnackbar.show("Property archived."),
  );
  const restoreMutation = useRestoreGovernedRecord(() =>
    propertySnackbar.show("Property restored."),
  );
  const propertyForm = usePropertyFormController(accessToken, {
    onSaved: (_property, operation) =>
      propertySnackbar.show(
        operation === "created" ? "Property added." : "Property updated.",
      ),
  });
  const {
    closeForm,
    editingProperty,
    existingPropertyDocuments,
    form,
    formError,
    isFormVisible,
    isLoadingExistingDocuments,
    isLoadingPropertyOwners,
    isSaving,
    openCreateForm: openForm,
    openEditForm,
    pickDocuments,
    pickImages: pickImage,
    propertyOwnerChoices,
    propertyOwnersError,
    publishingBlocked,
    publishingQuotaLabel,
    removeDocument,
    removeImage,
    selectedDocuments,
    selectedImages,
    storageRemainingLabel,
    selectSuggestedLocation: selectLocation,
    submitForm: handleSubmit,
    updateClassification,
    updateCoordinates,
    updateForm,
  } = propertyForm;

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return properties.filter((property) => {
      const statusMatches =
        statusFilter === "ALL" || property.status === statusFilter;
      const searchMatches =
        !query ||
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query);

      return statusMatches && searchMatches;
    });
  }, [properties, searchQuery, statusFilter]);
  const propertyListItems = useMemo<PropertyListItem[]>(() => {
    if (isLoading) return [{ kind: "loading" }];
    if (isError) return [{ kind: "error" }];

    const propertyItems = filteredProperties.map((property) => ({
      kind: "property" as const,
      property,
    }));

    return propertyItems.length > 0
      ? propertyItems
      : [{ kind: "empty" as const }];
  }, [filteredProperties, isError, isLoading]);

  const filteredLocationSuggestions = useMemo(() => {
    const query = form.location.trim().toLowerCase();

    if (!query) return suggestedLocations.slice(0, 5);

    return suggestedLocations
      .filter((location) => location.toLowerCase().includes(query))
      .slice(0, 5);
  }, [form.location]);
  const propertyTypeChoices = useMemo(
    () => getPropertyTypeChoices(form.classification),
    [form.classification],
  );

  async function refreshProperties() {
    await refetch();
  }

  return (
    <Screen bottomInset="tab-bar" className="bg-surface">
      <View className="flex-1">
        <View className="px-1 pb-5">
          <ModuleHeader
            action={
              archiveState === "active" ? (
                <AddButton
                  permission="properties.create"
                  iconOnly
                  title="Add property"
                  onPress={openForm}
                />
              ) : undefined
            }
            eyebrow="Portfolio Intelligence"
            title="Properties"
          />
        </View>

        {access.role === "ADMIN" ? (
          <View className="mb-4 flex-row items-center gap-2">
            <View className="min-w-0 flex-1 flex-row rounded-2xl bg-primary/10 p-1">
              {(["active", "archived"] as const).map((state) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: archiveState === state }}
                  className={`min-h-11 flex-1 items-center justify-center rounded-xl ${archiveState === state ? "bg-panel" : ""}`}
                  key={state}
                  onPress={() => setArchiveState(state)}
                >
                  <Text className="font-ralewayBold text-sm capitalize text-textPrimary">
                    {state}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              accessibilityLabel="Manage property owners"
              accessibilityRole="button"
              activeOpacity={0.8}
              className="h-12 items-center justify-center rounded-2xl border border-primary/25 bg-panel px-3"
              onPress={() => router.push(appRoutes.secondary.propertyOwners)}
            >
              <Text className="font-ralewayBold text-sm text-primary">
                Owners
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="z-10 pb-4">
          <PropertyListToolbar
            onChangeSearch={setSearchQuery}
            onChangeStatus={setStatusFilter}
            resultLabel={
              isLoading
                ? "Loading properties"
                : isError
                  ? "Properties unavailable"
                  : `${filteredProperties.length} ${
                      filteredProperties.length === 1
                        ? "property"
                        : "properties"
                    }`
            }
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        </View>

        <PullToRefreshFlatList
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          data={propertyListItems}
          ItemSeparatorComponent={() => <View className="h-4" />}
          keyExtractor={(item) =>
            item.kind === "property" ? item.property.id : item.kind
          }
          renderItem={({ item }) => {
            if (item.kind === "loading") {
              return (
                <View className="gap-4">
                  <PropertyListSkeleton />
                  <PropertyListSkeleton />
                </View>
              );
            }

            if (item.kind === "error") {
              return (
                <PropertyListMessage
                  actionLabel="Try again"
                  description={
                    error?.message ??
                    "Properties could not be loaded. Check your connection and retry."
                  }
                  icon="cloud-alert-outline"
                  onAction={refetch}
                  title="Unable to load properties"
                />
              );
            }

            if (item.kind === "empty") {
              const isFiltered =
                Boolean(searchQuery.trim()) || statusFilter !== "ALL";

              return (
                <PropertyListMessage
                  actionLabel={
                    isFiltered
                      ? "Clear filters"
                      : can("properties.create")
                        ? "Add property"
                        : undefined
                  }
                  description={
                    isFiltered
                      ? "Change your search or reset filters to see more results."
                      : archiveState === "archived"
                        ? "Archived properties appear here and can be restored by an administrator."
                        : access.role === "MANAGER"
                          ? "No assigned properties are available. Ask your account owner to review your access."
                          : "Add your first property to start tracking portfolio performance."
                  }
                  icon={
                    isFiltered ? "home-search-outline" : "home-plus-outline"
                  }
                  onAction={
                    isFiltered
                      ? () => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                        }
                      : archiveState === "active" && can("properties.create")
                        ? openForm
                        : undefined
                  }
                  title={
                    isFiltered ? "No matching properties" : "No properties yet"
                  }
                />
              );
            }

            const property = item.property;
            const actions = getPropertyManageActions(property, can, {
              onBedspaces: () =>
                router.push({
                  pathname: appRoutes.secondary.bedspaces,
                  params: {
                    propertyId: property.id,
                    propertyTitle: property.title,
                  },
                }),
              onFloorPlans: () =>
                router.push({
                  pathname: appRoutes.secondary.floorPlans,
                  params: {
                    propertyId: property.id,
                    propertyTitle: property.title,
                    propertyType: property.type,
                  },
                }),
              onBookings: () =>
                router.push({
                  pathname: appRoutes.secondary.bookings,
                  params: { propertyId: property.id },
                }),
              onEdit: () => openEditForm(property),
              onArchive: () =>
                governance.open({
                  resource: "properties",
                  id: property.id,
                  label: property.title,
                }),
              onRestore: () =>
                restoreMutation.mutate({
                  resource: "properties",
                  id: property.id,
                }),
            });
            return (
              <PropertyCard
                property={property}
                onOpenDetails={() => setSelectedProperty(property)}
                onManage={
                  actions.length
                    ? () => setManagedProperty({ property, actions })
                    : undefined
                }
              />
            );
          }}
          onRefresh={refreshProperties}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <PropertyDetailsModal
        accessToken={accessToken}
        onClose={() => setSelectedProperty(null)}
        onPropertyUpdated={setSelectedProperty}
        property={selectedProperty}
      />

      <ActionSheet
        actions={managedProperty?.actions ?? []}
        grouped
        onClose={() => setManagedProperty(null)}
        subtitle={managedProperty?.property.title}
        title="Manage property"
        visible={Boolean(managedProperty)}
      />

      <DeletionImpactSheet
        error={governance.error}
        impact={governance.impact}
        isLoading={governance.isLoading}
        isPending={governance.isPending}
        label={governance.target?.label}
        onClose={governance.close}
        onConfirm={governance.confirm}
        onRetry={() => void governance.refetch()}
        visible={Boolean(governance.target)}
      />

      <AddEditModal
        permission={editingProperty ? "properties.update" : "properties.create"}
        propertyId={editingProperty?.id}
        appearance="card"
        isVisible={isFormVisible}
        onClose={() => {
          if (!isSavingOwner) {
            setIsAddingOwner(false);
            closeForm();
          }
        }}
        title={editingProperty ? "Edit property" : "Add a property"}
        subtitle={
          editingProperty
            ? "Update this portfolio asset."
            : "Create a portfolio asset."
        }
        isPending={isSaving}
        submitText={editingProperty ? "Save Property" : "Create Property"}
        onSubmit={handleSubmit}
        formError={formError}
        showCancelAction
        showSubmitAction={!isAddingOwner}
      >
        <PropertyCoreFields
          form={form}
          locationSuggestions={filteredLocationSuggestions}
          onClassificationChange={updateClassification}
          onCoordinatesChange={updateCoordinates}
          onSelectSuggestedLocation={selectLocation}
          onUpdate={updateForm}
          propertyOwnerChoices={propertyOwnerChoices}
          propertyOwnersError={propertyOwnersError}
          propertyOwnersLoading={isLoadingPropertyOwners}
          publishingBlocked={publishingBlocked}
          publishingQuotaLabel={publishingQuotaLabel}
          propertyTypeChoices={propertyTypeChoices}
          statusEditable={!editingProperty}
          onAddOwner={isAddingOwner ? undefined : () => setIsAddingOwner(true)}
          ownerForm={
            isAddingOwner && access.role === "ADMIN" ? (
              <OwnerForm
                onBusyChange={setIsSavingOwner}
                onCancel={() => setIsAddingOwner(false)}
                onSaved={(owner) => {
                  updateForm("ownerId", owner.id);
                  setIsAddingOwner(false);
                }}
              />
            ) : undefined
          }
        />

        <PropertyImagesField
          images={selectedImages}
          maxImages={MAX_PROPERTY_IMAGES}
          onPick={pickImage}
          onRemove={removeImage}
          storageHint={storageRemainingLabel}
        />

        <PropertyDocumentsField
          documents={selectedDocuments}
          existingDocuments={existingPropertyDocuments}
          isEditing={Boolean(editingProperty)}
          isLoadingExistingDocuments={isLoadingExistingDocuments}
          onPick={pickDocuments}
          onRemove={removeDocument}
          storageHint={storageRemainingLabel}
        />
      </AddEditModal>

      <ScreenSnackbar
        message={propertySnackbar.message}
        onDismiss={propertySnackbar.dismiss}
      />
    </Screen>
  );
}
