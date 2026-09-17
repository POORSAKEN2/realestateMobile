import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiStaffGateway } from "../../api/staff";
import { createStaffService } from "../../services/staff/staffService";
import { getSessionAccess } from "../../services/access/sessionAccess";
import type {
  CreateStaffManagerPayload,
  StaffGateway,
  StaffManagerDetails,
} from "../../types/domain/staff";
import {
  useBillingEntitlement,
  BILLING_ENTITLEMENT_QUERY_KEY,
} from "./useBillingEntitlement";
import { useAuth } from "../useAuth";
import { useAccess } from "../auth/useAccess";

export function useStaffManagement(gateway: StaffGateway = apiStaffGateway) {
  const { session } = useAuth();
  const { can } = useAccess();
  const client = useQueryClient();
  const key = ["staff-managers", (session?.user as { id?: string })?.id];
  const service = createStaffService(
    gateway,
    () => getSessionAccess().access,
    session?.accessToken,
  );
  const entitlement = useBillingEntitlement({ enabled: can("staff.manage") });
  const roster = useQuery({
    queryKey: key,
    queryFn: service.list,
    enabled: can("staff.manage") && Boolean(gateway.list),
  });
  const catalog = useQuery({
    queryKey: ["staff-access-catalog"],
    queryFn: () => gateway.catalog!(session?.accessToken),
    enabled: can("staff.manage") && Boolean(gateway.catalog),
    staleTime: 1000 * 60 * 15,
  });
  const invalidate = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: key }),
      client.invalidateQueries({ queryKey: BILLING_ENTITLEMENT_QUERY_KEY }),
    ]);
  const create = useMutation({
    mutationFn: (payload: CreateStaffManagerPayload) => service.create(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      record,
      payload,
    }: {
      record: import("../../types/domain/staff").StaffManager;
      payload: StaffManagerDetails;
    }) => service.update(record, payload),
    onSuccess: invalidate,
  });
  const resend = useMutation({
    mutationFn: service.resend,
    onSuccess: invalidate,
  });
  const revoke = useMutation({
    mutationFn: service.revoke,
    onSuccess: invalidate,
  });
  const setEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      service.setEnabled(id, enabled),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: service.remove,
    onSuccess: invalidate,
  });
  return {
    gateway,
    roster,
    catalog,
    entitlement,
    create,
    update,
    resend,
    revoke,
    setEnabled,
    remove,
  };
}
