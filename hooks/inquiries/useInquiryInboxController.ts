import { useEffect, useMemo, useState } from "react";

import type { InquiryStatusFilter } from "../../types/domain/inquiries";
import { useInquiryList } from "../api/useInquiries";

const SEARCH_DEBOUNCE_MS = 300;

export function useInquiryInboxController() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<InquiryStatusFilter>("all");

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedQuery(query.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [query]);

  const filters = useMemo(
    () => ({ query: debouncedQuery || undefined, status }),
    [debouncedQuery, status],
  );
  const inquiryQuery = useInquiryList(filters);
  const isFiltered = Boolean(query.trim()) || status !== "all";

  return {
    ...inquiryQuery,
    clearFilters() {
      setQuery("");
      setDebouncedQuery("");
      setStatus("all");
    },
    isFiltered,
    query,
    setQuery,
    setStatus,
    status,
  };
}
