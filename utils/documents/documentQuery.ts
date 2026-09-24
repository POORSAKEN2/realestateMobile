export type DocumentQueryParams = {
  archiveState?: "active" | "archived";
  clientId?: string;
  propertyId?: string;
};

export function buildDocumentQuery(params?: DocumentQueryParams) {
  const queryParts = [
    params?.archiveState ? `archive_state=${params.archiveState}` : "",
    params?.propertyId
      ? `property_id=${encodeURIComponent(params.propertyId)}`
      : "",
    params?.clientId ? `client_id=${encodeURIComponent(params.clientId)}` : "",
  ].filter(Boolean);

  return queryParts.length ? `?${queryParts.join("&")}` : "";
}
