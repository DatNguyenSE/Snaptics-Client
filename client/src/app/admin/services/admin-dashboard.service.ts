import { Injectable, signal, computed } from '@angular/core';
import { of, delay } from 'rxjs';
import {
  AdminDashboardStats,
  RecentAdminActivity,
  RecentError,
  SystemHealthItem,
  KpiCard,
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
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

  getDashboardStats() {
    this._loading.set(true);
    return of({ kpis: this._kpis(), health: this._health() }).pipe(delay(200));
  }

  getUserGrowthData() {
    return of({ labels: [], newUsers: [], activeUsers: [] }).pipe(delay(200));
  }

  getAiUsageData() {
    return of({ labels: [], aiChat: [], receiptScan: [], productScan: [] }).pipe(delay(200));
  }

  refresh() {
    this._loading.set(true);
    setTimeout(() => this._loading.set(false), 300);
  }
}
