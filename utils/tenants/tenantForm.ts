import type { Lessee, LesseePayload } from "../../types";

export type TenantFormState = {
  name: string;
  contactEmail: string;
  phone: string;
  propertyIds: string[];
};

export const EMPTY_TENANT_FORM: TenantFormState = {
  name: "",
  contactEmail: "",
  phone: "",
  propertyIds: [],
};

export function createTenantForm(tenant?: Lessee | null): TenantFormState {
  if (!tenant) return { ...EMPTY_TENANT_FORM };
  return {
    name: tenant.name,
    contactEmail: tenant.contactEmail,
    phone: tenant.phone,
    propertyIds: tenant.propertyIds ?? [],
  };
}

export function getTenantFormResult(
  form: TenantFormState,
  requireProperty = false,
):
  | { isValid: true; payload: LesseePayload }
  | { isValid: false; error: string } {
  const payload = {
    name: form.name.trim(),
    contactEmail: form.contactEmail.trim(),
    phone: form.phone.trim(),
    propertyIds: form.propertyIds,
  };

  if (!payload.name)
    return { isValid: false, error: "Tenant name is required." };
  if (!payload.contactEmail)
    return { isValid: false, error: "Tenant email is required." };
  if (!payload.phone)
    return { isValid: false, error: "Tenant phone is required." };
  if (requireProperty && payload.propertyIds.length === 0)
    return {
      isValid: false,
      error: "Select at least one assigned property for this tenant.",
    };
  return { isValid: true, payload };
}
