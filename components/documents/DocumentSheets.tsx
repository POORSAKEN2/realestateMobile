import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
                isSelected ? "bg-blue-50" : "bg-slate-50"
              }`}
              onPress={() => onSelect(option.value)}
            >
              <Text
                className={`min-w-0 flex-1 font-ralewayBold text-sm ${
                  isSelected ? "text-blue-700" : "text-slate-700"
                }`}
              >
                {option.label}
              </Text>
              {isSelected ? (
                <MaterialCommunityIcons
                  name="check-circle"
                  color="#2563EB"
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
  return (
    <BottomSheet
      onClose={onClose}
      subtitle={document?.name}
      title="Document actions"
      visible={Boolean(document)}
    >
      {document ? (
        <View className="gap-2">
          <ActionRow
            disabled={!document.url}
            icon="file-eye-outline"
            label="Open document"
            onPress={() => onOpen(document)}
          />
          <ActionRow
            disabled={!document.url}
            icon="share-variant-outline"
            label="Share document"
            onPress={() => onShare(document)}
          />
          <ActionRow
            icon="file-edit-outline"
            label="Edit or replace"
            onPress={() => onEdit(document)}
          />
          <ActionRow
            destructive
            icon="trash-can-outline"
            label="Delete document"
            onPress={() => onDelete(document)}
          />
        </View>
      ) : null}
    </BottomSheet>
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
      <Text className="font-ralewayMedium text-sm leading-6 text-slate-500">
        “{document?.name ?? "This document"}” will be permanently removed from
        your library. This action can’t be undone.
      </Text>
      <View className="mt-5 flex-row gap-3">
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.82}
          className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-100"
          disabled={isDeleting}
          onPress={onCancel}
        >
          <Text className="font-ralewayExtraBold text-sm text-slate-700">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.82}
          className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-red-600"
          disabled={isDeleting}
          onPress={() => document && onConfirm(document)}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-ralewayExtraBold text-sm text-white">Delete</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

function ActionRow({
  destructive = false,
  disabled = false,
  icon,
  label,
  onPress,
}: {
  destructive?: boolean;
  disabled?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const color = destructive ? "#DC2626" : disabled ? "#94A3B8" : "#334155";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
      className={`min-h-14 flex-row items-center gap-3 rounded-2xl px-4 ${
        destructive ? "bg-red-50" : "bg-slate-50"
      } ${disabled ? "opacity-60" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} color={color} size={21} />
      <Text
        className={`font-ralewayBold text-sm ${
          destructive ? "text-red-700" : "text-slate-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end bg-slate-950/45">
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          className="flex-1"
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          className="rounded-t-[30px] bg-white px-5 pb-8 pt-3"
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-slate-300" />
          <View className="mb-5 flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text
                accessibilityRole="header"
                className="font-ralewayExtraBold text-xl text-slate-950"
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  className="mt-1 font-ralewayMedium text-xs text-slate-500"
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
              className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" color="#334155" size={21} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
