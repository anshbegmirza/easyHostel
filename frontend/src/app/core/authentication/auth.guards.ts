import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CredentialsService } from './credentials.service';
import { isStaffRole } from '../roles';

export const authGuard: CanActivateFn = () => {
  const credentials = inject(CredentialsService);
  const router = inject(Router);
  if (credentials.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const credentials = inject(CredentialsService);
  const router = inject(Router);
  if (!credentials.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/']);
};

export const staffGuard: CanActivateFn = () => {
  const credentials = inject(CredentialsService);
  const router = inject(Router);
  if (!credentials.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (isStaffRole(credentials.user()?.role)) {
    return true;
  }
  return router.createUrlTree(['/']);
};

export const superuserGuard: CanActivateFn = () => {
  const credentials = inject(CredentialsService);
  const router = inject(Router);
  if (!credentials.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (credentials.user()?.role === 'superuser') {
    return true;
  }
  return router.createUrlTree(['/']);
};

export const tenantGuard: CanActivateFn = () => {
  const credentials = inject(CredentialsService);
  const router = inject(Router);
  if (!credentials.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (credentials.user()?.role === 'tenant') {
    return true;
  }
  return router.createUrlTree(['/']);
};

/** Staff routes that also need a module grant (superuser always passes). */
export function moduleGuard(code: string): CanActivateFn {
  return () => {
    const credentials = inject(CredentialsService);
    const router = inject(Router);
    if (!credentials.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    const role = credentials.user()?.role;
    if (role === 'superuser') {
      return true;
    }
    if (!isStaffRole(role)) {
      return router.createUrlTree(['/']);
    }
    if (credentials.hasModule(code)) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
}
