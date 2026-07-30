import { useEffect, useState } from "react";

import type { FloorPlanVisibilityRepository } from "../../services/floorplans/contracts";

export function useFloorPlanVisibility(
  propertyId: string,
  repository: FloorPlanVisibilityRepository,
) {
  const [hiddenAreaIds, setHiddenAreaIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    repository
      .load(propertyId)
      .then((ids) => {
        if (active) setHiddenAreaIds(ids);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [propertyId, repository]);

  useEffect(() => {
    if (!propertyId || !loaded) return;
    repository.save(propertyId, hiddenAreaIds).catch(() => {
      // Visibility remains active in memory when persistence fails.
    });
  }, [hiddenAreaIds, loaded, propertyId, repository]);

  function toggle(areaId: string) {
    setHiddenAreaIds((current) => {
      const next = new Set(current);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  function forget(areaId: string) {
    setHiddenAreaIds((current) => {
      const next = new Set(current);
      next.delete(areaId);
      return next;
    });
  }

  return { forget, hiddenAreaIds, toggle };
}
