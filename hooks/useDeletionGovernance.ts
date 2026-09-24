import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  deletionImpactFromError,
  executeGovernedAction,
  fetchDeletionImpact,
  restoreGovernedRecord,
} from "../api/deletionGovernance";
import type { DeletionImpact, GovernedResource } from "../types";
import { useAuth } from "./useAuth";

export type DeletionTarget = {
  resource: GovernedResource;
  id: string;
  label: string;
} | null;

const INVALIDATION_ROOTS = [
  "properties",
  "documents",
  "clients",
  "leases",
  "transientBookings",
  "rooms",
  "floorplans",
  "bedspaces",
  "payments",
  "leaseLedger",
  "expenses",
  "billingEntitlement",
  "audit-history",
  "audit-event",
  "audit-record",
  "analytics",
  "portfolio-analytics",
] as const;

export function useDeletionGovernance(onSuccess?: (impact: DeletionImpact) => void) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<DeletionTarget>(null);
  const [serverImpact, setServerImpact] = useState<DeletionImpact | null>(null);
  const impactQuery = useQuery({
    enabled: Boolean(target && accessToken),
    queryKey: ["deletion-impact", target?.resource, target?.id],
    queryFn: () => fetchDeletionImpact(target!.resource, target!.id, accessToken),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (impact: DeletionImpact) => executeGovernedAction(impact, accessToken),
    onError: (error) => setServerImpact(deletionImpactFromError(error)),
    onSuccess: async (_, impact) => {
      await Promise.all(
        INVALIDATION_ROOTS.map((root) => queryClient.invalidateQueries({ queryKey: [root] })),
      );
      setTarget(null);
      setServerImpact(null);
      onSuccess?.(impact);
    },
  });

  const impact = serverImpact ?? impactQuery.data ?? null;

  return {
    close: () => {
      if (mutation.isPending) return;
      setTarget(null);
      setServerImpact(null);
      mutation.reset();
    },
    confirm: () => impact && mutation.mutate(impact),
    error: mutation.error ?? impactQuery.error,
    impact,
    isLoading: impactQuery.isFetching,
    isPending: mutation.isPending,
    open: (nextTarget: NonNullable<DeletionTarget>) => {
      setServerImpact(null);
      mutation.reset();
      setTarget(nextTarget);
    },
    refetch: () => {
      setServerImpact(null);
      mutation.reset();
      return impactQuery.refetch();
    },
    target,
  };
}

export function useRestoreGovernedRecord(onSuccess?: () => void) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resource, id }: { resource: "properties" | "documents"; id: string }) =>
      restoreGovernedRecord(resource, id, session?.accessToken),
    onSuccess: async () => {
      await Promise.all(
        INVALIDATION_ROOTS.map((root) => queryClient.invalidateQueries({ queryKey: [root] })),
      );
      onSuccess?.();
    },
  });
}
