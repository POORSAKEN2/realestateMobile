import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  createProperty,
  fetchProperties,
  updateProperty,
} from "../../api/properties";
import {
  CreatePropertyPayload,
  Property,
  UpdatePropertyPayload,
} from "../../types";
import { usePaginatedQuery } from "./usePaginatedResource";

export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (filters?: any) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
};

export const propertyFetchers = {
  getList: async (filters?: any) => {
    // Note: The backend may not support all filters yet, but we pass them down.
    // fetchProperties in api/properties.ts currently doesn't take filters natively,
    // so we just call it. In the future, it should accept filters.
    const results = await fetchProperties();
    // We mock the PaginatedApiData format for now since fetchProperties returns Property[] directly
    // based on unwrapList.
    return {
      data: results,
      current_page: 1,
      last_page: 1,
    };
  },
  getDetail: async (id: string) => {
    // Currently, there isn't a fetchProperty(id) in api/properties.ts,
    // we would need to implement it. For now, this is a placeholder.
    throw new Error("getDetail not implemented in api/properties.ts");
  },
  create: async (payload: CreatePropertyPayload) => {
    return await createProperty(payload);
  },
  update: async ({
    id,
    payload,
  }: {
    id: string;
    payload: UpdatePropertyPayload;
  }) => {
    return await updateProperty(id, payload);
  },
};

export function useProperties() {
  const queryClient = useQueryClient();

  return {
    useList: (filters?: any) => {
      return usePaginatedQuery(
        propertyKeys.list(filters),
        () => propertyFetchers.getList(filters),
      );
    },
    useDetail: (id: string, options?: UseQueryOptions<Property, Error>) => {
      return useQuery({
        queryKey: propertyKeys.detail(id),
        queryFn: () => propertyFetchers.getDetail(id),
        ...options,
      });
    },
    useCreate: () => {
      return useMutation({
        mutationFn: propertyFetchers.create,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
        },
      });
    },
    useUpdate: () => {
      return useMutation({
        mutationFn: propertyFetchers.update,
        onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
          queryClient.invalidateQueries({
            queryKey: propertyKeys.detail(variables.id),
          });
        },
      });
    },
  };
}
