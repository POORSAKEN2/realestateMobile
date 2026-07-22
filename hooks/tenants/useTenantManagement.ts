import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  createLessee,
  deleteLessee,
  fetchLeases,
  fetchLessees,
  updateLessee,
} from "../../api/propertyDetails";
import type { Lessee, LesseePayload, Property } from "../../types";
import {
  createTenantForm,
  EMPTY_TENANT_FORM,
  getTenantFormResult,
  type TenantFormState,
} from "../../utils/tenants/tenantForm";
import { useProperties } from "../api/useProperties";
import { useAuth } from "../useAuth";

export function useTenantManagement() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ action?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<TenantFormState>(EMPTY_TENANT_FORM);
  const [formError, setFormError] = useState("");
  const [editingTenant, setEditingTenant] = useState<Lessee | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Lessee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lessee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ["lessees", accessToken],
    queryFn: () => fetchLessees(accessToken),
    enabled: Boolean(accessToken),
  });
  const { data: leases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["leases", accessToken],
    queryFn: () => fetchLeases(accessToken),
    enabled: Boolean(accessToken),
  });
  const { useList } = useProperties();
  const { data: properties = [], isLoading: isLoadingProperties } = useList();

  const saveMutation = useMutation({
    mutationFn: (payload: LesseePayload) =>
      editingTenant
        ? updateLessee(editingTenant.id, payload, accessToken)
        : createLessee(payload, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lessees"] });
      closeForm();
    },
    onError: (error) =>
      setFormError(
        error instanceof Error ? error.message : "Failed to save tenant.",
      ),
  });
  const deleteMutation = useMutation({
    mutationFn: (tenantId: string) => deleteLessee(tenantId, accessToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lessees"] }),
        queryClient.invalidateQueries({ queryKey: ["leases"] }),
      ]);
      setDeleteTarget(null);
    },
  });

  const filteredTenants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tenants.filter(
      (tenant) =>
        !query ||
        [tenant.name, tenant.contactEmail, tenant.phone]
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
  }, [searchQuery, tenants]);

  useEffect(() => {
    if (params.action === "add") openCreateForm();
  }, [params.action]);

  function updateForm<K extends keyof TenantFormState>(
    key: K,
    value: TenantFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateForm() {
    setEditingTenant(null);
    setForm(createTenantForm());
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(tenant: Lessee) {
    setEditingTenant(tenant);
    setForm(createTenantForm(tenant));
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingTenant(null);
    setForm(createTenantForm());
    setFormError("");
  }

  function getTenantLeases(tenantId: string) {
    return leases.filter((lease) => lease.lesseeId === tenantId);
  }

  function getLinkedProperties(tenantId: string) {
    const names = getTenantLeases(tenantId)
      .map((lease) =>
        properties.find((property) => property.id === lease.propertyId),
      )
      .filter((property): property is Property => Boolean(property))
      .map((property) => property.title);
    return Array.from(new Set(names));
  }

  function submit() {
    setFormError("");
    const result = getTenantFormResult(form);
    if (!result.isValid) {
      setFormError(result.error);
      return;
    }
    saveMutation.mutate(result.payload);
  }

  const linkedTenantCount = tenants.filter((tenant) =>
    leases.some((lease) => lease.lesseeId === tenant.id),
  ).length;

  return {
    closeForm,
    deleteMutation,
    deleteTarget,
    editingTenant,
    filteredTenants,
    form,
    formError,
    getLinkedProperties,
    getTenantLeases,
    isFormOpen,
    isLoading: isLoadingTenants || isLoadingLeases || isLoadingProperties,
    leases,
    linkedTenantCount,
    linkedTenantPercentage:
      tenants.length === 0 ? 0 : (linkedTenantCount / tenants.length) * 100,
    openCreateForm,
    openEditForm,
    saveMutation,
    searchQuery,
    selectedTenant,
    setDeleteTarget,
    setSearchQuery,
    setSelectedTenant,
    submit,
    tenantMonthlyRent: leases.reduce(
      (sum, lease) => sum + lease.monthlyRent,
      0,
    ),
    tenants,
    updateForm,
  };
}
