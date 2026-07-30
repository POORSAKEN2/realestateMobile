import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  Share,
  View,
} from "react-native";

import {
  DocumentActionSheet,
  DeleteDocumentSheet,
  DocumentSortSheet,
} from "../../components/documents/DocumentSheets";
import { DocumentCard } from "../../components/documents/DocumentCard";
import {
  DocumentFeedbackToast,
  DocumentModuleState,
} from "../../components/documents/DocumentModuleState";
import { DocumentFilterSheet } from "../../components/documents/DocumentFilterSheet";
import { DocumentFormModal } from "../../components/documents/DocumentFormModal";
import { DocumentsHeader } from "../../components/documents/DocumentsHeader";
import { DocumentsToolbar } from "../../components/documents/DocumentsToolbar";
import { Screen } from "../../components/ui/Screen";
import { useDocumentLibrary } from "../../hooks/documents/useDocumentLibrary";
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
  DOCUMENT_SORT_OPTIONS,
  EMPTY_DOCUMENT_FILTERS,
  filterAndSortDocuments,
  type DocumentAdvancedFilters,
  type DocumentCategoryFilter,
  type DocumentSort,
} from "../../utils/documents/documentPresentation";

export default function DocumentsScreen() {
  const {
    deleteDocument,
    documents,
    isDeleting,
    isError,
    isLoading,
    isRefreshing,
    isSaving,
    lessees,
    properties,
    refresh,
    saveDocument,
  } = useDocumentLibrary();

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<DocumentCategoryFilter>("All");
  const [filters, setFilters] = useState<DocumentAdvancedFilters>(
    EMPTY_DOCUMENT_FILTERS,
  );
  const [sort, setSort] = useState<DocumentSort>("newest");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [actionTarget, setActionTarget] = useState<PropertyDocument | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PropertyDocument | null>(
    null,
  );
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<PropertyDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentUpload | null>(null);
  const [form, setForm] = useState<DocumentFormValues>(EMPTY_DOCUMENT_FORM);
  const [formErrors, setFormErrors] = useState<DocumentFormErrors>({});
  const [formError, setFormError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

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
        sort,
      }),
    [
      category,
      documents,
      filters,
      lesseeLookup,
      propertyLookup,
      searchQuery,
      sort,
    ],
  );
  const activeFilterCount = countAdvancedFilters(filters);
  const sortLabel =
    DOCUMENT_SORT_OPTIONS.find(({ value }) => value === sort)?.label ??
    "Newest";
  const isFiltered = Boolean(
    searchQuery.trim() || category !== "All" || activeFilterCount,
  );

  useEffect(() => {
    if (!feedbackMessage) return;
    const timeout = setTimeout(() => setFeedbackMessage(""), 3000);
    return () => clearTimeout(timeout);
  }, [feedbackMessage]);

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
      setFeedbackMessage(
        editingDocument ? "Document updated" : "Document uploaded",
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

  async function confirmDelete(document: PropertyDocument) {
    try {
      await deleteDocument(document.id);
      setDeleteTarget(null);
      setFeedbackMessage("Document deleted");
    } catch (error) {
      Alert.alert(
        "Cannot delete document",
        error instanceof Error
          ? error.message
          : "The document could not be deleted.",
      );
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setCategory("All");
    setFilters(EMPTY_DOCUMENT_FILTERS);
  }

  return (
    <Screen className="bg-slate-50">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
        data={isLoading || isError ? [] : visibleDocuments}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(document) => document.id}
        ListHeaderComponent={
          <View className="gap-6 pb-5">
            <DocumentsHeader
              documentCount={documents.length}
              onUpload={openCreateForm}
            />
            <DocumentsToolbar
              activeFilterCount={activeFilterCount}
              category={category}
              onChangeCategory={setCategory}
              onChangeSearch={setSearchQuery}
              onOpenFilters={() => setIsFilterVisible(true)}
              onOpenSort={() => setIsSortVisible(true)}
              resultCount={visibleDocuments.length}
              searchQuery={searchQuery}
              sortLabel={sortLabel}
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
          />
        }
        refreshControl={
          <RefreshControl
            colors={["#2563EB"]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing && !isLoading}
            tintColor="#2563EB"
          />
        }
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
        filters={filters}
        lessees={lessees}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setIsFilterVisible(false);
        }}
        onClose={() => setIsFilterVisible(false)}
        properties={properties}
        visible={isFilterVisible}
      />
      <DocumentSortSheet
        onClose={() => setIsSortVisible(false)}
        onSelect={(nextSort) => {
          setSort(nextSort);
          setIsSortVisible(false);
        }}
        selectedSort={sort}
        visible={isSortVisible}
      />
      <DocumentActionSheet
        document={actionTarget}
        onClose={() => setActionTarget(null)}
        onDelete={(document) => {
          setActionTarget(null);
          setDeleteTarget(document);
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
      />
      <DeleteDocumentSheet
        document={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(document) => void confirmDelete(document)}
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
        visible={isFormVisible}
      />
      <DocumentFeedbackToast message={feedbackMessage} />
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
