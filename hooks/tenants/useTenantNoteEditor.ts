import { useEffect, useRef, useState } from "react";

import type { TenantNote, TenantNoteDraft } from "../../types";
import {
  createTenantNoteForm,
  getTenantNoteFormResult,
  type TenantNoteFormState,
} from "../../utils/tenants/tenantNoteForm";
import { useMountedRef } from "../useMountedRef";

export type TenantNoteEditorSave = {
  note?: TenantNote;
  payload: TenantNoteDraft;
};

export function useTenantNoteEditor({
  onSave,
  onSaved,
  tenantId,
}: {
  onSave: (input: TenantNoteEditorSave) => Promise<unknown>;
  onSaved: () => void;
  tenantId?: string;
}) {
  const isMounted = useMountedRef();
  const tenantIdRef = useRef(tenantId);
  tenantIdRef.current = tenantId;
  const [editingNote, setEditingNote] = useState<TenantNote | undefined>();
  const [form, setForm] = useState<TenantNoteFormState>(() =>
    createTenantNoteForm(),
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setEditingNote(undefined);
    setForm(createTenantNoteForm());
    setFormError("");
  }, [tenantId]);

  function open(note?: TenantNote) {
    setEditingNote(note);
    setForm(createTenantNoteForm(note));
    setFormError("");
  }

  function updateForm<K extends keyof TenantNoteFormState>(
    key: K,
    value: TenantNoteFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setFormError("");
    const result = getTenantNoteFormResult(form);
    if (!result.isValid) {
      setFormError(result.error);
      return;
    }

    const submittedTenantId = tenantId;

    try {
      await onSave({ note: editingNote, payload: result.payload });
      if (isMounted.current && tenantIdRef.current === submittedTenantId) {
        onSaved();
      }
    } catch (error) {
      if (isMounted.current && tenantIdRef.current === submittedTenantId) {
        setFormError(
          error instanceof Error
            ? error.message
            : "The note could not be saved.",
        );
      }
    }
  }

  return {
    editingNote,
    form,
    formError,
    open,
    submit,
    updateForm,
  };
}
