import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';
import { NotificationService } from '../../../core/services/notification-service';
import { NotificationItem, NotificationType } from '../../../models/notification-item';
import { UserHeader } from '../../user-layout/user-header/user-header';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, UserHeader],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
})
export class Notification {
  protected readonly language = inject(LanguageService);
  private readonly notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;
  activeFilter: 'all' | 'unread' = 'all';

  readonly notificationMeta: Record<NotificationType, { icon: string; tone: string }> = {
    receipt: { icon: 'receipt_long', tone: 'violet' },
    transaction: { icon: 'payments', tone: 'emerald' },
    'manual-entry': { icon: 'edit_note', tone: 'blue' },
    insight: { icon: 'auto_awesome', tone: 'amber' },
    budget: { icon: 'account_balance_wallet', tone: 'rose' },
    category: { icon: 'category', tone: 'blue' },
    report: { icon: 'bar_chart', tone: 'violet' },
  };

  get unreadCount(): number {
    return this.notificationService.unreadCount();
  }

  get filteredNotifications(): NotificationItem[] {
    const items = this.notifications();
    return this.activeFilter === 'unread' ? items.filter((item) => !item.isRead) : items;
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.activeFilter = filter;
  }

  markAsRead(notification: NotificationItem): void {
    if (!notification.isRead) this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  labelForType(type: NotificationType): string {
    const key = type === 'manual-entry' ? 'manualEntry' : type;
    return this.language.t(`notifications.types.${key}`);
  }

}
