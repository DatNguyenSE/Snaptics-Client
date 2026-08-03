import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, catchError, tap, finalize } from 'rxjs';
import {
  AdminDashboardStats,
  RecentAdminActivity,
  RecentError,
  SystemHealthItem,
  KpiCard,
} from '../models/admin.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/dashboard`;

  private readonly _kpis = signal<KpiCard[]>([]);
  private readonly _health = signal<SystemHealthItem[]>([]);
  private readonly _activity = signal<RecentAdminActivity[]>([]);
  private readonly _errors = signal<RecentError[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly kpis = this._kpis.asReadonly();
  readonly systemHealth = this._health.asReadonly();
  readonly recentActivity = this._activity.asReadonly();
  readonly recentErrors = this._errors.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly avgResponseTime = computed(() => {
    const list = this._health().filter((s) => s.responseTime !== undefined);
    if (list.length === 0) return 0;
    return Math.round(list.reduce((sum, s) => sum + (s.responseTime ?? 0), 0) / list.length);
  });

  getDashboardStats(): Observable<any> {
    this._loading.set(true);
    return this.http.get<any>(`${this.baseUrl}/stats`, { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.kpis) this._kpis.set(res.kpis);
        if (res?.health) this._health.set(res.health);
        if (res?.activity) this._activity.set(res.activity);
        if (res?.errors) this._errors.set(res.errors);
      }),
      catchError(() => of({ kpis: this._kpis(), health: this._health() })),
      finalize(() => this._loading.set(false))
    );
  }

  getUserGrowthData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/user-growth`, { withCredentials: true }).pipe(
      catchError(() => of({ labels: [], newUsers: [], activeUsers: [] }))
    );
  }

  getAiUsageData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ai-usage`, { withCredentials: true }).pipe(
      catchError(() => of({ labels: [], aiChat: [], receiptScan: [], productScan: [] }))
    );
  }

  refresh(): void {
    this.getDashboardStats().subscribe();
  }
}
