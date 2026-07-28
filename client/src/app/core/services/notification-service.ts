import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { Subject } from 'rxjs';
import { AppLanguage, LanguageService } from './language-service';
import { LocalizedText, NotificationItem, NotificationRecord, NotificationType } from '../../models/notification-item';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AccountService } from './account-service';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface NotificationDto {
  id: number;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  itemInventoryId?: number | null;
  relatedId?: number | null;
  type: number | string;
  transactionDetailId?: number | null;
}

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
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

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
    const url = `${this.apiUrl}/user`;
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    if (!environment.production) {
      console.log(`[NotificationService] Fetching notifications from: ${url}`);
    }

    this.http.get<NotificationDto[]>(url, { withCredentials: true })
      .subscribe({
        next: (dtos) => {
          this.isLoading.set(false);
          if (!environment.production) {
            console.log(`[NotificationService] API Response from ${url}:`, dtos);
          }
          if (dtos && Array.isArray(dtos)) {
            const records: NotificationRecord[] = dtos.map(dto => this.mapDtoToRecord(dto));
            this.setNotifications(records);
          } else {
            this.setNotifications([]);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(err.message || 'Error fetching notifications');
          if (!environment.production) {
            console.error(`[NotificationService] HTTP error fetching from ${url}:`, err);
          }
          this.setNotifications([]);
        }
      });
  }

  private mapDtoToRecord(dto: NotificationDto): NotificationRecord {
    let feType: NotificationType = 'system';
    let titleVi = 'Thông báo hệ thống';
    let titleEn = 'System Notification';
    let relatedEntityType: 'wallet' | 'transaction' | 'product' | 'system' = 'system';
    let relatedEntityId: string | undefined = undefined;

    const typeNum = typeof dto.type === 'number' ? dto.type : parseInt(dto.type as string, 10);
    const typeStr = typeof dto.type === 'string' ? dto.type : '';

    if (typeNum === 4 || typeStr === 'BudgetInvitation') {
      feType = 'wallet_invitation';
      titleVi = 'Lời mời tham gia ngân sách';
      titleEn = 'Budget Invitation';
      relatedEntityType = 'wallet';
    } else if (typeNum === 2 || typeStr === 'UsageReview') {
      feType = 'product_review';
      titleVi = 'Đánh giá sản phẩm/chi tiêu';
      titleEn = 'Usage Review';
      relatedEntityType = 'product';
      if (dto.itemInventoryId) {
        relatedEntityId = dto.itemInventoryId.toString();
      }
    } else if (typeNum === 1 || typeStr === 'MissingInfo') {
      feType = 'manual-entry';
      titleVi = 'Cần bổ sung thông tin';
      titleEn = 'Missing Information Needed';
      if (dto.transactionDetailId) {
        relatedEntityType = 'transaction';
        relatedEntityId = dto.transactionDetailId.toString();
      }
    } else if (dto.transactionDetailId) {
      feType = 'wallet_activity';
      titleVi = 'Hoạt động giao dịch';
      titleEn = 'Transaction Activity';
      relatedEntityType = 'transaction';
      relatedEntityId = dto.transactionDetailId.toString();
    }

    const cleanDateString = dto.createdAt?.replace(/(Z|[+-]\d{2}:\d{2})$/, '') || '';
    const date = new Date(cleanDateString);
    const timeString = isNaN(date.getTime()) ? dto.createdAt : date.toLocaleString('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });

    return {
      id: dto.id.toString(),
      userId: dto.userId,
      title: { vi: titleVi, en: titleEn },
      description: { vi: dto.message || '', en: dto.message || '' },
      time: { vi: timeString, en: timeString },
      type: feType,
      isRead: dto.isRead,
      createdAt: dto.createdAt,
      relatedEntityId: relatedEntityId,
      relatedEntityType: relatedEntityType,
      metadata: {
        itemInventoryId: dto.itemInventoryId ?? (dto as any).ItemInventoryId,
        transactionDetailId: dto.transactionDetailId ?? (dto as any).TransactionDetailId,
        relatedId: dto.relatedId ?? (dto as any).RelatedId,
        rawType: dto.type ?? (dto as any).Type
      },
      actionStatus: feType === 'wallet_invitation' ? 'pending' : undefined
    };
  }

  createHubConnection(): void {
    const token = this.accountService.currentUser()?.token;
    const hubUrl = (environment as any).hubUrl 
      ? (environment as any).hubUrl + 'notification'
      : `${this.baseUrl}hubs/notification`;

    if (!environment.production) {
      console.log(`[NotificationService] Connecting to SignalR Hub: ${hubUrl}`);
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch((error: unknown) => {
      if (!environment.production) {
        console.error('[NotificationService] SignalR connection failed:', error);
      }
    });

    this.hubConnection.on('ReceiveAiResult', (result: any) => {
      if (!environment.production) {
        console.log('[NotificationService] SignalR ReceiveAiResult:', result);
      }
      this.aiResult$.next(result);
    });

    this.hubConnection.on('ReceiveAiError', (errorMsg: string) => {
      if (!environment.production) {
        console.error('[NotificationService] SignalR ReceiveAiError:', errorMsg);
      }
      this.aiError$.next(errorMsg);
    });

    this.hubConnection.on('ReceiveNotification', (notificationDto: NotificationDto) => {
      if (!environment.production) {
        console.log('[NotificationService] SignalR ReceiveNotification:', notificationDto);
      }
      const newRecord = this.mapDtoToRecord(notificationDto);
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
        const dto: NotificationDto = {
          id: numId,
          userId: target.userId || this.accountService.currentUser()?.id || '',
          message: target.description.en || target.description.vi || '',
          isRead: true,
          type: target.metadata?.['rawType'] ?? (target.type === 'wallet_invitation' ? 4 : 0),
          createdAt: target.createdAt || new Date().toISOString(),
          itemInventoryId: target.metadata?.['itemInventoryId'] || null,
          transactionDetailId: target.metadata?.['transactionDetailId'] || null
        };
        const url = `${this.apiUrl}/${numId}`;
        if (!environment.production) {
          console.log(`[NotificationService] PUT ${url}`, dto);
        }
        this.http.put<NotificationDto>(url, dto, { withCredentials: true })
          .subscribe({
            next: (res) => {
              if (!environment.production) {
                console.log(`[NotificationService] Marked as read success for ID ${numId}:`, res);
              }
            },
            error: (err) => {
              if (!environment.production) {
                console.error(`[NotificationService] Error marking as read for ID ${numId}:`, err);
              }
            }
          });
      }
    }
  }

  markAsUnread(id: string): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: false } : notification,
      ),
    );

    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      const target = this.notificationsState().find((n) => n.id === id);
      if (target) {
        const dto: NotificationDto = {
          id: numId,
          userId: target.userId || this.accountService.currentUser()?.id || '',
          message: target.description.en || target.description.vi || '',
          isRead: false,
          type: target.metadata?.['rawType'] ?? (target.type === 'wallet_invitation' ? 4 : 0),
          createdAt: target.createdAt || new Date().toISOString(),
          itemInventoryId: target.metadata?.['itemInventoryId'] || null,
          transactionDetailId: target.metadata?.['transactionDetailId'] || null
        };
        const url = `${this.apiUrl}/${numId}`;
        if (!environment.production) {
          console.log(`[NotificationService] PUT ${url} (mark unread)`, dto);
        }
        this.http.put<NotificationDto>(url, dto, { withCredentials: true })
          .subscribe({
            next: (res) => {
              if (!environment.production) {
                console.log(`[NotificationService] Marked as unread success for ID ${numId}:`, res);
              }
            },
            error: (err) => {
              if (!environment.production) {
                console.error(`[NotificationService] Error marking as unread for ID ${numId}:`, err);
              }
            }
          });
      }
    }
  }

  markAllAsRead(): void {
    const unreadItems = this.notificationsState().filter((n) => !n.isRead);
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.isRead ? notification : { ...notification, isRead: true },
      ),
    );

    unreadItems.forEach((target) => {
      const numId = parseInt(target.id, 10);
      if (!isNaN(numId)) {
        const dto: NotificationDto = {
          id: numId,
          userId: target.userId || this.accountService.currentUser()?.id || '',
          message: target.description.en || target.description.vi || '',
          isRead: true,
          type: target.metadata?.['rawType'] ?? (target.type === 'wallet_invitation' ? 4 : 0),
          createdAt: target.createdAt || new Date().toISOString(),
          itemInventoryId: target.metadata?.['itemInventoryId'] || null,
          transactionDetailId: target.metadata?.['transactionDetailId'] || null
        };
        const url = `${this.apiUrl}/${numId}`;
        this.http.put<NotificationDto>(url, dto, { withCredentials: true }).subscribe();
      }
    });
  }

  deleteNotification(id: string): void {
    this.notificationsState.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );

    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      const url = `${this.apiUrl}/${numId}`;
      if (!environment.production) {
        console.log(`[NotificationService] DELETE ${url}`);
      }
      this.http.delete(`${this.apiUrl}/${numId}`, { withCredentials: true })
        .subscribe({
          next: (res) => {
            if (!environment.production) {
              console.log(`[NotificationService] Deleted notification ID ${numId} success:`, res);
            }
          },
          error: (err) => {
            if (!environment.production) {
              console.error(`[NotificationService] Error deleting notification ID ${numId}:`, err);
            }
          }
        });
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

