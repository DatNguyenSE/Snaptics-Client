import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, Observable, catchError, map } from 'rxjs';
import { AuditLog, AdminRole, RiskLevel } from '../models/admin.models';
import { AccountService } from '../../core/services/account-service';
import { environment } from '../../environments/environment';

let _logIdCounter = 1;

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly accountService = inject(AccountService);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/audit-logs`;
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
      ipAddress: 'Client IP',
      device: 'Admin Console / Browser',
      requestId: `req_${Date.now()}`,
      status: params.status ?? 'success',
      riskLevel: params.riskLevel,
      beforeValue: params.beforeValue,
      afterValue: params.afterValue,
    };

    this._logs.update((logs) => [newLog, ...logs]);

    // Send HTTP POST log to backend asynchronously
    this.http.post<any>(this.baseUrl, newLog, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  fetchLogsFromApi(filter?: {
    search?: string;
    role?: AdminRole | '';
    action?: string;
    status?: 'success' | 'failed' | '';
    riskLevel?: RiskLevel | '';
    dateFrom?: string;
    dateTo?: string;
  }, page = 1, pageSize = 15): Observable<any> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.role) params = params.set('role', filter.role);
    if (filter?.action) params = params.set('action', filter.action);
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.riskLevel) params = params.set('riskLevel', filter.riskLevel);

    return this.http.get<any>(this.baseUrl, { params, withCredentials: true }).pipe(
      map((res) => {
        const items: AuditLog[] = res?.data || res?.items || res || [];
        if (Array.isArray(items) && items.length > 0) {
          this._logs.set(items);
        }
        return this.getLogs(filter, page, pageSize);
      }),
      catchError(() => of(this.getLogs(filter, page, pageSize)))
    );
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
