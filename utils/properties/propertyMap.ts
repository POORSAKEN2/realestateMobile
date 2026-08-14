import { DEFAULT_PHILIPPINES_REGION } from "../../constants/defaultLocation";
import type { MapRegion } from "../../types/maps";
import {
  getPropertyCoordinate,
  type MappedProperty,
} from "./propertyPresentation";

export const SELECTED_PROPERTY_DELTA = {
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export function getSelectedPropertyRegion(property: MappedProperty): MapRegion {
  return {
    ...getPropertyCoordinate(property),
    ...SELECTED_PROPERTY_DELTA,
  };
}

export function getPortfolioRegion(properties: MappedProperty[]): MapRegion {
  if (!properties.length) return DEFAULT_PHILIPPINES_REGION;
  if (properties.length === 1) return getSelectedPropertyRegion(properties[0]);

  let minimumLatitude = properties[0].lat;
  let maximumLatitude = properties[0].lat;
  let minimumLongitude = properties[0].lng;
  let maximumLongitude = properties[0].lng;

  for (let index = 1; index < properties.length; index += 1) {
    const property = properties[index];
    minimumLatitude = Math.min(minimumLatitude, property.lat);
    maximumLatitude = Math.max(maximumLatitude, property.lat);
    minimumLongitude = Math.min(minimumLongitude, property.lng);
    maximumLongitude = Math.max(maximumLongitude, property.lng);
  }

  return {
    latitude: (minimumLatitude + maximumLatitude) / 2,
    longitude: (minimumLongitude + maximumLongitude) / 2,
    latitudeDelta: Math.min(
      170,
      Math.max(
        (maximumLatitude - minimumLatitude) * 1.65,
        SELECTED_PROPERTY_DELTA.latitudeDelta,
      ),
    ),
    longitudeDelta: Math.min(
      360,
      Math.max(
        (maximumLongitude - minimumLongitude) * 1.45,
        SELECTED_PROPERTY_DELTA.longitudeDelta,
      ),
    ),
  };
}
