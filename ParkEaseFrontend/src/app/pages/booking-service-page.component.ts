import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { extractApiError } from '../core/http-error';
import { BookingResponse, CreateBookingResponse, LotResponse, SlotResponse } from '../core/models';

declare var Razorpay: any;

@Component({
  selector: 'app-booking-service-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, DecimalPipe],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-info">Booking Service</span>
          <h2>Reserve Your Spot</h2>
          <p>Secure your parking in advance with instant payment confirmation.</p>
        </div>
      </header>

      <div *ngIf="message()" class="message badge badge-available" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        {{ message() }}
      </div>
      <div *ngIf="error()" class="error-banner" style="margin-bottom: 2rem;">
        {{ error() }}
      </div>

      <section class="section grid grid-2">
        <!-- Booking Flow -->
        <article class="card">
          <div class="step-header">
            <span class="step-num">1</span>
            <h3>Select a Parking Lot</h3>
          </div>
          
          <div class="lot-selection-grid">
            <div 
              *ngFor="let lot of lots()" 
              class="lot-mini-card" 
              [class.active]="selectedLot()?.lotId === lot.lotId"
              (click)="onSelectLot(lot)"
            >
              <strong>{{ lot.name }}</strong>
              <span>Rs {{ lot.pricePerHour }}/hr</span>
            </div>
          </div>

          <ng-container *ngIf="selectedLot()">
            <div class="step-header" style="margin-top: 2rem;">
              <span class="step-num">2</span>
              <h3>Choose Available Slot</h3>
            </div>
            
            <div class="slot-picker">
              <div 
                *ngFor="let slot of slots()" 
                class="slot-item" 
                [class.available]="slot.status === 'Available'" 
                [class.selected]="bookingForm.controls.slotId.value === slot.slotId"
                (click)="onSelectSlot(slot)"
              >
                <span class="slot-name">{{ slot.slotNumber }}</span>
                <span class="slot-type">{{ slot.type }}</span>
              </div>
              <div *ngIf="slots().length === 0" class="empty-state">No slots available for this lot.</div>
            </div>
          </ng-container>

          <ng-container *ngIf="bookingForm.controls.slotId.value">
            <form [formGroup]="bookingForm" (ngSubmit)="createBooking()" style="margin-top: 2rem;" *ngIf="authStore.role() === 'Driver'">
              <div class="field">
                <label>Booking Amount (Est.)</label>
                <div class="amount-preview">Rs {{ bookingForm.controls.amount.value | number:'1.2-2' }}</div>
              </div>
              <button class="btn btn-primary btn-full" type="submit" [disabled]="bookingForm.invalid || loading()">
                {{ loading() ? 'Processing...' : 'Confirm & Pay' }}
              </button>
            </form>
            <div *ngIf="authStore.role() !== 'Driver'" class="message badge badge-occupied" style="margin-top: 2rem; width: 100%; padding: 1rem;">
              Only Drivers can book and pay for slots.
            </div>
          </ng-container>
        </article>

        <!-- History & Status -->
        <article class="card glass">
          <div class="section-header">
            <h3>Recent Bookings</h3>
            <button class="btn btn-ghost btn-sm" (click)="loadBookings()">Refresh</button>
          </div>

          <div class="history-list">
            <div class="history-card" *ngFor="let booking of bookings()">
              <div class="history-main" style="display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <strong style="font-family: monospace; font-size: 0.85rem;" title="Booking ID: {{ booking.id }}">
                    {{ booking.id }}
                  </strong>
                  <span class="badge booking-status-badge" [class.badge-available]="booking.status === 'Confirmed'" [class.badge-occupied]="booking.status === 'Pending'" [class.badge-maintenance]="booking.status === 'Failed'">
                    {{ booking.status | uppercase }}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: var(--ink-muted);">Slot: {{ booking.slotId | slice:0:8 }}</div>
              </div>
              <div class="history-details">
                <span>Rs {{ booking.amount | number:'1.2-2' }}</span>
                <span>{{ booking.createdAt | date:'short' }}</span>
              </div>
            </div>
            <div *ngIf="bookings().length === 0" class="empty-state">You have no recent bookings.</div>
          </div>

          <div *ngIf="latestBooking()" class="latest-response card animate-fade" style="margin-top: 2rem; background: var(--mint); border: none;">
            <h4>Payment Initiated</h4>
            <p>Razorpay Order: <code>{{ latestBooking()?.razorpayOrderId }}</code></p>
            <p class="muted">Complete payment in the popup to confirm your slot.</p>
          </div>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .step-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .step-num {
      width: 28px;
      height: 28px;
      background: var(--chocolate);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.8rem;
    }
    .lot-selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }
    .lot-mini-card {
      padding: 1rem;
      border: 1px solid var(--line);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .lot-mini-card:hover { border-color: var(--mint); }
    .lot-mini-card.active {
      background: var(--mint);
      border-color: var(--chocolate);
    }
    .slot-picker {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.75rem;
    }
    .slot-item {
      padding: 0.75rem;
      border: 1px solid var(--line);
      border-radius: 12px;
      text-align: center;
      cursor: not-allowed;
      opacity: 0.5;
      display: flex;
      flex-direction: column;
    }
    .slot-item.available {
      cursor: pointer;
      opacity: 1;
      background: #fdfcfc;
    }
    .slot-item.available:hover { border-color: var(--lavender); }
    .slot-item.selected {
      background: var(--lavender);
      border-color: var(--chocolate);
    }
    .slot-name { font-weight: bold; font-size: 1.1rem; }
    .slot-type { font-size: 0.7rem; color: var(--ink-muted); text-transform: uppercase; }
    
    .amount-preview {
      font-size: 2rem;
      font-weight: 700;
      color: var(--chocolate);
      font-family: 'Outfit';
    }
    .booking-history {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .history-item {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 12px;
      border: 1px solid var(--line);
    }
    .history-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .history-details {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--ink-muted);
    }
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--ink-muted);
      border: 1px dashed var(--line);
      border-radius: 12px;
    }
    .latest-response code {
      background: rgba(0,0,0,0.1);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    .booking-status-badge {
      margin-left: 1.5rem;
      flex-shrink: 0;
      white-space: nowrap;
    }
  `]
})
export class BookingServicePageComponent {
  readonly authStore = inject(AuthStore);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly lots = signal<LotResponse[]>([]);
  readonly slots = signal<SlotResponse[]>([]);
  readonly selectedLot = signal<LotResponse | null>(null);
  readonly bookings = signal<BookingResponse[]>([]);
  readonly latestBooking = signal<CreateBookingResponse | null>(null);
  
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  readonly bookingForm = this.fb.nonNullable.group({
    slotId: ['', Validators.required],
    userId: [this.authStore.userId() ?? '', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.loadLots();
    this.loadBookings();
  }

  loadLots(): void {
    this.api.getLots(1, 50).subscribe({
      next: (res) => this.lots.set(res.items),
      error: (err) => this.error.set(extractApiError(err))
    });
  }

  onSelectLot(lot: LotResponse): void {
    this.selectedLot.set(lot);
    this.bookingForm.patchValue({ slotId: '', amount: lot.pricePerHour });
    this.api.getSlotsByLot(lot.lotId).subscribe({
      next: (slots) => this.slots.set(slots),
      error: (err) => this.error.set(extractApiError(err))
    });
  }

  onSelectSlot(slot: SlotResponse): void {
    if (slot.status !== 'Available') return;
    this.bookingForm.patchValue({ slotId: slot.slotId });
  }

  createBooking(): void {
    if (this.bookingForm.invalid) return;

    this.loading.set(true);
    this.message.set('');
    this.error.set('');

    const value = this.bookingForm.getRawValue();
    this.api.createBooking(value).subscribe({
      next: (response) => {
        this.latestBooking.set(response);
        this.loading.set(false);
        this.loadBookings();
        
        if (response.razorpayOrderId) {
          this.handlePayment(response);
        } else {
          this.message.set('Booking confirmed! (Cash/Free)');
        }
      },
      error: (error) => {
        this.error.set(extractApiError(error));
        this.loading.set(false);
      },
    });
  }

  handlePayment(booking: CreateBookingResponse): void {
    const options = {
      key: booking.razorpayKeyId,
      amount: booking.amount * 100,
      currency: booking.currency,
      name: 'ParkEase',
      description: 'Parking Slot Reservation',
      order_id: booking.razorpayOrderId,
      handler: (response: any) => {
        const verifyPayload = {
          razorpayOrderId: booking.razorpayOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        };
        
        this.api.verifyPayment(verifyPayload).subscribe({
          next: () => {
            this.message.set('Payment verified successfully! Your slot is reserved.');
            // Wait a moment for the backend messaging (RabbitMQ) to update the booking status to confirmed
            setTimeout(() => this.loadBookings(), 1500);
          },
          error: (err) => this.error.set('Payment success but failed to verify status: ' + extractApiError(err))
        });
      },
      prefill: {
        name: this.authStore.fullName(),
        email: this.authStore.email(),
      },
      theme: { color: '#ADEBB3' },
      modal: {
        ondismiss: () => {
          this.error.set('Payment cancelled. Slot not reserved.');
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }

  loadBookings(): void {
    const userId = this.authStore.userId();
    if (!userId) return;

    this.api.getUserBookings(userId).subscribe({
      next: (bookings) => this.bookings.set(bookings),
      error: (error) => this.error.set(extractApiError(error)),
    });
  }
}
