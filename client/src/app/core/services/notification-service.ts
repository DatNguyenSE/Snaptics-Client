import { Injectable, computed, inject, signal } from '@angular/core';
import { AppLanguage, LanguageService } from './language-service';
import { NotificationItem, NotificationRecord } from '../../models/notification-item';

const MOCK_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'receipt-scanned',
    title: {
      vi: 'Quét hóa đơn thành công',
      en: 'Receipt scanned successfully',
    },
    description: {
      vi: 'Đã thêm 3 món từ receipt Cafe Luna vào dòng thời gian chi tiêu.',
      en: '3 line items from Cafe Luna were added to your spending timeline.',
    },
    time: {
      vi: '2 phút trước',
      en: '2 minutes ago',
    },
    type: 'receipt',
    isRead: false,
  },
  {
    id: 'transaction-added',
    title: {
      vi: 'Đã thêm giao dịch mới',
      en: 'New transaction added',
    },
    description: {
      vi: 'Khoản chi 245.000 VND tại Co-op Food đã xuất hiện trong lịch sử giao dịch.',
      en: 'A 245,000 VND grocery purchase from Co-op Food is now in your history.',
    },
    time: {
      vi: '10 phút trước',
      en: '10 minutes ago',
    },
    type: 'transaction',
    isRead: false,
  },
  {
    id: 'manual-entry-saved',
    title: {
      vi: 'Đã lưu giao dịch nhập tay',
      en: 'Manual entry saved',
    },
    description: {
      vi: 'Mục phí gửi xe bạn vừa nhập đã được lưu vào Transactions.',
      en: 'Your quick parking fee note was saved and synced to Transactions.',
    },
    time: {
      vi: '30 phút trước',
      en: '30 minutes ago',
    },
    type: 'manual-entry',
    isRead: false,
  },
  {
    id: 'spending-increased',
    title: {
      vi: 'Chi tiêu Food & Drinks đang tăng',
      en: 'Food & Drinks spending increased',
    },
    description: {
      vi: 'Danh mục này tăng 18% so với hôm qua sau các giao dịch buổi sáng.',
      en: 'This category is up 18% compared with yesterday after your morning orders.',
    },
    time: {
      vi: '1 giờ trước',
      en: '1 hour ago',
    },
    type: 'insight',
    isRead: false,
  },
  {
    id: 'budget-nearly-reached',
    title: {
      vi: 'Ngân sách tháng sắp đạt giới hạn',
      en: 'Monthly budget is nearly reached',
    },
    description: {
      vi: 'Bạn đã dùng 87% ngân sách tháng này. Hãy theo dõi các khoản chi lớn.',
      en: "You have used 87% of this month's budget. Consider reviewing larger purchases.",
    },
    time: {
      vi: 'Hôm nay',
      en: 'Today',
    },
    type: 'budget',
    isRead: false,
  },
  {
    id: 'category-updated',
    title: {
      vi: 'Đã cập nhật danh mục giao dịch',
      en: 'Transaction category updated',
    },
    description: {
      vi: 'Matcha latte đã được chuyển sang danh mục Food & Drinks để báo cáo chính xác hơn.',
      en: 'Matcha latte was moved to Food & Drinks to keep your reports accurate.',
    },
    time: {
      vi: 'Hôm nay',
      en: 'Today',
    },
    type: 'category',
    isRead: true,
  },
  {
    id: 'report-generated',
    title: {
      vi: 'Đã tạo báo cáo chi tiêu',
      en: 'Spending report generated',
    },
    description: {
      vi: 'Bản tổng kết chi tiêu hàng tuần của bạn đã sẵn sàng để xem.',
      en: 'Your weekly spending summary is ready to review.',
    },
    time: {
      vi: 'Hôm qua',
      en: 'Yesterday',
    },
    type: 'report',
    isRead: true,
  },
];

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly language = inject(LanguageService);

  // Keep the dashboard interactive until notifications are loaded from the API.
  private readonly notificationsState = signal<NotificationRecord[]>([...MOCK_NOTIFICATIONS]);

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

  private localized(value: NotificationRecord['title']): string {
    const lang: AppLanguage = this.language.currentLang();
    return value[lang];
  }
}
