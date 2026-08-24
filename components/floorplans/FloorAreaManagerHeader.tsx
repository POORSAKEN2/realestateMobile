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
        <AddButton
          className="h-11 flex-row items-center gap-1.5 rounded-2xl bg-primary px-3.5"
          disabled={!canAddArea}
          iconSize={17}
          onPress={onAddArea}
          title="Area"
        />
      }
      eyebrow="Property Layout"
      leading={
        <BackButton
          accessibilityLabel="Back to floor plans"
          onPress={onBack}
          variant="secondary"
        />
      }
      supportingText={`${propertyTitle} · ${floorName}`}
      title="Floor Areas"
    />
  );
}
