import * as Location from "expo-location";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  fetchDocuments,
  uploadPropertyDocuments,
} from "../../api/propertyDetails";
import { propertyFetchers } from "../api/useProperties";
import { usePropertyAttachments } from "./usePropertyAttachments";
import type { Property, PropertyClassification } from "../../types";
import {
  emptyForm,
  formatCoordinate,
  getPropertyTypeChoices,
  locationCoordinates,
  toFormState,
  type FormState,
} from "../../utils/properties/propertyForm";
import {
  buildPropertyPayload,
  type PropertyFormPayload,
} from "../../utils/properties/propertyPayload";

export function usePropertyFormController(accessToken?: string) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const formRef = useRef(form);
  const [formError, setFormError] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const formSessionRef = useRef(0);
  const attachments = usePropertyAttachments(setFormError);
  const {
    clearAttachments,
    pickDocuments,
    pickImages,
    removeDocument,
    removeImage,
    selectedDocuments,
    selectedImages,
  } = attachments;

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const {
    data: existingPropertyDocuments = [],
    isLoading: isLoadingExistingDocuments,
  } = useQuery({
    queryKey: ["documents", accessToken, editingProperty?.id],
    queryFn: () =>
      fetchDocuments(accessToken, { propertyId: editingProperty?.id }),
    enabled: Boolean(accessToken && editingProperty?.id && isFormVisible),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: PropertyFormPayload) => {
      const property = editingProperty
        ? await propertyFetchers.update({ id: editingProperty.id, payload })
        : await propertyFetchers.create(payload as any);

      if (selectedDocuments.length > 0) {
        await uploadPropertyDocuments(
          property.id,
          selectedDocuments,
          accessToken,
        );
      }

      return property;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({
          queryKey: ["transientBookablePropertyIds"],
        }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
      closeForm();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Failed to save property.",
      );
    },
  });

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    formRef.current = { ...formRef.current, [key]: value };
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCoordinates(coordinates: { lat: string; lng: string }) {
    formRef.current = { ...formRef.current, ...coordinates };
    setForm((current) => ({ ...current, ...coordinates }));
  }

  function updateClassification(classification: PropertyClassification) {
    const [type] = getPropertyTypeChoices(classification);
    formRef.current = { ...formRef.current, classification, type: type.value };
    setForm((current) => ({ ...current, classification, type: type.value }));
  }

  async function setDefaultPinFromCurrentLocation(formSession: number) {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") return;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (formSessionRef.current !== formSession) return;

      const coordinates = {
        lat: formatCoordinate(currentLocation.coords.latitude),
        lng: formatCoordinate(currentLocation.coords.longitude),
      };
      if (formRef.current.lat.trim() || formRef.current.lng.trim()) return;
      updateCoordinates(coordinates);
    } catch {
      // Device location is optional; map search and manual pinning remain available.
    }
  }

  function resetFormState(nextForm: FormState, property: Property | null) {
    formSessionRef.current += 1;
    formRef.current = nextForm;
    setForm(nextForm);
    clearAttachments();
    setFormError("");
    setEditingProperty(property);
  }

  function openCreateForm() {
    resetFormState(emptyForm, null);
    setIsFormVisible(true);
    void setDefaultPinFromCurrentLocation(formSessionRef.current);
  }

  function openEditForm(property: Property) {
    resetFormState(toFormState(property), property);
    setIsFormVisible(true);
  }

  function closeForm() {
    resetFormState(emptyForm, null);
    setIsFormVisible(false);
  }

  function selectSuggestedLocation(location: string) {
    const coordinates = locationCoordinates[location];
    const nextForm = {
      ...formRef.current,
      location,
      country: "Philippines",
      lat: coordinates ? String(coordinates.lat) : formRef.current.lat,
      lng: coordinates ? String(coordinates.lng) : formRef.current.lng,
    };
    formRef.current = nextForm;
    setForm(nextForm);
  }

  function submitForm() {
    setFormError("");
    if (saveMutation.isPending) return;
    if (!accessToken) {
      setFormError("Please log in before creating a property.");
      return;
    }

    const result = buildPropertyPayload(form, selectedImages);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (result.payload) saveMutation.mutate(result.payload);
  }

  return {
    closeForm,
    editingProperty,
    existingPropertyDocuments,
    form,
    formError,
    isFormVisible,
    isLoadingExistingDocuments,
    isSaving: saveMutation.isPending,
    openCreateForm,
    openEditForm,
    pickDocuments,
    pickImages,
    removeDocument,
    removeImage,
    selectedDocuments,
    selectedImages,
    selectSuggestedLocation,
    submitForm,
    updateClassification,
    updateCoordinates,
    updateForm,
  };
}
