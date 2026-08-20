import { useContext } from "react";

import { MapKitGeocodingContext } from "../../components/maps/MapKitGeocodingProvider";

export function useMapKitGeocoding() {
  const geocoding = useContext(MapKitGeocodingContext);

  if (!geocoding) {
    throw new Error(
      "useMapKitGeocoding must be used inside MapKitGeocodingProvider.",
    );
  }

  return geocoding;
}
