import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Switch, Text, TouchableOpacity, View } from "react-native";

import type { PropertyClassification, PropertyType } from "../../types";
import {
  cleanDecimal,
  cleanInteger,
  propertyClassificationChoices,
  propertyListingModeChoices,
  propertyListingTypeChoices,
  propertyStatusChoices,
  requiresBedroomAndBathroomCounts,
  seaCountryChoices,
  type Choice,
  type FormState,
} from "../../utils/properties/propertyForm";
import { BaseField } from "../ui/fields/BaseField";
import { DropdownField } from "../ui/fields/DropdownField";
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
  propertyOwnerChoices,
  propertyOwnersError,
  propertyOwnersLoading,
  publishingBlocked,
  publishingQuotaLabel,
  propertyTypeChoices,
  statusEditable = true,
}: {
  form: FormState;
  locationSuggestions: string[];
  onClassificationChange: (classification: PropertyClassification) => void;
  onCoordinatesChange: (coordinates: { lat: string; lng: string }) => void;
  onSelectSuggestedLocation: (location: string) => void;
  onUpdate: UpdateForm;
  propertyOwnerChoices: Choice<string>[];
  propertyOwnersError?: string;
  propertyOwnersLoading: boolean;
  publishingBlocked: boolean;
  publishingQuotaLabel?: string;
  propertyTypeChoices: Choice<PropertyType>[];
  statusEditable?: boolean;
}) {
  const filteredLocationSuggestions = locationSuggestions;
  const selectLocation = onSelectSuggestedLocation;
  const updateClassification = onClassificationChange;
  const updateCoordinates = onCoordinatesChange;
  const updateForm = onUpdate;

  return (
    <>
      <View className="flex-row items-start gap-3 rounded-2xl border border-primary bg-primary/10 px-4 py-3.5">
        <MaterialCommunityIcons
          name="information-outline"
          color="#8A77F4"
          size={20}
        />
        <Text className="min-w-0 flex-1 font-ralewayMedium text-sm leading-5 text-secondary">
          Fields marked with * are required. You can add images and documents
          now or later.
        </Text>
      </View>

      <PropertyFormSection
        description={
          statusEditable
            ? "Name the property and choose its initial lifecycle state."
            : "Update the property name. Lifecycle changes use the controlled transition workflow."
        }
        icon="home-outline"
        title="Basics"
        variant="card"
      >
        <BaseField
          autoCorrect={false}
          label="Property name"
          onChangeText={(value) => updateForm("title", value)}
          placeholder="e.g. Greenfield Residences"
          value={form.title}
          required
          variant="filled"
        />
        {statusEditable ? (
          <DropdownField
            label="Initial lifecycle state"
            options={propertyStatusChoices}
            onSelect={(value) => updateForm("status", value)}
            placeholder="Select a state"
            value={form.status}
            required
            variant="filled"
          />
        ) : (
          <View className="rounded-2xl bg-primary/5 px-4 py-3.5">
            <Text className="font-ralewayBold text-xs text-textPrimary">
              Lifecycle state changes live in Property details.
            </Text>
            <Text className="mt-1 text-xs leading-5 text-description">
              Close this form, open property details, then choose an allowed
              next state.
            </Text>
          </View>
        )}
      </PropertyFormSection>

      <PropertyFormSection
        description="Enter the city, then confirm the exact position on the map."
        icon="map-marker-outline"
        title="Location"
        variant="card"
      >
        <BaseField
          label="City or area"
          onChangeText={(value) => updateForm("location", value)}
          placeholder="e.g. Makati City"
          value={form.location}
          required
          variant="filled"
        />

        {filteredLocationSuggestions.length > 0 ? (
          <View className="gap-2">
            <Text className="font-ralewayBold text-xs text-description">
              Quick choices
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {filteredLocationSuggestions.map((location) => (
                <TouchableOpacity
                  key={location}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  className="min-h-11 justify-center rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2.5"
                  onPress={() => selectLocation(location)}
                >
                  <Text className="font-ralewayBold text-xs text-primary">
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
          variant="filled"
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
        variant="card"
      >
        <DropdownField
          label="Classification"
          options={propertyClassificationChoices}
          onSelect={updateClassification}
          placeholder="Select a classification"
          value={form.classification}
          required
          variant="filled"
        />
        <DropdownField
          label="Property type"
          options={propertyTypeChoices}
          onSelect={(value) => updateForm("type", value)}
          placeholder="Select a property type"
          value={form.type}
          required
          variant="filled"
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
                variant="filled"
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
                variant="filled"
              />
            </View>
          </View>
        ) : null}

        <BaseField
          label="Floor area"
          onChangeText={(value) => updateForm("area", value)}
          placeholder="e.g. 120 sqm"
          value={form.area}
          variant="filled"
        />
        <BaseField
          label="Description"
          multiline
          numberOfLines={4}
          onChangeText={(value) => updateForm("description", value)}
          placeholder="Add useful notes about the property (optional)"
          value={form.description}
          variant="filled"
        />
      </PropertyFormSection>

      <PropertyFormSection
        description="Add valuation and operating information for portfolio reporting."
        icon="chart-line"
        title="Financials & use"
        variant="card"
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
              variant="filled"
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
              variant="filled"
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
          variant="filled"
        />

        <View className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-center justify-between gap-4">
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <MaterialCommunityIcons
                  name="calendar-clock"
                  color="#8A77F4"
                  size={21}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-ralewayExtraBold text-sm text-textPrimary">
                  Allow short-term bookings
                </Text>
                <Text className="mt-1 text-xs leading-4 text-description">
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
              trackColor={{ false: "#6F6D6D", true: "#8A77F4" }}
              value={form.isTransientBookable}
            />
          </View>
        </View>
      </PropertyFormSection>

      <PropertyFormSection
        description="Publish eligible properties to the Terrane marketplace. Listing limits follow your plan."
        icon="storefront-outline"
        title="Marketplace listing"
        variant="card"
      >
        <View className={`rounded-2xl border border-primary/20 bg-primary/5 p-4 ${publishingBlocked ? "opacity-60" : ""}`}>
          <View className="flex-row items-center justify-between gap-4">
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <MaterialCommunityIcons
                  name="earth"
                  color="#8A77F4"
                  size={21}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-ralewayExtraBold text-sm text-textPrimary">
                  Publish property
                </Text>
                <Text className="mt-1 text-xs leading-4 text-description">
                  Requires a verified owner, listing mode, map pin, photo, and price.
                </Text>
                {publishingQuotaLabel ? (
                  <Text className="mt-1 font-ralewaySemiBold text-[11px] text-primary">
                    {publishingQuotaLabel}
                  </Text>
                ) : null}
              </View>
            </View>
            <Switch
              accessibilityLabel="Publish property"
              disabled={publishingBlocked}
              onValueChange={(value) => updateForm("isPublished", value)}
              thumbColor="#FFFFFF"
              trackColor={{ false: "#6F6D6D", true: "#8A77F4" }}
              value={form.isPublished}
            />
          </View>
        </View>

        {publishingBlocked ? (
          <Text className="text-xs leading-4 text-warning">
            Published-listing limit reached. Unpublish another property or upgrade your plan.
          </Text>
        ) : null}

        {form.isPublished ? (
          <>
            <DropdownField
              disabled={propertyOwnersLoading || propertyOwnerChoices.length === 0}
              label="Verified property owner"
              options={propertyOwnerChoices}
              onSelect={(value) => updateForm("ownerId", value)}
              placeholder={propertyOwnersLoading ? "Loading owners..." : "Select owner"}
              value={form.ownerId}
              required
              variant="filled"
            />
            {!propertyOwnersLoading && propertyOwnerChoices.length === 0 ? (
              <Text className="text-xs leading-4 text-warning">
                {propertyOwnersError ?? "No verified property owner is available. Verify an owner before publishing."}
              </Text>
            ) : null}
            <DropdownField
              label="Listing mode"
              options={propertyListingModeChoices}
              onSelect={(value) => updateForm("listingMode", value)}
              value={form.listingMode}
              required
              variant="filled"
            />
            <DropdownField
              label="Listing type"
              options={propertyListingTypeChoices}
              onSelect={(value) => updateForm("listingType", value)}
              placeholder="Optional"
              value={form.listingType}
              variant="filled"
            />
            <BaseField
              keyboardType="number-pad"
              label="Listing floor area (sqm)"
              onChangeText={(value) => updateForm("sqm", cleanInteger(value))}
              placeholder="Optional"
              value={form.sqm}
              variant="filled"
            />
          </>
        ) : null}
      </PropertyFormSection>
    </>
  );
}
