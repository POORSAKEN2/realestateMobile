import {
  deleteDocument,
  fetchDocuments,
  fetchLessees,
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
  list(accessToken?: string): Promise<PropertyDocument[]>;
  listLessees(accessToken?: string): Promise<Lessee[]>;
  remove(id: string, accessToken?: string): Promise<void>;
  update(
    id: string,
    payload: DocumentUpdatePayload,
    accessToken?: string,
  ): Promise<PropertyDocument>;
}

export const apiDocumentRepository: DocumentRepository = {
  create: uploadDocument,
  list: fetchDocuments,
  listLessees: fetchLessees,
  remove: deleteDocument,
  update: updateDocument,
};
