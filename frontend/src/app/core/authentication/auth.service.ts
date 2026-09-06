import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthUser, CredentialsService } from './credentials.service';
import { SKIP_ERROR_SNACKBAR } from '../http/error-handler.interceptor';

export interface AuthResponse {
  token: string;
  user: AuthUser;
  hostel?: { id: string; partner: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly credentials = inject(CredentialsService);
  private readonly router = inject(Router);

  readonly user = this.credentials.user;

  private readonly skipSnack = {
    context: new HttpContext().set(SKIP_ERROR_SNACKBAR, true),
  };

  login(username: string, password: string, remember: boolean): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/login', { username, password }, this.skipSnack)
      .pipe(tap((res) => this.credentials.setSession(res.token, res.user, remember)));
  }

  loginWithGoogle(payload: {
    idToken?: string;
    email?: string;
    name?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/google', payload, this.skipSnack)
      .pipe(tap((res) => this.credentials.setSession(res.token, res.user, true)));
  }

  me(): Observable<{ user: AuthUser }> {
    return this.http.get<{ user: AuthUser }>('/auth/me');
  }

  logout() {
    this.credentials.clear();
    this.router.navigateByUrl('/login');
  }

  isLoggedIn() {
    return this.credentials.isAuthenticated();
  }

  homePathForRole(role: string) {
    switch (role) {
      case 'superuser':
      case 'admin':
      case 'staff':
      case 'tenant':
      default:
        return '/';
    }
  }
}
