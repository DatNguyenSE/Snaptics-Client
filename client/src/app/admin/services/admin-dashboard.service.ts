import { Injectable, signal, computed } from '@angular/core';
import { of, delay } from 'rxjs';
import {
  AdminDashboardStats,
  RecentAdminActivity,
  RecentError,
  SystemHealthItem,
  KpiCard,
} from '../models/admin.models';
import {
  MOCK_KPI_CARDS,
  MOCK_SYSTEM_HEALTH,
  MOCK_RECENT_ACTIVITY,
  MOCK_RECENT_ERRORS,
  MOCK_USER_GROWTH_DATA,
  MOCK_AI_USAGE_DATA,
} from '../data/admin-mock-data';

// TODO: Replace mock implementation with Admin API.
// GET /api/admin/dashboard/overview

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly _kpis = signal<KpiCard[]>(MOCK_KPI_CARDS);
  private readonly _health = signal<SystemHealthItem[]>(MOCK_SYSTEM_HEALTH);
  private readonly _activity = signal<RecentAdminActivity[]>(MOCK_RECENT_ACTIVITY);
  private readonly _errors = signal<RecentError[]>(MOCK_RECENT_ERRORS);
  private readonly _loading = signal<boolean>(false);

  readonly kpis = this._kpis.asReadonly();
  readonly systemHealth = this._health.asReadonly();
  readonly recentActivity = this._activity.asReadonly();
  readonly recentErrors = this._errors.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly avgResponseTime = computed(() =>
    Math.round(
      this._health().reduce((sum, s) => sum + (s.responseTime ?? 0), 0) /
        this._health().filter((s) => s.responseTime !== undefined).length
    )
  );

  getDashboardStats() {
    this._loading.set(true);
    return of({ kpis: MOCK_KPI_CARDS, health: MOCK_SYSTEM_HEALTH }).pipe(delay(300));
  }

  getUserGrowthData() {
    return of(MOCK_USER_GROWTH_DATA).pipe(delay(200));
  }

  getAiUsageData() {
    return of(MOCK_AI_USAGE_DATA).pipe(delay(200));
  }

  refresh() {
    this._loading.set(true);
    setTimeout(() => this._loading.set(false), 800);
  }
}
