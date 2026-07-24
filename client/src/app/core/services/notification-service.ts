import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { AppLanguage, LanguageService } from './language-service';
import { NotificationItem, NotificationRecord, NotificationType } from '../../models/notification-item';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AccountService } from './account-service';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly language = inject(LanguageService);

  private readonly notificationsState = signal<NotificationRecord[]>([]);
  private readonly accountService = inject(AccountService);
  private readonly http = inject(HttpClient);
  private hubConnection?: HubConnection;

  constructor() {
    effect(() => {
      const user = this.accountService.currentUser();
      if (user) {
        this.loadNotifications();
        if (!this.hubConnection) {
          this.createHubConnection();
        }
      } else {
        this.hubConnection?.stop();
        this.hubConnection = undefined;
        this.setNotifications([]);
      }
    });
  }

  loadNotifications() {
    this.http.get<any[]>(environment.apiUrl + 'Notification/user', { withCredentials: true })
      .subscribe({
        next: (dtos) => {
          const records: NotificationRecord[] = dtos.map(dto => {
            const feType: NotificationType = dto.type === 4 ? 'budget' : 'insight';
            const date = new Date(dto.createdAt);
            const timeString = date.toLocaleString();
            
            const record: NotificationRecord = {
              id: dto.id.toString(),
              title: { vi: 'Thông báo hệ thống', en: 'System Notification' },
              description: { vi: dto.message, en: dto.message },
              time: { vi: timeString, en: timeString },
              type: feType,
              isRead: dto.isRead
            };
            if (dto.type === 4) {
              record.title = { vi: 'Lời mời vào ví', en: 'Budget Invitation' };
            }
            return record;
          });
          
          this.setNotifications(records);
        },
        error: (err) => console.log('Error loading notifications', err)
      });
  }

  createHubConnection() {
    const token = this.accountService.currentUser()?.token;
    
    // Fallback to cookie if token is not in state but withCredentials is true in login
    // SignalR with WebSockets requires the token to be passed via accessTokenFactory 
    // unless the cookie is sent automatically by the browser (which it usually is for same-origin or with credentials).
    const hubUrl = environment.apiUrl.replace('api/', 'hubs/notification');

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch(error => console.log('Error establishing SignalR connection', error));

    this.hubConnection.on('ReceiveNotification', (notificationDto: any) => {
      const feType: NotificationType = notificationDto.type === 4 ? 'budget' : 'insight';
      const date = new Date(notificationDto.createdAt);
      const timeString = date.toLocaleString();
      
      const newRecord: NotificationRecord = {
        id: notificationDto.id.toString(),
        title: { vi: 'Thông báo hệ thống', en: 'System Notification' },
        description: { vi: notificationDto.message, en: notificationDto.message },
        time: { vi: timeString, en: timeString },
        type: feType,
        isRead: notificationDto.isRead
      };

      if (notificationDto.type === 4) {
        newRecord.title = { vi: 'Lời mời vào ví', en: 'Budget Invitation' };
      }

      this.addNotification(newRecord);
    });
  }

  readonly notifications = computed<NotificationItem[]>(() =>
    this.notificationsState().map((notification) => ({
      id: notification.id,
      title: this.localized(notification.title),
      description: this.localized(notification.description),
      time: this.localized(notification.time),
      type: notification.type,
      isRead: notification.isRead,
    })),
  );
  readonly unreadCount = computed(
    () => this.notificationsState().filter((notification) => !notification.isRead).length,
  );

  markAsRead(id: string): void {
    // Optimistic update
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.id === id && !notification.isRead
          ? { ...notification, isRead: true }
          : notification,
      ),
    );

    // Call backend
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      // Find the notification to get its full state
      const target = this.notificationsState().find(n => n.id === id);
      if (target) {
        // Send a mock DTO to just satisfy the backend if it needs the whole object, 
        // or just rely on backend to update IsRead = true if it allows partial updates.
        // According to NotificationController: [PUT("{id}")] accepts NotificationDto
        const dto = {
          id: numId,
          userId: this.accountService.currentUser()?.id || '',
          message: target.description.en || target.description.vi,
          isRead: true,
          type: target.type === 'budget' ? 4 : 3, // fallback
          createdAt: new Date().toISOString()
        };
        this.http.put(environment.apiUrl + `Notification/${numId}`, dto, { withCredentials: true })
          .subscribe({ error: (err) => console.log('Error updating notification', err) });
      }
    }
  }

  markAllAsRead(): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.isRead ? notification : { ...notification, isRead: true },
      ),
    );
  }

  setNotifications(notifications: NotificationRecord[]): void {
    this.notificationsState.set([...notifications]);
  }

  addNotification(notification: NotificationRecord): void {
    this.notificationsState.update((notifications) => [notification, ...notifications]);
  }

  private localized(value: NotificationRecord['title']): string {
    const lang: AppLanguage = this.language.currentLang();
    return value[lang];
  }
}
