import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DEFAULT_LOCATION_OPTIONS } from "../../constants/defaultLocation";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import { useDefaultLocation } from "../../hooks/useDefaultLocation";

export default function DefaultLocationScreen() {
  const { isAuthenticated } = useAuth();
  const { defaultLocation, setDefaultLocation } = useDefaultLocation();
  const [selectedId, setSelectedId] = useState(
    defaultLocation?.id ?? "philippines",
  );
  const [isSaving, setIsSaving] = useState(false);
  const selectedLocation =
    DEFAULT_LOCATION_OPTIONS.find((location) => location.id === selectedId) ??
    DEFAULT_LOCATION_OPTIONS[0];

  async function handleContinue() {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    setIsSaving(true);

    try {
      await setDefaultLocation(selectedLocation);
      router.replace("/(tabs)/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen className="bg-slate-50">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1">
        <View className="pb-6 pt-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#0f766e]">
            <MaterialCommunityIcons
              name="map-marker-radius"
              color="#FFFFFF"
              size={28}
            />
          </View>
          <Text className="mt-6 text-xs font-ralewayExtraBold uppercase tracking-widest text-slate-500">
            Default Location
          </Text>
          <Text className="mt-2 text-3xl font-ralewayExtraBold text-slate-950">
            Choose your portfolio country
          </Text>
          <Text className="mt-3 text-base leading-6 text-slate-500">
            R.E.M. will use this country for property lists, map defaults, and
            new property forms.
          </Text>
        </View>

        <FlatList
          contentContainerStyle={{ paddingBottom: 120 }}
          data={DEFAULT_LOCATION_OPTIONS}
          ItemSeparatorComponent={() => <View className="h-3" />}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selected = item.id === selectedId;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                className={`min-h-20 flex-row items-center justify-between rounded-2xl border px-4 ${
                  selected
                    ? "border-[#0f766e] bg-[#0f766e]/10"
                    : "border-slate-200 bg-white"
                }`}
                onPress={() => setSelectedId(item.id)}
              >
                <View className="min-w-0 flex-1">
                  <Text
                    className={`text-base font-ralewayExtraBold ${
                      selected ? "text-[#0f766e]" : "text-slate-950"
                    }`}
                  >
                    {item.label}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    Start map and property views in {item.country}
                  </Text>
                </View>
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    selected ? "bg-[#0f766e]" : "bg-slate-100"
                  }`}
                >
                  <MaterialCommunityIcons
                    name={selected ? "check" : "map-marker-outline"}
                    color={selected ? "#FFFFFF" : "#64748B"}
                    size={20}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
        />

        <View className="absolute bottom-4 left-0 right-0">
          <TouchableOpacity
            activeOpacity={0.85}
            className={`h-14 flex-row items-center justify-center rounded-2xl ${
              isSaving ? "bg-[#5eead4]" : "bg-[#0f766e]"
            }`}
            disabled={isSaving}
            onPress={handleContinue}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="arrow-right"
                  color="#FFFFFF"
                  size={20}
                />
                <Text className="ml-2 text-base font-ralewayExtraBold text-white">
                  Continue
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}
