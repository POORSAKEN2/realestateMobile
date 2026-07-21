import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { PropertyCard } from "../../components/properties/PropertyCard";
import { PropertyCoreFields } from "../../components/properties/PropertyCoreFields";
import { PropertyDocumentsField } from "../../components/properties/PropertyDocumentsField";
import { PropertyImagesField } from "../../components/properties/PropertyImagesField";
import {
  PropertyListMessage,
  PropertyListSkeleton,
} from "../../components/properties/PropertyListState";
import { PropertyListToolbar } from "../../components/properties/PropertyListToolbar";
import { PropertyPortfolioSummary } from "../../components/properties/PropertyPortfolioSummary";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { Screen } from "../../components/ui/Screen";
import { useProperties } from "../../hooks/api/useProperties";
import { usePropertyFormController } from "../../hooks/properties/usePropertyFormController";
import { useAuth } from "../../hooks/useAuth";
import type { Property } from "../../types";
import {
  getPropertyTypeChoices,
  MAX_PROPERTY_IMAGES,
  StatusFilter,
  suggestedLocations,
} from "../../utils/properties/propertyForm";
import AddButton from "../../components/ui/buttons/AddButton";

type PropertyListItem =
  | { kind: "search" }
  | { kind: "property"; property: Property }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" };

export default function PropertiesScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { useList } = useProperties();
  const { data: properties = [], isError, isLoading, refetch } = useList();
  const propertyForm = usePropertyFormController(accessToken);
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
    if (isLoading) return [{ kind: "search" }, { kind: "loading" }];
    if (isError) return [{ kind: "search" }, { kind: "error" }];

    const propertyItems = filteredProperties.map((property) => ({
      kind: "property" as const,
      property,
    }));

    return [
      { kind: "search" },
      ...(propertyItems.length > 0
        ? propertyItems
        : [{ kind: "empty" as const }]),
    ];
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

  const portfolioValue = useMemo(
    () => properties.reduce((sum, property) => sum + property.value, 0),
    [properties],
  );
  const averageRoi = useMemo(() => {
    if (properties.length === 0) return 0;

    const totalRoi = properties.reduce(
      (sum, property) => sum + property.roi,
      0,
    );
    return totalRoi / properties.length;
  }, [properties]);
  const revenueGeneratingCount = useMemo(
    () =>
      properties.filter((property) => property.status === "REVENUE_GENERATING")
        .length,
    [properties],
  );
  return (
    <Screen className="bg-[#F5F7FC]">
      <View className="flex-1">
        <FlatList
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
          data={propertyListItems}
          ItemSeparatorComponent={() => <View className="h-4" />}
          keyExtractor={(item) =>
            item.kind === "property" ? item.property.id : item.kind
          }
          ListHeaderComponent={
            <View className="gap-5 pb-5">
              <View className="flex-row items-center justify-between px-1">
                <View className="min-w-0 flex-1 pr-4">
                  <Text className="text-xs font-semibold text-slate-600">
                    Asset management
                  </Text>
                  <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
                    Properties
                  </Text>
                </View>

                <AddButton title="Add" onPress={openForm} />
              </View>

              <PropertyPortfolioSummary
                averageRoi={averageRoi}
                portfolioValue={portfolioValue}
                propertyCount={properties.length}
                revenueGeneratingCount={revenueGeneratingCount}
                state={isLoading ? "loading" : isError ? "error" : "ready"}
              />
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === "search") {
              return (
                <View className="z-10 bg-white pb-3 shadow-[#000000] drop-shadow-md">
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
              );
            }

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
                  description="Properties could not be loaded. Check your connection and retry."
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
                  actionLabel={isFiltered ? "Clear filters" : "Add property"}
                  description={
                    isFiltered
                      ? "Change your search or reset filters to see more results."
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
                      : openForm
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
                onOpenBookings={
                  item.property.isTransientBookable
                    ? () =>
                        router.push({
                          pathname: "/(tabs)/bookings",
                          params: { propertyId: item.property.id },
                        })
                    : undefined
                }
              />
            );
          }}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
        />
      </View>

      <AddEditModal
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
    </Screen>
  );
}
