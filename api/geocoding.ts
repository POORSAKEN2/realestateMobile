const GEOCODING_BASE_URL =
  process.env.EXPO_PUBLIC_GEOCODING_BASE_URL ??
  "https://nominatim.openstreetmap.org";

export type LocationSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type NominatimSearchResult = {
  place_id?: number | string;
  display_name?: string;
  lat?: string;
  lon?: string;
};

type NominatimReverseResult = {
  address?: Partial<
    Record<
      | "city"
      | "municipality"
      | "town"
      | "village"
      | "city_district"
      | "county"
      | "state_district"
      | "state"
      | "country",
      string
    >
  >;
};

const REQUEST_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
  "User-Agent": "realestateMobile/1.0 (com.angelod2.realestateMobile)",
};

export async function searchLocations(
  query: string,
): Promise<LocationSearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const url = new URL("/search", GEOCODING_BASE_URL);
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "ph");
  url.searchParams.set("limit", "5");

  const response = await fetch(url.toString(), {
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Location search failed with status ${response.status}.`);
  }

  const data = (await response.json()) as NominatimSearchResult[];

  return data.flatMap((item) => {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);

    if (
      item.place_id === undefined ||
      !item.display_name ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return [];
    }

    return [
      {
        id: String(item.place_id),
        label: item.display_name,
        latitude,
        longitude,
      },
    ];
  });
}

export type ReverseGeocodeResult = {
  city?: string;
  country?: string;
};

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {};
  }

  const url = new URL("/reverse", GEOCODING_BASE_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");

  const response = await fetch(url.toString(), {
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}.`);
  }

  const data = (await response.json()) as NominatimReverseResult;
  const address = data.address;

  return {
    city:
      address?.city ??
      address?.municipality ??
      address?.town ??
      address?.village ??
      address?.city_district ??
      address?.county ??
      address?.state_district ??
      address?.state,
    country: address?.country,
  };
}
