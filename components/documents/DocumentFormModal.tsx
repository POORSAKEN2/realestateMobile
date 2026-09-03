import { useAccess } from "../../hooks/auth/useAccess";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { BottomSheetModal } from "../ui/BottomSheetModal";
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
import { FormActionRow } from "../ui/forms/FormActionRow";
import { ModalActionFooter } from "../ui/ModalActionFooter";
import { ModalHeader } from "../ui/ModalHeader";
import { DocumentFileField } from "./DocumentFileField";

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
  const { can } = useAccess();
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
    <BottomSheetModal
      backdropAccessibilityLabel="Close document form"
      closeOnBackdropPress={false}
      keyboardAvoiding
      onClose={handleClose}
      visible={visible}
    >
      <View
        accessibilityViewIsModal
        className="max-h-[94%] min-h-[620px] overflow-hidden rounded-t-[30px] bg-surface"
      >
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
              selectorMode === "property" ? "Choose property" : "Choose tenant"
            }
          />
        ) : (
          <>
            <ModalHeader
              closeAccessibilityLabel="Close document form"
              onClose={onClose}
              subtitle={
                editingDocument
                  ? "Update its details or choose a replacement file."
                  : "Organize a file by category, property, and tenant."
              }
              title={editingDocument ? "Edit document" : "Upload document"}
            />

            <ScrollView
              contentContainerClassName="gap-4 p-5"
              keyboardShouldPersistTaps="handled"
            >
              {formError ? (
                <View
                  accessibilityLiveRegion="assertive"
                  accessibilityRole="alert"
                  className="rounded-2xl bg-dangerSurface px-4 py-3"
                >
                  <Text className="font-ralewayBold text-sm text-danger">
                    {formError}
                  </Text>
                </View>
              ) : null}

              <FormSection
                icon="file-upload-outline"
                title="Document file"
                variant="card"
              >
                <DocumentFileField
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
                    className={`min-h-14 rounded-2xl border bg-surface px-4 py-3 font-ralewayMedium text-base text-textPrimary ${
                      errors.name ? "border-danger" : "border-textPrimary/10"
                    }`}
                    onChangeText={(name) => onChangeForm({ ...form, name })}
                    placeholder="Document name"
                    placeholderTextColor="#6F6D6D"
                    value={form.name}
                  />
                  {errors.name ? (
                    <Text
                      accessibilityLiveRegion="assertive"
                      className="font-ralewaySemiBold text-xs text-danger"
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
                              ? "border-primary bg-primary"
                              : "border-textPrimary/10 bg-surface"
                          }`}
                          onPress={() => onChangeForm({ ...form, category })}
                        >
                          <Text
                            className={`font-ralewayBold text-xs ${
                              isSelected ? "text-white" : "text-description"
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
                      className="min-h-24 rounded-2xl border border-textPrimary/10 bg-surface px-4 py-3 font-ralewayMedium text-base text-textPrimary"
                      multiline
                      onChangeText={(revisionComment) =>
                        onChangeForm({ ...form, revisionComment })
                      }
                      placeholder="For example: Signed copy uploaded"
                      placeholderTextColor="#6F6D6D"
                      textAlignVertical="top"
                      value={form.revisionComment}
                    />
                  </View>
                ) : null}
              </FormSection>
            </ScrollView>

            <ModalActionFooter>
              <FormActionRow
                appearance="card"
                isPending={isSaving}
                onCancel={onClose}
                onSubmit={onSubmit}
                submitDisabled={!canSubmit || !can(editingDocument ? "documents.update" : "documents.create", form.propertyId || undefined)}
                submitText={
                  editingDocument ? "Save changes" : "Upload document"
                }
              />
            </ModalActionFooter>
          </>
        )}
      </View>
    </BottomSheetModal>
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
    <Text className="font-ralewaySemiBold text-sm text-description">
      {label}
      {required ? <Text className="text-danger"> *</Text> : null}
    </Text>
  );
}
