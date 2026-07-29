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
  relatedId?: number | string | null;
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
    let titleVi = 'Hệ thống';
    let titleEn = 'System';
    let relatedEntityId: string | undefined = dto.relatedId?.toString();
    let relatedEntityType: 'wallet' | 'transaction' | 'product' | 'ticket' | 'system' = 'system';
    
    // Parse encoded status from message
    let actionStatus: 'pending' | 'accepted' | 'rejected' | 'reviewed' | undefined;
    let usageStatusLabel: string | undefined;
    let originalMessage = dto.message || '';

    if (originalMessage.startsWith('[REVIEWED:')) {
      actionStatus = 'reviewed';
      const match = originalMessage.match(/\[REVIEWED:(.*?)\]/);
      if (match) {
        usageStatusLabel = match[1].trim();
        originalMessage = originalMessage.replace(match[0], '').trim();
      }
    } else if (originalMessage.startsWith('[ACCEPTED]')) {
      actionStatus = 'accepted';
      originalMessage = originalMessage.replace('[ACCEPTED]', '').trim();
    } else if (originalMessage.startsWith('[REJECTED]')) {
      actionStatus = 'rejected';
      originalMessage = originalMessage.replace('[REJECTED]', '').trim();
    }

    const typeNum = typeof dto.type === 'number' ? dto.type : parseInt(dto.type as any, 10);
    const typeStr = typeof dto.type === 'string' ? dto.type : '';

    if (typeNum === 4 || typeStr === 'BudgetInvitation' || typeStr === 'Budget') {
      feType = 'wallet_invitation';
      titleVi = 'Lời mời / Hoạt động Ngân sách';
      titleEn = 'Budget Invitation / Activity';
      relatedEntityType = 'wallet';
      if (dto.relatedId) relatedEntityId = dto.relatedId.toString();
    } else if (typeNum === 2 || typeStr === 'UsageReview' || typeStr === 'ItemReviewJob') {
      feType = 'product_review';
      titleVi = 'Kiểm duyệt / Đánh giá sản phẩm';
      titleEn = 'Item Review Completed';
      relatedEntityType = 'product';
      if (dto.itemInventoryId) {
        relatedEntityId = dto.itemInventoryId.toString();
      } else if (dto.relatedId) {
        relatedEntityId = dto.relatedId.toString();
      }
    } else if (typeNum === 5 || typeStr === 'SupportTicket' || typeStr === 'Ticket') {
      feType = 'system';
      titleVi = 'Cập nhật Yêu cầu Hỗ trợ';
      titleEn = 'Support Ticket Update';
      relatedEntityType = 'ticket';
      if (dto.relatedId) relatedEntityId = dto.relatedId.toString();
    } else if (typeNum === 1 || typeStr === 'MissingInfo') {
      feType = 'manual-entry';
      titleVi = 'Cần bổ sung thông tin';
      titleEn = 'Missing Information Needed';
      relatedEntityType = 'transaction';
      if (dto.transactionDetailId) {
        relatedEntityId = dto.transactionDetailId.toString();
      } else if (dto.relatedId) {
        relatedEntityId = dto.relatedId.toString();
      }
    } else if (dto.transactionDetailId || typeStr === 'Transaction') {
      feType = 'wallet_activity';
      titleVi = 'Hoạt động giao dịch';
      titleEn = 'Transaction Activity';
      relatedEntityType = 'transaction';
      relatedEntityId = dto.transactionDetailId?.toString() || dto.relatedId?.toString();
    }

    // Format date explicitly in UTC+7 (Asia/Ho_Chi_Minh)
    const cleanDateString = dto.createdAt?.replace(/(Z|[+-]\d{2}:\d{2})$/, '') || '';
    const date = new Date(cleanDateString);
    const timeString = isNaN(date.getTime())
      ? dto.createdAt
      : date.toLocaleString('vi-VN', { 
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric', month: '2-digit', day: '2-digit', 
          hour: '2-digit', minute: '2-digit' 
        });

    return {
      id: dto.id.toString(),
      userId: dto.userId,
      title: { vi: titleVi, en: titleEn },
      description: { vi: originalMessage, en: originalMessage },
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
        rawType: dto.type ?? (dto as any).Type,
        usageStatusLabel: usageStatusLabel
      },
      actionStatus: actionStatus ?? (feType === 'wallet_invitation' ? 'pending' : undefined)
    };
  }

  createHubConnection(): void {
    const hubUrl = (environment as any).hubUrl 
      ? (environment as any).hubUrl + 'notification'
      : `${this.baseUrl}hubs/notification`;

    if (!environment.production) {
      console.log(`[NotificationService] Connecting to SignalR Hub: ${hubUrl}`);
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.accountService.currentUser()?.token || ''
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

    this.hubConnection.on('ReceiveItemReviewCompleted', (data: any) => {
      if (!environment.production) {
        console.log('[NotificationService] SignalR ItemReviewJob Completed:', data);
      }
      if (data && typeof data === 'object') {
        const notif: NotificationDto = {
          id: data.id || Date.now(),
          userId: data.userId || '',
          message: data.message || `Mặt hàng "${data.itemName || 'Sản phẩm'}" đã hoàn thành kiểm duyệt.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          itemInventoryId: data.itemInventoryId || data.relatedId,
          relatedId: data.relatedId || data.itemInventoryId,
          type: 'ItemReviewJob'
        };
        this.addNotification(this.mapDtoToRecord(notif));
      }
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
          const newStatus = accept ? 'accepted' : 'rejected';
          this.updateBackendMessage(id, accept ? '[ACCEPTED]' : '[REJECTED]');
          return {
            ...notification,
            isRead: true,
            actionStatus: newStatus,
          };
        }
        return notification;
      }),
    );
  }

  submitProductReview(id: string, rating: number, comment: string, usageStatusLabel?: string): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) => {
        if (notification.id === id) {
          const tag = `[REVIEWED:${usageStatusLabel || 'Done'}]`;
          this.updateBackendMessage(id, tag);
          return {
            ...notification,
            isRead: true,
            actionStatus: 'reviewed',
            metadata: {
              ...notification.metadata,
              rating,
              userComment: comment,
              usageStatusLabel,
            },
          };
        }
        return notification;
      }),
    );
  }

  private updateBackendMessage(id: string, prefixTag: string): void {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;

    const target = this.notificationsState().find((n) => n.id === id);
    if (!target) return;

    // Use original message without existing tags if it somehow already has one
    let cleanMessage = target.description.en || target.description.vi || '';
    if (cleanMessage.startsWith('[REVIEWED:')) {
      cleanMessage = cleanMessage.replace(/\[REVIEWED:(.*?)\]/, '').trim();
    } else if (cleanMessage.startsWith('[ACCEPTED]')) {
      cleanMessage = cleanMessage.replace('[ACCEPTED]', '').trim();
    } else if (cleanMessage.startsWith('[REJECTED]')) {
      cleanMessage = cleanMessage.replace('[REJECTED]', '').trim();
    }

    const newMessage = `${prefixTag} ${cleanMessage}`.trim();

    const dto: NotificationDto = {
      id: numId,
      userId: target.userId || this.accountService.currentUser()?.id || '',
      message: newMessage,
      isRead: true,
      type: target.metadata?.['rawType'] ?? (target.type === 'wallet_invitation' ? 4 : 0),
      createdAt: target.createdAt || new Date().toISOString(),
      itemInventoryId: target.metadata?.['itemInventoryId'] || null,
      transactionDetailId: target.metadata?.['transactionDetailId'] || null,
      relatedId: target.metadata?.['relatedId'] || null
    };

    const url = `${this.apiUrl}/${numId}`;
    this.http.put(url, dto, { withCredentials: true }).subscribe({
      next: () => {
        if (!environment.production) {
          console.log(`[NotificationService] Successfully updated notification ${numId} message to: ${newMessage}`);
        }
      },
      error: (err) => {
        if (!environment.production) {
          console.error(`[NotificationService] Error updating notification message ${numId}:`, err);
        }
      }
    });
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

