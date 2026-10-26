export const STAFF_ROLES = ['superuser', 'admin', 'staff'] as const;
export const ADMIN_ROLES = ['superuser', 'admin'] as const;

export function isStaffRole(role?: string | null) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function isAdminRole(role?: string | null) {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isParentRole(role?: string | null) {
  return role === 'parent';
}

export function isTenantRole(role?: string | null) {
  return role === 'tenant';
}
