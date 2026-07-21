import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminUserService } from '../../../services/admin-user.service';
import { AuditLogService } from '../../../services/audit-log.service';
import { AdminUser, AuditLog, AdminRole } from '../../../models/admin.models';
import { StatusBadgeComponent, BadgeVariant } from '../../../components/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmModalConfig } from '../../../components/confirmation-modal/confirmation-modal.component';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { ToastService } from '../../../../core/services/toast-service';

type TabId = 'overview' | 'activity' | 'usage' | 'security' | 'history';

const ACTIVITY_MOCK = [
  { id: 'a1', event: 'Login successful', time: '2026-07-21T10:20:00Z', icon: 'login', variant: 'success' },
  { id: 'a2', event: 'Profile updated', time: '2026-07-18T08:30:00Z', icon: 'edit', variant: 'success' },
  { id: 'a3', event: 'Password changed', time: '2026-07-10T14:00:00Z', icon: 'lock_reset', variant: 'success' },
  { id: 'a4', event: 'Login failed', time: '2026-07-08T22:12:00Z', icon: 'error', variant: 'failed' },
  { id: 'a5', event: 'Verification completed', time: '2026-06-01T09:45:00Z', icon: 'verified', variant: 'success' },
];

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [StatusBadgeComponent, ConfirmationModalComponent, EmptyStateComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css',
})
export class UserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(AdminUserService);
  private readonly auditService = inject(AuditLogService);
  private readonly toast = inject(ToastService);

  user: AdminUser | undefined;
  auditLogs: AuditLog[] = [];
  loading = true;
  activeTab: TabId = 'overview';
  readonly activityMock = ACTIVITY_MOCK;

  confirmModal: { open: boolean; config: ConfirmModalConfig; action?: (reason: string) => void; loading: boolean } = {
    open: false,
    config: { title: '', description: '' },
    loading: false,
  };

  readonly tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'person' },
    { id: 'activity', label: 'Account Activity', icon: 'history' },
    { id: 'usage', label: 'Usage', icon: 'bar_chart' },
    { id: 'security', label: 'Security', icon: 'security' },
    { id: 'history', label: 'Admin History', icon: 'fact_check' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    setTimeout(() => {
      this.user = this.userService.getUserById(id);
      this.auditLogs = this.auditService.getLogsForUser(id);
      this.loading = false;
      if (!this.user) {
        this.toast.error('User not found.');
        void this.router.navigateByUrl('/admin/users');
      }
    }, 350);
  }

  goBack(): void {
    void this.router.navigateByUrl('/admin/users');
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
  }

  getStatusVariant(status: string): BadgeVariant {
    return status as BadgeVariant;
  }

  getRoleVariant(role: AdminRole): BadgeVariant {
    return role.toLowerCase() as BadgeVariant;
  }

  getInitials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  openLockModal(): void {
    if (!this.user) return;
    this.confirmModal = {
      open: true,
      loading: false,
      config: {
        title: 'Lock Account',
        description: 'The user will be unable to log in. All active sessions will be terminated.',
        targetName: this.user.displayName,
        confirmLabel: 'Lock Account',
        isDangerous: true,
        requireReason: true,
        requireCheckbox: true,
      },
      action: (reason) => {
        this.userService.lockUser(this.user!.id, reason);
        this.user = this.userService.getUserById(this.user!.id);
        this.toast.success('Account locked.');
      },
    };
  }

  openUnlockModal(): void {
    if (!this.user) return;
    this.confirmModal = {
      open: true,
      loading: false,
      config: {
        title: 'Unlock Account',
        description: 'The user will regain access to their account.',
        targetName: this.user.displayName,
        confirmLabel: 'Unlock Account',
        requireReason: true,
      },
      action: (reason) => {
        this.userService.unlockUser(this.user!.id, reason);
        this.user = this.userService.getUserById(this.user!.id);
        this.toast.success('Account unlocked.');
      },
    };
  }

  openRevokeModal(): void {
    if (!this.user) return;
    this.confirmModal = {
      open: true,
      loading: false,
      config: {
        title: 'Revoke All Sessions',
        description: 'The user will be signed out of all devices immediately.',
        targetName: this.user.displayName,
        confirmLabel: 'Revoke Sessions',
        isDangerous: true,
        requireReason: true,
      },
      action: (reason) => {
        this.userService.revokeSessions(this.user!.id, reason);
        this.user = this.userService.getUserById(this.user!.id);
        this.toast.success('All sessions revoked.');
      },
    };
  }

  onModalConfirm(event: { reason: string }): void {
    this.confirmModal.loading = true;
    setTimeout(() => {
      if (this.confirmModal.action) this.confirmModal.action(event.reason);
      this.auditLogs = this.auditService.getLogsForUser(this.user?.id ?? '');
      this.confirmModal = { ...this.confirmModal, open: false, loading: false };
    }, 600);
  }

  onModalCancel(): void {
    this.confirmModal = { ...this.confirmModal, open: false };
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
