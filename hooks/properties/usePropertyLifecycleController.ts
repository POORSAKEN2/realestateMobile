import { useEffect, useMemo, useState } from "react";

import type {
  Property,
  PropertyStatus,
  PropertyStatusHistoryEntry,
} from "../../types";
import {
  getAllowedPropertyTransitions,
  mergePropertyStatusHistory,
} from "../../utils/properties/propertyLifecycle";
import { useProperties } from "../api/useProperties";

type PropertyLifecycleControllerOptions = {
  accessToken?: string;
  onUpdated?: (property: Property) => void;
  property: Property | null;
};

export function usePropertyLifecycleController({
  accessToken,
  onUpdated,
  property,
}: PropertyLifecycleControllerOptions) {
  const { useLifecycleHistory, useTransitionLifecycle } =
    useProperties(accessToken);
  const transition = useTransitionLifecycle();
  const historyQuery = useLifecycleHistory(
    property?.id ?? "",
    Boolean(property),
  );
  const [history, setHistory] = useState<PropertyStatusHistoryEntry[]>([]);
  const [requestedStatus, setRequestedStatus] = useState<PropertyStatus | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setHistory(
      historyQuery.data?.length
        ? historyQuery.data
        : (property?.statusHistory ?? []),
    );
    setRequestedStatus(null);
    setError("");
  }, [historyQuery.data, property?.id, property?.statusHistory]);

  const allowedTransitions = useMemo(
    () => (property ? [...getAllowedPropertyTransitions(property.status)] : []),
    [property?.status],
  );

  function requestTransition(status: PropertyStatus) {
    if (!allowedTransitions.includes(status)) {
      setError("That lifecycle transition is not allowed.");
      return;
    }

    setError("");
    setRequestedStatus(status);
  }

  async function confirmTransition() {
    if (!property || !requestedStatus) return;

    try {
      setError("");
      const result = await transition.mutateAsync({
        id: property.id,
        fromStatus: property.status,
        toStatus: requestedStatus,
      });
      const serverHistory = result.property.statusHistory ?? [];
      const mergedHistory = mergePropertyStatusHistory(
        [...serverHistory, ...history],
        result.historyEntry,
      );
      const updatedProperty = {
        ...result.property,
        statusHistory: mergedHistory,
      };

      setHistory(mergedHistory);
      setRequestedStatus(null);
      onUpdated?.(updatedProperty);
    } catch (transitionError) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : "The lifecycle state could not be updated.",
      );
    }
  }

  return {
    allowedTransitions,
    cancelTransition: () => setRequestedStatus(null),
    confirmTransition,
    error,
    history,
    historyError: historyQuery.error?.message,
    isHistoryLoading: historyQuery.isLoading,
    isPending: transition.isPending,
    requestTransition,
    requestedStatus,
  };
}
