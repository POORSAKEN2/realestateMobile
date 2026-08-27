import { useMemo, useState } from "react";

import {
  useBedspaceCommands,
  useRoomBedspacesQuery,
} from "../api/useBedspaces";
import type { Bedspace } from "../../types";
import {
  createBedspaceForm,
  createEmptyBedspaceForm,
  getBedspaceFormResult,
  type BedspaceFormState,
} from "../../utils/bedspaces/bedspaceForm";

export type BedspaceSaveOperation = "created" | "deleted" | "updated";

export function useBedspaceManagement({
  accessToken,
  onError,
  onSaved,
  propertyId,
  roomId,
}: {
  accessToken?: string;
  onError: (message: string) => void;
  onSaved: (operation: BedspaceSaveOperation) => void;
  propertyId: string;
  roomId: string;
}) {
  const query = useRoomBedspacesQuery(roomId, accessToken);
  const commands = useBedspaceCommands({ accessToken, propertyId, roomId });
  const [form, setForm] = useState<BedspaceFormState>(createEmptyBedspaceForm);
  const [formError, setFormError] = useState("");
  const [editingBedspace, setEditingBedspace] = useState<Bedspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bedspace | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const bedspaces = query.data ?? [];
  const summary = useMemo(
    () => ({
      maintenance: bedspaces.filter((item) => item.status === "Maintenance")
        .length,
      occupied: bedspaces.filter((item) => item.status === "Occupied").length,
      total: bedspaces.length,
      vacant: bedspaces.filter((item) => item.status === "Vacant").length,
    }),
    [bedspaces],
  );

  function updateForm<K extends keyof BedspaceFormState>(
    key: K,
    value: BedspaceFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateForm() {
    setEditingBedspace(null);
    setForm(createEmptyBedspaceForm());
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(bedspace: Bedspace) {
    setEditingBedspace(bedspace);
    setForm(createBedspaceForm(bedspace));
    setFormError("");
    setIsFormOpen(true);
  }

  function resetForm() {
    setIsFormOpen(false);
    setEditingBedspace(null);
    setForm(createEmptyBedspaceForm());
    setFormError("");
  }

  function closeForm() {
    if (commands.create.isPending || commands.update.isPending) return;
    resetForm();
  }

  async function submit() {
    setFormError("");
    const result = getBedspaceFormResult(form);
    if (!result.isValid) {
      setFormError(result.error);
      return;
    }

    try {
      if (editingBedspace) {
        await commands.update.mutateAsync({
          bedspaceId: editingBedspace.id,
          payload: result.payload,
        });
        resetForm();
        onSaved("updated");
      } else {
        await commands.create.mutateAsync(result.payload);
        resetForm();
        onSaved("created");
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Bedspace could not be saved.",
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      await commands.remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      onSaved("deleted");
    } catch (error) {
      setDeleteTarget(null);
      onError(
        error instanceof Error
          ? error.message
          : "Bedspace could not be deleted.",
      );
    }
  }

  return {
    bedspaces,
    closeForm,
    confirmDelete,
    deleteTarget,
    editingBedspace,
    form,
    formError,
    isBusy:
      commands.create.isPending ||
      commands.update.isPending ||
      commands.remove.isPending,
    isDeleting: commands.remove.isPending,
    isFormOpen,
    openCreateForm,
    openEditForm,
    query,
    setDeleteTarget,
    submit,
    summary,
    updateForm,
  };
}
