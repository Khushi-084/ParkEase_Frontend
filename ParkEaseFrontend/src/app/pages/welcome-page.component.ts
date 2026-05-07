import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { extractApiError } from '../core/http-error';
import { LotResponse } from '../core/models';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="page">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <span class="badge badge-info">Smart Parking Solution</span>
          <h2 class="display-text">Find your perfect spot with <span class="highlight">ParkEase</span></h2>
          <p class="hero-subtitle">
            The modern way to manage, book, and discover parking slots in real-time. 
            Join thousands of drivers and lot managers today.
          </p>
          <div class="hero-actions">
            <a *ngIf="!isLoggedIn()" class="btn btn-primary btn-lg" routerLink="/auth/register">Get Started Free</a>
            <a *ngIf="isLoggedIn()" class="btn btn-primary btn-lg" routerLink="/dashboard">Go to Workspace</a>
            <a class="btn btn-ghost btn-lg" href="#explore">Explore Lots</a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="abstract-shape shape-1"></div>
          <div class="abstract-shape shape-2"></div>
          <div class="stats-card glass">
            <div class="stat-item">
              <span class="stat-value">{{ activeLots() }}</span>
              <span class="stat-label">Active Lots</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ availableSpots() }}</span>
              <span class="stat-label">Available Now</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Role Cards -->
      <section class="roles-section grid grid-2">
        <div class="role-card driver-theme card">
          <div class="role-icon">🚗</div>
          <h3>For Drivers</h3>
          <p>Search, book, and pay for parking in seconds. No more circling the block.</p>
          <ul class="feature-list">
            <li>Real-time availability</li>
            <li>Instant booking & payment</li>
            <li>Easy check-in/out</li>
          </ul>
        </div>
        <div class="role-card manager-theme card">
          <div class="role-icon">🏢</div>
          <h3>For Managers</h3>
          <p>Optimize your facility, manage spots, and maximize revenue with ease.</p>
          <ul class="feature-list">
            <li>Slot configuration</li>
            <li>Occupancy analytics</li>
            <li>Automated reporting</li>
          </ul>
        </div>
      </section>

      <!-- Explore Section -->
      <section id="explore" class="inventory-section">
        <div class="section-header">
          <div>
            <h3>Explore Parking Lots</h3>
            <p>Live inventory from across the city</p>
          </div>
          <div class="search-box">
            <input 
              type="text" 
              [ngModel]="searchTerm()" 
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Search by city or lot name..."
            />
          </div>
        </div>

        <div *ngIf="error()" class="error-banner">{{ error() }}</div>

        <div class="lots-grid grid grid-3">
          <div 
            *ngFor="let lot of filteredLots()" 
            class="lot-card card"
            [class.selected]="selectedLot()?.lotId === lot.lotId"
            (click)="selectLot(lot)"
          >
            <div class="lot-header">
              <h4>{{ lot.name }}</h4>
              <span class="badge" [class.badge-available]="lot.availableSpots > 0" [class.badge-occupied]="lot.availableSpots === 0">
                {{ lot.availableSpots > 0 ? 'Available' : 'Full' }}
              </span>
            </div>
            <p class="lot-location">{{ lot.city }}, {{ lot.state }}</p>
            <div class="lot-info">
              <div class="info-item">
                <span class="label">Price</span>
                <span class="value">Rs {{ lot.pricePerHour }}/hr</span>
              </div>
              <div class="info-item">
                <span class="label">Spots</span>
                <span class="value">{{ lot.availableSpots }}/{{ lot.totalSpots }}</span>
              </div>
            </div>
            <button class="btn btn-primary btn-full" routerLink="/auth/login" *ngIf="!isLoggedIn()">Book Now</button>
            <button class="btn btn-primary btn-full" routerLink="/services/booking" *ngIf="isLoggedIn() && authStore.role() === 'Driver'">Book Now</button>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .hero-section {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 4rem;
      padding: 4rem 0;
      align-items: center;
    }
    .display-text {
      font-size: 3.5rem;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      color: var(--chocolate);
    }
    .highlight {
      color: var(--coral);
      position: relative;
    }
    .highlight::after {
      content: '';
      position: absolute;
      bottom: 5px;
      left: 0;
      width: 100%;
      height: 12px;
      background: var(--lavender);
      z-index: -1;
      opacity: 0.5;
    }
    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--ink-muted);
      margin-bottom: 2.5rem;
      max-width: 500px;
    }
    .hero-actions {
      display: flex;
      gap: 1rem;
    }
    .hero-visual {
      position: relative;
      height: 400px;
    }
    .abstract-shape {
      position: absolute;
      border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
      filter: blur(40px);
      z-index: -1;
    }
    .shape-1 {
      width: 300px;
      height: 300px;
      background: var(--mint);
      top: 0;
      right: 0;
      opacity: 0.4;
    }
    .shape-2 {
      width: 250px;
      height: 250px;
      background: var(--lavender);
      bottom: 0;
      left: 0;
      opacity: 0.4;
    }
    .stats-card {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 2rem;
      border-radius: 24px;
      display: flex;
      gap: 2rem;
      width: 100%;
      justify-content: center;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      display: block;
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--chocolate);
      font-family: 'Outfit';
    }
    .stat-label {
      font-size: 0.9rem;
      color: var(--ink-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .stat-divider {
      width: 1px;
      background: var(--line);
    }
    .roles-section {
      padding: 4rem 0;
    }
    .role-card {
      padding: 3rem;
      text-align: center;
    }
    .role-icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
    }
    .feature-list {
      list-style: none;
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }
    .feature-list li::before {
      content: '✓';
      margin-right: 0.5rem;
      color: var(--mint);
      font-weight: bold;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 3rem;
    }
    .search-box input {
      padding: 1rem 1.5rem;
      border-radius: 999px;
      border: 1px solid var(--line);
      width: 300px;
      font-family: inherit;
    }
    .lot-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .lot-location {
      color: var(--ink-muted);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .lot-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .info-item {
      background: #fdfcfc;
      padding: 0.75rem;
      border-radius: 12px;
      text-align: center;
    }
    .info-item .label {
      display: block;
      font-size: 0.75rem;
      color: var(--ink-muted);
      text-transform: uppercase;
    }
    .info-item .value {
      font-weight: 600;
      color: var(--chocolate);
    }
    .btn-full {
      width: 100%;
    }
    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }
    .error-banner {
      background: var(--coral);
      color: white;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    @media (max-width: 992px) {
      .hero-section {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 2rem;
      }
      .hero-content {
        order: 2;
      }
      .hero-visual {
        order: 1;
        height: 300px;
      }
      .hero-subtitle {
        margin-left: auto;
        margin-right: auto;
      }
      .hero-actions {
        justify-content: center;
      }
    }
  `]
})
export class WelcomePageComponent {
  readonly authStore = inject(AuthStore);
  private readonly api = inject(ApiService);

  readonly lots = signal<LotResponse[]>([]);
  readonly selectedLot = signal<LotResponse | null>(null);
  readonly error = signal('');
  readonly searchTerm = signal('');
  readonly isLoggedIn = computed(() => this.authStore.isAuthenticated());
  
  readonly availableSpots = computed(() =>
    this.lots().reduce((sum, lot) => sum + lot.availableSpots, 0),
  );
  
  readonly activeLots = computed(() =>
    this.lots().filter((lot) => lot.status === 'Active').length,
  );
  
  readonly filteredLots = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.lots();

    return this.lots().filter((lot) =>
      `${lot.name} ${lot.city} ${lot.state} ${lot.address}`.toLowerCase().includes(query),
    );
  });

  constructor() {
    this.loadLots();
  }

  loadLots(): void {
    this.api.getLots(1, 50).subscribe({
      next: (response) => {
        this.lots.set(response.items);
        this.error.set('');
      },
      error: (error) => this.error.set(extractApiError(error)),
    });
  }

  selectLot(lot: LotResponse): void {
    this.selectedLot.set(lot);
  }
}
