import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFloorArea,
  createFloorPlan,
  createPropertyRoom,
  deleteFloorArea,
  deleteFloorPlan,
  deletePropertyRoom,
  fetchFloorPlans,
  fetchPropertyRooms,
  updateFloorArea,
  updateFloorPlan,
  updatePropertyRoom,
  uploadFloorPlanImage,
} from "../../api/floorplans";

export const floorPlanKeys = {
  property: (propertyId: string) => ["floorplans", propertyId] as const,
  rooms: (propertyId: string) => ["floorplans", propertyId, "rooms"] as const,
};

function useFloorPlanInvalidation(propertyId: string) {
  const queryClient = useQueryClient();

  return {
    floorPlans: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: floorPlanKeys.property(propertyId),
        }),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
      ]),
    rooms: () =>
      queryClient.invalidateQueries({
        queryKey: floorPlanKeys.rooms(propertyId),
      }),
  };
}

export function useFloorPlanQueries(propertyId: string, accessToken?: string) {
  const floorPlans = useQuery({
    queryKey: floorPlanKeys.property(propertyId),
    queryFn: () => fetchFloorPlans(propertyId, accessToken),
    enabled: Boolean(propertyId),
  });
  const rooms = usePropertyRoomsQuery(propertyId, accessToken);

  return { floorPlans, rooms };
}

export function usePropertyRoomsQuery(
  propertyId: string,
  accessToken?: string,
) {
  return useQuery({
    queryKey: floorPlanKeys.rooms(propertyId),
    queryFn: () => fetchPropertyRooms(propertyId, accessToken),
    enabled: Boolean(propertyId),
  });
}

export function useFloorCommands(propertyId: string, accessToken?: string) {
  const invalidate = useFloorPlanInvalidation(propertyId);

  return {
    create: useMutation({
      mutationFn: (name: string) =>
        createFloorPlan(propertyId, { name }, accessToken),
      onSuccess: invalidate.floorPlans,
    }),
    update: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        updateFloorPlan(id, { name }, accessToken),
      onSuccess: invalidate.floorPlans,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteFloorPlan(id, accessToken),
      onSuccess: async () => {
        await Promise.all([invalidate.floorPlans(), invalidate.rooms()]);
      },
    }),
    uploadImage: useMutation({
      mutationFn: ({
        floorPlanId,
        image,
      }: {
        floorPlanId: string;
        image: Parameters<typeof uploadFloorPlanImage>[1];
      }) => uploadFloorPlanImage(floorPlanId, image, accessToken),
      onSuccess: invalidate.floorPlans,
    }),
  };
}

export function useFloorAreaCommands(propertyId: string, accessToken?: string) {
  const invalidate = useFloorPlanInvalidation(propertyId);

  return {
    create: useMutation({
      mutationFn: ({
        floorPlanId,
        label,
      }: {
        floorPlanId: string;
        label: string;
      }) => createFloorArea(floorPlanId, { label, points: [] }, accessToken),
      onSuccess: invalidate.floorPlans,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: Parameters<typeof updateFloorArea>[1];
      }) => updateFloorArea(id, payload, accessToken),
      onSuccess: invalidate.floorPlans,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteFloorArea(id, accessToken),
      onSuccess: async () => {
        await Promise.all([invalidate.floorPlans(), invalidate.rooms()]);
      },
    }),
  };
}

export function usePropertyRoomCommands(
  propertyId: string,
  accessToken?: string,
) {
  const invalidate = useFloorPlanInvalidation(propertyId);

  return {
    create: useMutation({
      mutationFn: (
        payload: Omit<Parameters<typeof createPropertyRoom>[0], "propertyId">,
      ) => createPropertyRoom({ ...payload, propertyId }, accessToken),
      onSuccess: invalidate.rooms,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: Parameters<typeof updatePropertyRoom>[1];
      }) => updatePropertyRoom(id, payload, accessToken),
      onSuccess: invalidate.rooms,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deletePropertyRoom(id, accessToken),
      onSuccess: invalidate.rooms,
    }),
  };
}
