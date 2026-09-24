import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Share, Text, TouchableOpacity, View } from "react-native";

import {
  DocumentActionSheet,
} from "../../components/documents/DocumentSheets";
import { DeletionImpactSheet } from "../../components/governance/DeletionImpactSheet";
import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { DocumentCard } from "../../components/documents/DocumentCard";
import { DocumentModuleState } from "../../components/documents/DocumentModuleState";
import { DocumentFilterSheet } from "../../components/documents/DocumentFilterSheet";
import { DocumentFormModal } from "../../components/documents/DocumentFormModal";
import { DocumentsHeader } from "../../components/documents/DocumentsHeader";
import { DocumentsToolbar } from "../../components/documents/DocumentsToolbar";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useDocumentLibrary } from "../../hooks/documents/useDocumentLibrary";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useAccess } from "../../hooks/auth/useAccess";
import { useDeletionGovernance, useRestoreGovernedRecord } from "../../hooks/useDeletionGovernance";
import type { DocumentUpload, PropertyDocument } from "../../types";
import { chooseDocumentFile } from "../../utils/documents/documentFiles";
import {
  createDocumentFormValues,
  EMPTY_DOCUMENT_FORM,
  hasDocumentFormErrors,
  type DocumentFormErrors,
  type DocumentFormValues,
  validateDocumentForm,
} from "../../utils/documents/documentForm";
import {
  buildDocumentLookup,
  countAdvancedFilters,
  EMPTY_DOCUMENT_FILTERS,
  filterAndSortDocuments,
  type DocumentAdvancedFilters,
  type DocumentCategoryFilter,
} from "../../utils/documents/documentPresentation";

export default function DocumentsScreen() {
  const { access } = useAccess();
  const [archiveState, setArchiveState] = useState<"active" | "archived">("active");
  const params = useLocalSearchParams<{ action?: string; tenantId?: string }>();
  const {
    documents,
    isError,
    isLoading,
    isSaving,
    lessees,
    properties,
    refresh,
    saveDocument,
    storageRemainingLabel,
  } = useDocumentLibrary(undefined, archiveState);

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<DocumentCategoryFilter>("All");
  const [filters, setFilters] = useState<DocumentAdvancedFilters>(
    EMPTY_DOCUMENT_FILTERS,
  );
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [actionTarget, setActionTarget] = useState<PropertyDocument | null>(
    null,
  );
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<PropertyDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentUpload | null>(null);
  const [form, setForm] = useState<DocumentFormValues>(EMPTY_DOCUMENT_FORM);
  const [formErrors, setFormErrors] = useState<DocumentFormErrors>({});
  const [formError, setFormError] = useState("");
  const feedbackSnackbar = useSnackbar({ autoHideDuration: 3000 });
  const governance = useDeletionGovernance((impact) =>
    feedbackSnackbar.show(impact.action === "archive" ? "Document archived." : "Document removed."),
  );
  const restoreMutation = useRestoreGovernedRecord(() => feedbackSnackbar.show("Document restored."));

  useEffect(() => {
    if (!params.tenantId) return;

    setFilters((current) => ({ ...current, lesseeId: params.tenantId ?? "" }));
    if (params.action === "add") {
      setEditingDocument(null);
      setSelectedFile(null);
      setForm({ ...EMPTY_DOCUMENT_FORM, lesseeId: params.tenantId });
      setFormErrors({});
      setFormError("");
      setIsFormVisible(true);
    }
  }, [params.action, params.tenantId]);

  const propertyLookup = useMemo(
    () => buildDocumentLookup(properties),
    [properties],
  );
  const lesseeLookup = useMemo(() => buildDocumentLookup(lessees), [lessees]);
  const visibleDocuments = useMemo(
    () =>
      filterAndSortDocuments({
        category,
        documents,
        filters,
        lesseeLookup,
        propertyLookup,
        searchQuery,
        sort: "newest",
      }),
    [category, documents, filters, lesseeLookup, propertyLookup, searchQuery],
  );
  const activeFilterCount =
    countAdvancedFilters(filters) + Number(category !== "All");
  const isFiltered = Boolean(
    searchQuery.trim() || category !== "All" || activeFilterCount,
  );

  function openCreateForm() {
    setEditingDocument(null);
    setSelectedFile(null);
    setForm(EMPTY_DOCUMENT_FORM);
    setFormErrors({});
    setFormError("");
    setIsFormVisible(true);
  }

  function openEditForm(document: PropertyDocument) {
    setActionTarget(null);
    setEditingDocument(document);
    setSelectedFile(null);
    setForm(createDocumentFormValues(document));
    setFormErrors({});
    setFormError("");
    setIsFormVisible(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormVisible(false);
    setEditingDocument(null);
    setSelectedFile(null);
    setForm(EMPTY_DOCUMENT_FORM);
    setFormErrors({});
    setFormError("");
  }

  async function pickFile() {
    setFormError("");
    const result = await chooseDocumentFile();
    if (!result) return;

    if (!result.ok) {
      setFormErrors((current) => ({ ...current, file: result.error }));
      return;
    }

    setSelectedFile(result.file);
    setFormErrors((current) => ({ ...current, file: undefined }));
    if (!form.name.trim()) {
      setForm((current) => ({
        ...current,
        name: result.file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  }

  async function submitForm() {
    const errors = validateDocumentForm({
      editingDocument,
      file: selectedFile,
      values: form,
    });
    setFormErrors(errors);
    setFormError("");
    if (hasDocumentFormErrors(errors)) return;

    try {
      await saveDocument({ editingDocument, file: selectedFile, values: form });
      feedbackSnackbar.show(
        editingDocument ? "Document updated." : "Document uploaded.",
      );
      closeForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "The document could not be saved.",
      );
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setCategory("All");
    setFilters(EMPTY_DOCUMENT_FILTERS);
  }

  return (
    <Screen className="bg-surface">
      <DocumentsHeader
        documentCount={documents.length}
        isLoading={isLoading}
        onUpload={openCreateForm}
        showUpload={archiveState === "active"}
      />
      {access.role === "ADMIN" ? (
        <View className="mb-2 flex-row rounded-2xl bg-primary/10 p-1">
          {(["active", "archived"] as const).map((state) => (
            <TouchableOpacity className={`min-h-10 flex-1 items-center justify-center rounded-xl ${archiveState === state ? "bg-white" : ""}`} key={state} onPress={() => setArchiveState(state)}>
              <Text className="font-ralewayBold text-sm capitalize text-textPrimary">{state}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <PullToRefreshFlatList
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
        data={isLoading || isError ? [] : visibleDocuments}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(document) => document.id}
        ListHeaderComponent={
          <View className="pb-5 pt-6">
            <DocumentsToolbar
              activeFilterCount={activeFilterCount}
              onChangeSearch={setSearchQuery}
              onOpenFilters={() => setIsFilterVisible(true)}
              searchQuery={searchQuery}
            />
          </View>
        }
        ListEmptyComponent={
          <DocumentModuleState
            isError={isError}
            isFiltered={isFiltered}
            isLoading={isLoading}
            onClearFilters={clearFilters}
            onRetry={() => void refresh()}
            onUpload={openCreateForm}
            uploadEnabled={archiveState === "active"}
          />
        }
        onRefresh={refresh}
        renderItem={({ item: document }) => (
          <DocumentCard
            document={document}
            lessee={
              document.lesseeId ? lesseeLookup[document.lesseeId] : undefined
            }
            onOpen={() => void openDocument(document)}
            onOpenActions={() => setActionTarget(document)}
            property={
              document.propertyId
                ? propertyLookup[document.propertyId]
                : undefined
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <DocumentFilterSheet
        category={category}
        filters={filters}
        lessees={lessees}
        onApply={(nextFilters, nextCategory) => {
          setFilters(nextFilters);
          setCategory(nextCategory);
          setIsFilterVisible(false);
        }}
        onClose={() => setIsFilterVisible(false)}
        properties={properties}
        visible={isFilterVisible}
      />
      <DocumentActionSheet
        document={actionTarget}
        onClose={() => setActionTarget(null)}
        onDelete={(document) => {
          setActionTarget(null);
          governance.open({ resource: "documents", id: document.id, label: document.name });
        }}
        onEdit={openEditForm}
        onOpen={(document) => {
          setActionTarget(null);
          void openDocument(document);
        }}
        onShare={(document) => {
          setActionTarget(null);
          void shareDocument(document);
        }}
        onRestore={(document) => {
          setActionTarget(null);
          restoreMutation.mutate({ resource: "documents", id: document.id });
        }}
      />
      <DeletionImpactSheet
        error={governance.error}
        impact={governance.impact}
        isLoading={governance.isLoading}
        isPending={governance.isPending}
        label={governance.target?.label}
        onClose={governance.close}
        onConfirm={governance.confirm}
        onRetry={() => void governance.refetch()}
        visible={Boolean(governance.target)}
      />
      <DocumentFormModal
        editingDocument={editingDocument}
        errors={formErrors}
        form={form}
        formError={formError}
        isSaving={isSaving}
        lessees={lessees}
        onChangeForm={(nextForm) => {
          setForm(nextForm);
          if (nextForm.name.trim()) {
            setFormErrors((current) => ({ ...current, name: undefined }));
          }
        }}
        onClearFile={() => setSelectedFile(null)}
        onClose={closeForm}
        onPickFile={() => void pickFile()}
        onSubmit={() => void submitForm()}
        properties={properties}
        selectedFile={selectedFile}
        storageRemainingLabel={storageRemainingLabel}
        visible={isFormVisible}
      />
      <ScreenSnackbar
        message={feedbackSnackbar.message}
        onDismiss={feedbackSnackbar.dismiss}
      />
    </Screen>
  );
}

async function openDocument(document: PropertyDocument) {
  if (!document.url) {
    Alert.alert(
      "Document unavailable",
      "This document does not have a viewable file URL.",
    );
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(document.url);
    if (!canOpen) {
      Alert.alert(
        "Cannot open document",
        "No app is available to open this document.",
      );
      return;
    }
    await Linking.openURL(document.url);
  } catch {
    Alert.alert("Cannot open document", "The document could not be opened.");
  }
}

async function shareDocument(document: PropertyDocument) {
  if (!document.url) return;

  try {
    await Share.share({
      message: `${document.name}\n${document.url}`,
      title: document.name,
      url: document.url,
    });
  } catch {
    Alert.alert(
      "Cannot share document",
      "The share sheet could not be opened.",
    );
  }
}
