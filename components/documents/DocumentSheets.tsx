import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { ModalHeader } from "../ui/ModalHeader";
import type { PropertyDocument } from "../../types";
import {
  DOCUMENT_SORT_OPTIONS,
  type DocumentSort,
} from "../../utils/documents/documentPresentation";

export function DocumentSortSheet({
  onClose,
  onSelect,
  selectedSort,
  visible,
}: {
  onClose: () => void;
  onSelect: (sort: DocumentSort) => void;
  selectedSort: DocumentSort;
  visible: boolean;
}) {
  return (
    <BottomSheet onClose={onClose} title="Sort documents" visible={visible}>
      <View className="gap-2">
        {DOCUMENT_SORT_OPTIONS.map((option) => {
          const isSelected = option.value === selectedSort;

          return (
            <TouchableOpacity
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              activeOpacity={0.8}
              className={`min-h-14 flex-row items-center rounded-2xl px-4 ${
                isSelected ? "bg-primary/10" : "bg-surface"
              }`}
              onPress={() => onSelect(option.value)}
            >
              <Text
                className={`min-w-0 flex-1 font-ralewayBold text-sm ${
                  isSelected ? "text-primary" : "text-textPrimary"
                }`}
              >
                {option.label}
              </Text>
              {isSelected ? (
                <MaterialCommunityIcons
                  name="check-circle"
                  color="#8A77F4"
                  size={21}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}

export function DocumentActionSheet({
  document,
  onClose,
  onDelete,
  onEdit,
  onOpen,
  onRestore,
  onShare,
}: {
  document: PropertyDocument | null;
  onClose: () => void;
  onDelete: (document: PropertyDocument) => void;
  onEdit: (document: PropertyDocument) => void;
  onOpen: (document: PropertyDocument) => void;
  onRestore: (document: PropertyDocument) => void;
  onShare: (document: PropertyDocument) => void;
}) {
  const actions: ActionSheetItem[] = document
    ? document.archivedAt
      ? [{
          description: "Return this document to the active library.",
          icon: "restore",
          label: "Restore document",
          permission: "documents.restore" as const,
          onPress: () => onRestore(document),
        }]
      : [
        {
          description: "View this file in a supported app.",
          disabled: !document.url,
          icon: "file-eye-outline",
          label: "Open document",
          onPress: () => onOpen(document),
        },
        {
          description: "Share this document using another app.",
          disabled: !document.url,
          icon: "share-variant-outline",
          label: "Share document",
          onPress: () => onShare(document),
        },
        {
          description: "Update details or replace the uploaded file.",
          icon: "file-edit-outline",
          label: "Edit or replace",
          permission: "documents.update" as const,
          propertyId: document.propertyId,
          onPress: () => onEdit(document),
        },
        {
          description: "Archive this document while retaining its file history.",
          destructive: true,
          icon: "trash-can-outline",
          label: "Archive document",
          permission: "documents.archive" as const,
          propertyId: document.propertyId,
          onPress: () => onDelete(document),
        },
      ]
    : [];

  return (
    <ActionSheet
      actions={actions}
      onClose={onClose}
      subtitle={document?.name}
      title="Document actions"
      visible={Boolean(document)}
    />
  );
}

function BottomSheet({
  children,
  onClose,
  subtitle,
  title,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  subtitle?: string;
  title: string;
  visible: boolean;
}) {
  return (
    <BottomSheetModal
      backdropAccessibilityLabel={`Close ${title}`}
      onClose={onClose}
      visible={visible}
    >
      <SafeAreaView
        accessibilityViewIsModal
        className="rounded-t-[30px] bg-white"
        edges={["bottom"]}
      >
        <ModalHeader
          closeAccessibilityLabel={`Close ${title}`}
          onClose={onClose}
          subtitle={subtitle}
          title={title}
        />
        <View className="px-5 pb-4 pt-5">{children}</View>
      </SafeAreaView>
    </BottomSheetModal>
  );
}
