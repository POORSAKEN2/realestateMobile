import { apiClient, authHeaders } from "./client";
import { staffApiContract } from "./staffContract";
import { createHttpStaffGateway } from "../services/staff/httpStaffGateway";

export const apiStaffGateway = createHttpStaffGateway({
  get: (path, token) => apiClient.get(path, { headers: authHeaders(token) }),
  post: (path, payload, token) => apiClient.post(path, payload, { headers: authHeaders(token) }),
  patch: (path, payload, token) => apiClient.patch(path, payload, { headers: authHeaders(token) }),
  remove: (path, token) => apiClient.delete(path, { headers: authHeaders(token) }),
}, staffApiContract);
export const createStaffManager = apiStaffGateway.create;
