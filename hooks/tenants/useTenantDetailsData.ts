import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchDocuments, fetchLeaseLedger } from "../../api/propertyDetails";
import type { Lease, Lessee } from "../../types";
import { aggregateLeaseLedgers } from "../../utils/tenants/tenantDetails";
import { useAuth } from "../useAuth";

const EMPTY_LEDGER = aggregateLeaseLedgers([]);

export function useTenantDetailsData(tenant: Lessee | null, leases: Lease[]) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const leaseIds = useMemo(
    () =>
      leases
        .filter((lease) => lease.lesseeId === tenant?.id)
        .map((lease) => lease.id)
        .sort(),
    [leases, tenant?.id],
  );

  const ledgerQuery = useQuery({
    enabled: Boolean(accessToken && tenant),
    gcTime: 0,
    queryFn: async ({ signal }) => {
      const ledgers = await Promise.all(
        leaseIds.map((leaseId) =>
          fetchLeaseLedger(leaseId, accessToken, signal),
        ),
      );
      return aggregateLeaseLedgers(ledgers);
    },
    queryKey: ["tenant-financial-ledger", accessToken, tenant?.id, leaseIds],
  });

  const documentsQuery = useQuery({
    enabled: Boolean(accessToken && tenant),
    gcTime: 0,
    queryFn: ({ signal }) =>
      fetchDocuments(
        accessToken,
        { clientId: tenant?.id ?? undefined },
        signal,
      ),
    queryKey: ["documents", accessToken, "tenant", tenant?.id],
  });

  return {
    documents: documentsQuery.data ?? [],
    documentsError: documentsQuery.error,
    isLoadingDocuments: documentsQuery.isLoading,
    isLoadingLedger: ledgerQuery.isLoading,
    ledger: ledgerQuery.data ?? EMPTY_LEDGER,
    ledgerError: ledgerQuery.error,
  };
}
