import AddButton from "../ui/buttons/AddButton";
import { BackButton } from "../ui/buttons/BackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

export function FloorAreaManagerHeader({
  canAddArea,
  floorName,
  onAddArea,
  onBack,
  propertyTitle,
}: {
  canAddArea: boolean;
  floorName: string;
  onAddArea: () => void;
  onBack: () => void;
  propertyTitle: string;
}) {
  return (
    <ModuleHeader
      action={
        <AddButton permission="areas.create"
          disabled={!canAddArea}
          iconOnly
          iconSize={17}
          onPress={onAddArea}
          title="Add area"
        />
      }
      eyebrow="Portfolio Intelligence"
      leading={
        <BackButton
          accessibilityLabel="Back to floor plans"
          onPress={onBack}
          variant="secondary"
        />
      }
      supportingText={`${propertyTitle} · ${floorName}`}
      title="Areas"
    />
  );
}
