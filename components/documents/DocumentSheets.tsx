import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";
import { BottomSheetModal } from "../ui/BottomSheetModal";
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
  onShare,
}: {
  document: PropertyDocument | null;
  onClose: () => void;
  onDelete: (document: PropertyDocument) => void;
  onEdit: (document: PropertyDocument) => void;
  onOpen: (document: PropertyDocument) => void;
  onShare: (document: PropertyDocument) => void;
}) {
  const actions: ActionSheetItem[] = document
    ? [
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
          onPress: () => onEdit(document),
        },
        {
          description: "Permanently remove this document.",
          destructive: true,
          icon: "trash-can-outline",
          label: "Delete document",
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

export function DeleteDocumentSheet({
  document,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  document: PropertyDocument | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (document: PropertyDocument) => void;
}) {
  return (
    <BottomSheet
      onClose={onCancel}
      title="Delete document?"
      visible={Boolean(document)}
    >
      <Text className="font-ralewayMedium text-sm leading-6 text-description">
        “{document?.name ?? "This document"}” will be permanently removed from
        your library. This action can’t be undone.
      </Text>
      <View className="mt-5 flex-row gap-3">
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.82}
          className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-primary bg-white"
          disabled={isDeleting}
          onPress={onCancel}
        >
          <Text className="font-ralewayBold text-base text-primary">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.82}
          className="min-h-14 flex-1 items-center justify-center rounded-2xl bg-danger"
          disabled={isDeleting}
          onPress={() => document && onConfirm(document)}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-ralewayBold text-base text-white">
              Delete
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
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
        className="rounded-t-[30px] bg-white px-5 pb-4 pt-3"
        edges={["bottom"]}
      >
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-primary/30" />
        <View className="mb-5 flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text
              accessibilityRole="header"
              className="font-ralewayExtraBold text-xl text-textPrimary"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="mt-1 font-ralewayMedium text-xs text-description"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            accessibilityLabel="Close"
            accessibilityRole="button"
            activeOpacity={0.75}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/10"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#8A77F4" size={21} />
          </TouchableOpacity>
        </View>
        {children}
      </SafeAreaView>
    </BottomSheetModal>
  );
}
