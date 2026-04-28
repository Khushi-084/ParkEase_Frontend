import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../core/auth.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-available">Welcome Back, {{ authStore.fullName() }}</span>
          <h2>Your Dashboard</h2>
          <p>Manage your parking services and operations</p>
        </div>
        <div class="user-meta card glass">
          <div class="meta-item">
            <span class="label">Role</span>
            <span class="value">{{ authStore.role() }}</span>
          </div>
          <div class="meta-item">
            <span class="label">Account Status</span>
            <span class="value">Active</span>
          </div>
        </div>
      </header>

      <div *ngIf="authStore.role() === 'LotManager' && authStore.isApproved() === false" class="message badge badge-occupied" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        Your Lot Manager account is pending approval by an Admin. Some features may be restricted until approved.
      </div>

      <section class="services-overview">
        <div class="section-title">
          <h3>Available Services</h3>
          <p>Access the core modules of the ParkEase system</p>
        </div>

        <div class="service-grid grid grid-3">
          <!-- Booking Service (Primary for Drivers) -->
          <a *ngIf="authStore.role() === 'Driver'" class="service-card card animate-fade" routerLink="/services/booking" style="--delay: 0.1s">
            <div class="service-icon theme-mint">📅</div>
            <h4>Booking</h4>
            <p>Create and manage your parking reservations effortlessly.</p>
            <span class="action-hint">Open Service →</span>
          </a>

          <!-- Parking Service (Primary for Managers) -->
          <a *ngIf="authStore.role() === 'LotManager' || authStore.role() === 'Admin'" class="service-card card animate-fade" routerLink="/services/parking" style="--delay: 0.2s">
            <div class="service-icon theme-coral">🅿️</div>
            <h4>Parking Lots</h4>
            <p>Monitor lot status, pricing, and overall occupancy.</p>
            <span class="action-hint">Open Service →</span>
          </a>

          <!-- Ticket Service -->
          <a *ngIf="authStore.role() === 'LotManager' || authStore.role() === 'Admin'" class="service-card card animate-fade" routerLink="/services/ticket" style="--delay: 0.3s">
            <div class="service-icon theme-lavender">🎟️</div>
            <h4>Tickets</h4>
            <p>Handle on-the-spot entries and exit processing.</p>
            <span class="action-hint">Open Service →</span>
          </a>

          <!-- Slot Service -->
          <a *ngIf="authStore.role() === 'LotManager' || authStore.role() === 'Admin'" class="service-card card animate-fade" routerLink="/services/slot" style="--delay: 0.4s">
            <div class="service-icon theme-mint">📐</div>
            <h4>Slot Setup</h4>
            <p>Configure slot types and perform bulk operations.</p>
            <span class="action-hint">Open Service →</span>
          </a>

          <!-- Payment Service -->
          <a class="service-card card animate-fade" routerLink="/services/payment" style="--delay: 0.5s">
            <div class="service-icon theme-coral">💳</div>
            <h4>Payments</h4>
            <p>Review transaction history and payment details.</p>
            <span class="action-hint">Open Service →</span>
          </a>

          <!-- Admin Service -->
          <a *ngIf="authStore.role() === 'Admin'" class="service-card card animate-fade" routerLink="/services/admin" style="--delay: 0.6s">
            <div class="service-icon theme-lavender">🛡️</div>
            <h4>Administration</h4>
            <p>Manage users and lot manager approval requests.</p>
            <span class="action-hint">Open Service →</span>
          </a>
        </div>
      </section>

      <!-- Profile Quick Link -->
      <section class="quick-links animate-fade" style="--delay: 0.7s">
        <div class="promo-card card glass">
          <div class="promo-content">
            <h4>Need to update your details?</h4>
            <p>Manage your personal profile and security settings in your account workspace.</p>
          </div>
          <a class="btn btn-accent" routerLink="/profile">View Profile</a>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4rem;
      padding-top: 2rem;
    }
    .user-greeting h2 {
      font-size: 2.5rem;
      margin-top: 1rem;
      color: var(--chocolate);
    }
    .user-meta {
      display: flex;
      gap: 2rem;
      padding: 1.5rem 2.5rem;
    }
    .meta-item .label {
      display: block;
      font-size: 0.75rem;
      color: var(--ink-muted);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .meta-item .value {
      font-weight: 700;
      color: var(--chocolate);
      font-size: 1.1rem;
    }
    .section-title {
      margin-bottom: 2.5rem;
    }
    .section-title h3 {
      font-size: 1.75rem;
      color: var(--chocolate);
    }
    .service-card {
      text-decoration: none;
      color: inherit;
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      overflow: hidden;
    }
    .service-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .theme-mint { background: var(--mint); }
    .theme-coral { background: var(--coral); }
    .theme-lavender { background: var(--lavender); }
    
    .service-card h4 {
      font-size: 1.25rem;
      color: var(--chocolate);
    }
    .service-card p {
      color: var(--ink-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .action-hint {
      margin-top: auto;
      font-weight: 600;
      color: var(--coral);
      font-size: 0.9rem;
    }
    .animate-fade {
      opacity: 0;
      animation: fadeIn 0.5s ease forwards;
      animation-delay: var(--delay, 0s);
    }
    .quick-links {
      margin-top: 4rem;
    }
    .promo-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5rem;
      background: linear-gradient(to right, rgba(235, 174, 230, 0.1), rgba(173, 235, 179, 0.1));
    }
    .promo-content h4 {
      margin-bottom: 0.5rem;
    }
    
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2rem;
      }
      .user-meta {
        width: 100%;
        justify-content: space-around;
      }
      .promo-card {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }
    }
  `]
})
export class DashboardPageComponent {
  readonly authStore = inject(AuthStore);
}
