import { apiClient, authHeaders, unwrapCollection } from "./client";
import type { ApiEnvelope, PropertyOwner } from "../types";

function normalizePropertyOwner(owner: Record<string, unknown>): PropertyOwner {
  return {
    id: String(owner.id ?? ""),
    name: String(owner.name ?? "Property owner"),
    contactEmail: String(owner.contactEmail ?? owner.contact_email ?? ""),
    phone: String(owner.phone ?? ""),
    verificationStatus:
      typeof (owner.verificationStatus ?? owner.verification_status) === "string"
        ? String(owner.verificationStatus ?? owner.verification_status)
        : undefined,
  };
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
