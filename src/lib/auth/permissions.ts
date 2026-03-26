export type AppRole = "owner" | "manager" | "staff";

export type AppSection =
  | "dashboard"
  | "customers"
  | "services"
  | "staff"
  | "appointments"
  | "products"
  | "sales"
  | "balance"
  | "settings"
  | "profile"
  | "upgrade";

const rolePermissions: Record<AppRole, AppSection[]> = {
  owner: [
    "dashboard",
    "customers",
    "services",
    "staff",
    "appointments",
    "products",
    "sales",
    "balance",
    "settings",
    "profile",
    "upgrade",
  ],
  manager: [
    "dashboard",
    "customers",
    "services",
    "appointments",
    "products",
    "sales",
    "balance",
    "profile",
    "upgrade",
  ],
  staff: [
    "dashboard",
    "customers",
    "appointments",
    "profile",
    "upgrade",
  ],
};

export function normalizeAppRole(role: string | null | undefined): AppRole {
  if (role === "owner" || role === "manager" || role === "staff") {
    return role;
  }

  return "staff";
}

export function hasSectionAccess(
  role: string | null | undefined,
  section: AppSection
) {
  const normalizedRole = normalizeAppRole(role);
  return rolePermissions[normalizedRole].includes(section);
}

export function getAllowedSections(role: string | null | undefined) {
  const normalizedRole = normalizeAppRole(role);
  return rolePermissions[normalizedRole];
}