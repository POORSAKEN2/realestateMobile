export { createLease, deleteLease, fetchLeases, updateLease } from "./leases";
export {
  createLessee,
  deleteLessee,
  fetchLessees,
  updateLessee,
} from "./lessees";
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
