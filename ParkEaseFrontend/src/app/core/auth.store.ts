import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, UserRole } from './models';

const STORAGE_KEY = 'parkease.auth';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly session = signal<AuthResponse | null>(this.readInitialState());

  readonly token = computed(() => this.session()?.token ?? null);
  readonly role = computed<UserRole | null>(() => this.session()?.role ?? null);
  readonly userId = computed(() => this.session()?.userId ?? null);
  readonly fullName = computed(() => this.session()?.fullName ?? null);
  readonly email = computed(() => this.session()?.email ?? null);
  readonly isApproved = computed(() => this.session()?.isApproved ?? null);
  readonly isAuthenticated = computed(() => !!this.session()?.token);

  setSession(response: AuthResponse): void {
    this.session.set(response);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
  }

  clear(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private readInitialState(): AuthResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
