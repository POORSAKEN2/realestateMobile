import { useMutation } from "@tanstack/react-query";

import { createStaffManager } from "../../api/staff";
import type { CreateStaffManagerPayload } from "../../types";

export function useCreateStaffManager(accessToken?: string) {
  return useMutation({
    mutationFn: (payload: CreateStaffManagerPayload) =>
      createStaffManager(payload, accessToken),
  });
}
