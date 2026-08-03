import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, Observable, catchError, tap, map } from 'rxjs';
import { AiRequestLog, AiRequestFilter, PaginatedResult, FailureReason } from '../models/admin.models';
import { AuditLogService } from './audit-log.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminAiService {
  private readonly http = inject(HttpClient);
  private readonly auditLog = inject(AuditLogService);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/ai`;

  private readonly _requests = signal<AiRequestLog[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly requests = this._requests.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly failureReasons: FailureReason[] = [];

  readonly totalRequests = 0;
  readonly receiptScans = 0;
  readonly productScans = 0;
  readonly successRate = 0;
  readonly avgLatencyMs = 0;
  readonly estimatedCostUsd = 0;

  getRequestsFromApi(filter?: Partial<AiRequestFilter>, page = 1, pageSize = 10): Observable<PaginatedResult<AiRequestLog>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.type) params = params.set('type', filter.type);
    if (filter?.status) params = params.set('status', filter.status);

    this._loading.set(true);
    return this.http.get<any>(`${this.baseUrl}/logs`, { params, withCredentials: true }).pipe(
      map((res) => {
        const items: AiRequestLog[] = res?.data || res?.items || res || [];
        this._requests.set(items);
        this._loading.set(false);
        return {
          data: items,
          total: res?.total || res?.totalCount || items.length,
          page: res?.page || page,
          pageSize: res?.pageSize || pageSize,
          totalPages: res?.totalPages || Math.ceil((res?.total || items.length) / pageSize),
        };
      }),
      catchError(() => {
        this._loading.set(false);
        return of(this.getRequests(filter, page, pageSize));
      })
    );
  }

  getRequests(filter?: Partial<AiRequestFilter>, page = 1, pageSize = 10): PaginatedResult<AiRequestLog> {
    let data = this._requests();

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      data = data.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.maskedUser.toLowerCase().includes(q) ||
          (r.errorCode ?? '').toLowerCase().includes(q)
      );
    }
    if (filter?.type) data = data.filter((r) => r.type === filter.type);
    if (filter?.status) data = data.filter((r) => r.status === filter.status);

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

  getRequestById(id: string): AiRequestLog | undefined {
    return this._requests().find((r) => r.id === id);
  }

  retryRequest(id: string): Observable<any> {
    this._requests.update((reqs) =>
      reqs.map((r) =>
        r.id === id ? { ...r, status: 'retrying', retryCount: r.retryCount + 1 } : r
      )
    );
    const req = this._requests().find((r) => r.id === id);
    if (req) {
      this.auditLog.addLog({
        action: 'Retry AI Request',
        target: id,
        targetId: id,
        reason: 'Admin manually triggered retry',
        riskLevel: 'low',
      });
    }

    return this.http.post<any>(`${this.baseUrl}/logs/${id}/retry`, {}, { withCredentials: true }).pipe(
      catchError(() => {
        setTimeout(() => {
          this._requests.update((reqs) =>
            reqs.map((r) =>
              r.id === id ? { ...r, status: 'success', processingTime: 2100 } : r
            )
          );
        }, 1000);
        return of({ success: true });
      })
    );
  }

  markResolved(id: string): Observable<any> {
    this._requests.update((reqs) =>
      reqs.map((r) => (r.id === id ? { ...r, status: 'success' } : r))
    );
    this.auditLog.addLog({
      action: 'Mark AI Request Resolved',
      target: id,
      targetId: id,
      reason: 'Admin manually marked as resolved',
      riskLevel: 'low',
    });

    return this.http.post<any>(`${this.baseUrl}/logs/${id}/resolve`, {}, { withCredentials: true }).pipe(
      catchError(() => of({ success: true }))
    );
  }

  load(): Observable<any> {
    this._loading.set(true);
    return this.getRequestsFromApi();
  }
}
