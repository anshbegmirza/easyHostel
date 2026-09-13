import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  username?: string | null;
  email: string;
  name: string;
  role: string;
  status?: string;
  phone?: string | null;
  hostel_id: string;
  auth_provider: string;
}

const TOKEN_KEY = 'eh4-token';
const USER_KEY = 'eh4-user';
const MODULES_KEY = 'eh4-modules';

@Injectable({ providedIn: 'root' })
export class CredentialsService {
  user = signal<AuthUser | null>(this.readUser());
  modules = signal<string[]>(this.readModules());

  get token() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated() {
    return Boolean(this.token);
  }

  hasModule(code: string) {
    const role = this.user()?.role;
    if (role === 'superuser') {
      return true;
    }
    return this.modules().includes(code);
  }

  setSession(token: string, user: AuthUser, remember: boolean, modules: string[] = []) {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(TOKEN_KEY);
    other.removeItem(USER_KEY);
    other.removeItem(MODULES_KEY);
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
    store.setItem(MODULES_KEY, JSON.stringify(modules));
    this.user.set(user);
    this.modules.set(modules);
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODULES_KEY);
    sessionStorage.removeItem(MODULES_KEY);
    this.user.set(null);
    this.modules.set([]);
  }

  private readUser() {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private readModules() {
    const raw = localStorage.getItem(MODULES_KEY) || sessionStorage.getItem(MODULES_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
}
