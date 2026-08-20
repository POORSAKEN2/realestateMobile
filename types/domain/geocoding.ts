export type LocationSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  countryCode?: string;
};

export type ReverseGeocodeResult = {
  city?: string;
  country?: string;
  countryCode?: string;
  label?: string;
};

export type GeocodingClient = {
  searchLocations: (query: string) => Promise<LocationSearchResult[]>;
  reverseGeocodeLocation: (
    latitude: number,
    longitude: number,
  ) => Promise<ReverseGeocodeResult>;
};
