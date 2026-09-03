import { PermissionGate } from "../auth/PermissionGate";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type { TenantNote, TenantNoteCategory } from "../../types";
import { formatTenantDetailDate } from "../../utils/tenants/tenantDetails";
import { SkeletonBlock, SkeletonGroup } from "../ui/Skeleton";
import { DetailError, TenantSection } from "./TenantFinancialLedgerSection";

const CATEGORY_STYLES: Record<
  TenantNoteCategory,
  { backgroundColor: string; color: string }
> = {
  Behavior: { backgroundColor: "#FDE2E2", color: "#B42318" },
  Financial: { backgroundColor: "#FFF0DD", color: "#B85D0A" },
  General: { backgroundColor: "#EEEAFE", color: "#6952DB" },
  Maintenance: { backgroundColor: "#D8F3EA", color: "#157457" },
};

export function TenantNotesSection({
  error,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  notes,
  onAdd,
  onDelete,
  onEdit,
  onLoadMore,
}: {
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  notes: TenantNote[];
  onAdd: () => void;
  onDelete: (note: TenantNote) => void;
  onEdit: (note: TenantNote) => void;
  onLoadMore: () => void;
}) {
  return (
    <TenantSection icon="reader-outline" title="Internal logs & notes">
      <View className="mb-3 flex-row justify-end">
        <PermissionGate permission="tenant-notes.create"><TouchableOpacity
          accessibilityLabel="Add internal note"
          accessibilityRole="button"
          activeOpacity={0.75}
          className="min-h-10 flex-row items-center gap-2 rounded-xl border border-primary px-3"
          onPress={onAdd}
        >
          <Ionicons color="#8A77F4" name="add" size={17} />
          <Text className="font-ralewayBold text-xs text-secondary">
            Add note
          </Text>
        </TouchableOpacity></PermissionGate>
      </View>

      {isLoading ? (
        <SkeletonGroup
          accessibilityLabel="Loading internal notes"
          className="gap-2"
        >
          {Array.from({ length: 2 }, (_, index) => (
            <SkeletonBlock className="h-28 rounded-2xl" key={index} />
          ))}
        </SkeletonGroup>
      ) : error ? (
        <DetailError message="Internal notes could not be loaded." />
      ) : notes.length ? (
        <View className="overflow-hidden rounded-2xl border border-primary/20 bg-white">
          {notes.map((note, index) => (
            <NoteRow
              key={note.id}
              note={note}
              onDelete={() => onDelete(note)}
              onEdit={() => onEdit(note)}
              showDivider={index > 0}
            />
          ))}
          {hasNextPage ? (
            <TouchableOpacity
              accessibilityLabel="Load more internal notes"
              accessibilityRole="button"
              className="min-h-12 items-center justify-center border-t border-primary/10"
              disabled={isFetchingNextPage}
              onPress={onLoadMore}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator color="#8A77F4" size="small" />
              ) : (
                <Text className="font-ralewayBold text-xs text-secondary">
                  Load more notes
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View className="items-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-7">
          <Ionicons color="#8A77F4" name="reader-outline" size={30} />
          <Text className="mt-2 font-ralewayBold text-sm text-textPrimary">
            No internal notes
          </Text>
          <Text className="mt-1 text-center font-ralewayMedium text-xs text-description">
            Add an editable note for information your team needs to retain.
          </Text>
        </View>
      )}
    </TenantSection>
  );
}

function NoteRow({
  note,
  onDelete,
  onEdit,
  showDivider,
}: {
  note: TenantNote;
  onDelete: () => void;
  onEdit: () => void;
  showDivider: boolean;
}) {
  const categoryStyle = CATEGORY_STYLES[note.category];

  return (
    <View className={`p-4 ${showDivider ? "border-t border-primary/10" : ""}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: categoryStyle.backgroundColor }}
            >
              <Text
                className="font-ralewayExtraBold text-[9px] uppercase"
                style={{ color: categoryStyle.color }}
              >
                {note.category}
              </Text>
            </View>
            <Text className="font-ralewaySemiBold text-[11px] text-description">
              {formatTenantDetailDate(note.date)}
            </Text>
          </View>
          <Text className="mt-2 font-ralewayMedium text-sm leading-5 text-textPrimary">
            {note.content}
          </Text>
        </View>
        <View className="flex-row gap-1">
          <PermissionGate permission="tenant-notes.update"><NoteAction
            accessibilityLabel="Edit internal note"
            icon="create-outline"
            onPress={onEdit}
          /></PermissionGate>
          <PermissionGate permission="tenant-notes.delete"><NoteAction
            accessibilityLabel="Delete internal note"
            icon="trash-outline"
            onPress={onDelete}
          /></PermissionGate>
        </View>
      </View>
    </View>
  );
}

function NoteAction({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.75}
      className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10"
      onPress={onPress}
    >
      <Ionicons color="#8A77F4" name={icon} size={16} />
    </TouchableOpacity>
  );
}
