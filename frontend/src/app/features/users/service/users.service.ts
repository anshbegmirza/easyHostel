import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AppUser {
  id: string;
  username: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  phone: string | null;
  hostel_id: string;
  auth_provider: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  readonly http = inject(HttpClient);

  list(params?: { role?: string; status?: string }) {
    const q = new URLSearchParams();
    if (params?.role) {
      q.set('role', params.role);
    }
    if (params?.status) {
      q.set('status', params.status);
    }
    const qs = q.toString();
    return this.http.get<{ users: AppUser[] }>(`/users${qs ? `?${qs}` : ''}`);
  }

  createTenant(body: {
    name: string;
    email: string;
    username?: string;
    password?: string;
    phone?: string;
  }) {
    return this.http.post<{ user: AppUser; temp_password: string }>('/users/tenants', body);
  }

  createParent(body: {
    name: string;
    email: string;
    username?: string;
    password?: string;
    tenant_ids: string[];
  }) {
    return this.http.post<{ user: AppUser; temp_password: string }>('/users/parents', body);
  }

  approve(id: string) {
    return this.http.post<{ user: AppUser }>(`/users/${id}/approve`, {});
  }

  reject(id: string) {
    return this.http.post<{ user: AppUser }>(`/users/${id}/reject`, {});
  }

  links(id: string) {
    return this.http.get<{ tenants: AppUser[] }>(`/users/${id}/links`);
  }

  update(
    id: string,
    body: {
      name?: string;
      email?: string;
      username?: string;
      phone?: string | null;
      status?: string;
      password?: string;
      tenant_ids?: string[];
    }
  ) {
    return this.http.patch<{ user: AppUser }>(`/users/${id}`, body);
  }
}
