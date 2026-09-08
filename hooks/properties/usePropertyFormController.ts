import * as Location from "expo-location";
import { fetchCurrentUser } from "../../api/user";
import { useAuth } from "../useAuth";
import { getSessionAccess } from "../../services/access/sessionAccess";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  fetchDocuments,
  uploadPropertyDocuments,
} from "../../api/propertyDetails";
import { propertyFetchers } from "../api/useProperties";
import { useBillingEntitlement } from "../api/useBillingEntitlement";
import { usePropertyOwners } from "../api/usePropertyOwners";
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
import {
  formatBytes,
  remainingStorageBytes,
  storageUploadError,
} from "../../utils/billing/entitlementCapabilities";

export type PropertySaveOperation = "created" | "updated";

export function usePropertyFormController(
  accessToken?: string,
  {
    onSaved,
  }: {
    onSaved?: (property: Property, operation: PropertySaveOperation) => void;
  } = {},
) {
  const queryClient = useQueryClient();
  const { session, signIn } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const formRef = useRef(form);
  const [formError, setFormError] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const createdProperty = useRef<Property | null>(null);
  const formSessionRef = useRef(0);
  const attachments = usePropertyAttachments(setFormError);
  const entitlementQuery = useBillingEntitlement();
  const propertyOwnersQuery = usePropertyOwners(
    accessToken,
    isFormVisible && form.isPublished,
  );
  const publishedListings = entitlementQuery.data?.limits?.published_listings;
  const publishingBlocked = Boolean(
    entitlementQuery.data?.gating_enabled !== false &&
      publishedListings &&
      !publishedListings.unlimited &&
      publishedListings.limit !== null &&
      publishedListings.used >= publishedListings.limit &&
      !editingProperty?.isPublished,
  );
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
      async function refreshManagerAccess() {
        if (getSessionAccess().access.role !== "MANAGER" || !accessToken) return;
        const user = await fetchCurrentUser(accessToken);
        if (getSessionAccess().token === accessToken) signIn({ ...session, user });
      }
      // If a follow-up upload or access refresh fails after creation, retry
      // against the saved property rather than creating another quota entry.
      if (createdProperty.current) await refreshManagerAccess();
      const existing = editingProperty ?? createdProperty.current;
      const property = existing
        ? await propertyFetchers.update(
            { id: existing.id, payload },
            accessToken,
          )
        : await propertyFetchers.create(payload as any, accessToken);

      if (!editingProperty) {
        createdProperty.current = property;
        await refreshManagerAccess();
      }

      if (selectedDocuments.length > 0) {
        await uploadPropertyDocuments(
          property.id,
          selectedDocuments,
          accessToken,
        );
      }

      return property;
    },
    onSuccess: async (property) => {
      const operation: PropertySaveOperation = editingProperty
        ? "updated"
        : "created";
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({
          queryKey: ["transientBookablePropertyIds"],
        }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["billingEntitlement"] }),
      ]);
      closeForm();
      onSaved?.(property, operation);
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
    createdProperty.current = null;
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

    const quotaError = storageUploadError(entitlementQuery.data, [
      ...selectedImages,
      ...selectedDocuments,
    ]);
    if (quotaError) {
      setFormError(quotaError);
      return;
    }

    const result = buildPropertyPayload(form, selectedImages, {
      hasExistingImages: Boolean(editingProperty?.images?.length),
      includeStatus: !editingProperty,
    });
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
    propertyOwnerChoices: (propertyOwnersQuery.data ?? [])
      .filter((owner) => owner.verificationStatus?.toLowerCase() === "verified")
      .map((owner) => ({ label: owner.name, value: owner.id })),
    propertyOwnersError: propertyOwnersQuery.isError
      ? propertyOwnersQuery.error?.message ?? "Property owners could not be loaded."
      : undefined,
    isLoadingPropertyOwners: propertyOwnersQuery.isLoading,
    publishingBlocked,
    publishingQuotaLabel:
      publishedListings?.limit === null || publishedListings?.unlimited
        ? "Unlimited published listings"
        : publishedListings
          ? `${publishedListings.used} of ${publishedListings.limit} published listings used`
          : undefined,
    removeDocument,
    removeImage,
    selectedDocuments,
    selectedImages,
    storageRemainingLabel: (() => {
      const remaining = remainingStorageBytes(entitlementQuery.data);
      return remaining === null ? undefined : `${formatBytes(remaining)} plan storage remaining`;
    })(),
    selectSuggestedLocation,
    submitForm,
    updateClassification,
    updateCoordinates,
    updateForm,
  };
}
