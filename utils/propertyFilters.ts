import type { DefaultDashboardLocation } from "../constants/defaultLocation";
import type { Property } from "../types";

export function matchesDefaultLocation(
  property: Property,
  defaultLocation: DefaultDashboardLocation | null,
) {
  if (!defaultLocation) return true;

  const country = property.country?.trim().toLowerCase();

  if (!country) return true;

  return country === defaultLocation.country.toLowerCase();
}

export function filterPropertiesByDefaultLocation(
  properties: Property[],
  defaultLocation: DefaultDashboardLocation | null,
) {
  return properties.filter((property) =>
    matchesDefaultLocation(property, defaultLocation),
  );
}
