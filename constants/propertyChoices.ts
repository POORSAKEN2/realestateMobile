import { PROPERTY_TAXONOMY, Property } from "../types";

export type Choice<T extends string> = {
  label: string;
  value: T;
};

export default function PropertyChoices() {
  type PropertyType = NonNullable<Property["type"]>;
  type StatusFilter = Property["status"] | "ALL";

  const propertyStatusChoices: Choice<Property["status"]>[] = [
    { label: "Idle", value: "IDLE" },
    { label: "Under Construction", value: "UNDER_CONSTRUCTION" },
    { label: "Pre Leased", value: "PRE_LEASED" },
    { label: "Revenue Generating", value: "REVENUE_GENERATING" },
    { label: "Personal Use", value: "PERSONAL_USE" },
  ];

  const propertyTypeChoices: Choice<PropertyType>[] = Object.values(
    PROPERTY_TAXONOMY,
  )
    .flat()
    .map((type) => ({ label: type, value: type }));

  const seaCountryChoices: Choice<string>[] = [
    { label: "Brunei", value: "Brunei" },
    { label: "Cambodia", value: "Cambodia" },
    { label: "Indonesia", value: "Indonesia" },
    { label: "Laos", value: "Laos" },
    { label: "Malaysia", value: "Malaysia" },
    { label: "Myanmar", value: "Myanmar" },
    { label: "Philippines", value: "Philippines" },
    { label: "Singapore", value: "Singapore" },
    { label: "Thailand", value: "Thailand" },
    { label: "Timor-Leste", value: "Timor-Leste" },
    { label: "Vietnam", value: "Vietnam" },
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

  function formatStatus(status: string) {
    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
