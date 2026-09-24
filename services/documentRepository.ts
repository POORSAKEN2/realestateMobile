import {
  deleteDocument,
  fetchDocuments,
  fetchClients,
  updateDocument,
  uploadDocument,
} from "../api/propertyDetails";
import type {
  DocumentCategory,
  DocumentUpdatePayload,
  DocumentUpload,
  Lessee,
  PropertyDocument,
} from "../types";

export type CreateDocumentPayload = {
  category: DocumentCategory;
  file: DocumentUpload;
  lesseeId?: string;
  name: string;
  propertyId?: string;
};

export interface DocumentRepository {
  create(
    payload: CreateDocumentPayload,
    accessToken?: string,
  ): Promise<PropertyDocument>;
  list(accessToken?: string, signal?: AbortSignal, archiveState?: "active" | "archived"): Promise<PropertyDocument[]>;
  listClients(accessToken?: string): Promise<Lessee[]>;
  remove(id: string, accessToken?: string): Promise<void>;
  update(
    id: string,
    payload: DocumentUpdatePayload,
    accessToken?: string,
  ): Promise<PropertyDocument>;
}

export const apiDocumentRepository: DocumentRepository = {
  create: uploadDocument,
  list: (accessToken, signal, archiveState = "active") => fetchDocuments(accessToken, { archiveState }, signal),
  listClients: fetchClients,
  remove: deleteDocument,
  update: updateDocument,
};
