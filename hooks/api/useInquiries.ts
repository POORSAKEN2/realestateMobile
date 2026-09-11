import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchInquiry,
  fetchInquiryPage,
  updateInquiryStatus,
} from "../../api/inquiries";
import type {
  InquiryFilters,
  UpdateInquiryStatusPayload,
} from "../../types/domain/inquiries";
import { usePaginatedQuery } from "./usePaginatedResource";

export const inquiryKeys = {
  all: ["inquiries"] as const,
  lists: () => [...inquiryKeys.all, "list"] as const,
  list: (filters: InquiryFilters) => [...inquiryKeys.lists(), filters] as const,
  details: () => [...inquiryKeys.all, "detail"] as const,
  detail: (id: string) => [...inquiryKeys.details(), id] as const,
};

export function useInquiryList(filters: InquiryFilters) {
  return usePaginatedQuery(inquiryKeys.list(filters), ({ pageParam }) =>
    fetchInquiryPage(filters, pageParam),
  );
}

export function useInquiryDetail(id: string) {
  return useQuery({
    queryKey: inquiryKeys.detail(id),
    queryFn: () => fetchInquiry(id),
    enabled: Boolean(id),
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInquiryStatusPayload) =>
      updateInquiryStatus(payload),
    onSuccess: (inquiry) => {
      queryClient.setQueryData(inquiryKeys.detail(inquiry.id), inquiry);
      queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() });
    },
  });
}
