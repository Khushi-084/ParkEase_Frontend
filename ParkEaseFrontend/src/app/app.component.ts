import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth.store';
import { NotificationService } from './core/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="topbar">
        <a class="brand" routerLink="/welcome">
          <div class="logo-circle"></div>
          <h1>ParkEase</h1>
        </a>

        <nav class="nav-links">
          <a class="nav-link" routerLink="/welcome" routerLinkActive="active">Welcome</a>
          <a *ngIf="isLoggedIn()" class="nav-link" routerLink="/dashboard" routerLinkActive="active">Workspace</a>
          
          <ng-container *ngIf="isLoggedIn()">
            <a class="nav-link" routerLink="/services/booking" routerLinkActive="active">Booking</a>
            <a class="nav-link" routerLink="/services/parking" routerLinkActive="active" *ngIf="authStore.role() === 'LotManager' || authStore.role() === 'Admin'">Management</a>
            <a class="nav-link" routerLink="/services/admin" routerLinkActive="active" *ngIf="authStore.role() === 'Admin'">Admin</a>
          </ng-container>

          <div class="auth-actions">
            <ng-container *ngIf="!isLoggedIn()">
              <a class="btn btn-ghost" routerLink="/auth/login">Login</a>
              <a class="btn btn-primary" routerLink="/auth/register">Sign Up</a>
            </ng-container>
            
            <ng-container *ngIf="isLoggedIn()">
              <a class="nav-link notification-bell" routerLink="/notifications" routerLinkActive="active">
                <span class="bell-icon">🔔</span>
                <span class="badge badge-coral badge-pill" *ngIf="notifService.unreadCount() > 0">
                  {{ notifService.unreadCount() }}
                </span>
              </a>
              <a class="nav-link" routerLink="/profile" routerLinkActive="active">Profile</a>
              <button class="btn btn-secondary btn-sm" type="button" (click)="logout()">
                Logout
              </button>
            </ng-container>
          </div>
        </nav>
      </header>

      <main class="animate-fade">
        <router-outlet></router-outlet>
      </main>

      <footer class="bottom-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="logo-circle-small"></div>
            <span>ParkEase &copy; 2026</span>
          </div>
          <div class="footer-links">
            <a routerLink="/welcome">Home</a>
            <a routerLink="/profile">Profile</a>
            <a href="mailto:support@parkease.com">Support</a>
          </div>
          <div class="footer-status">
            <span class="status-dot"></span> System Operational
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .logo-circle {
      width: 32px;
      height: 32px;
      background: var(--mint);
      border-radius: 50%;
      border: 3px solid var(--chocolate);
    }
    .auth-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-left: 1rem;
      padding-left: 1rem;
      border-left: 1px solid var(--line);
    }
    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }
    .notification-bell {
      position: relative;
      margin-right: 0.5rem;
    }
    .bell-icon {
      font-size: 1.4rem;
    }
    .badge-pill {
      position: absolute;
      top: -5px;
      right: -5px;
      min-width: 18px;
      height: 18px;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    .bottom-footer {
      margin-top: auto;
      padding: 2rem 0;
      border-top: 1px solid var(--line);
      background: var(--snow);
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--ink-muted);
      font-size: 0.9rem;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo-circle-small {
      width: 16px;
      height: 16px;
      background: var(--mint);
      border-radius: 50%;
      border: 2px solid var(--chocolate);
    }
    .footer-links {
      display: flex;
      gap: 2rem;
    }
    .footer-links a {
      color: var(--ink-muted);
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer-links a:hover {
      color: var(--chocolate);
    }
    .footer-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: #4caf50;
      border-radius: 50%;
      box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
    }
  `]
})
export class AppComponent {
  readonly authStore = inject(AuthStore);
  readonly notifService = inject(NotificationService);
  private readonly router = inject(Router);
  readonly isLoggedIn = computed(() => this.authStore.isAuthenticated());

  logout(): void {
    this.authStore.clear();
    void this.router.navigate(['/auth/login']);
  }
}
