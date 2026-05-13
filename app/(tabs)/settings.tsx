import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";

export default function SettingsScreen() {
  const { signOut } = useAuth();

  function handleSignOut() {
    signOut();
    router.replace("/(auth)/login");
  }

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 justify-between">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Account
          </Text>
          <Text className="mt-2 text-3xl font-bold text-slate-950">
            Settings
          </Text>
          <Text className="mt-2 text-base leading-6 text-slate-500">
            Manage your profile, preferences, and secure access.
          </Text>

          <View className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm shadow-slate-900/10">
            <View className="flex-row items-center p-4">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <Ionicons name="person-outline" color="#2563EB" size={21} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-950">Profile</Text>
                <Text className="mt-1 text-sm text-slate-500">
                  Owner and company details
                </Text>
              </View>
              <Ionicons name="chevron-forward" color="#CBD5E1" size={20} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleSignOut}
          className="mb-2 flex-row items-center justify-center rounded-2xl bg-slate-950 px-5 py-4"
        >
          <Ionicons name="log-out-outline" color="#FFFFFF" size={20} />
          <Text className="ml-2 font-bold text-white">Sign out</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
