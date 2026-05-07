import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { extractApiError } from '../core/http-error';
import { ExitTicketResponse, TicketResponse } from '../core/models';

declare var Razorpay: any;

@Component({
  selector: 'app-ticket-service-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-info">Ticket Service</span>
          <h2>Walk-in Management</h2>
          <p>Handle on-the-spot vehicle entries and exits with ease.</p>
        </div>
      </header>

      <div *ngIf="message()" class="message badge badge-available" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        {{ message() }}
      </div>
      <div *ngIf="error()" class="error-banner" style="margin-bottom: 2rem;">
        {{ error() }}
      </div>

      <section class="section grid grid-2">
        <!-- Entry Ticket -->
        <article class="card">
          <div class="section-header">
            <h3>Generate Entry Ticket</h3>
            <p>For vehicles without pre-bookings.</p>
          </div>

          <form [formGroup]="ticketForm" (ngSubmit)="createTicket()" class="lot-form">
            <div class="field">
              <label>Vehicle Number</label>
              <input type="text" formControlName="vehicleNumber" placeholder="E.g. MH12AB1234" />
            </div>
            <div class="field">
              <label>Preferred Slot Type</label>
              <select formControlName="slotType" class="custom-select">
                <option value="">Any Available</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Truck">Truck</option>
                <option value="EV">EV</option>
              </select>
            </div>
            <button class="btn btn-primary btn-full" type="submit" [disabled]="ticketForm.invalid">
              Generate Ticket
            </button>
          </form>

          <div *ngIf="latestTicket()" class="latest-response card animate-fade" style="margin-top: 2rem; background: var(--mint); border: none;">
            <div class="ticket-view">
              <div class="ticket-id" style="font-family: monospace; font-size: 1.2rem; font-weight: 800;" title="System ID: {{ latestTicket()?.id }}">
                {{ latestTicket()?.displayId }}
              </div>
              <h4>{{ latestTicket()?.vehicleNumber }}</h4>
              <p>Assigned Slot: <strong>{{ latestTicket()?.slotNumber }}</strong></p>
              <p class="muted">Entry Time: {{ latestTicket()?.entryTime | date:'short' }}</p>
            </div>
          </div>
        </article>

        <!-- Exit Processing -->
        <article class="card glass">
          <div class="section-header">
            <h3>Process Vehicle Exit</h3>
            <p>Calculate duration and settle payment.</p>
          </div>

          <form [formGroup]="exitForm" (ngSubmit)="exitTicket()" class="lot-form">
            <div class="field">
              <label>Ticket ID / Number</label>
              <input type="text" formControlName="ticketId" placeholder="Paste Ticket ID or Short ID here..." />
            </div>
            <div class="field">
              <select formControlName="paymentMode" class="custom-select">
                <option value="Cash">Cash (Manual Collection)</option>
              </select>
            </div>
            <button class="btn btn-secondary btn-full" type="submit" [disabled]="exitForm.invalid">
              Calculate & Finalize
            </button>
          </form>

          <div *ngIf="latestExit()" class="latest-response card animate-fade" style="margin-top: 2rem; background: var(--lavender); border: none;">
            <div class="exit-view">
              <h4>Exit Confirmed</h4>
              <div class="amount-display">Rs {{ latestExit()?.amount }}</div>
              <p>Duration: {{ latestExit()?.durationHours }} hours</p>
              <p class="muted">Payment ID: {{ latestExit()?.paymentId }}</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .lot-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .custom-select {
      padding: 0.8rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: #fdfcfc;
      width: 100%;
    }
    .ticket-view, .exit-view { text-align: center; }
    .ticket-id { font-family: 'Courier New', monospace; font-weight: bold; margin-bottom: 0.5rem; color: var(--ink-muted); }
    .amount-display { font-size: 2.5rem; font-weight: 800; color: var(--chocolate); font-family: 'Outfit'; margin: 1rem 0; }
  `]
})
export class TicketServicePageComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly latestTicket = signal<TicketResponse | null>(null);
  readonly latestExit = signal<ExitTicketResponse | null>(null);
  readonly message = signal('');
  readonly error = signal('');

  readonly ticketForm = this.fb.nonNullable.group({
    vehicleNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9 -]{4,15}$/i)]],
    slotType: [''],
  });

  readonly exitForm = this.fb.nonNullable.group({
    ticketId: ['', Validators.required],
    paymentMode: ['Cash', Validators.required],
  });

  createTicket(): void {
    if (this.ticketForm.invalid) return;

    const value = this.ticketForm.getRawValue();
    this.api.createTicket({
      vehicleNumber: value.vehicleNumber,
      slotType: (value.slotType || undefined) as any,
    }).subscribe({
      next: (ticket) => {
        this.latestTicket.set(ticket);
        this.exitForm.patchValue({ ticketId: ticket.id });
        this.message.set('Entry recorded successfully.');
        this.error.set('');
      },
      error: (error) => this.error.set(extractApiError(error)),
    });
  }

  exitTicket(): void {
    if (this.exitForm.invalid) return;

    const value = this.exitForm.getRawValue();
    this.api.exitTicket(value.ticketId, {
      paymentMode: value.paymentMode as any,
    }).subscribe({
      next: (response) => {
        this.latestExit.set(response);
        this.error.set('');
        this.message.set('Vehicle exit processed successfully (Cash Collection).');
      },
      error: (error) => this.error.set(extractApiError(error)),
    });
  }

  handlePayment(exit: ExitTicketResponse): void {
    const options = {
      key: 'rzp_test_your_key', // This should ideally come from the backend or config
      amount: exit.amount * 100, // Razorpay expects paise
      currency: 'INR',
      name: 'ParkEase',
      description: 'Parking Exit Payment',
      order_id: exit.razorpayOrderId,
      handler: (response: any) => {
        this.api.updatePaymentStatus(exit.paymentId, 'Success', response.razorpay_payment_id).subscribe({
          next: () => {
            this.message.set('Payment successful! Vehicle exit finalized.');
          },
          error: (err) => this.error.set('Payment success but failed to update status: ' + extractApiError(err))
        });
      },
      theme: { color: '#FF857A' },
      modal: {
        ondismiss: () => {
          this.error.set('Payment cancelled. Exit not finalized.');
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }
}
