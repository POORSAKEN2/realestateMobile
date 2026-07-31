export { createLease, deleteLease, fetchLeases, updateLease } from "./leases";
export {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "./clients";
export {
  deleteDocument,
  fetchDocuments,
  updateDocument,
  uploadDocument,
  uploadPropertyDocuments,
} from "./documents";

export type {
  DocumentCategory,
  DocumentUpdatePayload,
  DocumentUpload,
  Lease,
  LeasePayload,
  Lessee,
  LesseePayload,
  PropertyDocument,
} from "../types";
