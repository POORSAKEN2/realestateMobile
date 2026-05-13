import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";

export default function DocumentsScreen() {
  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 justify-center">
        <View className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm shadow-slate-900/10">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <MaterialCommunityIcons
              name="file-document-outline"
              color="#2563EB"
              size={28}
            />
          </View>
          <Text className="mt-5 text-3xl font-bold text-slate-950">
            Documents
          </Text>
          <Text className="mt-3 text-base leading-7 text-slate-500">
            Access leases, compliance files, and uploaded property documents
            from one operational library.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
