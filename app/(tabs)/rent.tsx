import { View } from "react-native";

import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";

export default function RentScreen() {
  return (
    <Screen bottomInset="tab-bar" className="bg-surface">
      <ModuleHeader eyebrow="Collection Management" title="Rent" />

      <View className="flex-1 justify-center pb-24">
        <ModuleEmptyState
          description="Online rent tracking, payment reminders, and collection reporting are being prepared for a future release."
          icon="wallet-outline"
          title="Rent collection is coming soon"
        />
      </View>
    </Screen>
  );
}
