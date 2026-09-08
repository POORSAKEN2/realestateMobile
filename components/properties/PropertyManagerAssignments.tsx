import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProperty, syncPropertyManagers } from "../../api/properties";
import { useStaffManagement } from "../../hooks/api/useStaffManagement";
import { useAuth } from "../../hooks/useAuth";
import { StaffActionButton } from "../staff/StaffActionButton";

export function PropertyManagerAssignments({ propertyId }: { propertyId: string }) {
  const staff = useStaffManagement();
  const { session } = useAuth();
  const client = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const property = useQuery({ queryKey: ["property-manager-assignments", propertyId], queryFn: () => fetchProperty(propertyId, session?.accessToken) });
  useEffect(() => {
    if (!dirty && property.data?.managers) setSelected(property.data.managers.map(manager => String(manager.id)));
  }, [property.data, dirty]);
  const save = useMutation({
    mutationFn: () => syncPropertyManagers(propertyId, selected, session?.accessToken),
    onSuccess: async updated => {
      client.setQueryData(["property-manager-assignments", propertyId], updated);
      setDirty(false);
      setNotice("Property assignments saved.");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["properties"] }),
        client.invalidateQueries({ queryKey: ["staff-managers"] }),
      ]);
    },
  });
  const unavailable = !staff.roster.data?.complete || !Array.isArray(property.data?.managers);
  return <View className="gap-3 rounded-2xl border border-primary/15 bg-white p-4">
    <Text className="font-ralewayBold text-base">Assigned managers</Text>
    {property.isPending || staff.roster.isPending ? <Text>Loading assignments…</Text> : property.isError || staff.roster.isError || unavailable
      ? <StaffActionButton label="Reload assignments" onPress={() => { void property.refetch(); void staff.roster.refetch(); }} />
      : <>
        {staff.roster.data?.managers.map(manager => <TouchableOpacity key={manager.id} accessibilityRole="checkbox"
          accessibilityState={{ checked: selected.includes(manager.id), disabled: save.isPending }} disabled={save.isPending}
          className="rounded-xl bg-surface p-3" onPress={() => {
            setDirty(true); setNotice("");
            setSelected(ids => ids.includes(manager.id) ? ids.filter(id => id !== manager.id) : [...ids, manager.id]);
          }}><Text>{selected.includes(manager.id) ? "Selected: " : ""}{manager.name}{manager.status === "disabled" ? " (disabled)" : ""}</Text></TouchableOpacity>)}
        {staff.roster.data?.total === 0 && <Text className="text-description">Create a manager in Staff management to assign this property.</Text>}
        <StaffActionButton label="Save assignments" disabled={!dirty || unavailable} pending={save.isPending} onPress={() => save.mutate()} />
      </>}
    {save.error && <Text accessibilityRole="alert" className="text-danger">{save.error.message}</Text>}
    {!!notice && <Text accessibilityRole="alert" className="text-description">{notice}</Text>}
  </View>;
}
