import type {
  PropertySpatialCapabilities,
  PropertyType,
  SpatialCapabilityLevel,
} from "../../types";

export type FloorManagerMode = "full" | "layout" | "minimal";
export type FloorSummaryProminence = "primary" | "secondary";

export type FloorManagerPolicy = {
  canCreateFloorPlans: boolean;
  canCreateRooms: boolean;
  floorPlans: SpatialCapabilityLevel;
  floorSummaryProminence: FloorSummaryProminence;
  mode: FloorManagerMode;
  rooms: SpatialCapabilityLevel;
  showRoomActions: boolean;
};

type CompleteSpatialCapabilities = Required<PropertySpatialCapabilities>;

const UNKNOWN_PROPERTY_CAPABILITIES: CompleteSpatialCapabilities = {
  floorplans: "optional",
  rooms: "optional",
};

// Backend-provided capabilities override this exhaustive fallback map.
export const PROPERTY_SPATIAL_CAPABILITIES = {
  "Single Family Home": {
    floorplans: "recommended",
    rooms: "optional",
  },
  Townhouse: {
    floorplans: "recommended",
    rooms: "optional",
  },
  "Apartment Unit": {
    floorplans: "recommended",
    rooms: "optional",
  },
  "Condominium Unit": {
    floorplans: "recommended",
    rooms: "optional",
  },
  "Condominium Building": {
    floorplans: "recommended",
    rooms: "recommended",
  },
  "Office Space": {
    floorplans: "recommended",
    rooms: "optional",
  },
  "Coworking Space": {
    floorplans: "recommended",
    rooms: "recommended",
  },
  "Mixed Use Building": {
    floorplans: "recommended",
    rooms: "recommended",
  },
  Warehouse: {
    floorplans: "recommended",
    rooms: "recommended",
  },
  Factory: {
    floorplans: "recommended",
    rooms: "recommended",
  },
  "Cold Storage": {
    floorplans: "recommended",
    rooms: "recommended",
  },
  Mall: {
    floorplans: "recommended",
    rooms: "recommended",
  },
  Storefront: {
    floorplans: "recommended",
    rooms: "optional",
  },
  "Kiosk / Booth": {
    floorplans: "discouraged",
    rooms: "discouraged",
  },
  "Empty Lot": {
    floorplans: "discouraged",
    rooms: "discouraged",
  },
  "Agricultural Lot": {
    floorplans: "discouraged",
    rooms: "discouraged",
  },
  "Commercial Lot": {
    floorplans: "discouraged",
    rooms: "discouraged",
  },
} satisfies Record<PropertyType, CompleteSpatialCapabilities>;

function getTypeCapabilities(
  propertyType?: PropertyType,
): CompleteSpatialCapabilities {
  if (!propertyType) return UNKNOWN_PROPERTY_CAPABILITIES;
  return (
    PROPERTY_SPATIAL_CAPABILITIES[propertyType] ?? UNKNOWN_PROPERTY_CAPABILITIES
  );
}

function getMode({
  floorplans,
  rooms,
}: CompleteSpatialCapabilities): FloorManagerMode {
  if (floorplans === "discouraged" || floorplans === "unsupported") {
    return "minimal";
  }
  if (floorplans === "recommended" && rooms === "recommended") {
    return "full";
  }
  return "layout";
}

export function resolveFloorManagerPolicy({
  backendCapabilities,
  hasFloorPlans = false,
  hasRooms = false,
  propertyType,
}: {
  backendCapabilities?: PropertySpatialCapabilities;
  hasFloorPlans?: boolean;
  hasRooms?: boolean;
  propertyType?: PropertyType;
}): FloorManagerPolicy {
  const fallback = getTypeCapabilities(propertyType);
  const capabilities: CompleteSpatialCapabilities = {
    floorplans: backendCapabilities?.floorplans ?? fallback.floorplans,
    rooms: backendCapabilities?.rooms ?? fallback.rooms,
  };
  const hasSpatialData = hasFloorPlans || hasRooms;
  const roomsAreNormallyShown =
    capabilities.rooms === "recommended" || capabilities.rooms === "optional";

  return {
    canCreateFloorPlans: capabilities.floorplans !== "unsupported",
    canCreateRooms:
      capabilities.rooms !== "unsupported" &&
      (roomsAreNormallyShown || hasRooms),
    floorPlans: capabilities.floorplans,
    floorSummaryProminence:
      hasSpatialData || capabilities.floorplans === "recommended"
        ? "primary"
        : "secondary",
    mode: getMode(capabilities),
    rooms: capabilities.rooms,
    showRoomActions: roomsAreNormallyShown || hasRooms,
  };
}

export function getFloorManagerGuidance(policy: FloorManagerPolicy) {
  if (policy.floorPlans === "unsupported") {
    return "Existing layouts remain accessible. New floor plans are unavailable.";
  }
  if (policy.mode === "full") {
    return "Map areas and connect rooms to their exact floor location.";
  }
  if (policy.mode === "layout") {
    return "Map the layout. Add rooms only for separately managed spaces.";
  }
  return "A floor plan is optional for this property type.";
}

export function getRoomManagementGuidance(policy: FloorManagerPolicy) {
  if (!policy.showRoomActions) return undefined;
  if (policy.rooms === "optional") {
    return "Rooms are optional. Add them only for separately leased or managed spaces.";
  }
  if (policy.rooms === "discouraged" || policy.rooms === "unsupported") {
    return "Existing room assignments are preserved for review and cleanup.";
  }
  return undefined;
}

export function isPropertyType(value: unknown): value is PropertyType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PROPERTY_SPATIAL_CAPABILITIES, value)
  );
}
