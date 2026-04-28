import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { extractApiError } from '../core/http-error';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card card animate-fade">
        <header class="auth-header">
          <h2>Join ParkEase</h2>
          <p>Create an account to start booking</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" autocomplete="off">
          <div *ngIf="error()" class="error-banner">{{ error() }}</div>

          <div class="grid grid-2" style="gap: 1rem; margin-bottom: 0;">
            <div class="field">
              <label for="name">Full Name</label>
              <input id="name" type="text" formControlName="fullName" placeholder="John Doe" />
            </div>
            <div class="field">
              <label for="phone">Phone</label>
              <input id="phone" type="text" formControlName="phone" placeholder="+1234567890" />
            </div>
          </div>

          <div class="field">
            <label for="email">Email Address</label>
            <input id="email" type="email" formControlName="email" placeholder="name@example.com" />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••" />
          </div>

          <div class="field">
            <label for="role">I am a...</label>
            <select id="role" formControlName="role" class="custom-select">
              <option value="Driver">Driver (I want to park)</option>
              <option value="LotManager">Lot Manager (I own a parking lot)</option>
            </select>
          </div>

          <button class="btn btn-primary btn-full" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <footer class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login">Sign in</a></p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: radial-gradient(circle at 90% 80%, rgba(173, 235, 179, 0.05), transparent 30%);
    }
    .auth-card {
      width: 100%;
      max-width: 550px;
      padding: 3rem;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .auth-header h2 {
      font-size: 2rem;
      color: var(--chocolate);
      margin-bottom: 0.5rem;
    }
    .auth-header p {
      color: var(--ink-muted);
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .custom-select {
      padding: 0.8rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: #fdfcfc;
      font-family: inherit;
    }
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.95rem;
      color: var(--ink-muted);
    }
    .auth-footer a {
      color: var(--coral);
      font-weight: 600;
      text-decoration: none;
    }
    .error-banner {
      background: rgba(255, 133, 122, 0.1);
      color: var(--coral);
      padding: 0.75rem;
      border-radius: 12px;
      font-size: 0.9rem;
      border: 1px solid rgba(255, 133, 122, 0.2);
    }
  `]
})
export class RegisterPageComponent {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    phone: new FormControl('', [Validators.required]),
    role: new FormControl('Driver', [Validators.required]),
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.api.register(this.form.getRawValue() as any).subscribe({
      next: (response) => {
        this.authStore.setSession(response);
        void this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.error.set(extractApiError(error));
        this.loading.set(false);
      },
    });
  }
}
