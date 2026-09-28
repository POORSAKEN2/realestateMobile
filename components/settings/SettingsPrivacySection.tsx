import { useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import { exportUserData } from "../../api/user";
import { FormSection } from "../ui/forms/FormSection";
import { Button } from "../ui/buttons/Button";

export function SettingsPrivacySection() {
  const [exporting, setExporting] = useState(false);
  async function exportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportUserData();
      await Share.share({
        title: "Terrane_User_Data.json",
        message: JSON.stringify(data, null, 2),
      });
    } catch (error) {
      Alert.alert(
        "Export failed",
        error instanceof Error ? error.message : "Could not export user data.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <View className="mt-5">
      <FormSection
        icon="download-outline"
        title="Your data"
        description="Download a copy of your account information."
        variant="card"
      >
        <Text className="text-xs leading-5 text-description">
          Export contains personal information. Choose a trusted destination
          when sharing.
        </Text>
        <Button
          title="Export my data (JSON)"
          variant="secondary"
          isLoading={exporting}
          onPress={() => {
            void exportData();
          }}
        />
      </FormSection>
    </View>
  );
}
