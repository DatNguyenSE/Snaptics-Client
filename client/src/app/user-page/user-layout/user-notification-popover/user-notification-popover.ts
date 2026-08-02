import { Component, computed, inject, input, output } from '@angular/core';
import { AppLanguage, LanguageService } from '../../../core/services/language-service';
import { NotificationService } from '../../../core/services/notification-service';
import {
  LocalizedText,
  NotificationItem,
  NotificationTone,
  NotificationType,
} from '../../../models/notification-item';

interface NotificationMeta {
  icon: string;
  tone: NotificationTone;
  label: LocalizedText;
}

const NOTIFICATION_META: Record<
  NotificationType,
  NotificationMeta
> = {
  wallet_invitation: {
    icon: 'group_add',
    tone: 'violet',
    label: { vi: 'Lời mời vào ví', en: 'Wallet invitation' },
  },
  product_review: {
    icon: 'rate_review',
    tone: 'amber',
    label: { vi: 'Đánh giá sản phẩm', en: 'Product review' },
  },
  wallet_activity: {
    icon: 'account_balance_wallet',
    tone: 'emerald',
    label: { vi: 'Hoạt động ví', en: 'Wallet activity' },
  },
  system: {
    icon: 'info',
    tone: 'blue',
    label: { vi: 'Hệ thống', en: 'System' },
  },
  receipt: {
    icon: 'receipt_long',
    tone: 'blue',
    label: { vi: 'Hóa đơn', en: 'Receipt' },
  },
  transaction: {
    icon: 'payments',
    tone: 'emerald',
    label: { vi: 'Giao dịch', en: 'Transaction' },
  },
  'manual-entry': {
    icon: 'edit_note',
    tone: 'amber',
    label: { vi: 'Nhập tay', en: 'Manual entry' },
  },
  insight: {
    icon: 'auto_awesome',
    tone: 'violet',
    label: { vi: 'Lời khuyên AI', en: 'AI Insight' },
  },
  budget: {
    icon: 'account_balance_wallet',
    tone: 'rose',
    label: { vi: 'Ngân sách', en: 'Budget' },
  },
  category: {
    icon: 'sell',
    tone: 'amber',
    label: { vi: 'Danh mục', en: 'Category' },
  },
  report: {
    icon: 'bar_chart',
    tone: 'blue',
    label: { vi: 'Báo cáo', en: 'Report' },
  },
};

const POPOVER_COPY: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    markAllRead: string;
    empty: string;
    loading: string;
    error: string;
    retry: string;
  }
> = {
  vi: {
    title: 'Hoạt động gần đây',
    subtitle: 'Cập nhật từ quét hóa đơn, giao dịch và ngân sách',
    markAllRead: 'Đánh dấu đã xem',
    empty: 'Chưa có hoạt động gần đây.',
    loading: 'Đang tải thông báo...',
    error: 'Không thể tải thông báo. Vui lòng thử lại.',
    retry: 'Thử lại',
  },
  en: {
    title: 'Recent Activity',
    subtitle: 'Updates from receipts, transactions, and budgets',
    markAllRead: 'Mark all as read',
    empty: 'No recent activity yet.',
    loading: 'Loading notifications...',
    error: 'Could not load notifications. Please try again.',
    retry: 'Retry',
  },
};

@Component({
  selector: 'app-user-notification-popover',
  standalone: true,
  templateUrl: './user-notification-popover.html',
  styleUrl: './user-notification-popover.css',
})
export class UserNotificationPopover {
  protected readonly language = inject(LanguageService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly notificationMeta = NOTIFICATION_META;
  protected readonly copy = computed(() => POPOVER_COPY[this.language.currentLang()]);

  /** Trạng thái loading từ service — hiển thị spinner khi tải */
  protected readonly isLoading = this.notificationService.isLoading;
  /** Trạng thái lỗi từ service — hiển thị error state với nút Retry */
  protected readonly hasError = this.notificationService.hasError;

  readonly isOpen = input(false);
  readonly notifications = input<readonly NotificationItem[]>([]);
  readonly notificationRead = output<string>();
  readonly markAllRead = output<void>();

  protected readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length,
  );

  protected handleNotificationClick(notification: NotificationItem): void {
    if (!notification.isRead) {
      this.notificationRead.emit(notification.id);
    }
  }

  protected handleMarkAllRead(): void {
    this.markAllRead.emit();
  }

  protected handleRetry(): void {
    this.notificationService.loadNotifications();
  }

  protected labelForType(type: NotificationType): string {
    return this.notificationMeta[type].label[this.language.currentLang()];
  }
}

