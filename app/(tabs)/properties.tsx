import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  fetchDocuments,
  uploadPropertyDocuments,
} from "../../api/propertyDetails";
import { LocationPinPicker } from "../../components/properties/LocationPinPicker";
import { PropertyCard } from "../../components/properties/PropertyCard";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { ChoiceGroup } from "../../components/ui/groups/ChoiceGroup";
import { BaseField } from "../../components/ui/fields/BaseField";
import { DropdownField } from "../../components/ui/fields/DropdownField";
import { Screen } from "../../components/ui/Screen";
import { useProperties, propertyFetchers } from "../../hooks/api/useProperties";
import { useAuth } from "../../hooks/useAuth";
import type {
  CreatePropertyPayload,
  Property,
  UpdatePropertyPayload,
} from "../../types";
import {
  cleanDecimal,
  cleanInteger,
  emptyForm,
  formatPeso,
  formatSelectedDocumentSize,
  getDocumentType,
  getPropertyTypeChoices,
  locationCoordinates,
  MAX_PROPERTY_IMAGES,
  openPropertyDocument,
  parseInteger,
  parseNumber,
  propertyStatusChoices,
  propertyClassificationChoices,
  requiresBedroomAndBathroomCounts,
  seaCountryChoices,
  SelectedDocument,
  SelectedImage,
  statusFilterChoices,
  StatusFilter,
  suggestedLocations,
  toFormState,
  toSelectedImage,
  type FormState,
} from "../../utils/properties/propertyForm";
import AddButton from "../../components/ui/buttons/AddButton";

type PropertyListItem =
  | { kind: "search" }
  | { kind: "property"; property: Property }
  | { kind: "empty" };

type PropertyFormPayload = CreatePropertyPayload | UpdatePropertyPayload;

const MAX_PROPERTY_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_PROPERTY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
  const queryClient = useQueryClient();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<
    SelectedDocument[]
  >([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { useList, useCreate, useUpdate } = useProperties();
  const { data: properties = [], isLoading } = useList();
  const {
    data: existingPropertyDocuments = [],
    isLoading: isLoadingExistingDocuments,
  } = useQuery({
    queryKey: ["documents", accessToken, editingProperty?.id],
    queryFn: () =>
      fetchDocuments(accessToken, { propertyId: editingProperty?.id }),
    enabled: Boolean(accessToken && editingProperty?.id && isFormVisible),
  });

  const submitLockRef = useRef(false);

  const saveMutation = useMutation({
    mutationFn: async (payload: PropertyFormPayload) => {
      const property = editingProperty
        ? await propertyFetchers.update({ id: editingProperty.id, payload })
        : await propertyFetchers.create(payload as CreatePropertyPayload);

      if (selectedDocuments.length > 0) {
        await uploadPropertyDocuments(
          property.id,
          selectedDocuments,
          accessToken,
        );
      }

      return property;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({
        queryKey: ["transientBookablePropertyIds"],
      });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      closeForm();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Failed to save property.",
      );
    },
  });

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

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openForm() {
    setForm(emptyForm);
    setSelectedImages([]);
    setSelectedDocuments([]);
    setFormError("");
    setEditingProperty(null);
    setIsFormVisible(true);
  }

  function openEditForm(property: Property) {
    setForm(toFormState(property));
    setSelectedImages([]);
    setSelectedDocuments([]);
    setFormError("");
    setEditingProperty(property);
    setIsFormVisible(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setSelectedImages([]);
    setSelectedDocuments([]);
    setFormError("");
    setEditingProperty(null);
    setIsFormVisible(false);
  }

  function selectLocation(location: string) {
    const coordinates = locationCoordinates[location];

    setForm((current) => ({
      ...current,
      location,
      country: "Philippines",
      lat: coordinates ? String(coordinates.lat) : current.lat,
      lng: coordinates ? String(coordinates.lng) : current.lng,
    }));
  }

  async function pickImage() {
    if (saveMutation.isPending) return;
    setFormError("");

    if (selectedImages.length >= MAX_PROPERTY_IMAGES) {
      setFormError(
        `You can upload up to ${MAX_PROPERTY_IMAGES} property images.`,
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError("Photo library permission is required to add an image.");
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    try {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ["images"],
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 0.85,
        selectionLimit: MAX_PROPERTY_IMAGES - selectedImages.length,
      });
    } catch {
      setFormError("Photo library could not open. Please try again.");
      return;
    }

    if (result.canceled || !result.assets?.length) return;

    const invalidImage = result.assets.find((asset) => {
      const type = asset.mimeType?.toLowerCase();
      return (
        !type ||
        !SUPPORTED_PROPERTY_IMAGE_TYPES.has(type) ||
        (asset.fileSize ?? 0) > MAX_PROPERTY_IMAGE_SIZE
      );
    });

    if (invalidImage) {
      setFormError("Choose JPG, PNG, or WEBP images smaller than 5 MB.");
      return;
    }

    const pickedImages = result.assets.map(toSelectedImage);

    setSelectedImages((current) => {
      const existingUris = new Set(current.map((image) => image.uri));
      const newImages = pickedImages.filter(
        (image) => !existingUris.has(image.uri),
      );
      const nextImages = [...current, ...newImages].slice(
        0,
        MAX_PROPERTY_IMAGES,
      );

      if (current.length + newImages.length > MAX_PROPERTY_IMAGES) {
        setFormError(
          `Only ${MAX_PROPERTY_IMAGES} property images can be uploaded.`,
        );
      }

      return nextImages;
    });
  }

  function removeImage(index: number) {
    if (saveMutation.isPending) return;
    setSelectedImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  async function pickDocuments() {
    if (saveMutation.isPending) return;
    setFormError("");

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ],
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const pickedDocuments = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      type: getDocumentType(asset),
      size: asset.size,
      file: asset.file,
    }));

    setSelectedDocuments((current) => {
      const existingKeys = new Set(
        current.map((document) => `${document.name}:${document.size ?? ""}`),
      );
      const newDocuments = pickedDocuments.filter((document) => {
        const key = `${document.name}:${document.size ?? ""}`;
        return !existingKeys.has(key);
      });

      return [...current, ...newDocuments];
    });
  }

  function removeDocument(index: number) {
    if (saveMutation.isPending) return;
    setSelectedDocuments((current) =>
      current.filter((_, documentIndex) => documentIndex !== index),
    );
  }

  function handleSubmit() {
    setFormError("");

    // isPending only updates on re-render, so a rapid double-tap can pass it
    // twice; the ref closes that window (double create + racing uploads).
    if (saveMutation.isPending || submitLockRef.current) return;

    if (!accessToken) {
      setFormError("Please log in before creating a property.");
      return;
    }

    const title = form.title.trim();
    const location = form.location.trim();
    const country = form.country.trim();
    const value = parseNumber(form.value);
    const roi = parseNumber(form.roi);
    const lat = parseNumber(form.lat);
    const lng = parseNumber(form.lng);
    const occupancy = parseNumber(form.occupancy);
    const bedrooms = parseInteger(form.bedrooms);
    const bathrooms = parseInteger(form.bathrooms);

    if (!title || !location || !country) {
      setFormError("Property title, location, and country are required.");
      return;
    }

    if (value === undefined || value < 0) {
      setFormError("Market value must be a valid number of 0 or greater.");
      return;
    }

    if (roi === undefined) {
      setFormError("Expected ROI must be a valid number.");
      return;
    }

    if (lat === undefined || lng === undefined) {
      setFormError(
        "Latitude and longitude are required. Select a suggested location or enter valid coordinates.",
      );
      return;
    }

    if (
      form.occupancy.trim() &&
      (occupancy === undefined || occupancy < 0 || occupancy > 100)
    ) {
      setFormError("Occupancy must be a valid percentage from 0 to 100.");
      return;
    }

    if (
      requiresBedroomAndBathroomCounts(form.classification, form.type) &&
      bedrooms === undefined
    ) {
      setFormError("Bedrooms must be a non-negative whole number.");
      return;
    }

    if (
      requiresBedroomAndBathroomCounts(form.classification, form.type) &&
      bathrooms === undefined
    ) {
      setFormError("Bathrooms must be a non-negative whole number.");
      return;
    }

    const payload: PropertyFormPayload = {
      title,
      location,
      country,
      status: form.status,
      classification: form.classification,
      type: form.type,
      value,
      roi,
      lat,
      lng,
      is_transient_bookable: form.isTransientBookable,
    };

    if (selectedImages.length > 0) payload.images = selectedImages;

    const area = form.area.trim();
    const description = form.description.trim();

    if (occupancy !== undefined) payload.occupancy = occupancy;
    if (area) payload.area = area;
    if (description) payload.description = description;

    if (requiresBedroomAndBathroomCounts(form.classification, form.type)) {
      payload.bedrooms = bedrooms;
      payload.bathrooms = bathrooms;
    }

    submitLockRef.current = true;
    saveMutation.mutate(payload, {
      onSettled: () => {
        submitLockRef.current = false;
      },
    });
  }

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
        isPending={saveMutation.isPending}
        submitText={editingProperty ? "Save Property" : "Create Property"}
        onSubmit={handleSubmit}
        formError={formError}
      >
        <BaseField
          label="Property Title"
          onChangeText={(value) => updateForm("title", value)}
          placeholder="e.g. The Shard"
          value={form.title}
          required
        />

        <BaseField
          label="Location"
          onChangeText={(value) => updateForm("location", value)}
          placeholder="City, area, or address"
          value={form.location}
          required
        />

        <View className="flex-row flex-wrap gap-2">
          {filteredLocationSuggestions.map((location) => (
            <TouchableOpacity
              key={location}
              activeOpacity={0.8}
              className="rounded-full border border-[#1d1d1f]/10 bg-[#FFFFFF] px-3.5 py-2.5 shadow-sm"
              onPress={() => selectLocation(location)}
            >
              <Text className="text-xs font-bold text-[#2563EB]">
                {location}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <DropdownField
          label="Country"
          subtitle="Southeast Asia"
          placeholder="Select a country"
          value={form.country}
          options={seaCountryChoices}
          onSelect={(value) => updateForm("country", value)}
        />

        <LocationPinPicker
          lat={form.lat}
          lng={form.lng}
          onChange={(coordinates) =>
            setForm((current) => ({
              ...current,
              lat: coordinates.lat,
              lng: coordinates.lng,
            }))
          }
        />

        <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
          <ChoiceGroup
            choices={propertyStatusChoices}
            label="Property Status"
            onSelect={(value) => updateForm("status", value)}
            value={form.status}
          />
        </View>

        <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
          <ChoiceGroup
            choices={propertyClassificationChoices}
            label="Property Classification"
            onSelect={(classification) => {
              const [type] = getPropertyTypeChoices(classification);
              setForm((current) => ({
                ...current,
                classification,
                type: type.value,
              }));
            }}
            value={form.classification}
          />
        </View>

        <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
          <ChoiceGroup
            choices={propertyTypeChoices}
            label="Property Type"
            onSelect={(value) => updateForm("type", value)}
            value={form.type}
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <BaseField
              keyboardType="decimal-pad"
              label="Market Value"
              onChangeText={(value) => updateForm("value", cleanDecimal(value))}
              placeholder="0"
              value={form.value}
            />
          </View>
          <View className="w-28">
            <BaseField
              keyboardType="decimal-pad"
              label="ROI %"
              onChangeText={(value) => updateForm("roi", cleanDecimal(value))}
              placeholder="0"
              value={form.roi}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <BaseField
              keyboardType="numbers-and-punctuation"
              label="Latitude"
              onChangeText={(value) =>
                updateForm("lat", cleanDecimal(value, true))
              }
              placeholder="0"
              value={form.lat}
              required
            />
          </View>
          <View className="flex-1">
            <BaseField
              keyboardType="numbers-and-punctuation"
              label="Longitude"
              onChangeText={(value) =>
                updateForm("lng", cleanDecimal(value, true))
              }
              placeholder="0"
              value={form.lng}
              required
            />
          </View>
        </View>

        {requiresBedroomAndBathroomCounts(form.classification, form.type) ? (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <BaseField
                keyboardType="numeric"
                label="Bedrooms"
                onChangeText={(value) =>
                  updateForm("bedrooms", cleanInteger(value))
                }
                value={form.bedrooms}
              />
            </View>
            <View className="flex-1">
              <BaseField
                keyboardType="numeric"
                label="Bathrooms"
                onChangeText={(value) =>
                  updateForm("bathrooms", cleanInteger(value))
                }
                value={form.bathrooms}
              />
            </View>
          </View>
        ) : null}

        <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/5">
                <MaterialCommunityIcons
                  name="calendar-clock"
                  color="#2563EB"
                  size={22}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1d1d1f]">
                  Transient Booking Enabled
                </Text>
                <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
                  Allow short-term reservations for this property.
                </Text>
              </View>
            </View>
            <Switch
              onValueChange={(value) =>
                updateForm("isTransientBookable", value)
              }
              thumbColor="#FFFFFF"
              trackColor={{ false: "#6F6D6D", true: "#2563EB" }}
              value={form.isTransientBookable}
            />
          </View>
        </View>

        <BaseField
          keyboardType="decimal-pad"
          label="Occupancy %"
          onChangeText={(value) => updateForm("occupancy", cleanDecimal(value))}
          placeholder="Optional"
          value={form.occupancy}
        />

        <BaseField
          label="Area"
          onChangeText={(value) => updateForm("area", value)}
          placeholder="Optional"
          value={form.area}
        />

        <BaseField
          label="Description"
          multiline
          onChangeText={(value) => updateForm("description", value)}
          placeholder="Optional notes"
          value={form.description}
        />

        {/* Property Images Section */}
        <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/5">
                <MaterialCommunityIcons
                  name="image-outline"
                  color="#2563EB"
                  size={22}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1d1d1f]">
                  Property Images
                </Text>
                <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
                  JPG, PNG, or WEBP. Upload up to {MAX_PROPERTY_IMAGES}.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              className="rounded-full bg-[#2563EB] px-4 py-2.5"
              onPress={pickImage}
            >
              <Text className="text-xs font-bold text-[#FFFFFF]">
                {selectedImages.length ? "Add" : "Choose"}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedImages.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            >
              {selectedImages.map((image, index) => (
                <View
                  className="w-64 overflow-hidden rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5"
                  key={`${image.uri}:${index}`}
                >
                  <Image
                    className="h-40 w-full"
                    resizeMode="cover"
                    source={{ uri: image.uri }}
                  />
                  <View className="flex-row items-center justify-between gap-3 p-3">
                    <Text
                      className="flex-1 text-xs font-semibold text-[#1d1d1f]"
                      numberOfLines={1}
                    >
                      {index + 1}. {image.name}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF]"
                      onPress={() => removeImage(index)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        color="#6F6D6D"
                        size={17}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Property Documents Section */}
        <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/5">
                <MaterialCommunityIcons
                  name="file-document-outline"
                  color="#2563EB"
                  size={22}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1d1d1f]">
                  Property Documents
                </Text>
                <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
                  PDF, DOC, DOCX, JPG, or PNG files.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              className="rounded-full bg-[#2563EB] px-4 py-2.5"
              onPress={pickDocuments}
            >
              <Text className="text-xs font-bold text-[#FFFFFF]">
                {selectedDocuments.length > 0 ? "Add More" : "Choose"}
              </Text>
            </TouchableOpacity>
          </View>

          {editingProperty && (
            <View className="rounded-2xl bg-[#2563EB]/5 px-3 py-2">
              <Text className="text-xs leading-5 text-[#6F6D6D]">
                Existing documents stay attached. Add files here to upload more
                documents to this property.
              </Text>
            </View>
          )}

          {editingProperty && (
            <View className="gap-2">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                Attached Documents
              </Text>
              {isLoadingExistingDocuments ? (
                <View className="h-14 justify-center rounded-2xl bg-[#2563EB]/5 px-3">
                  <ActivityIndicator color="#2563EB" />
                </View>
              ) : existingPropertyDocuments.length > 0 ? (
                existingPropertyDocuments.map((document) => (
                  <TouchableOpacity
                    key={document.id}
                    activeOpacity={0.8}
                    className="flex-row items-center gap-3 rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 p-3"
                    onPress={() => openPropertyDocument(document)}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFFFFF]">
                      <MaterialCommunityIcons
                        name="file-eye-outline"
                        color="#2563EB"
                        size={18}
                      />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text
                        className="text-xs font-bold text-[#1d1d1f]"
                        numberOfLines={1}
                      >
                        {document.name}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-[#6F6D6D]">
                        {document.category} | {document.size}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="open-in-new"
                      color={document.url ? "#6F6D6D" : "#C8C8C8"}
                      size={17}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View className="rounded-2xl border border-dashed border-[#1d1d1f]/15 bg-[#2563EB]/5 px-3 py-4">
                  <Text className="text-center text-xs font-semibold text-[#6F6D6D]">
                    No documents attached yet.
                  </Text>
                </View>
              )}
            </View>
          )}

          {selectedDocuments.length > 0 && (
            <View className="gap-2">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                New Uploads
              </Text>
              {selectedDocuments.map((document, index) => (
                <View
                  key={`${document.name}-${document.size ?? index}`}
                  className="flex-row items-center gap-3 rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 p-3"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFFFFF]">
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      color="#2563EB"
                      size={18}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      className="text-xs font-bold text-[#1d1d1f]"
                      numberOfLines={1}
                    >
                      {document.name}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-[#6F6D6D]">
                      {formatSelectedDocumentSize(document.size)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF]"
                    onPress={() => removeDocument(index)}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      color="#6F6D6D"
                      size={17}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </AddEditModal>
    </Screen>
  );
}
