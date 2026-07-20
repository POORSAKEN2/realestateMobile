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
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "realestateMobile/1.0 (com.angelod2.realestateMobile)",
    },
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
