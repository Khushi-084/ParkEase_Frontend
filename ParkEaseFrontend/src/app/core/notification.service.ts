import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { AuthStore } from './auth.store';
import { Observable } from 'rxjs';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/notification/api/v1/notifications';
  private hubUrl = '/notificationHub';
  private hubConnection?: signalR.HubConnection;

  // Real-time notification signal
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient, private authStore: AuthStore) {
    // React to authentication changes automatically
    effect(() => {
      const userId = this.authStore.userId();
      if (userId) {
        console.log('[NotificationService] User detected, initializing SignalR...', userId);
        this.initSignalR(userId);
        this.fetchNotifications(userId);
      } else {
        console.log('[NotificationService] No user detected, stopping SignalR...');
        this.stopConnection();
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  // ── API Methods ─────────────────────────────────────────────────────────────

  fetchNotifications(userId: string) {
    this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`).subscribe(data => {
      this.notifications.set(data);
      this.updateUnreadCount();
    });
  }

  markAsRead(id: string) {
    this.http.put(`${this.apiUrl}/mark-read/${id}`, {}).subscribe(() => {
      this.notifications.update(list => 
        list.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      this.updateUnreadCount();
    });
  }

  markAllAsRead(userId: string) {
    this.http.put(`${this.apiUrl}/user/${userId}/mark-all-read`, {}).subscribe(() => {
      this.notifications.update(list => 
        list.map(n => ({ ...n, isRead: true }))
      );
      this.unreadCount.set(0);
    });
  }

  private updateUnreadCount() {
    const count = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(count);
  }

  // ── SignalR Methods ─────────────────────────────────────────────────────────

  public initSignalR(userId: string) {
    if (this.hubConnection) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR Connected!');
        // Join the user-specific group to receive private notifications
        this.hubConnection?.invoke('JoinUserGroup', userId);
      })
      .catch(err => console.error('Error starting SignalR:', err));

    this.hubConnection.on('ReceiveNotification', (data: any) => {
      console.log('New notification received!', data);
      
      // Add to the top of the list
      const newNotif: Notification = {
        id: Math.random().toString(), // Temp ID for UI
        userId: userId,
        title: data.title,
        message: data.message,
        type: 'General',
        isRead: false,
        createdAt: data.createdAt
      };

      this.notifications.update(current => [newNotif, ...current]);
      this.unreadCount.update(c => c + 1);
      
      // Simple alert for the user
      alert(`🔔 ${data.title}\n${data.message}`);
    });
  }

  public async stopConnection() {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = undefined;
    }
  }
}
