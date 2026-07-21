import type {
  DocumentCategory,
  DocumentUpload,
  PropertyDocument,
} from "../../types";
import { DOCUMENT_CATEGORIES } from "./documentPresentation";

export type DocumentFormValues = {
  category: DocumentCategory;
  lesseeId: string;
  name: string;
  propertyId: string;
  revisionComment: string;
};

export type DocumentFormErrors = {
  file?: string;
  name?: string;
};

export const EMPTY_DOCUMENT_FORM: DocumentFormValues = {
  category: "Compliance",
  lesseeId: "",
  name: "",
  propertyId: "",
  revisionComment: "",
};

export function createDocumentFormValues(
  document: PropertyDocument,
): DocumentFormValues {
  return {
    category: DOCUMENT_CATEGORIES.includes(
      document.category as DocumentCategory,
    )
      ? (document.category as DocumentCategory)
      : "Compliance",
    lesseeId: document.lesseeId ?? "",
    name: document.name,
    propertyId: document.propertyId ?? "",
    revisionComment: "",
  };
}

export function validateDocumentForm({
  editingDocument,
  file,
  values,
}: {
  editingDocument: PropertyDocument | null;
  file: DocumentUpload | null;
  values: DocumentFormValues;
}): DocumentFormErrors {
  const errors: DocumentFormErrors = {};

  if (!values.name.trim()) errors.name = "Enter a document name.";
  if (!editingDocument && !file) {
    errors.file = "Choose a file to upload.";
  }

  return errors;
}

export function hasDocumentFormErrors(errors: DocumentFormErrors) {
  return Object.keys(errors).length > 0;
}
