import type { AccessSnapshot, AppPermission, Resource } from "../../types/auth/access";
import { ApiError } from "../../api/errors";
import { canAccessProperty, OPERATIONAL_RESOURCES, permits } from "../../utils/auth/accessPolicy";

export type RequestAccess = { resource?: Resource; permission?: AppPermission; id?: string; propertyId?: string; collection: boolean; aggregate: boolean; inheritProperty: boolean; references: Array<{ resource: Resource; id: string }> };

export function bodyField(body: unknown, name: string): unknown {
  if (!body || typeof body !== "object") return undefined;
  if ("get" in body && typeof body.get === "function") return body.get(name);
  // React Native FormData uses _parts; web FormData exposes get().
  if ("_parts" in body && Array.isArray(body._parts)) return body._parts.find(([key]: [string, unknown]) => key === name)?.[1];
  return (body as Record<string, unknown>)[name];
}

/** URL-to-permission mapping is separate from HTTP transport and UI policy. */
export function describeRequest(path: string, method: string, body?: unknown): RequestAccess {
  const [pathname, search = ""] = path.split("?");
  const segments = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(search);
  const verb = String(bodyField(body, "_method") ?? query.get("_method") ?? method).toUpperCase();
  const references: Array<{ resource: Resource; id: string }> = [];
  for (const [field, related] of [["room_id", "rooms"], ["lease_id", "leases"], ["client_id", "clients"]] as const) {
    const value = bodyField(body, field) ?? query.get(field);
    if (value) references.push({ resource: related, id: String(value) });
  }
  let inheritProperty = false;
  let resource = segments[0] as Resource;
  let id = segments[1];
  let propertyId = String(bodyField(body, "property_id") ?? bodyField(body, "propertyId") ?? query.get("property_id") ?? "") || undefined;
  if (resource === "properties" && id) propertyId = id;
  if (resource === "properties" && segments[2] === "floorplans") { resource = "floorplans"; id = segments[3]; inheritProperty = true; }
  if (resource === "rooms" && segments[2] === "bedspaces") {
    references.push({ resource: "rooms", id }); resource = "bedspaces"; id = segments[3]; inheritProperty = true;
  }
  if (resource === "floorplans" && segments[2] === "areas") {
    references.push({ resource: "floorplans", id }); resource = "areas"; id = segments[3]; inheritProperty = true;
  }
  if (resource === "leads" && ["viewings", "inquiries"].includes(id)) id = segments[2];
  const collection = !id;
  let permission: AppPermission | undefined;
  if (OPERATIONAL_RESOURCES.includes(resource)) {
    const action = verb === "GET" ? collection ? "viewAny" : "view" : verb === "DELETE" ? "delete" : id ? "update" : "create";
    permission = `${resource}.${action}`;
    if (resource === "expenses" && segments[2] === "approve") permission = "expenses.approve";
  }
  if (segments[0] === "users") permission = "staff.manage";
  if (segments[0] === "billing") permission = segments[1] === "checkout" ? "billing.checkout" : "billing.viewEntitlement";
  if (segments[0] === "analytics") permission = "analytics.viewStats";
  // These responses cannot be safely reduced to assigned properties on the device.
  const aggregate = ["analytics", "search", "reports"].includes(segments[0]) || pathname === "/account/data-export";
  return { inheritProperty, references, resource: OPERATIONAL_RESOURCES.includes(resource) ? resource : undefined, permission, id, propertyId, collection, aggregate };
}

export function denyAccess(message = "You don't have permission to do this. Ask your account owner to review your access."): never {
  throw new ApiError(message, 403, "ACCESS_DENIED");
}

/** Records only IDs observed in authorized responses; discarded on every access change. */
export class ResourceScopeIndex {
  private properties = new Map<string, string>();
  remember(resource: string, id: unknown, propertyId: string) {
    if (id !== undefined && id !== null) this.properties.set(`${resource}:${id}`, propertyId);
  }
  find(resource: string, id: string) { return this.properties.get(`${resource}:${id}`); }
}

export function assertRequestAccess(access: AccessSnapshot, request: RequestAccess, index: ResourceScopeIndex) {
  if (request.permission && !permits(access, request.permission)) denyAccess();
  if (access.role !== "MANAGER") return;
  if (request.aggregate) denyAccess("This view is unavailable for property managers until account reporting supports assigned properties.");
  if (!request.resource) return;
  if (!access.propertyIds?.length) denyAccess("No properties are assigned to your account. Ask your account owner to review your access.");
  for (const reference of request.references) {
    const property = index.find(reference.resource, reference.id);
    if (!property || !canAccessProperty(access, property)) denyAccess("This item is not linked to an assigned property.");
    if (!request.propertyId) request.propertyId = property;
  }
  const existingProperty = request.resource === "properties" ? request.id
    : request.id ? index.find(request.resource, request.id) : undefined;
  if (request.id && !existingProperty && request.resource !== "properties") denyAccess("Open this item from an assigned property before making changes.");
  for (const id of [existingProperty, request.propertyId].filter((id): id is string => Boolean(id))) {
    if (!canAccessProperty(access, id) || request.permission && !permits(access, request.permission, id)) denyAccess();
  }
  if (request.permission?.endsWith(".create") && !request.propertyId) denyAccess("Select an assigned property before creating this item.");
}

function propertyFor(row: Record<string, any>, resource: Resource, context: RequestAccess, index: ResourceScopeIndex): string | undefined {
  const value = resource === "properties" ? row.id : row.property_id ?? row.propertyId ?? row.property?.id ?? row.room?.property_id ?? row.lease?.property_id;
  if (value !== undefined && value !== null) return String(value);
  for (const [field, related] of [["room_id", "rooms"], ["lease_id", "leases"], ["client_id", "clients"]] as const) {
    if (row[field] && index.find(related, String(row[field]))) return index.find(related, String(row[field]));
  }
  return context.inheritProperty ? context.propertyId : context.id ? index.find(resource, context.id) : undefined;
}

/** Filter raw API envelopes before data enters React Query or screen state. Unknown scope stays hidden. */
export function scopeResponse<T>(payload: T, access: AccessSnapshot, request: RequestAccess, index: ResourceScopeIndex): T {
  if (access.role !== "MANAGER" || !request.resource) return payload;
  const resource = request.resource;
  function allowed(row: unknown): boolean {
    if (!row || typeof row !== "object") return false;
    const item = row as Record<string, any>;
    const propertyId = propertyFor(item, resource, request, index);
    if (!propertyId || !canAccessProperty(access, propertyId) || request.permission && !permits(access, request.permission, propertyId)) return false;
    index.remember(resource, item.id, propertyId);
    return true;
  }
  function visit(value: unknown): unknown {
    if (Array.isArray(value)) return value.filter(allowed);
    if (!value || typeof value !== "object") return value;
    const record = value as Record<string, unknown>;
    if ("data" in record) {
      const data = visit(record.data);
      // Never show organization-wide totals alongside a filtered collection.
      const { total: _total, meta, ...rest } = record;
      const pagination = meta && typeof meta === "object" ? meta as Record<string, unknown> : {};
      return { ...rest, data, ...(meta ? { meta: { current_page: pagination.current_page, last_page: pagination.last_page } } : {}) };
    }
    if (!allowed(value)) denyAccess();
    return value;
  }
  return visit(payload) as T;
}
