import { BackButton } from "../ui/buttons/BackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

type ProfileHeaderProps = {
  onBack?: () => void;
};

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <ModuleHeader
      centerTitle
      leading={
        onBack ? (
          <BackButton
            accessibilityLabel="Back from profile"
            onPress={onBack}
            variant="secondary"
          />
        ) : undefined
      }
      title="Your Profile"
    />
  );
}
