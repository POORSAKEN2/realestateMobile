import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiStaffGateway } from "../../api/staff";
import { createStaffService } from "../../services/staff/staffService";
import { getSessionAccess } from "../../services/access/sessionAccess";
import type { CreateStaffManagerPayload, StaffGateway, StaffManagerDetails } from "../../types/domain/staff";
import { useAuth } from "../useAuth";
import { useAccess } from "../auth/useAccess";

export function useStaffManagement(gateway: StaffGateway = apiStaffGateway) {
  const { session } = useAuth();
  const { can } = useAccess();
  const client = useQueryClient();
  const key = ["staff-managers", (session?.user as { id?: string })?.id];
  const service = createStaffService(gateway, () => getSessionAccess().access, session?.accessToken);
  const roster = useQuery({ queryKey: key, queryFn: service.list, enabled: can("staff.manage") && Boolean(gateway.list) });
  const invalidate = () => client.invalidateQueries({ queryKey: key });
  const create = useMutation({ mutationFn: (payload: CreateStaffManagerPayload) => service.create(payload, roster.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: StaffManagerDetails }) => service.update(id, payload), onSuccess: invalidate });
  const setEnabled = useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => service.setEnabled(id, enabled), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: service.remove, onSuccess: invalidate });
  return { gateway, roster, create, update, setEnabled, remove };
}
