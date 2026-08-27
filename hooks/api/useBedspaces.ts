import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBedspace,
  deleteBedspace,
  fetchRoomBedspaces,
  updateBedspace,
} from "../../api/bedspaces";
import type { BedspacePayload } from "../../types";
import { floorPlanKeys } from "./useFloorPlans";
import { propertyKeys } from "./useProperties";

export const bedspaceKeys = {
  all: ["bedspaces"] as const,
  room: (roomId: string) => [...bedspaceKeys.all, "room", roomId] as const,
};

export function useRoomBedspacesQuery(roomId: string, accessToken?: string) {
  return useQuery({
    queryKey: bedspaceKeys.room(roomId),
    queryFn: () => fetchRoomBedspaces(roomId, accessToken),
    enabled: Boolean(roomId),
  });
}

export function useBedspaceCommands({
  accessToken,
  propertyId,
  roomId,
}: {
  accessToken?: string;
  propertyId: string;
  roomId: string;
}) {
  const queryClient = useQueryClient();

  async function invalidateBedspaceInventory() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: bedspaceKeys.room(roomId) }),
      queryClient.invalidateQueries({
        queryKey: floorPlanKeys.rooms(propertyId),
      }),
      queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["leases"] }),
    ]);
  }

  return {
    create: useMutation({
      mutationFn: (payload: BedspacePayload) =>
        createBedspace(roomId, payload, accessToken),
      onSuccess: invalidateBedspaceInventory,
    }),
    update: useMutation({
      mutationFn: ({
        bedspaceId,
        payload,
      }: {
        bedspaceId: string;
        payload: Partial<BedspacePayload>;
      }) => updateBedspace(bedspaceId, payload, accessToken),
      onSuccess: invalidateBedspaceInventory,
    }),
    remove: useMutation({
      mutationFn: (bedspaceId: string) =>
        deleteBedspace(bedspaceId, accessToken),
      onSuccess: invalidateBedspaceInventory,
    }),
  };
}
