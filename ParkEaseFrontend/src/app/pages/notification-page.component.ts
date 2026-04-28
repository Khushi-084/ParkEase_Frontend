import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from '../core/notification.service';
import { AuthStore } from '../core/auth.store';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="page container">
      <div class="header-section">
        <h2>Notifications</h2>
        <p>Stay updated with your latest activities</p>
      </div>

      <div class="notification-list" *ngIf="notifService.notifications().length > 0; else emptyState">
        <div 
          *ngFor="let notif of notifService.notifications()" 
          class="notif-card card"
          [class.unread]="!notif.isRead"
          (click)="markAsRead(notif.id)"
        >
          <div class="notif-icon">
            {{ getIcon(notif.type) }}
          </div>
          <div class="notif-content">
            <div class="notif-header">
              <h4>{{ notif.title }}</h4>
              <span class="time">{{ notif.createdAt | date:'short' }}</span>
            </div>
            <p>{{ notif.message }}</p>
          </div>
          <div class="unread-dot" *ngIf="!notif.isRead"></div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <div class="empty-icon">🔕</div>
          <h3>No notifications yet</h3>
          <p>We'll notify you when something important happens.</p>
        </div>
      </ng-template>
    </main>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .header-section {
      margin-bottom: 2rem;
    }
    .notification-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .notif-card {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      align-items: flex-start;
      cursor: pointer;
      position: relative;
      transition: transform 0.2s;
    }
    .notif-card:hover {
      transform: translateX(5px);
    }
    .notif-card.unread {
      background: #fffafa;
      border-left: 4px solid var(--coral);
    }
    .notif-icon {
      font-size: 2rem;
      background: var(--lavender);
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }
    .notif-content {
      flex: 1;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .time {
      font-size: 0.8rem;
      color: var(--ink-muted);
    }
    .unread-dot {
      width: 10px;
      height: 10px;
      background: var(--coral);
      border-radius: 50%;
      position: absolute;
      top: 1.5rem;
      right: 1rem;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }
  `]
})
export class NotificationPageComponent {
  readonly notifService = inject(NotificationService);
  private readonly authStore = inject(AuthStore);

  constructor() {
    const userId = this.authStore.userId();
    if (userId) {
      // Small delay to ensure notifications are loaded before marking all as read
      // or just mark all read to clear the badge immediately
      this.notifService.markAllAsRead(userId);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'Driver': return '🚗';
      case 'Manager': return '🏢';
      case 'Admin': return '👨‍💼';
      default: return '🔔';
    }
  }

  markAsRead(id: string) {
    this.notifService.markAsRead(id);
  }
}
