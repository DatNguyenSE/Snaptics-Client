import { Injectable, signal, computed } from '@angular/core';
import { of, delay } from 'rxjs';
import { AdminUser, AdminUserStatus, AdminRole, PaginatedResult, UserFilter } from '../models/admin.models';
import { MOCK_ADMIN_USERS } from '../data/admin-mock-data';
import { AuditLogService } from './audit-log.service';
import { inject } from '@angular/core';

// TODO: Replace mock implementation with Admin API.
// GET    /api/admin/users
// GET    /api/admin/users/:id
// PATCH  /api/admin/users/:id/status
// PATCH  /api/admin/users/:id/role
// DELETE /api/admin/users/:id

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly auditLog = inject(AuditLogService);
  private readonly _users = signal<AdminUser[]>(structuredClone(MOCK_ADMIN_USERS));
  private readonly _loading = signal<boolean>(false);

  readonly loading = this._loading.asReadonly();

  readonly totalUsers = computed(() => this._users().length);
  readonly activeUsers = computed(() => this._users().filter((u) => u.status === 'active').length);
  readonly lockedUsers = computed(() => this._users().filter((u) => u.status === 'locked').length);
  readonly unverifiedUsers = computed(() =>
    this._users().filter((u) => u.verification !== 'verified').length
  );

  getUsers(filter?: Partial<UserFilter>, page = 1, pageSize = 10): PaginatedResult<AdminUser> {
    let data = this._users();

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      data = data.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }
    if (filter?.status) data = data.filter((u) => u.status === filter.status);
    if (filter?.role) data = data.filter((u) => u.role === filter.role);
    if (filter?.verification) data = data.filter((u) => u.verification === filter.verification);

    const total = data.length;
    const start = (page - 1) * pageSize;
    return {
      data: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  getUserById(id: string): AdminUser | undefined {
    return this._users().find((u) => u.id === id);
  }

  lockUser(id: string, reason: string): void {
    this._users.update((users) =>
      users.map((u) => (u.id === id ? { ...u, status: 'locked' as AdminUserStatus, activeSessions: 0 } : u))
    );
    const target = this._users().find((u) => u.id === id);
    if (target) {
      this.auditLog.addLog({
        action: 'Lock User',
        target: target.displayName,
        targetId: id,
        reason,
        riskLevel: 'high',
        beforeValue: { status: 'active' },
        afterValue: { status: 'locked' },
      });
    }
  }

  unlockUser(id: string, reason: string): void {
    this._users.update((users) =>
      users.map((u) => (u.id === id ? { ...u, status: 'active' as AdminUserStatus, failedLoginAttempts: 0 } : u))
    );
    const target = this._users().find((u) => u.id === id);
    if (target) {
      this.auditLog.addLog({
        action: 'Unlock User',
        target: target.displayName,
        targetId: id,
        reason,
        riskLevel: 'medium',
        beforeValue: { status: 'locked' },
        afterValue: { status: 'active' },
      });
    }
  }

  deleteUser(id: string, reason: string): void {
    this._users.update((users) =>
      users.map((u) => (u.id === id ? { ...u, status: 'deleted' as AdminUserStatus, activeSessions: 0 } : u))
    );
    const target = this._users().find((u) => u.id === id);
    if (target) {
      this.auditLog.addLog({
        action: 'Delete User',
        target: target.displayName,
        targetId: id,
        reason,
        riskLevel: 'critical',
      });
    }
  }

  changeRole(id: string, newRole: AdminRole, reason: string): void {
    const target = this._users().find((u) => u.id === id);
    if (!target) return;
    const oldRole = target.role;
    this._users.update((users) =>
      users.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
    this.auditLog.addLog({
      action: 'Change Role',
      target: target.displayName,
      targetId: id,
      reason,
      riskLevel: 'high',
      beforeValue: { role: oldRole },
      afterValue: { role: newRole },
    });
  }

  sendVerificationEmail(id: string): void {
    const target = this._users().find((u) => u.id === id);
    if (target) {
      this.auditLog.addLog({
        action: 'Send Verification Email',
        target: target.displayName,
        targetId: id,
        reason: 'Admin initiated verification email',
        riskLevel: 'low',
      });
    }
  }

  revokeSessions(id: string, reason: string): void {
    this._users.update((users) =>
      users.map((u) => (u.id === id ? { ...u, activeSessions: 0 } : u))
    );
    const target = this._users().find((u) => u.id === id);
    if (target) {
      this.auditLog.addLog({
        action: 'Revoke All Sessions',
        target: target.displayName,
        targetId: id,
        reason,
        riskLevel: 'high',
      });
    }
  }

  loadUser(id: string) {
    this._loading.set(true);
    return of(this.getUserById(id)).pipe(delay(300));
  }
}
