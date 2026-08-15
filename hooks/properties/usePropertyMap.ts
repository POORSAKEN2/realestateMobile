import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_PHILIPPINES_REGION } from "../../constants/defaultLocation";
import type { Property } from "../../types";
import type { MapRegion } from "../../types/maps";
import { hasMapCoordinate } from "../../utils/properties/propertyPresentation";
import {
  getPortfolioRegion,
  getSelectedPropertyRegion,
} from "../../utils/properties/propertyMap";

export function usePropertyMap(properties: Property[]) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [viewport, setViewport] = useState({
    region: DEFAULT_PHILIPPINES_REGION,
    revision: 0,
  });
  const mappedProperties = useMemo(
    () => properties.filter(hasMapCoordinate),
    [properties],
  );
  const propertiesById = useMemo(
    () => new Map(mappedProperties.map((property) => [property.id, property])),
    [mappedProperties],
  );
  const selectedProperty = selectedPropertyId
    ? (propertiesById.get(selectedPropertyId) ?? null)
    : null;
  const portfolioRegion = useMemo(
    () => getPortfolioRegion(mappedProperties),
    [mappedProperties],
  );

  const moveViewport = useCallback(
    (region: MapRegion) =>
      setViewport((current) => ({
        region,
        revision: current.revision + 1,
      })),
    [],
  );

  const propertiesKey = useMemo(
    () =>
      mappedProperties
        .map((property) => `${property.id}:${property.lat}:${property.lng}`)
        .join("|"),
    [mappedProperties],
  );
  const lastPropertiesKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (mappedProperties.length === 0) return;
    if (lastPropertiesKeyRef.current === propertiesKey) return;
    lastPropertiesKeyRef.current = propertiesKey;

    const timer = setTimeout(() => moveViewport(portfolioRegion), 250);
    return () => clearTimeout(timer);
  }, [moveViewport, portfolioRegion, propertiesKey, mappedProperties.length]);

  const clearSelection = useCallback(() => setSelectedPropertyId(null), []);

  const recenter = useCallback(() => {
    clearSelection();
    moveViewport(portfolioRegion);
  }, [clearSelection, moveViewport, portfolioRegion]);

  const selectPropertyById = useCallback(
    (propertyId: string) => {
      const property = propertiesById.get(propertyId);
      if (!property) return;
      setSelectedPropertyId(propertyId);
      moveViewport(getSelectedPropertyRegion(property));
    },
    [moveViewport, propertiesById],
  );

  return {
    clearSelection,
    mappedProperties,
    mapRegion: viewport.region,
    recenter,
    selectedProperty,
    selectPropertyById,
    unmappedPropertyCount: properties.length - mappedProperties.length,
    viewportRevision: viewport.revision,
  };
}
