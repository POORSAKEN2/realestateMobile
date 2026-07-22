import { useEffect, useMemo, useRef, useState } from "react";
import MapView, { type Region } from "react-native-maps";

import type { Property } from "../../types";
import {
  getPropertyCoordinate,
  hasMapCoordinate,
} from "../../utils/properties/propertyPresentation";

export const PHILIPPINES_REGION: Region = {
  latitude: 12.8797,
  longitude: 121.774,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

export const SELECTED_PROPERTY_DELTA = {
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export function usePropertyMap(properties: Property[]) {
  const mapRef = useRef<MapView | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const mappedProperties = useMemo(
    () => properties.filter(hasMapCoordinate),
    [properties],
  );

  function fitPortfolio(animated = true) {
    if (!mappedProperties.length) {
      mapRef.current?.animateToRegion(PHILIPPINES_REGION, 800);
    } else if (mappedProperties.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...getPropertyCoordinate(mappedProperties[0]),
          ...SELECTED_PROPERTY_DELTA,
        },
        800,
      );
    } else {
      mapRef.current?.fitToCoordinates(
        mappedProperties.map(getPropertyCoordinate),
        {
          animated,
          edgePadding: { top: 110, right: 70, bottom: 220, left: 70 },
        },
      );
    }
  }

  useEffect(() => {
    if (!isMapReady || !mappedProperties.length) return;
    const timer = setTimeout(() => fitPortfolio(), 250);
    return () => clearTimeout(timer);
  }, [isMapReady, mappedProperties]);

  function recenter() {
    setSelectedProperty(null);
    fitPortfolio();
  }

  function selectProperty(property: Property & { lat: number; lng: number }) {
    setSelectedProperty(property);
    mapRef.current?.animateToRegion(
      {
        ...getPropertyCoordinate(property),
        ...SELECTED_PROPERTY_DELTA,
      },
      500,
    );
  }

  return {
    mapRef,
    mappedProperties,
    unmappedPropertyCount: properties.length - mappedProperties.length,
    selectedProperty,
    setSelectedProperty,
    setIsMapReady,
    recenter,
    selectProperty,
  };
}
