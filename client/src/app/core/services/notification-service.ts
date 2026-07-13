import { Injectable, computed, inject, signal } from '@angular/core';
import { AppLanguage, LanguageService } from './language-service';
import { NotificationItem, NotificationRecord } from '../../models/notification-item';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly language = inject(LanguageService);

  private readonly notificationsState = signal<NotificationRecord[]>([]);

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
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.id === id && !notification.isRead
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
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
