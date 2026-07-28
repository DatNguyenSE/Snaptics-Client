import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { Subject } from 'rxjs';
import { AppLanguage, LanguageService } from './language-service';
import { LocalizedText, NotificationItem, NotificationRecord, NotificationType, SystemSeverity } from '../../models/notification-item';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AccountService } from './account-service';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

const SEED_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif-1',
    type: 'wallet_invitation',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    title: { vi: 'Lời mời tham gia ví gia đình', en: 'Invitation to Family Wallet' },
    description: {
      vi: 'Nguyễn Văn Anh đã mời bạn gia nhập Ví Gia Đình 2026 với vai trò Thành viên.',
      en: 'Nguyen Van Anh invited you to join Family Wallet 2026 as Member.'
    },
    time: { vi: '15 phút trước', en: '15 mins ago' },
    senderName: 'Nguyễn Văn Anh',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    relatedEntityId: 'wallet-101',
    relatedEntityType: 'wallet',
    actionStatus: 'pending',
    metadata: {
      walletName: 'Ví Gia Đình 2026',
      role: 'Thành viên'
    }
  },
  {
    id: 'notif-2',
    type: 'product_review',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    title: { vi: 'Nhắc nhở đánh giá sản phẩm', en: 'Product Review Reminder' },
    description: {
      vi: 'Bạn đã mua Tai nghe Bluetooth Sony WH-1000XM5 với giá 6.490.000 ₫. Hãy chia sẻ cảm nhận!',
      en: 'You purchased Sony WH-1000XM5 Headphones for 6,490,000 ₫. Share your review!'
    },
    time: { vi: '2 giờ trước', en: '2 hours ago' },
    relatedEntityId: 'prod-88',
    relatedEntityType: 'product',
    actionStatus: 'pending',
    metadata: {
      productName: 'Tai nghe Bluetooth Sony WH-1000XM5',
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
      amount: 6490000,
      purchaseDate: '24/07/2026'
    }
  },
  {
    id: 'notif-3',
    type: 'wallet_activity',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    title: { vi: 'Chi tiêu mới trong ví dùng chung', en: 'New Expense in Shared Wallet' },
    description: {
      vi: 'Trần Minh Hải vừa thêm khoản chi "Ăn trưa nhóm" 450.000 ₫ thuộc danh mục Ăn uống.',
      en: 'Tran Minh Hai added expense "Group Lunch" 450,000 ₫ in Food & Dining.'
    },
    time: { vi: '5 giờ trước', en: '5 hours ago' },
    senderName: 'Trần Minh Hải',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    relatedEntityId: 'tx-502',
    relatedEntityType: 'transaction',
    metadata: {
      walletName: 'Ví Quỹ Nhóm Công Ty',
      memberName: 'Trần Minh Hải',
      action: 'thêm khoản chi',
      amount: 450000,
      category: 'Ăn uống'
    }
  },
  {
    id: 'notif-4',
    type: 'system',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    title: { vi: 'Cảnh báo hạn mức ngân sách', en: 'Budget Limit Warning' },
    description: {
      vi: 'Chi tiêu danh mục Giải trí đã đạt 92% (4.600.000 ₫ / 5.000.000 ₫) hạn mức tháng này.',
      en: 'Entertainment category spending reached 92% of July budget limit.'
    },
    time: { vi: '12 giờ trước', en: '12 hours ago' },
    relatedEntityType: 'system',
    metadata: {
      severity: 'warning'
    }
  },
  {
    id: 'notif-5',
    type: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    title: { vi: 'Bảo trì hệ thống định kỳ', en: 'Scheduled System Maintenance' },
    description: {
      vi: 'Hệ thống sẽ bảo trì nâng cấp máy chủ từ 02:00 - 04:00 ngày 26/07/2026.',
      en: 'System upgrade maintenance scheduled from 02:00 - 04:00 AM on July 26, 2026.'
    },
    time: { vi: 'Hôm qua 10:15', en: 'Yesterday 10:15' },
    relatedEntityType: 'system',
    metadata: {
      severity: 'critical'
    }
  },
  {
    id: 'notif-6',
    type: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    title: { vi: 'Cập nhật phiên bản Snaptics 3.2', en: 'Snaptics v3.2 Update Available' },
    description: {
      vi: 'Trải nghiệm tính năng AI Phân tích chi tiêu thông minh và Trung tâm thông báo mới!',
      en: 'Experience smart AI spending analytics and the new Notification Center!'
    },
    time: { vi: '2 ngày trước', en: '2 days ago' },
    relatedEntityType: 'system',
    metadata: {
      severity: 'info'
    }
  }
];

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly language = inject(LanguageService);
  private readonly accountService = inject(AccountService);
  private readonly http = inject(HttpClient);
  private hubConnection?: HubConnection;

  public aiResult$ = new Subject<any>();
  public aiError$ = new Subject<string>();

  private readonly notificationsState = signal<NotificationRecord[]>([]);
  readonly mutedTypes = signal<Set<NotificationType>>(new Set());
  readonly notificationSettings = signal({
    emailNotif: true,
    pushNotif: true,
    walletInviteNotif: true,
    walletActivityNotif: true,
    reviewNotif: true,
    systemNotif: true,
    soundEnabled: true
  });

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

  private get baseUrl(): string {
    return environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
  }

  private get apiUrl(): string {
    return `${this.baseUrl}Notification`;
  }

  loadNotifications(): void {
    this.http.get<any[]>(`${this.apiUrl}/user`, { withCredentials: true })
      .subscribe({
        next: (dtos) => {
          if (dtos && dtos.length > 0) {
            const records: NotificationRecord[] = dtos.map(dto => {
              const feType: NotificationType = dto.type === 4 ? 'wallet_invitation' : 'system';
              const date = new Date(dto.createdAt);
              const timeString = date.toLocaleString();
              
              return {
                id: dto.id.toString(),
                title: { vi: dto.title || 'Thông báo hệ thống', en: dto.title || 'System Notification' },
                description: { vi: dto.message, en: dto.message },
                time: { vi: timeString, en: timeString },
                type: feType,
                isRead: dto.isRead,
                createdAt: dto.createdAt
              };
            });
            this.setNotifications(records);
          } else {
            this.setNotifications(SEED_NOTIFICATIONS);
          }
        },
        error: (err) => {
          console.log('Using seed notifications as fallback', err);
          if (this.notificationsState().length === 0) {
            this.setNotifications(SEED_NOTIFICATIONS);
          }
        }
      });
  }

  createHubConnection(): void {
    const token = this.accountService.currentUser()?.token;
    const hubUrl = (environment as any).hubUrl 
      ? (environment as any).hubUrl + 'notification'
      : `${this.baseUrl}hubs/notification`;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch((error: unknown) => console.log('Error establishing SignalR connection', error));

    this.hubConnection.on('ReceiveAiResult', (result: any) => {
      this.aiResult$.next(result);
    });

    this.hubConnection.on('ReceiveAiError', (errorMsg: string) => {
      this.aiError$.next(errorMsg);
    });

    this.hubConnection.on('ReceiveNotification', (notificationDto: any) => {
      const feType: NotificationType = notificationDto.type === 4 ? 'wallet_invitation' : 'system';
      const date = new Date(notificationDto.createdAt);
      const timeString = date.toLocaleString();
      
      const newRecord: NotificationRecord = {
        id: notificationDto.id?.toString() || Date.now().toString(),
        title: { vi: notificationDto.title || 'Thông báo mới', en: notificationDto.title || 'New Notification' },
        description: { vi: notificationDto.message, en: notificationDto.message },
        time: { vi: timeString, en: timeString },
        type: feType,
        isRead: false,
        createdAt: notificationDto.createdAt || new Date().toISOString()
      };

      this.addNotification(newRecord);
    });
  }

  readonly notifications = computed<NotificationItem[]>(() => {
    const muted = this.mutedTypes();
    return this.notificationsState()
      .filter((n) => !muted.has(n.type))
      .map((notification) => ({
        id: notification.id,
        userId: notification.userId,
        title: this.localized(notification.title),
        description: this.localized(notification.description),
        time: this.localized(notification.time),
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        relatedEntityId: notification.relatedEntityId,
        relatedEntityType: notification.relatedEntityType,
        senderId: notification.senderId,
        senderName: notification.senderName,
        senderAvatar: notification.senderAvatar,
        metadata: notification.metadata,
        actionStatus: notification.actionStatus,
      }));
  });

  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length,
  );

  markAsRead(id: string): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );

    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      const target = this.notificationsState().find((n) => n.id === id);
      if (target) {
        const dto = {
          id: numId,
          userId: this.accountService.currentUser()?.id || '',
          message: target.description.en || target.description.vi,
          isRead: true,
          type: target.type === 'wallet_invitation' ? 4 : 3,
          createdAt: new Date().toISOString(),
        };
        this.http.put(environment.apiUrl + `Notification/${numId}`, dto, { withCredentials: true })
          .subscribe({ error: (err) => console.log('Error updating notification', err) });
      }
    }
  }

  markAsUnread(id: string): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: false } : notification,
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

  deleteNotification(id: string): void {
    this.notificationsState.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );

    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      this.http.delete(`${this.apiUrl}/${numId}`, { withCredentials: true })
        .subscribe({ error: (err) => console.log('Error deleting notification', err) });
    }
  }

  respondToInvitation(id: string, accept: boolean): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) => {
        if (notification.id === id) {
          return {
            ...notification,
            isRead: true,
            actionStatus: accept ? 'accepted' : 'rejected',
          };
        }
        return notification;
      }),
    );
  }

  submitProductReview(id: string, rating: number, comment: string): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) => {
        if (notification.id === id) {
          return {
            ...notification,
            isRead: true,
            actionStatus: 'reviewed',
            metadata: {
              ...notification.metadata,
              rating,
              userComment: comment,
            },
          };
        }
        return notification;
      }),
    );
  }

  toggleMuteType(type: NotificationType): void {
    this.mutedTypes.update((types) => {
      const next = new Set(types);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  updateSettings(settings: Partial<ReturnType<typeof this.notificationSettings>>): void {
    this.notificationSettings.update((prev) => ({ ...prev, ...settings }));
  }

  setNotifications(notifications: NotificationRecord[]): void {
    this.notificationsState.set([...notifications]);
  }

  addNotification(notification: NotificationRecord): void {
    this.notificationsState.update((notifications) => [notification, ...notifications]);
  }

  private localized(value: LocalizedText): string {
    const lang: AppLanguage = this.language.currentLang();
    return value[lang] || value.vi || '';
  }
}

