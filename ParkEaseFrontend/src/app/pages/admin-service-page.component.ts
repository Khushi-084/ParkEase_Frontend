import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { extractApiError } from '../core/http-error';
import { UserProfileResponse } from '../core/models';

@Component({
  selector: 'app-admin-service-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-info">Admin Service</span>
          <h2>Platform Governance</h2>
          <p>Review applications and monitor the user directory.</p>
        </div>
      </header>

      <div *ngIf="message()" class="message badge badge-available" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        {{ message() }}
      </div>
      <div *ngIf="error()" class="error-banner" style="margin-bottom: 2rem;">
        {{ error() }}
      </div>

      <section *ngIf="authStore.role() !== 'Admin'" class="section">
        <div class="error-banner">Access Denied: This area is restricted to administrators.</div>
      </section>

      <section class="section grid grid-2" *ngIf="authStore.role() === 'Admin'">
        <!-- Approvals -->
        <article class="card">
          <div class="section-header">
            <h3>Manager Approvals</h3>
            <button class="btn btn-ghost btn-sm" (click)="loadData()">Refresh</button>
          </div>

          <div class="user-list">
            <div *ngFor="let user of pendingManagers()" class="user-item">
              <div class="user-info">
                <strong>{{ user.fullName }}</strong>
                <span class="muted">{{ user.email }}</span>
              </div>
              <div class="user-actions">
                <button class="btn btn-primary btn-sm" (click)="approve(user.userId)">Approve</button>
                <button class="btn btn-secondary btn-sm" (click)="reject(user.userId)">Reject</button>
              </div>
            </div>
            <div *ngIf="pendingManagers().length === 0" class="empty-state">No pending approval requests.</div>
          </div>
        </article>

        <!-- Directory -->
        <article class="card glass">
          <div class="section-header">
            <h3>User Directory</h3>
          </div>

          <div class="user-list">
            <div *ngFor="let user of users()" class="user-item">
              <div class="user-info">
                <strong>{{ user.fullName }}</strong>
                <div class="user-meta">
                  <span class="badge badge-info">{{ user.role }}</span>
                  <span class="badge" [class.badge-available]="user.isActive" [class.badge-occupied]="!user.isActive">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <span class="muted">{{ user.email }}</span>
              </div>
              <div class="admin-actions">
                <div class="role-selector">
                  <select (change)="changeRole(user.userId, $any($event.target).value)" [value]="user.role" class="sm-select">
                    <option value="Driver">Driver</option>
                    <option value="LotManager">LotManager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div class="user-status-btns">
                  <button *ngIf="user.isActive" class="btn btn-secondary btn-sm" (click)="deactivate(user.userId)">Deactivate</button>
                  <button *ngIf="!user.isActive" class="btn btn-primary btn-sm" (click)="activate(user.userId)">Activate</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteUser(user.userId)">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .user-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: white;
    }
    .user-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .user-meta { display: flex; gap: 0.5rem; margin: 0.25rem 0; }
    .admin-actions { display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-end; }
    .user-status-btns { display: flex; gap: 0.5rem; }
    .sm-select {
      padding: 0.3rem 0.6rem;
      border-radius: 8px;
      border: 1px solid var(--line);
      font-size: 0.85rem;
      background: var(--snow);
    }
    .user-actions { display: flex; gap: 0.5rem; }
    .empty-state { padding: 2rem; text-align: center; color: var(--ink-muted); border: 1px dashed var(--line); border-radius: 12px; }
    .btn-danger { background: #ff4d4d; color: white; border: none; }
    .btn-danger:hover { background: #e60000; }
  `]
})
export class AdminServicePageComponent {
  readonly authStore = inject(AuthStore);
  private readonly api = inject(ApiService);

  readonly users = signal<UserProfileResponse[]>([]);
  readonly pendingManagers = signal<UserProfileResponse[]>([]);
  readonly message = signal('');
  readonly error = signal('');

  constructor() {
    if (this.authStore.role() === 'Admin') {
      this.loadData();
    }
  }

  loadData(): void {
    this.api.getPendingLotManagers().subscribe({
      next: (users) => this.pendingManagers.set(users),
      error: (err) => this.error.set(extractApiError(err)),
    });

    this.api.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  approve(userId: string): void {
    this.api.approveLotManager(userId).subscribe({
      next: () => {
        this.message.set('Manager approved.');
        this.loadData();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  reject(userId: string): void {
    this.api.rejectLotManager(userId).subscribe({
      next: () => {
        this.message.set('Manager rejected.');
        this.loadData();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  changeRole(userId: string, role: string): void {
    this.api.changeUserRole(userId, role).subscribe({
      next: () => {
        this.message.set('User role updated successfully.');
        this.loadData();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  activate(userId: string): void {
    this.api.activateUser(userId).subscribe({
      next: () => {
        this.message.set('User activated.');
        this.loadData();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  deactivate(userId: string): void {
    this.api.deactivateUser(userId).subscribe({
      next: () => {
        this.message.set('User deactivated.');
        this.loadData();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    this.api.deleteUser(userId).subscribe({
      next: () => {
        this.message.set('User deleted.');
        this.loadData();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }
}
