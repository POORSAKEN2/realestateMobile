import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";

import { PropertyCard } from "../../components/properties/PropertyCard";
import { PropertyCoreFields } from "../../components/properties/PropertyCoreFields";
import { PropertyDocumentsField } from "../../components/properties/PropertyDocumentsField";
import { PropertyImagesField } from "../../components/properties/PropertyImagesField";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { ChoiceGroup } from "../../components/ui/groups/ChoiceGroup";
import { Screen } from "../../components/ui/Screen";
import { useProperties } from "../../hooks/api/useProperties";
import { usePropertyFormController } from "../../hooks/properties/usePropertyFormController";
import { useAuth } from "../../hooks/useAuth";
import type { Property } from "../../types";
import {
  formatPeso,
  getPropertyTypeChoices,
  MAX_PROPERTY_IMAGES,
  statusFilterChoices,
  StatusFilter,
  suggestedLocations,
} from "../../utils/properties/propertyForm";
import AddButton from "../../components/ui/buttons/AddButton";

type PropertyListItem =
  | { kind: "search" }
  | { kind: "property"; property: Property }
  | { kind: "empty" };

function LoadingState({ label }: { label: string }) {
  return (
    <View className="flex-1 justify-center rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-6 shadow-sm">
      <View className="items-center">
        <ActivityIndicator color="#2563EB" />
        <Text className="mt-3 text-sm font-semibold text-[#1d1d1f]">
          {label}
        </Text>
        <Text className="mt-1 text-center text-xs leading-5 text-[#6F6D6D]">
          Preparing your real estate portfolio workspace.
        </Text>
      </View>
    </View>
  );
}

export default function PropertiesScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { useList } = useProperties();
  const { data: properties = [], isLoading } = useList();
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
  }, [filteredProperties]);

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
  const revenueGeneratingPercentage =
    properties.length === 0
      ? 0
      : (revenueGeneratingCount / properties.length) * 100;

  return (
    <Screen className="bg-[#2563EB]/5">
      <View className="flex-1">
        {isLoading ? (
          <LoadingState label="Loading properties" />
        ) : (
          <FlatList
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
            data={propertyListItems}
            ItemSeparatorComponent={() => <View className="h-4" />}
            keyExtractor={(item) =>
              item.kind === "property" ? item.property.id : item.kind
            }
            ListHeaderComponent={
              <View className="gap-6 pb-6">
                {/* --- HEADER SECTION: Brand & Quick Action --- */}
                <View className="flex-row items-center justify-between px-1">
                  <View>
                    <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
                      Asset Management
                    </Text>
                    <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
                      Properties
                    </Text>
                  </View>

                  <AddButton onPress={openForm} />
                </View>

                {/* --- MAIN PORTFOLIO CARD: The "Hero" Data --- */}
                <View className="overflow-hidden rounded-[32px] bg-[#1d1d1f] p-6 shadow-xl shadow-slate-900/20">
                  {/* Background Decorative Element (Optional) */}
                  <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />

                  <View className="flex-row items-start justify-between">
                    <View>
                      <Text className="text-xs font-medium uppercase tracking-widest text-white/60">
                        Total Portfolio Value
                      </Text>
                      <Text className="mt-2 font-soraSemiBold text-4xl text-white">
                        {formatPeso(portfolioValue)}
                      </Text>
                    </View>
                    <View className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1">
                      <Text className="text-[10px] font-bold text-emerald-400">
                        +{averageRoi.toFixed(1)}% YIELD
                      </Text>
                    </View>
                  </View>

                  {/* Integrated Health Bar */}
                  <View className="mt-8">
                    <View className="mb-2 flex-row items-end justify-between">
                      <Text className="text-xs font-medium text-white/60">
                        Revenue Generating Assets
                      </Text>
                      <Text className="text-xs font-bold text-white">
                        {revenueGeneratingCount} / {properties.length}
                      </Text>
                    </View>
                    <View className="h-2 w-full flex-row gap-1">
                      <View
                        className="h-full rounded-l-full bg-[#2563EB]"
                        style={{ width: `${revenueGeneratingPercentage}%` }}
                      />
                      <View
                        className="h-full rounded-r-full bg-white/10"
                        style={{
                          width: `${100 - revenueGeneratingPercentage}%`,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* --- QUICK METRICS: Assets & Distribution --- */}
                <View className="flex-row gap-4">
                  <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                      <MaterialCommunityIcons
                        name="domain"
                        color="#2563EB"
                        size={20}
                      />
                    </View>
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total Assets
                      </Text>
                      <Text className="font-soraSemiBold text-lg text-[#1d1d1f]">
                        {properties.length}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                      <MaterialCommunityIcons
                        name="chart-donut"
                        color="#2563EB"
                        size={20}
                      />
                    </View>
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Avg. ROI
                      </Text>
                      <Text className="font-soraSemiBold text-lg text-[#1d1d1f]">
                        {averageRoi.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              if (item.kind === "search") {
                return (
                  <View className=" bg-white pb-1">
                    <View className="gap-3 rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-3 shadow-sm">
                      <View className="h-14 flex-row items-center rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 px-4">
                        <MaterialCommunityIcons
                          name="magnify"
                          color="#2563EB"
                          size={21}
                        />
                        <TextInput
                          className="ml-2 flex-1 text-base text-[#1d1d1f]"
                          onChangeText={setSearchQuery}
                          placeholder="Search properties"
                          placeholderTextColor="#6F6D6D"
                          value={searchQuery}
                        />
                      </View>

                      <ChoiceGroup
                        choices={statusFilterChoices}
                        horizontal
                        onSelect={setStatusFilter}
                        value={statusFilter}
                      />
                    </View>
                  </View>
                );
              }

              if (item.kind === "empty") {
                return (
                  <View className="items-center rounded-[28px] border border-dashed border-[#1d1d1f]/20 bg-[#FFFFFF]/95 p-8 shadow-sm">
                    <MaterialCommunityIcons
                      name="home-search-outline"
                      color="#2563EB"
                      size={38}
                    />
                    <Text className="mt-3 text-base font-bold text-[#1d1d1f]">
                      No properties found
                    </Text>
                    <Text className="mt-1 text-center text-sm leading-5 text-[#6F6D6D]">
                      Try another search or create a new property.
                    </Text>
                  </View>
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
        )}
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
