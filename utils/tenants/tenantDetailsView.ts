export type TenantDetailsView = "details" | "document-selector" | "note-editor";

export type TenantDetailsViewAction =
  | { type: "open-document-selector" }
  | { type: "open-note-editor" }
  | { type: "show-details" };

export function tenantDetailsViewReducer(
  _current: TenantDetailsView,
  action: TenantDetailsViewAction,
): TenantDetailsView {
  switch (action.type) {
    case "open-document-selector":
      return "document-selector";
    case "open-note-editor":
      return "note-editor";
    default:
      return "details";
  }
}
