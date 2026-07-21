import { Injectable, signal } from '@angular/core';
import { of, delay } from 'rxjs';
import { AiRequestLog, AiRequestFilter, PaginatedResult, FailureReason } from '../models/admin.models';
import { MOCK_AI_REQUESTS, MOCK_FAILURE_REASONS } from '../data/admin-mock-data';
import { AuditLogService } from './audit-log.service';
import { inject } from '@angular/core';

// TODO: Replace mock implementation with Admin API.
// GET  /api/admin/ai/requests
// POST /api/admin/ai/requests/:id/retry
// POST /api/admin/ai/requests/:id/resolve

@Injectable({ providedIn: 'root' })
export class AdminAiService {
  private readonly auditLog = inject(AuditLogService);
  private readonly _requests = signal<AiRequestLog[]>(structuredClone(MOCK_AI_REQUESTS));
  private readonly _loading = signal<boolean>(false);

  readonly requests = this._requests.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly failureReasons: FailureReason[] = MOCK_FAILURE_REASONS;

  readonly totalRequests = 38492;
  readonly receiptScans = 14284;
  readonly productScans = 7022;
  readonly successRate = 93.8;
  readonly avgLatencyMs = 2400;
  readonly estimatedCostUsd = 184.20;

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

  retryRequest(id: string): void {
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
    // Simulate async retry result
    setTimeout(() => {
      this._requests.update((reqs) =>
        reqs.map((r) =>
          r.id === id ? { ...r, status: 'success', processingTime: 2100 } : r
        )
      );
    }, 2000);
  }

  markResolved(id: string): void {
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
  }

  load() {
    this._loading.set(true);
    return of(null).pipe(delay(300));
  }
}
