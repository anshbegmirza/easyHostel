import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  username?: string | null;
  email: string;
  name: string;
  role: string;
  hostelId: string;
  authProvider: string;
}

const TOKEN_KEY = 'eh4-token';
const USER_KEY = 'eh4-user';

@Injectable({ providedIn: 'root' })
export class CredentialsService {
  user = signal<AuthUser | null>(this.readUser());

  get token() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated() {
    return Boolean(this.token);
  }

  setSession(token: string, user: AuthUser, remember: boolean) {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(TOKEN_KEY);
    other.removeItem(USER_KEY);
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.user.set(null);
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
}
