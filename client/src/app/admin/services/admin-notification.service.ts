import { Injectable, signal } from '@angular/core';
import { of, delay } from 'rxjs';
import { AdminNotification, NotificationAudience, NotificationChannel, NotificationStatus } from '../models/admin.models';
import { AuditLogService } from './audit-log.service';
import { inject } from '@angular/core';

let _notifIdCounter = 1;

@Injectable({ providedIn: 'root' })
export class AdminNotificationService {
  private readonly auditLog = inject(AuditLogService);
  private readonly _notifications = signal<AdminNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  getNotifications() {
    return of(this._notifications()).pipe(delay(200));
  }

  createNotification(notif: Omit<AdminNotification, 'id' | 'createdAt' | 'status'>): void {
    const newNotif: AdminNotification = {
      ...notif,
      id: `notif_${String(_notifIdCounter++).padStart(3, '0')}`,
      status: notif.scheduledTime ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
    };
    this._notifications.update((n) => [newNotif, ...n]);
    this.auditLog.addLog({
      action: 'Create Notification',
      target: notif.title,
      reason: 'Admin created notification',
      riskLevel: 'low',
    });
  }

  sendNow(id: string): void {
    this._notifications.update((notifs) =>
      notifs.map((n) =>
        n.id === id ? { ...n, status: 'sent' as NotificationStatus, sentAt: new Date().toISOString(), readRate: 0 } : n
      )
    );
    const notif = this._notifications().find((n) => n.id === id);
    if (notif) {
      this.auditLog.addLog({
        action: 'Send Notification',
        target: notif.title,
        targetId: id,
        reason: 'Admin sent notification immediately',
        riskLevel: 'low',
      });
    }
  }

  cancelSchedule(id: string): void {
    this._notifications.update((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, status: 'draft' as NotificationStatus, scheduledTime: undefined } : n))
    );
  }

  deleteNotification(id: string): void {
    this._notifications.update((n) => n.filter((notif) => notif.id !== id));
  }
}
