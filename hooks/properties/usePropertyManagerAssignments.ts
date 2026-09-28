import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProperty, syncPropertyManagers } from "../../api/properties";
import { useStaffManagement } from "../api/useStaffManagement";
import { useAuth } from "../useAuth";
import { getSessionAccess } from "../../services/access/sessionAccess";

export function usePropertyManagerAssignments(propertyId: string) {
  const staff = useStaffManagement();
  const { session } = useAuth();
  const token = session?.accessToken;
  const client = useQueryClient();
  const key = ["property-manager-assignments", token, propertyId];
  const property = useQuery({
    queryKey: key,
    queryFn: () => fetchProperty(propertyId, token),
  });
  const [draft, setDraft] = useState<string[] | null>(null);
  const [notice, setNotice] = useState("");
  const assigned = useMemo(
    () => property.data?.managers?.map((manager) => String(manager.id)) ?? [],
    [property.data?.managers],
  );
  const selected = draft ?? assigned;
  const selectedIds = useMemo(() => new Set(selected), [selected]);
  const dirty =
    selected.length !== assigned.length ||
    assigned.some((id) => !selectedIds.has(id));
  const unavailable =
    !staff.roster.data?.complete || !Array.isArray(property.data?.managers);
  const save = useMutation({
    mutationFn: () => syncPropertyManagers(propertyId, selected, token),
    onSuccess: async (updated) => {
      if (getSessionAccess().token !== token) return;
      client.setQueryData(key, updated);
      setDraft(null);
      setNotice("Manager assignments saved.");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["properties"] }),
        client.invalidateQueries({ queryKey: ["staff-managers"] }),
      ]);
    },
  });
  function edit() {
    setDraft([...assigned]);
    setNotice("");
    save.reset();
  }
  function cancel() {
    setDraft(null);
    setNotice("");
    save.reset();
  }
  function toggle(id: string) {
    setNotice("");
    setDraft((current) => {
      const ids = current ?? assigned;
      return ids.includes(id)
        ? ids.filter((value) => value !== id)
        : [...ids, id];
    });
  }
  async function reload() {
    await Promise.all([property.refetch(), staff.roster.refetch()]);
  }
  return {
    property,
    roster: staff.roster,
    selectedIds,
    assigned,
    editing: draft !== null,
    edit,
    cancel,
    toggle,
    dirty,
    unavailable,
    save,
    notice,
    reload,
  };
}
