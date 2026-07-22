import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { Lessee, Property, PropertyDocument } from "../../types";
import {
  formatDocumentDate,
  getCategoryPresentation,
  getDocumentIcon,
} from "../../utils/documents/documentPresentation";

export function DocumentCard({
  document,
  lessee,
  onOpen,
  onOpenActions,
  property,
}: {
  document: PropertyDocument;
  lessee?: Lessee;
  onOpen: () => void;
  onOpenActions: () => void;
  property?: Property;
}) {
  const category = getCategoryPresentation(document.category);
  const metadata = [
    `Updated ${formatDocumentDate(document.date)}`,
    document.size,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <View className="flex-row items-start gap-2 p-4">
        <TouchableOpacity
          accessibilityHint="Opens the document"
          accessibilityLabel={[
            document.name,
            property?.title,
            lessee?.name,
            document.category,
            metadata,
          ]
            .filter(Boolean)
            .join(", ")}
          accessibilityRole="button"
          activeOpacity={0.78}
          className="min-w-0 flex-1 flex-row items-start gap-3"
          onPress={onOpen}
        >
          <View
            className="h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: category.backgroundColor }}
          >
            <MaterialCommunityIcons
              name={getDocumentIcon(document.type)}
              color={category.color}
              size={25}
            />
            <Text
              className="mt-0.5 font-soraBold text-[9px]"
              style={{ color: category.color }}
            >
              {document.type}
            </Text>
          </View>

          <View className="min-w-0 flex-1 py-0.5">
            <Text
              className="pr-1 font-soraBold text-[16px] leading-6 text-slate-950"
              numberOfLines={2}
            >
              {document.name}
            </Text>

            {property ? (
              <View className="mt-2 flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="office-building-outline"
                  color="#64748B"
                  size={16}
                />
                <Text
                  className="min-w-0 flex-1 font-sora text-xs text-slate-500"
                  numberOfLines={1}
                >
                  {property.title}
                </Text>
              </View>
            ) : null}

            {lessee ? (
              <View className="mt-1.5 flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="account-outline"
                  color="#64748B"
                  size={16}
                />
                <Text
                  className="min-w-0 flex-1 font-sora text-xs text-slate-500"
                  numberOfLines={1}
                >
                  {lessee.name}
                </Text>
              </View>
            ) : null}

            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View
                className="rounded-lg border px-2.5 py-1"
                style={{
                  backgroundColor: category.backgroundColor,
                  borderColor: `${category.color}33`,
                }}
              >
                <Text
                  className="font-soraBold text-[10px]"
                  style={{ color: category.color }}
                >
                  {category.label}
                </Text>
              </View>
              <Text className="font-sora text-[11px] text-slate-500">
                {metadata}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel={`More actions for ${document.name}`}
          accessibilityRole="button"
          activeOpacity={0.75}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white"
          onPress={onOpenActions}
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            color="#0F172A"
            size={21}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
