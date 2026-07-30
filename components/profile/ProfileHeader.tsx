import { BackButton } from "../ui/buttons/BackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

type ProfileHeaderProps = {
  onBack: () => void;
};

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <ModuleHeader
      eyebrow="Account"
      leading={
        <BackButton
          accessibilityLabel="Back from profile"
          onPress={onBack}
        />
      }
      supportingText="Keep your account details current"
      title="Your Profile"
    />
  );
}
