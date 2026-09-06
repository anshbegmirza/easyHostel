import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CredentialsService } from './credentials.service';

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
