import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, delay, map, finalize, catchError, Observable } from 'rxjs';
import { AdminUser, AdminUserStatus, AdminRole, PaginatedResult, UserFilter } from '../models/admin.models';
import { AuditLogService } from './audit-log.service';
import { environment } from '../../environments/environment';

interface AdminUsersApiResponse {
  stats: {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    unverifiedUsers: number;
  };
  users: {
    items: AdminUserApiDto[];
    totalCount: number;
    page: number;
    size: number;
  };
}

interface AdminUserApiDto {
  id: string;
  email?: string;
  displayName?: string;
  status?: string;
  isEmailConfirmed: boolean;
  isLockedOut: boolean;
  roles: string[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly auditLog = inject(AuditLogService);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/users`;
  private readonly _users = signal<AdminUser[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _stats = signal({ totalUsers: 0, activeUsers: 0, lockedUsers: 0, unverifiedUsers: 0 });

  readonly loading = this._loading.asReadonly();

  readonly totalUsers = computed(() => this._stats().totalUsers);
  readonly activeUsers = computed(() => this._stats().activeUsers);
  readonly lockedUsers = computed(() => this._stats().lockedUsers);
  readonly unverifiedUsers = computed(() => this._stats().unverifiedUsers);

  getUsersFromApi(filter: Partial<UserFilter> = {}, page = 1, pageSize = 10) {
    let params = new HttpParams().set('page', page).set('size', pageSize);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.verification) params = params.set('isEmailConfirmed', filter.verification === 'verified');
    if (filter.role) params = params.set('role', filter.role);

    this._loading.set(true);
    return this.http.get<AdminUsersApiResponse>(this.baseUrl, { params, withCredentials: true }).pipe(
      map((response) => {
        const data = response.users.items.map((user) => this.mapUser(user));
        this._users.set(data);
        this._stats.set(response.stats);
        return {
          data,
          total: response.users.totalCount,
          page: response.users.page,
          pageSize: response.users.size,
          totalPages: Math.ceil(response.users.totalCount / response.users.size),
        } satisfies PaginatedResult<AdminUser>;
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  private mapUser(user: AdminUserApiDto): AdminUser {
    const displayName = user.displayName?.trim() || user.email || user.id;
    const status: AdminUserStatus = user.isLockedOut
      ? 'locked'
      : user.status?.toLowerCase() === 'deleted'
        ? 'deleted'
        : 'active';
    const role = (user.roles[0]?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER') as AdminRole;

    return {
      id: user.id,
      displayName,
      email: user.email || '',
      role,
      status,
      verification: user.isEmailConfirmed ? 'verified' : 'unverified',
      totalTransactions: 0,
      totalBudgets: 0,
      totalScans: 0,
      aiRequests: 0,
      lastLogin: '',
      createdAt: user.createdAt,
      currency: '',
      language: '',
      timezone: '',
      failedLoginAttempts: 0,
      activeSessions: 0,
    };
  }

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

  loadUser(id: string): Observable<AdminUser | undefined> {
    this._loading.set(true);
    return this.http.get<AdminUserApiDto>(`${this.baseUrl}/${id}`, { withCredentials: true }).pipe(
      map((res) => {
        const mapped = this.mapUser(res);
        this._loading.set(false);
        return mapped;
      }),
      catchError(() => {
        this._loading.set(false);
        return of(this.getUserById(id));
      })
    );
  }
}
