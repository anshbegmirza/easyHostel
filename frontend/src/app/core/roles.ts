export const STAFF_ROLES = ['superuser', 'admin', 'staff'] as const;

export function isStaffRole(role?: string | null) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function isParentRole(role?: string | null) {
  return role === 'parent';
}

export function isTenantRole(role?: string | null) {
  return role === 'tenant';
}
