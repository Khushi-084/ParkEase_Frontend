import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { extractApiError } from '../core/http-error';
import { LotResponse, SlotAvailabilityResponse, SlotResponse } from '../core/models';

@Component({
  selector: 'app-slot-service-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-info">Slot Service</span>
          <h2>Slot Orchestration</h2>
          <p>Monitor capacity and manage slot configurations in bulk.</p>
        </div>
      </header>

      <div *ngIf="message()" class="message badge badge-available" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        {{ message() }}
      </div>
      <div *ngIf="error()" class="error-banner" style="margin-bottom: 2rem;">
        {{ error() }}
      </div>

      <section class="section grid grid-2">
        <!-- Slot Management -->
        <article class="card">
          <div class="section-header">
            <h3>Capacity Monitor</h3>
            <button class="btn btn-ghost btn-sm" (click)="loadSlots()">Refresh</button>
          </div>

          <form [formGroup]="lookupForm" (ngSubmit)="loadSlots()" class="search-filter-box">
            <div class="field">
              <select formControlName="lotId" class="custom-select">
                <option value="">Select a Lot...</option>
                <option *ngFor="let lot of lots()" [value]="lot.lotId">{{ lot.name }} - {{ lot.city }}</option>
              </select>
            </div>
            <div class="field" style="max-width: 120px;">
              <select formControlName="type" class="custom-select">
                <option value="">All Types</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Truck">Truck</option>
                <option value="EV">EV</option>
              </select>
            </div>
            <button class="btn btn-primary" type="submit">Load</button>
          </form>

          <div *ngIf="availability()" class="stat-summary glass animate-fade">
            <div class="stat-bubble">
              <span class="label">Total</span>
              <span class="value">{{ availability()?.totalSlots }}</span>
            </div>
            <div class="stat-bubble theme-mint">
              <span class="label">Available</span>
              <span class="value">{{ availability()?.availableSlots }}</span>
            </div>
            <div class="stat-bubble theme-coral">
              <span class="label">Occupied</span>
              <span class="value">{{ availability()?.occupiedSlots }}</span>
            </div>
          </div>

          <div class="slots-list">
            <div *ngFor="let slot of slots()" class="slot-row">
              <div class="slot-info">
                <strong>{{ slot.slotNumber }}</strong>
                <span class="badge badge-info">{{ slot.type }}</span>
              </div>
              <div class="slot-actions">
                <span class="badge" [class.badge-available]="slot.status === 'Available'" [class.badge-occupied]="slot.status !== 'Available'">
                  {{ slot.status }}
                </span>
                <button *ngIf="canEdit() && slot.status !== 'Available'" class="btn btn-ghost btn-xs" (click)="setStatus(slot.slotId, 'Available')">Make Available</button>
              </div>
            </div>
          </div>
        </article>

        <!-- Bulk Creation -->
        <article class="card glass">
          <div class="section-header">
            <h3>Bulk Slot Generation</h3>
            <p>Setup multiple slots in seconds.</p>
          </div>

          <form [formGroup]="bulkForm" (ngSubmit)="createSlots()" class="lot-form">
            <div class="field">
              <label>Target Lot ID</label>
              <select formControlName="lotId" class="custom-select">
                <option value="">Select a Lot...</option>
                <option *ngFor="let lot of lots()" [value]="lot.lotId">{{ lot.name }} - {{ lot.city }}</option>
              </select>
            </div>
            <div class="grid grid-2">
              <div class="field">
                <label>Vehicle Type</label>
                <select formControlName="type" class="custom-select">
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Truck">Truck</option>
                  <option value="EV">EV</option>
                </select>
              </div>
              <div class="field">
                <label>Quantity</label>
                <input type="number" formControlName="count" />
              </div>
            </div>
            <div class="grid grid-2">
              <div class="field">
                <label>Numbering Prefix</label>
                <input type="text" formControlName="prefix" placeholder="E.g. A" />
              </div>
              <div class="field">
                <label>Price (Rs/hr)</label>
                <input type="number" formControlName="pricePerHour" />
              </div>
            </div>
            <button class="btn btn-secondary btn-full" type="submit" [disabled]="bulkForm.invalid || !canEdit()">
              Generate Slot Batch
            </button>
          </form>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .search-filter-box { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
    .search-filter-box .field { margin-bottom: 0; flex: 1; }
    .custom-select {
      padding: 0.8rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: #fdfcfc;
      width: 100%;
    }
    .stat-summary {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      border-radius: 20px;
    }
    .stat-bubble {
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
    }
    .stat-bubble .label { font-size: 0.75rem; color: var(--ink-muted); text-transform: uppercase; }
    .stat-bubble .value { font-size: 1.5rem; font-weight: 700; color: var(--chocolate); }
    .theme-mint .value { color: #2d5a31; }
    .theme-coral .value { color: #8a2e26; }
    
    .slots-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .slot-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: white;
    }
    .slot-info { display: flex; align-items: center; gap: 1rem; }
    .slot-actions { display: flex; align-items: center; gap: 0.75rem; }
    .btn-xs { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
    .lot-form { display: flex; flex-direction: column; gap: 1.25rem; }
  `]
})
export class SlotServicePageComponent {
  readonly authStore = inject(AuthStore);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly slots = signal<SlotResponse[]>([]);
  readonly lots = signal<LotResponse[]>([]);
  readonly availability = signal<SlotAvailabilityResponse | null>(null);
  readonly message = signal('');
  readonly error = signal('');

  readonly lookupForm = this.fb.nonNullable.group({
    lotId: ['', Validators.required],
    type: [''],
  });

  readonly bulkForm = this.fb.nonNullable.group({
    lotId: ['', Validators.required],
    type: ['Car', Validators.required],
    count: [20, [Validators.required, Validators.min(1)]],
    prefix: ['A', Validators.required],
    pricePerHour: [40, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.api.getLots(1, 50).subscribe({
      next: (res) => this.lots.set(res.items),
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  canEdit(): boolean {
    return this.authStore.role() === 'Admin' || this.authStore.role() === 'LotManager';
  }

  loadSlots(): void {
    if (this.lookupForm.invalid) return;

    const { lotId, type } = this.lookupForm.getRawValue();
    this.api.getSlotsByLot(lotId).subscribe({
      next: (slots) => this.slots.set(type ? slots.filter((s) => s.type === type) : slots),
      error: (err) => this.error.set(extractApiError(err)),
    });
    this.api.getAvailability(lotId, type || undefined).subscribe({
      next: (availability) => this.availability.set(availability),
    });
  }

  createSlots(): void {
    if (!this.canEdit() || this.bulkForm.invalid) return;

    const value = this.bulkForm.getRawValue();
    this.api.bulkCreateSlots(value as any).subscribe({
      next: () => {
        this.message.set('Batch created successfully.');
        this.lookupForm.patchValue({ lotId: value.lotId });
        this.loadSlots();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  setStatus(slotId: string, status: 'Available' | 'UnderMaintenance'): void {
    this.api.updateSlotStatus(slotId, { status }).subscribe({
      next: () => this.loadSlots(),
      error: (err) => this.error.set(extractApiError(err)),
    });
  }
}
