import type { Lessee, LesseePayload } from "../../types";

export type TenantFormState = {
  name: string;
  contactEmail: string;
  phone: string;
};

export const EMPTY_TENANT_FORM: TenantFormState = {
  name: "",
  contactEmail: "",
  phone: "",
};

export function createTenantForm(tenant?: Lessee | null): TenantFormState {
  if (!tenant) return { ...EMPTY_TENANT_FORM };
  return {
    name: tenant.name,
    contactEmail: tenant.contactEmail,
    phone: tenant.phone,
  };
}

export function getTenantFormResult(
  form: TenantFormState,
):
  | { isValid: true; payload: LesseePayload }
  | { isValid: false; error: string } {
  const payload = {
    name: form.name.trim(),
    contactEmail: form.contactEmail.trim(),
    phone: form.phone.trim(),
  };

  if (!payload.name)
    return { isValid: false, error: "Tenant name is required." };
  if (!payload.contactEmail)
    return { isValid: false, error: "Tenant email is required." };
  if (!payload.phone)
    return { isValid: false, error: "Tenant phone is required." };
  return { isValid: true, payload };
}
