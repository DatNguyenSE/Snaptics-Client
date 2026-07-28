import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminNotificationService } from '../../services/admin-notification.service';
import { AdminNotification, NotificationAudience, NotificationChannel, NotificationStatus } from '../../models/admin.models';
import { StatusBadgeComponent, BadgeVariant } from '../../components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { AdminDrawerComponent } from '../../components/admin-drawer/admin-drawer.component';
import { ToastService } from '../../../core/services/toast-service';
import { LanguageService } from '../../../core/services/language-service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, EmptyStateComponent, LoadingSkeletonComponent, AdminDrawerComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  private readonly notifService = inject(AdminNotificationService);
  private readonly toast = inject(ToastService);
  protected readonly language = inject(LanguageService);

  loading = true;
  notifications: AdminNotification[] = [];
  drawerOpen = false;

  selectedChannel: NotificationChannel = 'in_app';

  formData: Partial<AdminNotification> = {
    title: '',
    message: '',
    audience: 'all',
    scheduledTime: '',
  };

  get audienceOptions(): { value: NotificationAudience; label: string }[] {
    return [
      { value: 'all', label: this.language.t('admin.notificationsPage.allUsers') },
      { value: 'unverified', label: this.language.t('admin.notificationsPage.unverifiedUsers') },
      { value: 'active', label: this.language.t('admin.notificationsPage.activeUsers') },
      { value: 'specific', label: this.language.t('admin.notificationsPage.specificUser') },
    ];
  }

  get channelOptions(): { value: NotificationChannel; label: string }[] {
    return [
      { value: 'in_app', label: this.language.t('admin.notificationsPage.inApp') },
      { value: 'email', label: this.language.t('admin.notificationsPage.email') },
      { value: 'push', label: this.language.t('admin.notificationsPage.push') },
    ];
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.load();
      this.loading = false;
    }, 350);
  }

  load(): void {
    this.notifService.getNotifications().subscribe((n) => (this.notifications = n));
  }

  openDrawer(): void {
    this.formData = { title: '', message: '', audience: 'all', scheduledTime: '' };
    this.selectedChannel = 'in_app';
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  createNotification(): void {
    if (!this.formData.title || !this.formData.message) {
      this.toast.error('Title and message body are required.');
      return;
    }
    const payload = {
      ...this.formData,
      channel: [this.selectedChannel],
    };
    this.notifService.createNotification(payload as any);
    this.load();
    this.closeDrawer();
    this.toast.success('Notification created successfully.');
  }

  sendNow(id: string): void {
    this.notifService.sendNow(id);
    this.load();
    this.toast.success('Notification sent!');
  }

  deleteNotif(id: string): void {
    this.notifService.deleteNotification(id);
    this.load();
    this.toast.info('Notification deleted.');
  }

  hasChannel(channels: NotificationChannel[], target: NotificationChannel): boolean {
    return Array.isArray(channels) && channels.includes(target);
  }

  getStatusVariant(status: NotificationStatus): BadgeVariant {
    return status;
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  trackById(_: number, item: AdminNotification): string {
    return item.id;
  }
}
