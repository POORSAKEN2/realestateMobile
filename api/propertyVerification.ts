import { apiClient, unwrapData } from "./client";
import type {
  PropertyVerificationState,
  VerificationRecord,
} from "../types/domain/propertyVerification";
import { getSessionAccess } from "../services/access/sessionAccess";
import { openPrivateEvidence } from "../services/verification/openPrivateEvidence";

function root(propertyId: string) {
  if (getSessionAccess().access.role !== "ADMIN")
    throw new Error("Property verification requires an administrator.");
  return `/properties/${encodeURIComponent(propertyId)}`;
}
export async function fetchPropertyVerification(
  propertyId: string,
  page = 1,
  signal?: AbortSignal,
) {
  return unwrapData(
    await apiClient.get<PropertyVerificationState>(
      `${root(propertyId)}/verification?page=${page}`,
      { signal },
    ),
  );
}
export async function createPropertyVerification(
  propertyId: string,
  level: string,
) {
  return unwrapData(
    await apiClient.post<VerificationRecord>(
      `${root(propertyId)}/verification`,
      { level },
    ),
  );
}
export async function uploadVerificationEvidence(
  propertyId: string,
  id: string,
  body: FormData,
) {
  return unwrapData(
    await apiClient.post<VerificationRecord>(
      `${root(propertyId)}/verification/${encodeURIComponent(id)}/evidence`,
      body,
    ),
  );
}
export async function submitPropertyVerification(
  propertyId: string,
  id: string,
) {
  return unwrapData(
    await apiClient.post<VerificationRecord>(
      `${root(propertyId)}/verification/${encodeURIComponent(id)}/submit`,
    ),
  );
}
export async function withdrawPropertyVerification(
  propertyId: string,
  id: string,
) {
  return unwrapData(
    await apiClient.post<VerificationRecord>(
      `${root(propertyId)}/verification/${encodeURIComponent(id)}/withdraw`,
    ),
  );
}
export async function updateListingAvailability(
  propertyId: string,
  from: string,
  until: string,
) {
  return unwrapData(
    await apiClient.patch<PropertyVerificationState>(
      `${root(propertyId)}/availability`,
      { from, until: until || null },
    ),
  );
}
export async function setPropertyPublication(
  propertyId: string,
  isPublished: boolean,
) {
  return apiClient.patch(`${root(propertyId)}`, { is_published: isPublished });
}
export async function inspectPropertyEvidence(
  propertyId: string,
  id: string,
  evidenceId: string,
  name: string,
) {
  const session = getSessionAccess();
  if (!session.token) throw new Error("Sign-in required.");
  return openPrivateEvidence(
    `${root(propertyId)}/verification/${encodeURIComponent(id)}/evidence/${encodeURIComponent(evidenceId)}`,
    name,
    session.token,
    () => getSessionAccess().revision === session.revision,
  );
}
