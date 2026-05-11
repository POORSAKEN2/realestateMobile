import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";

import {
  createProperty,
  fetchProperties,
  type CreatePropertyPayload,
  type Property,
} from "../../api/properties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";

type PropertyType = NonNullable<Property["type"]>;
type StatusFilter = Property["status"] | "ALL";

type FormState = {
  title: string;
  location: string;
  country: string;
  status: Property["status"];
  type: PropertyType;
  value: string;
  roi: string;
  occupancy: string;
  bedrooms: string;
  bathrooms: string;
  lat: string;
  lng: string;
  area: string;
  description: string;
  isTransientBookable: boolean;
};

type Choice<T extends string> = {
  label: string;
  value: T;
};

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

const propertyStatusChoices: Choice<Property["status"]>[] = [
  { label: "Idle", value: "IDLE" },
  { label: "Under Construction", value: "UNDER_CONSTRUCTION" },
  { label: "Pre Leased", value: "PRE_LEASED" },
  { label: "Revenue Generating", value: "REVENUE_GENERATING" },
  { label: "Personal Use", value: "PERSONAL_USE" },
];

const propertyTypeChoices: Choice<PropertyType>[] = [
  { label: "Residential", value: "Residential" },
  { label: "Condominium", value: "Condominium" },
  { label: "Commercial", value: "Commercial" },
  { label: "Industrial", value: "Industrial" },
  { label: "Retail", value: "Retail" },
];

const statusFilterChoices: Choice<StatusFilter>[] = [
  { label: "All", value: "ALL" },
  ...propertyStatusChoices.map((choice) => ({
    label: formatStatus(choice.value),
    value: choice.value,
  })),
];

const suggestedLocations = [
  "Makati City, Metro Manila",
  "Taguig City, Metro Manila (BGC)",
  "Quezon City, Metro Manila",
  "Cebu City, Cebu",
  "Davao City, Davao del Sur",
  "Pasig City, Metro Manila",
  "Mandaluyong City, Metro Manila",
  "Paranaque City, Metro Manila",
  "Alabang, Muntinlupa City",
  "Baguio City, Benguet",
  "Angeles City, Pampanga",
  "Iloilo City, Iloilo",
  "Bacoor City, Cavite",
  "Santa Rosa, Laguna",
];

const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  "Makati City, Metro Manila": { lat: 14.5547, lng: 121.0244 },
  "Taguig City, Metro Manila (BGC)": { lat: 14.5505, lng: 121.0488 },
  "Quezon City, Metro Manila": { lat: 14.676, lng: 121.0437 },
  "Cebu City, Cebu": { lat: 10.3157, lng: 123.8854 },
  "Davao City, Davao del Sur": { lat: 7.1907, lng: 125.4553 },
  "Pasig City, Metro Manila": { lat: 14.5764, lng: 121.0851 },
  "Mandaluyong City, Metro Manila": { lat: 14.5794, lng: 121.0359 },
  "Paranaque City, Metro Manila": { lat: 14.4793, lng: 121.0198 },
  "Alabang, Muntinlupa City": { lat: 14.423, lng: 121.0386 },
  "Baguio City, Benguet": { lat: 16.4023, lng: 120.596 },
  "Angeles City, Pampanga": { lat: 15.145, lng: 120.5887 },
  "Iloilo City, Iloilo": { lat: 10.7202, lng: 122.5621 },
  "Bacoor City, Cavite": { lat: 14.459, lng: 120.929 },
  "Santa Rosa, Laguna": { lat: 14.2843, lng: 121.0889 },
};

const emptyForm: FormState = {
  title: "",
  location: "",
  country: "Philippines",
  status: "IDLE",
  type: "Residential",
  value: "",
  roi: "",
  occupancy: "",
  bedrooms: "2",
  bathrooms: "1",
  lat: "",
  lng: "",
  area: "",
  description: "",
  isTransientBookable: false,
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPeso(value = 0) {
  if (value >= 1_000_000_000)
    return `PHP ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  return `PHP ${value.toLocaleString()}`;
}

function isResidential(type: PropertyType) {
  return type === "Residential" || type === "Condominium";
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseInteger(value: string) {
  const parsed = parseNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}

function cleanDecimal(value: string, allowNegative = false) {
  let cleaned = value.replace(/[^\d.,-]/g, "");

  cleaned = allowNegative
    ? cleaned.replace(/(?!^)-/g, "")
    : cleaned.replace(/-/g, "");

  const [firstPart, ...otherParts] = cleaned.split(".");
  return [firstPart, otherParts.join("")].filter(Boolean).join(".");
}

function cleanInteger(value: string) {
  return value.replace(/\D/g, "");
}

function getImageName(asset: ImagePicker.ImagePickerAsset) {
  if (asset.fileName) return asset.fileName;

  const [nameFromUri] = asset.uri.split("/").slice(-1);
  return nameFromUri || `property-${Date.now()}.jpg`;
}

function getImageType(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType) return asset.mimeType;
  if (asset.uri.toLowerCase().endsWith(".png")) return "image/png";
  if (asset.uri.toLowerCase().endsWith(".webp")) return "image/webp";

  return "image/jpeg";
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  multiline?: boolean;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-teal-900/70">
        {label}
      </Text>
      <TextInput
        className={`rounded-2xl border border-teal-900/10 bg-white px-4 text-base text-zinc-950 shadow-sm ${
          multiline ? "min-h-28 py-4" : "h-14"
        }`}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

function ChoiceGroup<T extends string>({
  label,
  choices,
  value,
  onSelect,
  horizontal = false,
}: {
  label?: string;
  choices: Choice<T>[];
  value: T;
  onSelect: (value: T) => void;
  horizontal?: boolean;
}) {
  const content = (
    <View className="flex-row flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = choice.value === value;

        return (
          <TouchableOpacity
            key={choice.value}
            activeOpacity={0.8}
            className={`rounded-full border px-3.5 py-2.5 ${
              selected
                ? "border-teal-700 bg-teal-700"
                : "border-teal-900/10 bg-teal-50/70"
            }`}
            onPress={() => onSelect(choice.value)}
          >
            <Text
              className={`text-xs font-semibold ${
                selected ? "text-white" : "text-zinc-700"
              }`}
            >
              {choice.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View className={label ? "gap-3" : ""}>
      {label ? (
        <Text className="text-[11px] font-bold uppercase tracking-wide text-teal-900/70">
          {label}
        </Text>
      ) : null}
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="pr-6">{content}</View>
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

function PropertyCard({ property }: { property: Property }) {
  console.log(property.image)
  return (
    <View className="overflow-hidden rounded-[28px] border border-teal-900/10 bg-white shadow-sm">
      <View>
        <Image
          className="h-44 w-full bg-teal-50"
          resizeMode="cover"
          source={{ uri: property.image }}
           onError={(error) => {
    console.log("Image load error:", error.nativeEvent);
  }}
        />
        <View className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1.5">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-teal-900">
            {property.type ?? "Property"}
          </Text>
        </View>
        <View className="absolute bottom-4 right-4 rounded-full bg-teal-950/85 px-3 py-1.5">
          <Text className="text-[11px] font-bold text-white">
            {property.roi.toFixed(1)}% ROI
          </Text>
        </View>
      </View>

      <View className="gap-4 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1.5">
            <Text className="text-xl font-bold text-zinc-950">
              {property.title}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="map-marker-outline"
                color="#0F766E"
                size={15}
              />
              <Text className="flex-1 text-sm font-medium text-zinc-500">
                {property.location}
              </Text>
            </View>
          </View>
          <View className="rounded-full bg-sky-50 px-3 py-1.5">
            <Text className="text-[11px] font-bold text-sky-700">
              {formatStatus(property.status)}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl bg-teal-50 p-3.5">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name="cash-multiple"
              color="#0F766E"
              size={16}
            />
            <Text className="text-[11px] font-bold uppercase tracking-wide text-teal-900/70">
              Value
            </Text>
          </View>
          <Text className="mt-2 text-base font-bold text-teal-950">
            {formatPeso(property.value)}
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          {property.bedrooms !== undefined ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5">
              <MaterialCommunityIcons
                name="bed-king-outline"
                color="#52525B"
                size={15}
              />
              <Text className="text-xs font-bold text-zinc-600">
                {property.bedrooms} bed
              </Text>
            </View>
          ) : null}
          {property.bathrooms !== undefined ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5">
              <MaterialCommunityIcons name="shower" color="#52525B" size={15} />
              <Text className="text-xs font-bold text-zinc-600">
                {property.bathrooms} bath
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function PropertiesScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", accessToken],
    queryFn: () => fetchProperties(accessToken),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePropertyPayload) =>
      createProperty(payload, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      closeForm();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Failed to create property.",
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

  const filteredLocationSuggestions = useMemo(() => {
    const query = form.location.trim().toLowerCase();

    if (!query) return suggestedLocations.slice(0, 5);

    return suggestedLocations
      .filter((location) => location.toLowerCase().includes(query))
      .slice(0, 5);
  }, [form.location]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openForm() {
    setForm(emptyForm);
    setSelectedImage(null);
    setFormError("");
    setIsFormVisible(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setSelectedImage(null);
    setFormError("");
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
    setFormError("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError("Photo library permission is required to add an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];

    setSelectedImage({
      uri: asset.uri,
      name: getImageName(asset),
      type: getImageType(asset),
      file: asset.file,
    });
  }

  function handleSubmit() {
    setFormError("");

    if (createMutation.isPending) return;

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

    if (isResidential(form.type) && bedrooms === undefined) {
      setFormError("Bedrooms must be a non-negative whole number.");
      return;
    }

    if (isResidential(form.type) && bathrooms === undefined) {
      setFormError("Bathrooms must be a non-negative whole number.");
      return;
    }

    const payload: CreatePropertyPayload = {
      title,
      location,
      country,
      status: form.status,
      type: form.type,
      value,
      roi,
      lat,
      lng,
      is_transient_bookable: form.isTransientBookable,
    };

    if (selectedImage) payload.image = selectedImage;

    const area = form.area.trim();
    const description = form.description.trim();

    if (occupancy !== undefined) payload.occupancy = occupancy;
    if (area) payload.area = area;
    if (description) payload.description = description;

    if (isResidential(form.type)) {
      payload.bedrooms = bedrooms;
      payload.bathrooms = bathrooms;
    }

    createMutation.mutate(payload);
  }

  return (
    <Screen className="bg-teal-50">
      <View className="flex-1 gap-5">
        <View className="overflow-hidden rounded-[32px] bg-teal-900 p-5 shadow-sm">
          <View className="absolute -right-16 -top-12 h-36 w-36 rounded-full bg-teal-500/25" />
          <View className="absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-sky-400/20" />
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <MaterialCommunityIcons
                    name="office-building-marker-outline"
                    color="#CCFBF1"
                    size={18}
                  />
                </View>
                <Text className="text-xs font-bold uppercase tracking-wide text-teal-100/80">
                  Portfolio
                </Text>
              </View>
              <Text className="text-3xl font-bold text-white">Properties</Text>
              <Text className="mt-2 text-sm leading-5 text-teal-50/80">
                Manage {properties.length} portfolio assets across locations,
                yields, and property types.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 w-14 items-center justify-center rounded-2xl bg-white"
              onPress={openForm}
            >
              <MaterialCommunityIcons name="plus" color="#0F766E" size={25} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-3 rounded-[28px] border border-teal-900/10 bg-white/90 p-3 shadow-sm">
          <View className="h-14 flex-row items-center rounded-2xl border border-teal-900/10 bg-teal-50/70 px-4">
            <MaterialCommunityIcons name="magnify" color="#0F766E" size={21} />
            <TextInput
              className="ml-2 flex-1 text-base text-zinc-950"
              onChangeText={setSearchQuery}
              placeholder="Search properties"
              placeholderTextColor="#A1A1AA"
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

        {isLoading ? (
          <View className="flex-1 items-center justify-center rounded-[28px] border border-teal-900/10 bg-white/80">
            <ActivityIndicator color="#0F766E" />
            <Text className="mt-3 text-sm font-medium text-teal-900/70">
              Loading properties
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-8">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}

              {filteredProperties.length === 0 ? (
                <View className="items-center rounded-[28px] border border-dashed border-teal-900/20 bg-white/90 p-8 shadow-sm">
                  <MaterialCommunityIcons
                    name="home-search-outline"
                    color="#0F766E"
                    size={38}
                  />
                  <Text className="mt-3 text-base font-bold text-zinc-900">
                    No properties found
                  </Text>
                  <Text className="mt-1 text-center text-sm leading-5 text-zinc-500">
                    Try another search or create a new property.
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>

      <Modal
        animationType="slide"
        onRequestClose={closeForm}
        presentationStyle="fullScreen"
        visible={isFormVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-teal-50"
        >
          <View className="bg-teal-900 px-6 pb-5 pt-6">
            <View className="absolute -right-12 -top-16 h-32 w-32 rounded-full bg-teal-500/25" />
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-white">
                  Add Property
                </Text>
                <Text className="mt-1 text-sm text-teal-50/80">
                  Create a portfolio asset.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
                onPress={closeForm}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#FFFFFF"
                  size={22}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-5 px-6 py-6"
            keyboardShouldPersistTaps="handled"
          >
            <Field
              label="Property Title"
              onChangeText={(value) => updateForm("title", value)}
              placeholder="e.g. The Shard"
              value={form.title}
            />

            <Field
              label="Location"
              onChangeText={(value) => updateForm("location", value)}
              placeholder="City, area, or address"
              value={form.location}
            />

            <View className="flex-row flex-wrap gap-2">
              {filteredLocationSuggestions.map((location) => (
                <TouchableOpacity
                  key={location}
                  activeOpacity={0.8}
                  className="rounded-full border border-teal-900/10 bg-white px-3.5 py-2.5 shadow-sm"
                  onPress={() => selectLocation(location)}
                >
                  <Text className="text-xs font-bold text-teal-900">
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field
              label="Country"
              onChangeText={(value) => updateForm("country", value)}
              value={form.country}
            />

            <View className="gap-4 rounded-3xl border border-teal-900/10 bg-white/90 p-4 shadow-sm">
              <ChoiceGroup
                choices={propertyStatusChoices}
                label="Property Status"
                onSelect={(value) => updateForm("status", value)}
                value={form.status}
              />
            </View>

            <View className="gap-4 rounded-3xl border border-teal-900/10 bg-white/90 p-4 shadow-sm">
              <ChoiceGroup
                choices={propertyTypeChoices}
                label="Property Type"
                onSelect={(value) => updateForm("type", value)}
                value={form.type}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  keyboardType="decimal-pad"
                  label="Market Value"
                  onChangeText={(value) =>
                    updateForm("value", cleanDecimal(value))
                  }
                  placeholder="0"
                  value={form.value}
                />
              </View>
              <View className="w-28">
                <Field
                  keyboardType="decimal-pad"
                  label="ROI %"
                  onChangeText={(value) =>
                    updateForm("roi", cleanDecimal(value))
                  }
                  placeholder="0"
                  value={form.roi}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  keyboardType="numbers-and-punctuation"
                  label="Latitude"
                  onChangeText={(value) =>
                    updateForm("lat", cleanDecimal(value, true))
                  }
                  placeholder="0"
                  value={form.lat}
                />
              </View>
              <View className="flex-1">
                <Field
                  keyboardType="numbers-and-punctuation"
                  label="Longitude"
                  onChangeText={(value) =>
                    updateForm("lng", cleanDecimal(value, true))
                  }
                  placeholder="0"
                  value={form.lng}
                />
              </View>
            </View>

            {isResidential(form.type) ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field
                    keyboardType="numeric"
                    label="Bedrooms"
                    onChangeText={(value) =>
                      updateForm("bedrooms", cleanInteger(value))
                    }
                    value={form.bedrooms}
                  />
                </View>
                <View className="flex-1">
                  <Field
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

            <View className="rounded-3xl border border-teal-900/10 bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      color="#0F766E"
                      size={22}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-zinc-950">
                      Transient Booking Enabled
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-zinc-500">
                      Allow short-term reservations for this property.
                    </Text>
                  </View>
                </View>
                <Switch
                  onValueChange={(value) =>
                    updateForm("isTransientBookable", value)
                  }
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#D4D4D8", true: "#0F766E" }}
                  value={form.isTransientBookable}
                />
              </View>
            </View>

            <Field
              keyboardType="decimal-pad"
              label="Occupancy %"
              onChangeText={(value) =>
                updateForm("occupancy", cleanDecimal(value))
              }
              placeholder="Optional"
              value={form.occupancy}
            />

            <Field
              label="Area"
              onChangeText={(value) => updateForm("area", value)}
              placeholder="Optional"
              value={form.area}
            />

            <Field
              label="Description"
              multiline
              onChangeText={(value) => updateForm("description", value)}
              placeholder="Optional notes"
              value={form.description}
            />

            <View className="gap-4 rounded-3xl border border-teal-900/10 bg-white/90 p-4 shadow-sm">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
                    <MaterialCommunityIcons
                      name="image-outline"
                      color="#0F766E"
                      size={22}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-zinc-950">
                      Property Image
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-zinc-500">
                      JPG, PNG, or WEBP up to 5 MB.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="rounded-full bg-teal-700 px-4 py-2.5"
                  onPress={pickImage}
                >
                  <Text className="text-xs font-bold text-white">
                    {selectedImage ? "Change" : "Choose"}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedImage ? (
                <View className="overflow-hidden rounded-2xl border border-teal-900/10 bg-teal-50">
                  <Image
                    className="h-48 w-full"
                    resizeMode="cover"
                    source={{ uri: selectedImage.uri }}
                  />
                  <View className="flex-row items-center justify-between gap-3 p-3">
                    <Text
                      className="flex-1 text-xs font-semibold text-zinc-700"
                      numberOfLines={1}
                    >
                      {selectedImage.name}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="h-8 w-8 items-center justify-center rounded-full bg-white"
                      onPress={() => setSelectedImage(null)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        color="#52525B"
                        size={17}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

            {formError ? (
              <View className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <Text className="text-sm font-medium text-rose-700">
                  {formError}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="border-t border-teal-900/10 bg-white p-6">
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 flex-1 items-center justify-center rounded-2xl border border-teal-900/10 bg-white"
                onPress={closeForm}
              >
                <Text className="text-base font-bold text-zinc-800">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 flex-1 items-center justify-center rounded-2xl bg-teal-700"
                disabled={createMutation.isPending}
                onPress={handleSubmit}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Create Property
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
