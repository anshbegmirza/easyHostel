import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CredentialsService } from '../authentication/credentials.service';
import { HostelContextService } from '../hostel/hostel-context.service';

/**
 * Works4-style: prefix relative URLs with serverUrl + apiVersion,
 * attach Bearer token and X-Hostel-Partner.
 */
export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('bypass-interceptor')) {
    return next(
      req.clone({
        headers: req.headers.delete('bypass-interceptor'),
      })
    );
  }

  let request = req;

  if (!/^(http|https):/i.test(req.url)) {
    const url = `${environment.serverUrl}${environment.apiVersion}${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    request = req.clone({ url });
  }

  const credentials = inject(CredentialsService);
  const hostel = inject(HostelContextService);
  let headers = request.headers.set('X-Hostel-Partner', hostel.partner());

  if (credentials.token) {
    headers = headers.set('Authorization', `Bearer ${credentials.token}`);
  }

  return next(request.clone({ headers }));
};
