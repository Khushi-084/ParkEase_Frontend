import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { extractApiError } from '../core/http-error';
import { LotResponse } from '../core/models';

@Component({
  selector: 'app-parking-service-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-info">Parking Service</span>
          <h2>Parking Lot Management</h2>
          <p>Register, update, and monitor your parking facilities.</p>
        </div>
      </header>

      <div *ngIf="message()" class="message badge badge-available" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        {{ message() }}
      </div>
      <div *ngIf="error()" class="error-banner" style="margin-bottom: 2rem;">
        {{ error() }}
      </div>

      <section class="section grid grid-2">
        <!-- Lot Explorer -->
        <article class="card">
          <div class="section-header">
            <h3>Lot Inventory</h3>
            <button class="btn btn-ghost btn-sm" (click)="loadLots()">Refresh</button>
          </div>

          <form [formGroup]="searchForm" (ngSubmit)="loadLots()" class="search-filter-box">
            <div class="field">
              <input type="text" formControlName="city" placeholder="Filter by City..." />
            </div>
            <button class="btn btn-primary" type="submit">Search</button>
          </form>

          <div class="lots-list">
            <div *ngFor="let lot of lots()" class="lot-item-card" [class.editing]="editingId() === lot.lotId">
              <div class="lot-main">
                <div>
                  <strong>{{ lot.name }}</strong>
                  <span class="lot-loc">{{ lot.city }}, {{ lot.state }}</span>
                </div>
                <span class="badge" [class.badge-available]="lot.status === 'Active'" [class.badge-occupied]="lot.status !== 'Active'">
                  {{ lot.status }}
                </span>
              </div>
              <div class="lot-meta">
                <span>Rs {{ lot.pricePerHour }}/hr</span>
                <span>{{ lot.availableSpots }}/{{ lot.totalSpots }} Slots</span>
              </div>
              <div class="lot-actions">
                <button *ngIf="canEdit()" class="btn btn-ghost btn-sm" (click)="prefill(lot)">Edit Details</button>
                <button *ngIf="authStore.role() === 'Admin'" class="btn btn-secondary btn-sm" (click)="toggleStatus(lot)">Toggle Status</button>
              </div>
            </div>
          </div>
        </article>

        <!-- Creation/Edit Form -->
        <article class="card glass">
          <div class="section-header">
            <h3>{{ editingId() ? 'Update Facility' : 'Register New Facility' }}</h3>
          </div>

          <form [formGroup]="lotForm" (ngSubmit)="saveLot()" class="lot-form">
            <div class="field">
              <label>Lot Name</label>
              <input type="text" formControlName="name" placeholder="E.g. Central Plaza Parking" />
            </div>
            <div class="field">
              <label>Address</label>
              <input type="text" formControlName="address" placeholder="Full street address" />
            </div>
            <div class="grid grid-2">
              <div class="field">
                <label>City</label>
                <input type="text" formControlName="city" />
              </div>
              <div class="field">
                <label>State</label>
                <input type="text" formControlName="state" />
              </div>
            </div>
            <div class="grid grid-2">
              <div class="field">
                <label>Total Slots</label>
                <input type="number" formControlName="totalSpots" />
              </div>
              <div class="field">
                <label>Price (Rs/hr)</label>
                <input type="number" formControlName="pricePerHour" />
              </div>
            </div>
            <div class="field">
              <label>Description</label>
              <textarea formControlName="description" rows="3" placeholder="Optional details..."></textarea>
            </div>
            
            <div class="form-actions">
              <button class="btn btn-primary btn-full" type="submit" [disabled]="lotForm.invalid || !canEdit()">
                {{ editingId() ? 'Save Changes' : 'Create Facility' }}
              </button>
              <button *ngIf="editingId()" class="btn btn-ghost btn-full" type="button" (click)="resetForm()">Cancel Edit</button>
            </div>
          </form>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .search-filter-box {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .search-filter-box .field { margin-bottom: 0; flex: 1; }
    
    .lots-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .lot-item-card {
      padding: 1.25rem;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: white;
      transition: all 0.2s;
    }
    .lot-item-card.editing {
      border-color: var(--mint);
      background: rgba(173, 235, 179, 0.05);
    }
    .lot-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .lot-loc {
      display: block;
      font-size: 0.85rem;
      color: var(--ink-muted);
    }
    .lot-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--chocolate);
      margin-bottom: 1rem;
    }
    .lot-actions {
      display: flex;
      gap: 0.5rem;
    }
    .lot-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    textarea {
      padding: 0.8rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: #fdfcfc;
      font-family: inherit;
      resize: vertical;
    }
  `]
})
export class ParkingServicePageComponent {
  readonly authStore = inject(AuthStore);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly lots = signal<LotResponse[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly message = signal('');
  readonly error = signal('');

  readonly searchForm = this.fb.nonNullable.group({
    city: [''],
    status: [''],
  });

  readonly lotForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pinCode: ['411001', Validators.required],
    latitude: [18.5204],
    longitude: [73.8567],
    totalSpots: [50, [Validators.required, Validators.min(1)]],
    pricePerHour: [40, [Validators.required, Validators.min(1)]],
    managerId: [this.authStore.userId() ?? '', Validators.required],
    imageUrl: [''],
    description: [''],
  });

  constructor() {
    this.loadLots();
  }

  canEdit(): boolean {
    return this.authStore.role() === 'Admin' || this.authStore.role() === 'LotManager';
  }

  loadLots(): void {
    const { city, status } = this.searchForm.getRawValue();
    this.api.getLots(1, 50, city || undefined, status || undefined).subscribe({
      next: (response) => this.lots.set(response.items),
      error: (error) => this.error.set(extractApiError(error)),
    });
  }

  prefill(lot: LotResponse): void {
    this.editingId.set(lot.lotId);
    this.lotForm.patchValue({
      name: lot.name,
      address: lot.address,
      city: lot.city,
      state: lot.state,
      pinCode: lot.pinCode,
      latitude: lot.latitude,
      longitude: lot.longitude,
      totalSpots: lot.totalSpots,
      pricePerHour: lot.pricePerHour,
      managerId: lot.managerId,
      imageUrl: lot.imageUrl ?? '',
      description: lot.description ?? '',
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.lotForm.reset({
      name: '',
      address: '',
      city: '',
      state: '',
      pinCode: '411001',
      latitude: 18.5204,
      longitude: 73.8567,
      totalSpots: 50,
      pricePerHour: 40,
      managerId: this.authStore.userId() ?? '',
      imageUrl: '',
      description: '',
    });
  }

  saveLot(): void {
    if (!this.canEdit() || this.lotForm.invalid) return;

    const value = this.lotForm.getRawValue();
    const payload = { ...value, imageUrl: value.imageUrl || null, description: value.description || null };

    const request$ = this.editingId()
      ? this.api.updateLot(this.editingId()!, payload)
      : this.api.createLot(payload);

    request$.subscribe({
      next: () => {
        this.message.set(this.editingId() ? 'Facility updated successfully.' : 'Facility registered successfully.');
        this.resetForm();
        this.loadLots();
      },
      error: (error) => this.error.set(extractApiError(error)),
    });
  }

  toggleStatus(lot: LotResponse): void {
    const nextStatus = lot.status === 'Active' ? 'Inactive' : 'Active';
    this.api.updateLotStatus(lot.lotId, nextStatus).subscribe({
      next: () => this.loadLots(),
      error: (error) => this.error.set(extractApiError(error)),
    });
  }
}
