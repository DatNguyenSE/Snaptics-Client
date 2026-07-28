import { Injectable, signal } from '@angular/core';
import { of, delay } from 'rxjs';
import { AuditLog, AdminRole, RiskLevel } from '../models/admin.models';
import { AccountService } from '../../core/services/account-service';
import { inject } from '@angular/core';

let _logIdCounter = 1;

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly accountService = inject(AccountService);
  private readonly _logs = signal<AuditLog[]>([]);

  readonly logs = this._logs.asReadonly();

  addLog(params: {
    action: string;
    target: string;
    targetId?: string;
    reason: string;
    riskLevel: RiskLevel;
    beforeValue?: Record<string, unknown>;
    afterValue?: Record<string, unknown>;
    status?: 'success' | 'failed';
  }): void {
    const user = this.accountService.currentUser();
    const roles = user?.roles ?? [];
    const adminRole: AdminRole = roles.includes('ADMIN') ? 'ADMIN' : 'USER';

    const newLog: AuditLog = {
      id: `log_${String(_logIdCounter++).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      admin: user?.displayName ?? 'Unknown Admin',
      adminRole,
      action: params.action,
      target: params.target,
      targetId: params.targetId,
      reason: params.reason,
      ipAddress: '192.168.1.x',
      device: 'Admin Console / Browser',
      requestId: `req_${Date.now()}`,
      status: params.status ?? 'success',
      riskLevel: params.riskLevel,
      beforeValue: params.beforeValue,
      afterValue: params.afterValue,
    };

    this._logs.update((logs) => [newLog, ...logs]);
  }

  getLogs(filter?: {
    search?: string;
    role?: AdminRole | '';
    action?: string;
    status?: 'success' | 'failed' | '';
    riskLevel?: RiskLevel | '';
    dateFrom?: string;
    dateTo?: string;
  }, page = 1, pageSize = 15) {
    let data = this._logs();

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      data = data.filter(
        (l) =>
          l.admin.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q)
      );
    }
    if (filter?.role) data = data.filter((l) => l.adminRole === filter.role);
    if (filter?.action) data = data.filter((l) => l.action.toLowerCase().includes(filter.action!.toLowerCase()));
    if (filter?.status) data = data.filter((l) => l.status === filter.status);
    if (filter?.riskLevel) data = data.filter((l) => l.riskLevel === filter.riskLevel);

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

  getLogById(id: string): AuditLog | undefined {
    return this._logs().find((l) => l.id === id);
  }

  getLogsForUser(userId: string): AuditLog[] {
    return this._logs().filter((l) => l.targetId === userId);
  }
}
