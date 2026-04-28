import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthStore } from '../core/auth.store';
import { UserProfileResponse } from '../core/models';
import { extractApiError } from '../core/http-error';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="page">
      <header class="dashboard-header animate-fade">
        <div class="user-greeting">
          <span class="badge badge-info">Profile Workspace</span>
          <h2>Account Settings</h2>
          <p>Manage your identity and security preferences.</p>
        </div>
      </header>

      <div *ngIf="message()" class="message badge badge-available" style="margin-bottom: 2rem; width: 100%; padding: 1rem;">
        {{ message() }}
      </div>
      <div *ngIf="error()" class="error-banner" style="margin-bottom: 2rem;">
        {{ error() }}
      </div>

      <section class="section grid grid-2">
        <!-- Identity -->
        <article class="card">
          <div class="section-header">
            <h3>Personal Identity</h3>
            <span class="badge badge-available" *ngIf="profile()?.isActive">Verified Account</span>
          </div>

          <div class="profile-card-view animate-fade" *ngIf="profile(); else loading">
            <div class="avatar-placeholder">{{ profile()?.fullName?.substring(0,1) }}</div>
            <div class="profile-details">
              <h4>{{ profile()?.fullName }}</h4>
              <p class="muted">{{ profile()?.email }}</p>
              <p class="role-pill">{{ profile()?.role }}</p>
            </div>
          </div>
          <ng-template #loading><div class="empty-state">Loading identity...</div></ng-template>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="lot-form" style="margin-top: 2rem;">
            <div class="field">
              <label>Full Name</label>
              <input type="text" formControlName="fullName" />
            </div>
            <div class="field">
              <label>Phone Number</label>
              <input type="tel" formControlName="phone" />
            </div>
            <button class="btn btn-primary btn-full" type="submit" [disabled]="profileForm.invalid">
              Update Identity
            </button>
          </form>
        </article>

        <!-- Security -->
        <article class="card glass">
          <div class="section-header">
            <h3>Security & Access</h3>
          </div>

          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="lot-form">
            <div class="field">
              <label>Current Password</label>
              <input type="password" formControlName="currentPassword" placeholder="••••••••" />
            </div>
            <div class="field">
              <label>New Password</label>
              <input type="password" formControlName="newPassword" placeholder="Minimum 8 characters" />
            </div>
            <button class="btn btn-secondary btn-full" type="submit" [disabled]="passwordForm.invalid">
              Update Password
            </button>
          </form>

          <div class="danger-zone" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--line);">
            <h4>Danger Zone</h4>
            <p class="muted" style="font-size: 0.85rem; margin-bottom: 1rem;">Deactivating your account will remove your access to the platform.</p>
            <button class="btn btn-ghost btn-full" style="color: var(--coral); border-color: var(--coral);" (click)="deactivate()">
              Deactivate My Account
            </button>
          </div>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .profile-card-view { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: #fdfcfc; border-radius: 16px; border: 1px solid var(--line); }
    .avatar-placeholder { width: 64px; height: 64px; background: var(--lavender); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: var(--chocolate); }
    .profile-details h4 { margin-bottom: 0.25rem; }
    .role-pill { display: inline-block; background: var(--chocolate); color: white; padding: 0.1rem 0.75rem; border-radius: 999px; font-size: 0.75rem; margin-top: 0.5rem; }
    .lot-form { display: flex; flex-direction: column; gap: 1.25rem; }
  `]
})
export class ProfilePageComponent {
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

  private loadProfile(): void {
    this.api.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm.patchValue({
          fullName: profile.fullName,
          phone: profile.phone,
          profilePicUrl: profile.profilePicUrl ?? '',
        });
      },
      error: () => this.error.set('Unable to load profile data.'),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.api.updateProfile({ ...this.profileForm.getRawValue(), profilePicUrl: null }).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.message.set('Identity updated successfully.');
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.api.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.message.set('Password changed successfully.');
        this.passwordForm.reset();
      },
      error: (err) => this.error.set(extractApiError(err)),
    });
  }

  deactivate(): void {
    if (confirm('Are you sure you want to deactivate your account?')) {
      this.api.deactivateAccount().subscribe({
        next: () => this.authStore.clear(),
        error: (err) => this.error.set(extractApiError(err)),
      });
    }
  }
}
