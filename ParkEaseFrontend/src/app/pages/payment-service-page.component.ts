import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { extractApiError } from '../core/http-error';
import { PaymentResponse } from '../core/models';

@Component({
  selector: 'app-payment-service-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-info">Payment Service</span>
          <h2>Payment Explorer</h2>
          <p>Lookup and verify transaction outcomes with deep metadata.</p>
        </div>
      </header>

      <div *ngIf="message()" class="message badge badge-available" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        {{ message() }}
      </div>
      <div *ngIf="error()" class="error-banner" style="margin-bottom: 2rem;">
        {{ error() }}
      </div>

      <section class="section grid grid-2">
        <!-- Booking Lookup -->
        <article class="card">
          <div class="section-header">
            <h3>Booking Settlement</h3>
            <p>Verify pre-book payments.</p>
          </div>
          <form [formGroup]="bookingLookupForm" (ngSubmit)="loadBookingPayment()" class="search-filter-box">
            <div class="field">
              <input type="text" formControlName="bookingId" placeholder="Enter Booking ID..." />
            </div>
            <button class="btn btn-primary" type="submit" [disabled]="bookingLookupForm.invalid">Find</button>
          </form>
        </article>

        <!-- Ticket Lookup -->
        <article class="card">
          <div class="section-header">
            <h3>Ticket Settlement</h3>
            <p>Verify walk-in exit payments.</p>
          </div>
          <form [formGroup]="ticketLookupForm" (ngSubmit)="loadTicketPayment()" class="search-filter-box">
            <div class="field">
              <input type="text" formControlName="ticketId" placeholder="Enter Ticket ID..." />
            </div>
            <button class="btn btn-secondary" type="submit" [disabled]="ticketLookupForm.invalid">Find</button>
          </form>
        </article>
      </section>

      <!-- Results Display -->
      <section class="section animate-fade" *ngIf="payment()">
        <article class="card glass result-card">
          <div class="payment-header">
            <div class="pay-id">PAYMENT #{{ payment()?.paymentId?.substring(0,12) }}</div>
            <span class="badge" [class.badge-available]="payment()?.status === 'Success'" [class.badge-occupied]="payment()?.status !== 'Success'">
              {{ payment()?.status }}
            </span>
          </div>

          <div class="payment-body">
            <div class="amount-card">
              <span class="label">Total Amount</span>
              <div class="value">Rs {{ payment()?.amount }}</div>
              <span class="mode-badge">{{ payment()?.mode }}</span>
            </div>

            <div class="meta-grid">
              <div class="meta-box">
                <span class="label">Reference ID</span>
                <span class="value">{{ payment()?.transactionId || 'N/A' }}</span>
              </div>
              <div class="meta-box">
                <span class="label">Created At</span>
                <span class="value">{{ payment()?.createdAt | date:'medium' }}</span>
              </div>
              <div class="meta-box">
                <span class="label">Razorpay Order</span>
                <span class="value">{{ payment()?.razorpayOrderId || 'N/A' }}</span>
              </div>
              <div class="meta-box">
                <span class="label">Correlation ID</span>
                <span class="value code">{{ payment()?.bookingId || payment()?.ticketId }}</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <div *ngIf="!payment()" class="empty-state" style="margin-top: 2rem;">
        Enter a Booking or Ticket ID above to view transaction details.
      </div>
    </main>
  `,
  styles: [`
    .search-filter-box { display: flex; gap: 0.5rem; }
    .search-filter-box .field { margin-bottom: 0; flex: 1; }
    .result-card { padding: 3rem; }
    .payment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .pay-id { font-family: 'Courier New', monospace; font-weight: bold; color: var(--ink-muted); }
    .payment-body { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 3rem; }
    .amount-card {
      background: var(--mint);
      padding: 2.5rem;
      border-radius: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .amount-card .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-muted); }
    .amount-card .value { font-size: 3rem; font-weight: 800; color: var(--chocolate); font-family: 'Outfit'; }
    .mode-badge { margin-top: 1rem; background: var(--chocolate); color: white; padding: 0.25rem 1rem; border-radius: 999px; font-size: 0.8rem; }
    
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .meta-box { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-box .label { font-size: 0.75rem; color: var(--ink-muted); text-transform: uppercase; }
    .meta-box .value { font-weight: 600; color: var(--chocolate); font-size: 0.95rem; }
    
    @media (max-width: 768px) {
      .payment-body { grid-template-columns: 1fr; gap: 2rem; }
    }
  `]
})
export class PaymentServicePageComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly payment = signal<PaymentResponse | null>(null);
  readonly message = signal('');
  readonly error = signal('');

  readonly bookingLookupForm = this.fb.nonNullable.group({
    bookingId: ['', Validators.required],
  });

  readonly ticketLookupForm = this.fb.nonNullable.group({
    ticketId: ['', Validators.required],
  });

  loadBookingPayment(): void {
    if (this.bookingLookupForm.invalid) return;
    this.api.getPaymentByBooking(this.bookingLookupForm.getRawValue().bookingId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.error.set('');
      },
      error: (error) => this.error.set(extractApiError(error)),
    });
  }

  loadTicketPayment(): void {
    if (this.ticketLookupForm.invalid) return;
    this.api.getPaymentByTicket(this.ticketLookupForm.getRawValue().ticketId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.error.set('');
      },
      error: (error) => this.error.set(extractApiError(error)),
    });
  }
}
