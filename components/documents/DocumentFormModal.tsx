import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type {
  DocumentUpload,
  Lessee,
  Property,
  PropertyDocument,
} from "../../types";
import type {
  DocumentFormErrors,
  DocumentFormValues,
} from "../../utils/documents/documentForm";
import { DOCUMENT_CATEGORIES } from "../../utils/documents/documentPresentation";
import {
  SearchableOptionSelector,
  SelectionField,
} from "./SearchableOptionSelector";
import { FormSection } from "../ui/forms/FormSection";

type SelectorMode = "property" | "tenant" | null;

export function DocumentFormModal({
  editingDocument,
  errors,
  form,
  formError,
  isSaving,
  lessees,
  onChangeForm,
  onClearFile,
  onClose,
  onPickFile,
  onSubmit,
  properties,
  selectedFile,
  visible,
}: {
  editingDocument: PropertyDocument | null;
  errors: DocumentFormErrors;
  form: DocumentFormValues;
  formError: string;
  isSaving: boolean;
  lessees: Lessee[];
  onChangeForm: (form: DocumentFormValues) => void;
  onClearFile: () => void;
  onClose: () => void;
  onPickFile: () => void;
  onSubmit: () => void;
  properties: Property[];
  selectedFile: DocumentUpload | null;
  visible: boolean;
}) {
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [selectorQuery, setSelectorQuery] = useState("");

  useEffect(() => {
    if (!visible) return;
    setSelectorMode(null);
    setSelectorQuery("");
  }, [visible]);

  const propertyOptions = useMemo(
    () => properties.map(({ id, title }) => ({ id, label: title })),
    [properties],
  );
  const tenantOptions = useMemo(
    () => lessees.map(({ id, name }) => ({ id, label: name })),
    [lessees],
  );
  const selectedProperty = propertyOptions.find(
    ({ id }) => id === form.propertyId,
  );
  const selectedTenant = tenantOptions.find(({ id }) => id === form.lesseeId);
  const selectorOptions =
    selectorMode === "property" ? propertyOptions : tenantOptions;
  const selectedId =
    selectorMode === "property" ? form.propertyId : form.lesseeId;
  const canSubmit =
    Boolean(form.name.trim()) &&
    Boolean(editingDocument || selectedFile) &&
    !isSaving;

  function closeSelector() {
    setSelectorMode(null);
    setSelectorQuery("");
  }

  function handleClose() {
    if (selectorMode) {
      closeSelector();
      return;
    }
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-slate-950/45"
      >
        <View
          accessibilityViewIsModal
          className="max-h-[94%] min-h-[620px] overflow-hidden rounded-t-[30px] bg-[#F5F7FC]"
        >
          <View className="pt-3">
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-slate-300" />
          </View>

          {selectorMode ? (
            <SearchableOptionSelector
              backAccessibilityLabel="Back to document form"
              emptyLabel={
                selectorMode === "property"
                  ? "No property link"
                  : "No tenant link"
              }
              onBack={closeSelector}
              onChangeQuery={setSelectorQuery}
              onSelect={(id) => {
                onChangeForm({
                  ...form,
                  [selectorMode === "property" ? "propertyId" : "lesseeId"]: id,
                });
                closeSelector();
              }}
              options={selectorOptions}
              query={selectorQuery}
              selectedId={selectedId}
              title={
                selectorMode === "property"
                  ? "Choose property"
                  : "Choose tenant"
              }
            />
          ) : (
            <>
              <View className="flex-row items-center justify-between bg-white px-6 pb-5 pt-2">
                <View className="min-w-0 flex-1 pr-3">
                  <Text
                    accessibilityRole="header"
                    className="font-soraSemiBold text-[28px] leading-9 tracking-tight text-slate-950"
                  >
                    {editingDocument ? "Edit document" : "Upload document"}
                  </Text>
                  <Text className="mt-2 font-sora text-sm leading-5 text-slate-500">
                    {editingDocument
                      ? "Update its details or choose a replacement file."
                      : "Organize a file by category, property, and tenant."}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Close document form"
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  className="h-11 w-11 items-center justify-center rounded-full bg-transparent"
                  onPress={onClose}
                >
                  <MaterialCommunityIcons
                    name="close"
                    color="#334155"
                    size={21}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerClassName="gap-4 p-5"
                keyboardShouldPersistTaps="handled"
              >
                {formError ? (
                  <View
                    accessibilityLiveRegion="assertive"
                    accessibilityRole="alert"
                    className="rounded-2xl bg-red-50 px-4 py-3"
                  >
                    <Text className="font-soraSemiBold text-sm text-red-700">
                      {formError}
                    </Text>
                  </View>
                ) : null}

                <FormSection
                  icon="file-upload-outline"
                  title="Document file"
                  variant="card"
                >
                  <FileField
                    editingDocument={editingDocument}
                    error={errors.file}
                    onClear={onClearFile}
                    onPick={onPickFile}
                    selectedFile={selectedFile}
                  />
                </FormSection>

                <FormSection
                  icon="file-document-edit-outline"
                  title="Document details"
                  variant="card"
                >
                  <View className="gap-2">
                    <FieldLabel label="Name" required />
                    <TextInput
                      accessibilityLabel="Document name, required"
                      className={`min-h-14 rounded-2xl border bg-slate-50 px-4 py-3 font-sora text-base text-slate-950 ${
                        errors.name ? "border-red-400" : "border-slate-200"
                      }`}
                      onChangeText={(name) => onChangeForm({ ...form, name })}
                      placeholder="Document name"
                      placeholderTextColor="#94A3B8"
                      value={form.name}
                    />
                    {errors.name ? (
                      <Text
                        accessibilityLiveRegion="assertive"
                        className="font-soraMedium text-xs text-red-600"
                      >
                        {errors.name}
                      </Text>
                    ) : null}
                  </View>

                  <View className="gap-2">
                    <FieldLabel label="Category" />
                    <View className="flex-row flex-wrap gap-2">
                      {DOCUMENT_CATEGORIES.map((category) => {
                        const isSelected = form.category === category;
                        return (
                          <TouchableOpacity
                            key={category}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                            activeOpacity={0.8}
                            className={`min-h-11 justify-center rounded-2xl border px-4 ${
                              isSelected
                                ? "border-[#2563EB] bg-[#2563EB]"
                                : "border-slate-200 bg-slate-50"
                            }`}
                            onPress={() => onChangeForm({ ...form, category })}
                          >
                            <Text
                              className={`font-soraSemiBold text-xs ${
                                isSelected ? "text-white" : "text-slate-600"
                              }`}
                            >
                              {category}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <SelectionField
                    label="Property"
                    onPress={() => setSelectorMode("property")}
                    value={selectedProperty?.label ?? "No property link"}
                  />
                  <SelectionField
                    label="Tenant"
                    onPress={() => setSelectorMode("tenant")}
                    value={selectedTenant?.label ?? "No tenant link"}
                  />

                  {editingDocument && selectedFile ? (
                    <View className="gap-2">
                      <FieldLabel label="Version note" />
                      <TextInput
                        accessibilityLabel="Version note"
                        className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-sora text-base text-slate-950"
                        multiline
                        onChangeText={(revisionComment) =>
                          onChangeForm({ ...form, revisionComment })
                        }
                        placeholder="For example: Signed copy uploaded"
                        placeholderTextColor="#94A3B8"
                        textAlignVertical="top"
                        value={form.revisionComment}
                      />
                    </View>
                  ) : null}
                </FormSection>
              </ScrollView>

              <View className="flex-row gap-3 border-t border-slate-200 bg-white p-5 pb-8">
                <TouchableOpacity
                  accessibilityLabel="Cancel document form"
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  className={`min-h-14 flex-1 items-center justify-center rounded-2xl border border-[#2563EB] bg-white ${
                    isSaving ? "opacity-60" : ""
                  }`}
                  disabled={isSaving}
                  onPress={onClose}
                >
                  <Text className="font-soraSemiBold text-base text-[#2563EB]">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canSubmit }}
                  activeOpacity={0.85}
                  className={`min-h-14 flex-1 items-center justify-center rounded-2xl bg-blue-600 ${
                    canSubmit ? "" : "opacity-40"
                  }`}
                  disabled={!canSubmit}
                  onPress={onSubmit}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="font-soraSemiBold text-base text-white">
                      {editingDocument ? "Save changes" : "Upload document"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FileField({
  editingDocument,
  error,
  onClear,
  onPick,
  selectedFile,
}: {
  editingDocument: PropertyDocument | null;
  error?: string;
  onClear: () => void;
  onPick: () => void;
  selectedFile: DocumentUpload | null;
}) {
  return (
    <View className="gap-2">
      <FieldLabel label="File" required={!editingDocument} />
      <View
        className={`flex-row items-center gap-2 rounded-2xl border border-dashed bg-blue-50 p-2 ${
          error ? "border-red-400" : "border-blue-300"
        }`}
      >
        <TouchableOpacity
          accessibilityLabel={
            selectedFile
              ? `Replace ${selectedFile.name}`
              : "Choose document file"
          }
          accessibilityRole="button"
          activeOpacity={0.82}
          className="min-h-14 min-w-0 flex-1 flex-row items-center gap-3 px-2"
          onPress={onPick}
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            <MaterialCommunityIcons
              name={
                selectedFile ? "file-check-outline" : "cloud-upload-outline"
              }
              color="#2563EB"
              size={23}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="font-soraBold text-sm text-slate-950"
              numberOfLines={1}
            >
              {selectedFile
                ? selectedFile.name
                : editingDocument
                  ? "Choose replacement file"
                  : "Choose file"}
            </Text>
            <Text className="mt-1 font-sora text-xs text-slate-500">
              {selectedFile
                ? formatFileSize(selectedFile.size)
                : editingDocument
                  ? "Leave unchanged to keep the current file"
                  : "PDF, DOC, DOCX, JPG, or PNG · 10 MB max"}
            </Text>
          </View>
        </TouchableOpacity>
        {selectedFile ? (
          <TouchableOpacity
            accessibilityLabel={`Remove ${selectedFile.name}`}
            accessibilityRole="button"
            activeOpacity={0.75}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
            onPress={onClear}
          >
            <MaterialCommunityIcons name="close" color="#64748B" size={19} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="assertive"
          className="font-soraMedium text-xs text-red-600"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text className="font-soraMedium text-sm text-slate-600">
      {label}
      {required ? <Text className="text-red-600"> *</Text> : null}
    </Text>
  );
}

function formatFileSize(size?: number | null) {
  if (!size) return "Selected file";
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${Math.round(size / 1_000)} KB`;
  return `${size} B`;
}
