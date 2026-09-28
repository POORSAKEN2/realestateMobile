import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPropertyVerification } from "../../api/propertyVerification";
import { useAuth } from "../useAuth";

export function usePropertyVerification(propertyId: string, page = 1) {
  const { session } = useAuth();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["property-verification", session?.accessToken, propertyId, page],
    queryFn: ({ signal }) =>
      fetchPropertyVerification(propertyId, page, signal),
  });
  const action = useMutation({
    mutationFn: (operation: () => Promise<unknown>) => operation(),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["property-verification"] }),
        cache.invalidateQueries({ queryKey: ["properties"] }),
      ]);
    },
  });
  return { query, action };
}
