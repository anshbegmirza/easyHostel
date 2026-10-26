import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CredentialsService } from '../authentication/credentials.service';
import { ToastService } from '../toast.service';

/** Skip global error snackbar for this request. */
export const SKIP_ERROR_SNACKBAR = new HttpContextToken<boolean>(() => false);

/**
 * Error interceptor: snackbar + 401 → logout.
 */
export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const credentials = inject(CredentialsService);
  const router = inject(Router);
  const skipSnack = req.context.get(SKIP_ERROR_SNACKBAR);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          credentials.clear();
          if (!router.url.startsWith('/login') && !router.url.startsWith('/signup')) {
            void router.navigateByUrl('/login');
          }
        }

        if (!skipSnack && error.status !== 0) {
          const message =
            (typeof error.error === 'object' && error.error?.message) ||
            error.message ||
            'Request failed';
          toast.error(String(message));
        }
      }
      return throwError(() => error);
    })
  );
};
