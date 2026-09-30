import type { Property } from "../../types";
import type { AppPermission } from "../../types/auth/access";
import { resolveFloorManagerPolicy } from "../../utils/properties/floorManagerPolicy";
import type { ActionSheetItem } from "../ui/ActionSheet";

export type PropertyManageHandlers = {
  onBedspaces: () => void;
  onFloorPlans: () => void;
  onBookings: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
};

export function getPropertyManageActions(
  property: Property,
  can: (permission: AppPermission, propertyId?: string) => boolean,
  handlers: PropertyManageHandlers,
): ActionSheetItem[] {
  if (property.archivedAt) {
    return can("properties.restore")
      ? [
          {
            icon: "restore",
            label: "Restore",
            section: "Lifecycle",
            permission: "properties.restore",
            onPress: handlers.onRestore,
          },
        ]
      : [];
  }

  const actions: ActionSheetItem[] = [];
  if (can("bedspaces.viewAny", property.id)) {
    actions.push({
      icon: "bed-single-outline",
      label: "Bedspaces",
      section: "Spaces",
      permission: "bedspaces.viewAny",
      propertyId: property.id,
      onPress: handlers.onBedspaces,
    });
  }

  const floorPolicy = resolveFloorManagerPolicy({
    backendCapabilities: property.spatialCapabilities,
    hasFloorPlans: Boolean(property.floorplans?.length),
    propertyType: property.type,
  });
  if (floorPolicy.showFloorSummary && can("floorplans.viewAny", property.id)) {
    actions.push({
      icon: "floor-plan",
      label: "Floor plans",
      section: "Spaces",
      permission: "floorplans.viewAny",
      propertyId: property.id,
      onPress: handlers.onFloorPlans,
    });
  }
  if (property.isTransientBookable && can("bookings.viewAny", property.id)) {
    actions.push({
      icon: "calendar-clock",
      label: "Bookings",
      section: "Management",
      permission: "bookings.viewAny",
      propertyId: property.id,
      onPress: handlers.onBookings,
    });
  }
  if (can("properties.update", property.id)) {
    actions.push({
      icon: "pencil-outline",
      label: "Edit",
      section: "Management",
      permission: "properties.update",
      propertyId: property.id,
      onPress: handlers.onEdit,
    });
  }
  if (can("properties.archive")) {
    actions.push({
      destructive: true,
      icon: "archive-outline",
      label: "Archive",
      section: "Lifecycle",
      permission: "properties.archive",
      onPress: handlers.onArchive,
    });
  }
  return actions;
}
