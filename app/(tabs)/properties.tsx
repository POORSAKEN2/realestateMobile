import { useAccess } from "../../hooks/auth/useAccess";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { PropertyCard } from "../../components/properties/PropertyCard";
import { PropertyCoreFields } from "../../components/properties/PropertyCoreFields";
import { PropertyDetailsModal } from "../../components/properties/PropertyDetailsModal";
import { PropertyDocumentsField } from "../../components/properties/PropertyDocumentsField";
import { PropertyImagesField } from "../../components/properties/PropertyImagesField";
import {
  PropertyListMessage,
  PropertyListSkeleton,
} from "../../components/properties/PropertyListState";
import { PropertyListToolbar } from "../../components/properties/PropertyListToolbar";
import { AddEditModal } from "../../components/ui/AddEditModal";
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );

  const { useList } = useProperties(accessToken);
  const { data: properties = [], isError, isLoading, refetch, error } = useList();
  const propertySnackbar = useSnackbar();
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
    isSaving,
    openCreateForm: openForm,
    openEditForm,
    pickDocuments,
    pickImages: pickImage,
    removeDocument,
    removeImage,
    selectedDocuments,
    selectedImages,
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
            action={<AddButton permission="properties.create" title="Add" onPress={openForm} />}
            eyebrow="Portfolio Intelligence"
            title="Properties"
          />
        </View>

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
                  description={error?.message ?? "Properties could not be loaded. Check your connection and retry."}
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
                  actionLabel={isFiltered ? "Clear filters" : can("properties.create") ? "Add property" : undefined}
                  description={
                    isFiltered
                      ? "Change your search or reset filters to see more results."
                      : access.role === "MANAGER" ? "No assigned properties are available. Ask your account owner to review your access." : "Add your first property to start tracking portfolio performance."
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
                      : can("properties.create") ? openForm : undefined
                  }
                  title={
                    isFiltered ? "No matching properties" : "No properties yet"
                  }
                />
              );
            }

            return (
              <PropertyCard
                property={item.property}
                onEdit={() => openEditForm(item.property)}
                onOpenDetails={() => setSelectedProperty(item.property)}
                onOpenBedspaces={() =>
                  router.push({
                    pathname: appRoutes.secondary.bedspaces,
                    params: {
                      propertyId: item.property.id,
                      propertyTitle: item.property.title,
                    },
                  })
                }
                onOpenFloorPlans={() =>
                  router.push({
                    pathname: appRoutes.secondary.floorPlans,
                    params: {
                      propertyId: item.property.id,
                      propertyTitle: item.property.title,
                      propertyType: item.property.type,
                    },
                  })
                }
                onOpenBookings={
                  item.property.isTransientBookable
                    ? () =>
                        router.push({
                          pathname: appRoutes.secondary.bookings,
                          params: { propertyId: item.property.id },
                        })
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
        property={selectedProperty}
      />

      <AddEditModal permission={editingProperty ? "properties.update" : "properties.create"} propertyId={editingProperty?.id}
        appearance="card"
        isVisible={isFormVisible}
        onClose={closeForm}
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
      >
        <PropertyCoreFields
          form={form}
          locationSuggestions={filteredLocationSuggestions}
          onClassificationChange={updateClassification}
          onCoordinatesChange={updateCoordinates}
          onSelectSuggestedLocation={selectLocation}
          onUpdate={updateForm}
          propertyTypeChoices={propertyTypeChoices}
        />

        <PropertyImagesField
          images={selectedImages}
          maxImages={MAX_PROPERTY_IMAGES}
          onPick={pickImage}
          onRemove={removeImage}
        />

        <PropertyDocumentsField
          documents={selectedDocuments}
          existingDocuments={existingPropertyDocuments}
          isEditing={Boolean(editingProperty)}
          isLoadingExistingDocuments={isLoadingExistingDocuments}
          onPick={pickDocuments}
          onRemove={removeDocument}
        />
      </AddEditModal>

      <ScreenSnackbar
        message={propertySnackbar.message}
        onDismiss={propertySnackbar.dismiss}
      />
    </Screen>
  );
}
