import { useEffect, useMemo, useState } from "react";

import { ApiError } from "../../api/errors";
import type { WorkspaceSettings } from "../../types/domain/workspaceSettings";
import {
  getWorkspaceSettingsChanges,
  validateWorkspaceSettings,
} from "../../utils/workspaceSettings";
import { useWorkspaceSettings } from "../api/useWorkspaceSettings";

export function useWorkspaceSettingsForm() {
  const { query, mutation } = useWorkspaceSettings();
  const [saved, setSaved] = useState<WorkspaceSettings | null>(null);
  const [draft, setDraft] = useState<WorkspaceSettings | null>(null);
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof WorkspaceSettings, string>>>({});

  useEffect(() => {
    if (!query.data || saved) return;
    setSaved(query.data.values);
    setDraft(query.data.values);
  }, [query.data, saved]);

  const changes = useMemo(
    () => (saved && draft ? getWorkspaceSettingsChanges(saved, draft) : {}),
    [draft, saved],
  );
  const errors = useMemo(
    () =>
      draft && query.data
        ? { ...validateWorkspaceSettings(draft, query.data.options), ...serverErrors }
        : serverErrors,
    [draft, query.data, serverErrors],
  );

  function change<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) {
    setServerErrors(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setDraft(current => (current ? { ...current, [key]: value } : current));
  }

  function discard() {
    setDraft(saved);
    setServerErrors({});
  }

  async function save() {
    setServerErrors({});
    try {
      const response = await mutation.mutateAsync(changes);
      setSaved(response.values);
      setDraft(response.values);
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.details) {
        setServerErrors(
          Object.fromEntries(
            Object.entries(error.details).map(([key, value]) => [
              key,
              Array.isArray(value) ? String(value[0]) : String(value),
            ]),
          ),
        );
      }
      throw error;
    }
  }

  return {
    query, mutation, draft, changes, errors, change, discard, save,
    isDirty: Object.keys(changes).length > 0,
    isValid: Object.keys(errors).length === 0,
  };
}
