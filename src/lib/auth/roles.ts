import { Role } from "@prisma/client";

export { Role };

export interface AdminUserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Authorization matrix designed for granular extensibility in later parts (Branches, Orders, etc.)
 */
export const Permissions = {
  canManageProducts: (role?: Role | null): boolean => {
    return role === "SUPER_ADMIN" || role === "PRODUCT_MANAGER";
  },
  canManageUsers: (role?: Role | null): boolean => {
    return role === "SUPER_ADMIN";
  },
  canPublishProducts: (role?: Role | null): boolean => {
    return role === "SUPER_ADMIN" || role === "PRODUCT_MANAGER";
  },
  canViewReports: (role?: Role | null): boolean => {
    return role === "SUPER_ADMIN";
  },
};
