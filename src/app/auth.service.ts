import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface UserInfo {
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  userId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

interface AuthResponse {
  token: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);

  private readonly TOKEN_KEY = 'trello-token';
  readonly apiUrl = 'http://localhost:5108';

  private token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  user = computed<UserInfo | null>(() => this.decodeToken(this.token()));
  isAuthenticated = computed(() => !!this.user()?.email);
  role = computed(() => this.user()?.roles?.[0] ?? 'Guest');
  userId = computed(() => this.user()?.userId ?? null);
  displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.firstName) return `${u.firstName} ${u.lastName ?? ''}`.trim();
    return u.email;
  });
  initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    if (u.firstName) {
      return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    }
    return u.email.substring(0, 2).toUpperCase();
  });

  private setToken(token: string | null) {
    this.token.set(token);
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  private decodeToken(token: string | null): UserInfo | null {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded) as Record<string, unknown>;

      // sub now carries the userId (GUID)
      const userId = typeof parsed['sub'] === 'string' ? parsed['sub'] : undefined;
      const email =
        typeof parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] === 'string'
          ? parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
          : typeof parsed['email'] === 'string'
          ? parsed['email']
          : null;

      const nameKey = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
      const emailFallback = typeof parsed[nameKey] === 'string' ? parsed[nameKey] : null;
      const resolvedEmail = email ?? emailFallback;

      const rawRoles =
        parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        parsed['role'];
      const roles = Array.isArray(rawRoles)
        ? rawRoles.filter((r): r is string => typeof r === 'string')
        : typeof rawRoles === 'string'
        ? [rawRoles]
        : [];

      const firstName = typeof parsed['given_name'] === 'string' ? parsed['given_name'] : undefined;
      const lastName = typeof parsed['family_name'] === 'string' ? parsed['family_name'] : undefined;

      if (!resolvedEmail) return null;
      return { email: resolvedEmail, roles, firstName, lastName, userId };
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    const payload = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
    );
    this.setToken(payload.token);
    return true;
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<boolean> {
    const payload = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
        email,
        password,
        firstName,
        lastName
      })
    );
    this.setToken(payload.token);
    return true;
  }

  logout(): void {
    this.setToken(null);
    this.router.navigate(['/login']);
  }

  async fetchUsers(): Promise<AuthUser[]> {
    return firstValueFrom(this.http.get<AuthUser[]>(`${this.apiUrl}/auth/users`));
  }

  async updateUserRole(email: string, role: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/auth/role`, { email, role })
    );
  }

  async profile(): Promise<UserInfo> {
    return firstValueFrom(this.http.get<UserInfo>(`${this.apiUrl}/auth/profile`));
  }
}
