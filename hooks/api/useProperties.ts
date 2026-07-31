import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  createProperty,
  fetchProperty,
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
  getList: async (filters?: any, accessToken?: string) => {
    // Note: The backend may not support all filters yet, but we pass them down.
    // fetchProperties in api/properties.ts currently doesn't take filters natively,
    // so we just call it. In the future, it should accept filters.
    const results = await fetchProperties(accessToken);
    // We mock the PaginatedApiData format for now since fetchProperties returns Property[] directly
    // based on unwrapList.
    return {
      data: results,
      current_page: 1,
      last_page: 1,
    };
  },
  getDetail: async (id: string, accessToken?: string) => {
    return await fetchProperty(id, accessToken);
  },
  create: async (payload: CreatePropertyPayload, accessToken?: string) => {
    return await createProperty(payload, accessToken);
  },
  update: async (
    {
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePropertyPayload;
    },
    accessToken?: string,
  ) => {
    return await updateProperty(id, payload, accessToken);
  },
};

export function useProperties(accessToken?: string) {
  const queryClient = useQueryClient();

  return {
    useList: (filters?: any) => {
      return usePaginatedQuery(propertyKeys.list(filters), () =>
        propertyFetchers.getList(filters, accessToken),
      );
    },
    useDetail: (id: string, options?: UseQueryOptions<Property, Error>) => {
      return useQuery({
        queryKey: propertyKeys.detail(id),
        queryFn: () => propertyFetchers.getDetail(id, accessToken),
        ...options,
        enabled: Boolean(id) && (options?.enabled ?? true),
      });
    },
    useCreate: () => {
      return useMutation({
        mutationFn: (payload: CreatePropertyPayload) =>
          propertyFetchers.create(payload, accessToken),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
        },
      });
    },
    useUpdate: () => {
      return useMutation({
        mutationFn: (input: { id: string; payload: UpdatePropertyPayload }) =>
          propertyFetchers.update(input, accessToken),
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
