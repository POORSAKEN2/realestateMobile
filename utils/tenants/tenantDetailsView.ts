export type TenantDetailsView = "details" | "document-selector";

export type TenantDetailsViewAction =
  | { type: "open-document-selector" }
  | { type: "show-details" };

export function tenantDetailsViewReducer(
  _current: TenantDetailsView,
  action: TenantDetailsViewAction,
): TenantDetailsView {
  return action.type === "open-document-selector"
    ? "document-selector"
    : "details";
}
