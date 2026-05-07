import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { extractApiError } from '../core/http-error';
import { UserProfileResponse } from '../core/models';

@Component({
  selector: 'app-auth-service-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <main class="page">
      <section class="hero">
        <span class="service-kicker">Auth Service</span>
        <h2>Identity, profile, and account state.</h2>
        <p>Everything tied to authentication now lives on its own page instead of being buried in a generic dashboard.</p>
        <div class="chip-row">
          <span class="chip">Role {{ authStore.role() }}</span>
          <span class="chip">Approved {{ authStore.isApproved() ?? 'N/A' }}</span>
          <span class="chip">Email {{ authStore.email() }}</span>
        </div>
      </section>

      <section class="section">
        <div *ngIf="message()" class="message">{{ message() }}</div>
        <div *ngIf="error()" class="message error">{{ error() }}</div>
      </section>

      <section class="section grid two">
        <article class="card">
          <div class="section-header">
            <div>
              <h3>Profile snapshot</h3>
              <p>Live data from GET /auth/api/v1/auth/profile.</p>
            </div>
            <button class="ghost" type="button" (click)="loadProfile()">Refresh</button>
          </div>

          <div *ngIf="profile(); else emptyProfile" class="stack">
            <div class="list-card">
              <header>
                <div>
                  <strong>{{ profile()?.fullName }}</strong>
                  <p class="muted">{{ profile()?.email }}</p>
                </div>
                <span class="status" [class.warn]="profile()?.isApproved === false">
                  {{ profile()?.role }}
                </span>
              </header>
              <div class="chip-row">
                <span class="chip">{{ profile()?.phone }}</span>
                <span class="chip">Active {{ profile()?.isActive }}</span>
                <span class="chip">Joined {{ profile()?.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <ng-template #emptyProfile>
            <div class="empty-state">Profile data will appear here after the service responds.</div>
          </ng-template>
        </article>

        <article class="card">
          <div class="section-header">
            <div>
              <h3>Update profile</h3>
              <p>Submit profile edits directly through the Auth service.</p>
            </div>
          </div>

          <form class="grid" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="field">
              <label>Full name</label>
              <input type="text" formControlName="fullName" />
            </div>
            <div class="field">
              <label>Phone</label>
              <input type="tel" formControlName="phone" />
            </div>
            <div class="field">
              <label>Profile picture URL</label>
              <input type="url" formControlName="profilePicUrl" />
            </div>
            <div class="actions">
              <button class="primary" type="submit" [disabled]="profileForm.invalid">Save profile</button>
            </div>
          </form>
        </article>
      </section>

      <section class="section grid two">
        <article class="card">
          <div class="section-header">
            <div>
              <h3>Password control</h3>
              <p>Keep account security operations in a dedicated workspace.</p>
            </div>
          </div>

          <form class="grid" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <div class="field">
              <label>Current password</label>
              <input type="password" formControlName="currentPassword" />
            </div>
            <div class="field">
              <label>New password</label>
              <input type="password" formControlName="newPassword" />
            </div>
            <div class="actions">
              <button class="secondary" type="submit" [disabled]="passwordForm.invalid">Update password</button>
            </div>
          </form>
        </article>

        <article class="feature-banner">
          <h3>Account safety actions</h3>
          <p>
            When you deactivate the account here, the frontend simply calls your existing backend endpoint.
            No backend code is changed.
          </p>
          <div class="actions">
            <button class="danger" type="button" (click)="deactivate()">Deactivate account</button>
          </div>
        </article>
      </section>
    </main>
  `,
})
export class AuthServicePageComponent {
  readonly authStore = inject(AuthStore);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly profile = signal<UserProfileResponse | null>(null);
  readonly message = signal('');
  readonly error = signal('');

  readonly profileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required]],
    profilePicUrl: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.api.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm.patchValue({
          fullName: profile.fullName,
          phone: profile.phone,
          profilePicUrl: profile.profilePicUrl ?? '',
        });
        this.error.set('');
      },
      error: (error) => this.error.set(extractApiError(error)),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const rawValue = this.profileForm.getRawValue();
    this.api
      .updateProfile({
        fullName: rawValue.fullName,
        phone: rawValue.phone,
        profilePicUrl: rawValue.profilePicUrl || null,
      })
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.message.set('Profile updated.');
          this.error.set('');
        },
        error: (error) => {
          this.message.set('');
          this.error.set(extractApiError(error));
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.api.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.message.set('Password changed successfully.');
        this.error.set('');
        this.passwordForm.reset();
      },
      error: (error) => {
        this.message.set('');
        this.error.set(extractApiError(error));
      },
    });
  }

  deactivate(): void {
    this.api.deactivateAccount().subscribe({
      next: () => {
        this.message.set('Account deactivated.');
        this.error.set('');
        this.authStore.clear();
      },
      error: (error) => {
        this.message.set('');
        this.error.set(extractApiError(error));
      },
    });
  }
}
