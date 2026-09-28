import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";
import { getSessionAccess } from "../services/access/sessionAccess";
import type { ApiEnvelope, PropertyOwner } from "../types";

function normalizePropertyOwner(owner: Record<string, unknown>): PropertyOwner {
  return {
    id: String(owner.id ?? ""),
    name: String(owner.name ?? "Property owner"),
    contactEmail: String(owner.contactEmail ?? owner.contact_email ?? ""),
    phone: String(owner.phone ?? ""),
    createdAt:
      typeof owner.createdAt === "string" ? owner.createdAt : undefined,
    updatedAt:
      typeof owner.updatedAt === "string" ? owner.updatedAt : undefined,
    verificationStatus:
      typeof (owner.verificationStatus ?? owner.verification_status) ===
      "string"
        ? String(owner.verificationStatus ?? owner.verification_status)
        : undefined,
  };
}

export type OwnerDraft = { name: string; contact_email: string; phone: string };
export type OwnerPage = { records: PropertyOwner[]; nextPage: number | null };
export type OwnerPropertyPage = {
  records: { id: string; title: string; location: string }[];
  next_page: number | null;
};

function requireAdmin() {
  if (getSessionAccess().access.role !== "ADMIN")
    throw new Error("Owner management requires an administrator.");
}

export async function fetchOwnerPage(
  page: number,
  search: string,
  signal?: AbortSignal,
): Promise<OwnerPage> {
  requireAdmin();
  const response = await apiClient.get<any>(
    `/lessors?page=${page}&search=${encodeURIComponent(search)}`,
    { signal },
  );
  const pagination = response.meta ?? response.data?.meta;
  return {
    records: unwrapCollection<Record<string, unknown>>(response).map(
      normalizePropertyOwner,
    ),
    nextPage: page < Number(pagination?.last_page ?? 1) ? page + 1 : null,
  };
}

export async function fetchOwner(
  id: string,
  signal?: AbortSignal,
): Promise<PropertyOwner> {
  requireAdmin();
  return normalizePropertyOwner(
    unwrapData(
      await apiClient.get<Record<string, unknown>>(
        `/lessors/${encodeURIComponent(id)}`,
        { signal },
      ),
    ),
  );
}

export async function saveOwner(
  draft: OwnerDraft,
  id?: string,
): Promise<PropertyOwner> {
  requireAdmin();
  const data = id
    ? await apiClient.patch<Record<string, unknown>>(
        `/lessors/${encodeURIComponent(id)}`,
        draft,
      )
    : await apiClient.post<Record<string, unknown>>("/lessors", draft);
  return normalizePropertyOwner(unwrapData(data));
}

export async function fetchOwnerProperties(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  requireAdmin();
  return unwrapData(
    await apiClient.get<OwnerPropertyPage>(
      `/lessors/${encodeURIComponent(id)}/properties?page=${page}`,
      { signal },
    ),
  );
}

export async function fetchPropertyOwners(accessToken?: string) {
  const owners: PropertyOwner[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await apiClient.get<
      ApiEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]
    >(`/lessors?page=${page}`, { headers: authHeaders(accessToken) });
    owners.push(...unwrapCollection(response).map(normalizePropertyOwner));
    const envelope = response as Record<string, any>;
    const pagination = envelope.meta ?? envelope.data?.meta;
    const advertisedLastPage = Number(pagination?.last_page ?? 1);
    lastPage =
      Number.isInteger(advertisedLastPage) && advertisedLastPage > 0
        ? advertisedLastPage
        : 1;
    page += 1;
  } while (page <= lastPage);

  return [...new Map(owners.map((owner) => [owner.id, owner])).values()];
}
