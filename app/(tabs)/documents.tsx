import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  deleteDocument,
  fetchDocuments,
  fetchLessees,
  updateDocument,
  uploadDocument,
} from "../../api/propertyDetails";
import { fetchProperties } from "../../api/properties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import type {
  DocumentCategory,
  DocumentUpload,
  Lessee,
  Property,
  PropertyDocument,
} from "../../types";

type DocumentForm = {
  name: string;
  category: DocumentCategory;
  propertyId: string;
  lesseeId: string;
  revisionComment: string;
};

const categories: DocumentCategory[] = [
  "Leases",
  "Compliance",
  "Maintenance",
  "Contracts",
];

const emptyForm: DocumentForm = {
  name: "",
  category: "Compliance",
  propertyId: "",
  lesseeId: "",
  revisionComment: "",
};

const allowedDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

function getDocumentType(asset: DocumentPicker.DocumentPickerAsset) {
  if (asset.mimeType) return asset.mimeType;

  const extension = asset.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";

  return "application/octet-stream";
}

function toUpload(asset: DocumentPicker.DocumentPickerAsset): DocumentUpload {
  return {
    uri: asset.uri,
    name: asset.name,
    type: getDocumentType(asset),
    size: asset.size,
    file: asset.file,
  };
}

function getCategoryTone(category: string) {
  if (category === "Leases") return ["#0F766E", "#CCFBF1"];
  if (category === "Compliance") return ["#2563EB", "#DBEAFE"];
  if (category === "Maintenance") return ["#B45309", "#FEF3C7"];
  return ["#7C3AED", "#EDE9FE"];
}

function getDocumentIcon(document?: PropertyDocument | null) {
  if (document?.type === "JPG" || document?.type === "PNG") {
    return "file-image-outline";
  }

  if (document?.type === "DOCX") return "file-word-outline";

  return "file-pdf-box";
}

function buildLookup<T extends { id: string }>(items: T[]) {
  return items.reduce<Record<string, T>>((lookup, item) => {
    lookup[item.id] = item;
    return lookup;
  }, {});
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

export default function DocumentsScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    DocumentCategory | "All"
  >("All");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<PropertyDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentUpload | null>(null);
  const [form, setForm] = useState<DocumentForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PropertyDocument | null>(
    null,
  );

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents", accessToken],
    queryFn: () => fetchDocuments(accessToken),
    enabled: Boolean(accessToken),
  });
  const { data: properties = [] } = useQuery({
    queryKey: ["properties", accessToken],
    queryFn: () => fetchProperties(accessToken),
    enabled: Boolean(accessToken),
  });
  const { data: lessees = [] } = useQuery({
    queryKey: ["lessees", accessToken],
    queryFn: () => fetchLessees(accessToken),
    enabled: Boolean(accessToken),
  });

  const propertyLookup = useMemo(() => buildLookup(properties), [properties]);
  const lesseeLookup = useMemo(() => buildLookup(lessees), [lessees]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return documents.filter((document) => {
      const property = document.propertyId
        ? propertyLookup[document.propertyId]
        : undefined;
      const lessee = document.lesseeId
        ? lesseeLookup[document.lesseeId]
        : undefined;
      const searchable = [
        document.name,
        document.category,
        property?.title,
        lessee?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (categoryFilter === "All" || document.category === categoryFilter) &&
        (!query || searchable.includes(query))
      );
    });
  }, [categoryFilter, documents, lesseeLookup, propertyLookup, searchQuery]);

  const stats = useMemo(
    () =>
      categories.map((category) => ({
        category,
        count: documents.filter((document) => document.category === category)
          .length,
      })),
    [documents],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken)
        throw new Error("Please log in before saving documents.");

      const name = form.name.trim();
      if (!name) throw new Error("Document name is required.");

      if (editingDocument) {
        return updateDocument(
          editingDocument.id,
          {
            name,
            category: form.category,
            propertyId: form.propertyId || null,
            lesseeId: form.lesseeId || null,
            file: selectedFile ?? undefined,
            revisionComment: form.revisionComment.trim() || undefined,
          },
          accessToken,
        );
      }

      if (!selectedFile) throw new Error("Choose a file to upload.");

      return uploadDocument(
        {
          name,
          category: form.category,
          propertyId: form.propertyId || undefined,
          lesseeId: form.lesseeId || undefined,
          file: selectedFile,
        },
        accessToken,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      closeForm();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "The document could not be saved.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeleteTarget(null);
    },
    onError: (error) => {
      Alert.alert(
        "Cannot delete document",
        error instanceof Error
          ? error.message
          : "The document could not be deleted.",
      );
    },
  });

  function openCreateForm() {
    setEditingDocument(null);
    setSelectedFile(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormVisible(true);
  }

  function openEditForm(document: PropertyDocument) {
    setEditingDocument(document);
    setSelectedFile(null);
    setForm({
      name: document.name,
      category: categories.includes(document.category as DocumentCategory)
        ? (document.category as DocumentCategory)
        : "Compliance",
      propertyId: document.propertyId ?? "",
      lesseeId: document.lesseeId ?? "",
      revisionComment: "",
    });
    setFormError("");
    setIsFormVisible(true);
  }

  function closeForm() {
    setIsFormVisible(false);
    setEditingDocument(null);
    setSelectedFile(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function pickFile() {
    setFormError("");

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: allowedDocumentTypes,
    });

    if (result.canceled || !result.assets?.length) return;

    const file = toUpload(result.assets[0]);
    setSelectedFile(file);

    if (!form.name.trim()) {
      setForm((current) => ({
        ...current,
        name: file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  }

  const isSaving = saveMutation.isPending;
  const totalDocuments = documents.length;

  return (
    <Screen className="bg-slate-50">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
        data={isLoadingDocuments ? [] : filteredDocuments}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(document) => document.id}
        ListHeaderComponent={
          <View className="gap-5 pb-5">
            <View className="gap-4">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Operations
                  </Text>
                  <Text className="mt-2 text-3xl font-bold text-slate-950">
                    Documents
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-500">
                    Access leases, compliance files, and uploaded property
                    documents from one operational library.
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-600"
                  onPress={openCreateForm}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    color="#FFFFFF"
                    size={24}
                  />
                </TouchableOpacity>
              </View>

              <View className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                <Text className="text-sm font-bold text-slate-950">
                  Library overview
                </Text>
                <View className="mt-4 flex-row flex-wrap gap-3">
                  <View className="min-w-[110px] flex-1 rounded-2xl bg-slate-950 p-4">
                    <Text className="text-2xl font-bold text-white">
                      {totalDocuments}
                    </Text>
                    <Text className="mt-1 text-xs font-semibold text-white/70">
                      Total files
                    </Text>
                  </View>
                  {stats.map(({ category, count }) => {
                    const [color, background] = getCategoryTone(category);

                    return (
                      <TouchableOpacity
                        key={category}
                        activeOpacity={0.8}
                        className="min-w-[110px] flex-1 rounded-2xl p-4"
                        onPress={() => setCategoryFilter(category)}
                        style={{ backgroundColor: background }}
                      >
                        <Text className="text-2xl font-bold" style={{ color }}>
                          {count}
                        </Text>
                        <Text
                          className="mt-1 text-xs font-semibold"
                          style={{ color }}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View className="gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
              <View className="flex-row items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
                <MaterialCommunityIcons
                  name="magnify"
                  color="#64748B"
                  size={20}
                />
                <TextInput
                  className="min-w-0 flex-1 text-sm font-semibold text-slate-950"
                  onChangeText={setSearchQuery}
                  placeholder="Search documents, properties, tenants"
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {(
                    ["All", ...categories] as Array<DocumentCategory | "All">
                  ).map((category) => {
                    const isActive = categoryFilter === category;

                    return (
                      <TouchableOpacity
                        key={category}
                        activeOpacity={0.85}
                        className={`rounded-full px-4 py-2 ${
                          isActive ? "bg-slate-950" : "bg-slate-100"
                        }`}
                        onPress={() => setCategoryFilter(category)}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isActive ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoadingDocuments ? (
            <View className="h-48 items-center justify-center rounded-[28px] border border-slate-200 bg-white">
              <ActivityIndicator color="#2563EB" />
              <Text className="mt-3 text-sm font-semibold text-slate-500">
                Loading documents
              </Text>
            </View>
          ) : (
            <View className="items-center rounded-[28px] border border-dashed border-slate-300 bg-white p-8">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <MaterialCommunityIcons
                  name="file-document-plus-outline"
                  color="#2563EB"
                  size={28}
                />
              </View>
              <Text className="mt-4 text-lg font-bold text-slate-950">
                No documents found
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
                Upload a lease, compliance file, contract, or property document
                to build your operational library.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className="mt-5 rounded-2xl bg-blue-600 px-5 py-3"
                onPress={openCreateForm}
              >
                <Text className="text-sm font-bold text-white">
                  Upload document
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item: document }) => {
          const property = document.propertyId
            ? propertyLookup[document.propertyId]
            : undefined;
          const lessee = document.lesseeId
            ? lesseeLookup[document.lesseeId]
            : undefined;
          const [color, background] = getCategoryTone(document.category);

          return (
            <View className="rounded-[24px] border border-slate-200 bg-white p-4 pb-16 shadow-sm shadow-slate-900/5">
              <View className="flex-row items-start gap-3">
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: background }}
                >
                  <MaterialCommunityIcons
                    name={getDocumentIcon(document)}
                    color={color}
                    size={23}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-base font-bold text-slate-950"
                    numberOfLines={1}
                  >
                    {document.name}
                  </Text>
                  <Text className="mt-1 text-xs font-semibold text-slate-500">
                    {document.type} | {document.size} | {document.date}
                  </Text>
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    <View
                      className="rounded-full px-3 py-1"
                      style={{ backgroundColor: background }}
                    >
                      <Text className="text-[11px] font-bold" style={{ color }}>
                        {document.category}
                      </Text>
                    </View>
                    {property ? (
                      <View className="rounded-full bg-slate-100 px-3 py-1">
                        <Text className="text-[11px] font-bold text-slate-600">
                          {property.title}
                        </Text>
                      </View>
                    ) : null}
                    {lessee ? (
                      <View className="rounded-full bg-slate-100 px-3 py-1">
                        <Text className="text-[11px] font-bold text-slate-600">
                          {lessee.name}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View className="mt-4 flex-row gap-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3"
                  onPress={() => openDocument(document)}
                >
                  <MaterialCommunityIcons
                    name="open-in-new"
                    color="#FFFFFF"
                    size={17}
                  />
                  <Text className="text-xs font-bold text-white">Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100"
                  onPress={() => openEditForm(document)}
                >
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    color="#334155"
                    size={20}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-red-50"
                  onPress={() => setDeleteTarget(document)}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    color="#DC2626"
                    size={20}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      <DocumentFormModal
        editingDocument={editingDocument}
        form={form}
        formError={formError}
        isSaving={isSaving}
        lessees={lessees}
        onChangeForm={setForm}
        onClose={closeForm}
        onPickFile={pickFile}
        onSubmit={() => saveMutation.mutate()}
        properties={properties}
        selectedFile={selectedFile}
        visible={isFormVisible}
      />

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(deleteTarget)}
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View className="flex-1 justify-end bg-slate-950/40 px-4 pb-6">
          <View className="rounded-[28px] bg-white p-5">
            <Text className="text-lg font-bold text-slate-950">
              Delete document?
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              This removes {deleteTarget?.name ?? "this file"} from the document
              library.
            </Text>
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-1 rounded-2xl bg-slate-100 py-3"
                onPress={() => setDeleteTarget(null)}
              >
                <Text className="text-center text-sm font-bold text-slate-600">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-1 rounded-2xl bg-red-600 py-3"
                disabled={deleteMutation.isPending}
                onPress={() =>
                  deleteTarget && deleteMutation.mutate(deleteTarget.id)
                }
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-center text-sm font-bold text-white">
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function DocumentFormModal({
  editingDocument,
  form,
  formError,
  isSaving,
  lessees,
  onChangeForm,
  onClose,
  onPickFile,
  onSubmit,
  properties,
  selectedFile,
  visible,
}: {
  editingDocument: PropertyDocument | null;
  form: DocumentForm;
  formError: string;
  isSaving: boolean;
  lessees: Lessee[];
  onChangeForm: (form: DocumentForm) => void;
  onClose: () => void;
  onPickFile: () => void;
  onSubmit: () => void;
  properties: Property[];
  selectedFile: DocumentUpload | null;
  visible: boolean;
}) {
  const title = editingDocument ? "Update document" : "Upload document";

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-slate-950/40">
        <View className="max-h-[92%] rounded-t-[32px] bg-white">
          <View className="border-b border-slate-100 px-5 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-slate-950">{title}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                onPress={onClose}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#334155"
                  size={21}
                />
              </TouchableOpacity>
            </View>
            {editingDocument ? (
              <Text className="mt-2 text-xs leading-5 text-slate-500">
                Replace the file to create a backend document revision, or
                update metadata only.
              </Text>
            ) : null}
          </View>

          <ScrollView contentContainerClassName="gap-4 p-5">
            {formError ? (
              <View className="rounded-2xl bg-red-50 px-4 py-3">
                <Text className="text-sm font-semibold text-red-700">
                  {formError}
                </Text>
              </View>
            ) : null}

            <View className="gap-2">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                File
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-row items-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-4"
                onPress={onPickFile}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
                  <MaterialCommunityIcons
                    name="cloud-upload-outline"
                    color="#2563EB"
                    size={23}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-slate-950">
                    {selectedFile
                      ? selectedFile.name
                      : editingDocument
                        ? "Choose replacement file"
                        : "Choose file"}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    PDF, DOC, DOCX, JPG, or PNG up to 10 MB.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Name
              </Text>
              <TextInput
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950"
                onChangeText={(name) => onChangeForm({ ...form, name })}
                placeholder="Document name"
                placeholderTextColor="#94A3B8"
                value={form.name}
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = form.category === category;

                  return (
                    <TouchableOpacity
                      key={category}
                      activeOpacity={0.85}
                      className={`rounded-full px-4 py-2 ${
                        isActive ? "bg-slate-950" : "bg-slate-100"
                      }`}
                      onPress={() => onChangeForm({ ...form, category })}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isActive ? "text-white" : "text-slate-500"
                        }`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <OptionPicker
              emptyLabel="No property link"
              items={properties}
              label="Property"
              onSelect={(propertyId) => onChangeForm({ ...form, propertyId })}
              selectedId={form.propertyId}
              titleKey="title"
            />

            <OptionPicker
              emptyLabel="No tenant link"
              items={lessees}
              label="Tenant"
              onSelect={(lesseeId) => onChangeForm({ ...form, lesseeId })}
              selectedId={form.lesseeId}
              titleKey="name"
            />

            {editingDocument ? (
              <View className="gap-2">
                <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Revision comment
                </Text>
                <TextInput
                  className="min-h-20 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950"
                  multiline
                  onChangeText={(revisionComment) =>
                    onChangeForm({ ...form, revisionComment })
                  }
                  placeholder="Signed copy uploaded"
                  placeholderTextColor="#94A3B8"
                  textAlignVertical="top"
                  value={form.revisionComment}
                />
              </View>
            ) : null}
          </ScrollView>

          <View className="border-t border-slate-100 p-5">
            <TouchableOpacity
              activeOpacity={0.85}
              className="rounded-2xl bg-blue-600 py-4"
              disabled={isSaving}
              onPress={onSubmit}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-center text-sm font-bold text-white">
                  {editingDocument ? "Save changes" : "Upload document"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OptionPicker<T extends { id: string }>({
  emptyLabel,
  items,
  label,
  onSelect,
  selectedId,
  titleKey,
}: {
  emptyLabel: string;
  items: T[];
  label: string;
  onSelect: (id: string) => void;
  selectedId: string;
  titleKey: keyof T;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          <TouchableOpacity
            activeOpacity={0.85}
            className={`rounded-full px-4 py-2 ${
              !selectedId ? "bg-slate-950" : "bg-slate-100"
            }`}
            onPress={() => onSelect("")}
          >
            <Text
              className={`text-xs font-bold ${
                !selectedId ? "text-white" : "text-slate-500"
              }`}
            >
              {emptyLabel}
            </Text>
          </TouchableOpacity>
          {items.map((item) => {
            const isActive = selectedId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                className={`rounded-full px-4 py-2 ${
                  isActive ? "bg-slate-950" : "bg-slate-100"
                }`}
                onPress={() => onSelect(item.id)}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                  numberOfLines={1}
                >
                  {String(item[titleKey])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
