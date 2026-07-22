import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Switch, Text, TouchableOpacity, View } from "react-native";

import type { PropertyClassification, PropertyType } from "../../types";
import {
  cleanDecimal,
  cleanInteger,
  propertyClassificationChoices,
  propertyStatusChoices,
  propertySupportsTransientBooking,
  requiresBedroomAndBathroomCounts,
  seaCountryChoices,
  type Choice,
  type FormState,
} from "../../utils/properties/propertyForm";
import { BaseField } from "../ui/fields/BaseField";
import { DropdownField } from "../ui/fields/DropdownField";
import { ChoiceGroup } from "../ui/groups/ChoiceGroup";
import { LocationPinPicker } from "./LocationPinPicker";
import { PropertyFormSection } from "./PropertyFormSection";

type UpdateForm = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

export function PropertyCoreFields({
  form,
  locationSuggestions,
  onClassificationChange,
  onCoordinatesChange,
  onSelectSuggestedLocation,
  onUpdate,
  propertyTypeChoices,
}: {
  form: FormState;
  locationSuggestions: string[];
  onClassificationChange: (classification: PropertyClassification) => void;
  onCoordinatesChange: (coordinates: { lat: string; lng: string }) => void;
  onSelectSuggestedLocation: (location: string) => void;
  onUpdate: UpdateForm;
  propertyTypeChoices: Choice<PropertyType>[];
}) {
  const filteredLocationSuggestions = locationSuggestions;
  const selectLocation = onSelectSuggestedLocation;
  const updateClassification = onClassificationChange;
  const updateCoordinates = onCoordinatesChange;
  const updateForm = onUpdate;

  return (
    <>
      <View className="rounded-2xl bg-[#2563EB]/10 px-4 py-3">
        <Text className="text-xs leading-5 text-[#1E40AF]">
          Fields marked with * are required. You can add images and documents
          now or later.
        </Text>
      </View>

      <PropertyFormSection
        description="Name the property and choose its current portfolio status."
        icon="home-outline"
        title="Basics"
      >
        <BaseField
          autoCorrect={false}
          label="Property name"
          onChangeText={(value) => updateForm("title", value)}
          placeholder="e.g. Greenfield Residences"
          value={form.title}
          required
        />
        <ChoiceGroup
          choices={propertyStatusChoices}
          label="Current status"
          onSelect={(value) => updateForm("status", value)}
          value={form.status}
        />
      </PropertyFormSection>

      <PropertyFormSection
        description="Enter the city, then confirm the exact position on the map."
        icon="map-marker-outline"
        title="Location"
      >
        <BaseField
          label="City or area"
          onChangeText={(value) => updateForm("location", value)}
          placeholder="e.g. Makati City"
          value={form.location}
          required
        />

        {filteredLocationSuggestions.length > 0 ? (
          <View className="gap-2">
            <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
              Quick choices
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {filteredLocationSuggestions.map((location) => (
                <TouchableOpacity
                  key={location}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  className="min-h-11 justify-center rounded-full border border-[#1d1d1f]/10 bg-[#2563EB]/5 px-3.5 py-2.5"
                  onPress={() => selectLocation(location)}
                >
                  <Text className="text-xs font-semibold text-[#2563EB]">
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <DropdownField
          label="Country"
          subtitle="Southeast Asia"
          placeholder="Select a country"
          value={form.country}
          options={seaCountryChoices}
          onSelect={(value) => updateForm("country", value)}
          required
        />

        <LocationPinPicker
          lat={form.lat}
          lng={form.lng}
          onChange={updateCoordinates}
          onCountryChange={(country) => updateForm("country", country)}
          onLocationChange={(location) => updateForm("location", location)}
        />
      </PropertyFormSection>

      <PropertyFormSection
        description="Classify the asset and add the physical details buyers or operators need."
        icon="office-building-outline"
        title="Property details"
      >
        <ChoiceGroup
          choices={propertyClassificationChoices}
          label="Classification"
          onSelect={updateClassification}
          value={form.classification}
        />
        <ChoiceGroup
          choices={propertyTypeChoices}
          label="Property type"
          onSelect={(value) => updateForm("type", value)}
          value={form.type}
        />

        {requiresBedroomAndBathroomCounts(form.classification, form.type) ? (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <BaseField
                keyboardType="number-pad"
                label="Bedrooms"
                onChangeText={(value) =>
                  updateForm("bedrooms", cleanInteger(value))
                }
                placeholder="0"
                value={form.bedrooms}
                required
              />
            </View>
            <View className="flex-1">
              <BaseField
                keyboardType="number-pad"
                label="Bathrooms"
                onChangeText={(value) =>
                  updateForm("bathrooms", cleanInteger(value))
                }
                placeholder="0"
                value={form.bathrooms}
                required
              />
            </View>
          </View>
        ) : null}

        <BaseField
          label="Floor area"
          onChangeText={(value) => updateForm("area", value)}
          placeholder="e.g. 120 sqm"
          value={form.area}
        />
        <BaseField
          label="Description"
          multiline
          numberOfLines={4}
          onChangeText={(value) => updateForm("description", value)}
          placeholder="Add useful notes about the property (optional)"
          value={form.description}
        />
      </PropertyFormSection>

      <PropertyFormSection
        description="Add valuation and operating information for portfolio reporting."
        icon="chart-line"
        title="Financials & use"
      >
        <View className="flex-row gap-3">
          <View className="flex-1">
            <BaseField
              keyboardType="decimal-pad"
              label="Market value (PHP)"
              onChangeText={(value) => updateForm("value", cleanDecimal(value))}
              placeholder="0"
              value={form.value}
              required
            />
          </View>
          <View className="w-28">
            <BaseField
              keyboardType="decimal-pad"
              label="ROI (%)"
              onChangeText={(value) => updateForm("roi", cleanDecimal(value))}
              placeholder="0"
              value={form.roi}
              required
            />
          </View>
        </View>

        <BaseField
          keyboardType="decimal-pad"
          label="Occupancy (%)"
          maxLength={6}
          onChangeText={(value) => updateForm("occupancy", cleanDecimal(value))}
          placeholder="e.g. 85"
          value={form.occupancy}
        />

        {propertySupportsTransientBooking(form.classification, form.type) ? (
          <View className="rounded-2xl bg-[#F7F8FA] p-4">
            <View className="flex-row items-center justify-between gap-4">
              <View className="min-w-0 flex-1 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB]/10">
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    color="#2563EB"
                    size={21}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-[#1d1d1f]">
                    Allow short-term bookings
                  </Text>
                  <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
                    Guests can reserve this property for short stays.
                  </Text>
                </View>
              </View>
              <Switch
                accessibilityLabel="Allow short-term bookings"
                onValueChange={(value) =>
                  updateForm("isTransientBookable", value)
                }
                thumbColor="#FFFFFF"
                trackColor={{ false: "#8E8E93", true: "#2563EB" }}
                value={form.isTransientBookable}
              />
            </View>
          </View>
        ) : null}
      </PropertyFormSection>
    </>
  );
}
