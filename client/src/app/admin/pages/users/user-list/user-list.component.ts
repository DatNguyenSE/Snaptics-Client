import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AdminUserService } from '../../../services/admin-user.service';
import { AdminUser, AdminRole, AdminUserStatus, VerificationStatus, PaginatedResult, UserFilter } from '../../../models/admin.models';
import { StatusBadgeComponent, BadgeVariant } from '../../../components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent, ConfirmModalConfig } from '../../../components/confirmation-modal/confirmation-modal.component';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '../../../../core/services/toast-service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    StatusBadgeComponent,
    PaginationComponent,
    ConfirmationModalComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(AdminUserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  loading = true;
  result: PaginatedResult<AdminUser> = { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  filter: UserFilter = { search: '', status: '', verification: '', role: '', dateFrom: '', dateTo: '' };
  currentPage = 1;
  pageSize = 10;
  selectedIds = new Set<string>();

  confirmModal: { open: boolean; config: ConfirmModalConfig; action?: () => void; loading: boolean } = {
    open: false,
    config: { title: '', description: '' },
    loading: false,
  };

  readonly statusOptions: { value: AdminUserStatus | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'locked', label: 'Locked' },
    { value: 'deleted', label: 'Deleted' },
  ];

  readonly roleOptions: { value: AdminRole | ''; label: string }[] = [
    { value: '', label: 'All Roles' },
    { value: 'USER', label: 'User' },
    { value: 'SUPPORT', label: 'Support' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
  ];

  readonly verificationOptions: { value: VerificationStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'unverified', label: 'Unverified' },
    { value: 'pending', label: 'Pending' },
  ];

  get totalUsers(): number { return this.userService.totalUsers(); }
  get activeUsers(): number { return this.userService.activeUsers(); }
  get lockedUsers(): number { return this.userService.lockedUsers(); }
  get unverifiedUsers(): number { return this.userService.unverifiedUsers(); }

  get allSelected(): boolean {
    return this.result.data.length > 0 && this.result.data.every((u) => this.selectedIds.has(u.id));
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadUsers();
      this.loading = false;
    }, 400);
  }

  loadUsers(): void {
    this.result = this.userService.getUsers(this.filter, this.currentPage, this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters(): void {
    this.filter = { search: '', status: '', verification: '', role: '', dateFrom: '', dateTo: '' };
    this.onFilterChange();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.result.data.forEach((u) => this.selectedIds.delete(u.id));
    } else {
      this.result.data.forEach((u) => this.selectedIds.add(u.id));
    }
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  viewDetail(id: string): void {
    void this.router.navigateByUrl(`/admin/users/${id}`);
  }

  openLockModal(user: AdminUser): void {
    this.confirmModal = {
      open: true,
      loading: false,
      config: {
        title: 'Lock Account',
        description: 'The user will be unable to log in. All active sessions will be terminated immediately.',
        targetName: `${user.displayName} (${user.email})`,
        confirmLabel: 'Lock Account',
        isDangerous: true,
        requireReason: true,
        requireCheckbox: true,
      },
      action: (reason?: string) => {
        this.userService.lockUser(user.id, reason ?? '');
        this.loadUsers();
        this.toast.success(`Account locked: ${user.displayName}`);
      },
    };
  }

  openUnlockModal(user: AdminUser): void {
    this.confirmModal = {
      open: true,
      loading: false,
      config: {
        title: 'Unlock Account',
        description: 'The user will regain access to their account.',
        targetName: `${user.displayName} (${user.email})`,
        confirmLabel: 'Unlock Account',
        requireReason: true,
      },
      action: (reason?: string) => {
        this.userService.unlockUser(user.id, reason ?? '');
        this.loadUsers();
        this.toast.success(`Account unlocked: ${user.displayName}`);
      },
    };
  }

  openDeleteModal(user: AdminUser): void {
    this.confirmModal = {
      open: true,
      loading: false,
      config: {
        title: 'Delete Account',
        description: 'This action marks the account as deleted. The user data is retained for audit purposes.',
        targetName: `${user.displayName} (${user.email})`,
        confirmLabel: 'Delete Account',
        isDangerous: true,
        requireReason: true,
        requireCheckbox: true,
        checkboxLabel: 'I understand this action will remove the user\'s access permanently.',
      },
      action: (reason?: string) => {
        this.userService.deleteUser(user.id, reason ?? '');
        this.loadUsers();
        this.toast.success(`Account deleted: ${user.displayName}`);
      },
    };
  }

  onModalConfirm(event: { reason: string }): void {
    this.confirmModal.loading = true;
    setTimeout(() => {
      if (this.confirmModal.action) {
        (this.confirmModal.action as (reason?: string) => void)(event.reason);
      }
      this.confirmModal = { ...this.confirmModal, open: false, loading: false };
    }, 600);
  }

  onModalCancel(): void {
    this.confirmModal = { ...this.confirmModal, open: false };
  }

  getStatusVariant(status: AdminUserStatus): BadgeVariant {
    return status;
  }

  getRoleVariant(role: AdminRole): BadgeVariant {
    return role.toLowerCase() as BadgeVariant;
  }

  getVerificationVariant(v: VerificationStatus): BadgeVariant {
    return v;
  }

  getInitials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  trackById(_: number, item: AdminUser): string {
    return item.id;
  }
}
