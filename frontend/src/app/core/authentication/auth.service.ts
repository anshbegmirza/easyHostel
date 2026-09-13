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
  modules?: string[];
  linked_tenants?: AuthUser[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly credentials = inject(CredentialsService);
  private readonly router = inject(Router);

  readonly user = this.credentials.user;
  readonly modules = this.credentials.modules;

  private readonly skipSnack = {
    context: new HttpContext().set(SKIP_ERROR_SNACKBAR, true),
  };

  login(username: string, password: string, remember: boolean): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/login', { username, password }, this.skipSnack)
      .pipe(
        tap((res) =>
          this.credentials.setSession(res.token, res.user, remember, res.modules || [])
        )
      );
  }

  loginWithGoogle(payload: {
    id_token?: string;
    email?: string;
    name?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/google', payload, this.skipSnack)
      .pipe(
        tap((res) => this.credentials.setSession(res.token, res.user, true, res.modules || []))
      );
  }

  register(body: { name: string; email: string; username?: string; password: string }) {
    return this.http.post<{ message: string; user_id: string }>('/auth/register', body, this.skipSnack);
  }

  me(): Observable<{ user: AuthUser; modules?: string[]; linked_tenants?: AuthUser[] }> {
    return this.http.get<{ user: AuthUser; modules?: string[]; linked_tenants?: AuthUser[] }>('/auth/me');
  }

  logout() {
    this.credentials.clear();
    this.router.navigateByUrl('/login');
  }

  isLoggedIn() {
    return this.credentials.isAuthenticated();
  }

  hasModule(code: string) {
    return this.credentials.hasModule(code);
  }

  homePathForRole(_role: string) {
    return '/';
  }
}
