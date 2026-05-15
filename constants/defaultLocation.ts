import type { Region } from "react-native-maps";

export type DefaultDashboardLocation = {
  id: string;
  label: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  latitudeDelta: number;
  longitudeDelta: number;
};

export type SuggestedPropertyLocation = {
  label: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export const DEFAULT_LOCATION_OPTIONS: DefaultDashboardLocation[] = [
  {
    id: "singapore",
    label: "Singapore",
    country: "Singapore",
    coordinates: { lat: 1.3521, lng: 103.8198 },
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  },
  {
    id: "philippines",
    label: "Philippines",
    country: "Philippines",
    coordinates: { lat: 12.8797, lng: 121.774 },
    latitudeDelta: 12,
    longitudeDelta: 12,
  },
  {
    id: "malaysia",
    label: "Malaysia",
    country: "Malaysia",
    coordinates: { lat: 4.2105, lng: 101.9758 },
    latitudeDelta: 8,
    longitudeDelta: 8,
  },
  {
    id: "indonesia",
    label: "Indonesia",
    country: "Indonesia",
    coordinates: { lat: -2.5489, lng: 118.0149 },
    latitudeDelta: 16,
    longitudeDelta: 16,
  },
  {
    id: "thailand",
    label: "Thailand",
    country: "Thailand",
    coordinates: { lat: 15.87, lng: 100.9925 },
    latitudeDelta: 9,
    longitudeDelta: 9,
  },
  {
    id: "vietnam",
    label: "Vietnam",
    country: "Vietnam",
    coordinates: { lat: 14.0583, lng: 108.2772 },
    latitudeDelta: 10,
    longitudeDelta: 10,
  },
  {
    id: "brunei",
    label: "Brunei",
    country: "Brunei",
    coordinates: { lat: 4.5353, lng: 114.7277 },
    latitudeDelta: 1.2,
    longitudeDelta: 1.2,
  },
  {
    id: "cambodia",
    label: "Cambodia",
    country: "Cambodia",
    coordinates: { lat: 12.5657, lng: 104.991 },
    latitudeDelta: 6,
    longitudeDelta: 6,
  },
  {
    id: "laos",
    label: "Laos",
    country: "Laos",
    coordinates: { lat: 19.8563, lng: 102.4955 },
    latitudeDelta: 7,
    longitudeDelta: 7,
  },
  {
    id: "myanmar",
    label: "Myanmar",
    country: "Myanmar",
    coordinates: { lat: 21.9162, lng: 95.956 },
    latitudeDelta: 9,
    longitudeDelta: 9,
  },
  {
    id: "timor-leste",
    label: "Timor-Leste",
    country: "Timor-Leste",
    coordinates: { lat: -8.8742, lng: 125.7275 },
    latitudeDelta: 3,
    longitudeDelta: 3,
  },
];

export const SEA_COUNTRY_CHOICES = DEFAULT_LOCATION_OPTIONS.map((location) => ({
  label: location.label,
  value: location.country,
})).sort((first, second) => first.label.localeCompare(second.label));

export const SUGGESTED_PROPERTY_LOCATIONS: SuggestedPropertyLocation[] = [
  {
    label: "Bandar Seri Begawan",
    country: "Brunei",
    coordinates: { lat: 4.9031, lng: 114.9398 },
  },
  {
    label: "Phnom Penh",
    country: "Cambodia",
    coordinates: { lat: 11.5564, lng: 104.9282 },
  },
  {
    label: "Siem Reap",
    country: "Cambodia",
    coordinates: { lat: 13.3671, lng: 103.8448 },
  },
  {
    label: "Jakarta",
    country: "Indonesia",
    coordinates: { lat: -6.2088, lng: 106.8456 },
  },
  {
    label: "Bali",
    country: "Indonesia",
    coordinates: { lat: -8.3405, lng: 115.092 },
  },
  {
    label: "Vientiane",
    country: "Laos",
    coordinates: { lat: 17.9757, lng: 102.6331 },
  },
  {
    label: "Kuala Lumpur",
    country: "Malaysia",
    coordinates: { lat: 3.139, lng: 101.6869 },
  },
  {
    label: "Johor Bahru",
    country: "Malaysia",
    coordinates: { lat: 1.4927, lng: 103.7414 },
  },
  {
    label: "Yangon",
    country: "Myanmar",
    coordinates: { lat: 16.8409, lng: 96.1735 },
  },
  {
    label: "Mandalay",
    country: "Myanmar",
    coordinates: { lat: 21.9588, lng: 96.0891 },
  },
  {
    label: "Makati City, Metro Manila",
    country: "Philippines",
    coordinates: { lat: 14.5547, lng: 121.0244 },
  },
  {
    label: "Taguig City, Metro Manila (BGC)",
    country: "Philippines",
    coordinates: { lat: 14.5505, lng: 121.0488 },
  },
  {
    label: "Quezon City, Metro Manila",
    country: "Philippines",
    coordinates: { lat: 14.676, lng: 121.0437 },
  },
  {
    label: "Cebu City, Cebu",
    country: "Philippines",
    coordinates: { lat: 10.3157, lng: 123.8854 },
  },
  {
    label: "Davao City, Davao del Sur",
    country: "Philippines",
    coordinates: { lat: 7.1907, lng: 125.4553 },
  },
  {
    label: "Singapore",
    country: "Singapore",
    coordinates: { lat: 1.3521, lng: 103.8198 },
  },
  {
    label: "Bangkok",
    country: "Thailand",
    coordinates: { lat: 13.7563, lng: 100.5018 },
  },
  {
    label: "Phuket",
    country: "Thailand",
    coordinates: { lat: 7.8804, lng: 98.3923 },
  },
  {
    label: "Dili",
    country: "Timor-Leste",
    coordinates: { lat: -8.5569, lng: 125.5603 },
  },
  {
    label: "Ho Chi Minh City",
    country: "Vietnam",
    coordinates: { lat: 10.8231, lng: 106.6297 },
  },
  {
    label: "Hanoi",
    country: "Vietnam",
    coordinates: { lat: 21.0278, lng: 105.8342 },
  },
];

export function getDefaultLocationByCountry(country?: string | null) {
  if (!country) return null;

  return (
    DEFAULT_LOCATION_OPTIONS.find(
      (location) =>
        location.country.toLowerCase() === country.trim().toLowerCase(),
    ) ?? null
  );
}

export function getDefaultLocationRegion(
  location: DefaultDashboardLocation | null,
): Region {
  const nextLocation =
    location ??
    getDefaultLocationByCountry("Philippines") ??
    DEFAULT_LOCATION_OPTIONS[0];

  return {
    latitude: nextLocation.coordinates.lat,
    longitude: nextLocation.coordinates.lng,
    latitudeDelta: nextLocation.latitudeDelta,
    longitudeDelta: nextLocation.longitudeDelta,
  };
}

export function getLocationSuggestionsForCountry(country?: string | null) {
  const normalizedCountry = country?.trim().toLowerCase();

  if (!normalizedCountry) return SUGGESTED_PROPERTY_LOCATIONS;

  return SUGGESTED_PROPERTY_LOCATIONS.filter(
    (location) => location.country.toLowerCase() === normalizedCountry,
  );
}

export function getSuggestedLocation(label: string) {
  return (
    SUGGESTED_PROPERTY_LOCATIONS.find((location) => location.label === label) ??
    null
  );
}
