import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { RecentAdminActivity, RecentError, SystemHealthItem, KpiCard } from '../../models/admin.models';
import { BadgeVariant } from '../../components/status-badge/status-badge.component';
import { LanguageService } from '../../../core/services/language-service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [StatCardComponent, StatusBadgeComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(AdminDashboardService);
  protected readonly language = inject(LanguageService);
  private subs: Subscription[] = [];

  loading = true;
  kpis: KpiCard[] = [];
  systemHealth: SystemHealthItem[] = [];
  recentActivity: RecentAdminActivity[] = [];
  recentErrors: RecentError[] = [];
  avgResponseTime = 0;

  dateFilter: 'today' | '7d' | '30d' | 'custom' = '30d';

  get filterOptions(): Array<{ id: 'today' | '7d' | '30d' | 'custom'; label: string }> {
    return [
      { id: 'today', label: this.language.t('admin.overview.today') },
      { id: '7d', label: this.language.t('admin.overview.sevenDays') },
      { id: '30d', label: this.language.t('admin.overview.thirtyDays') },
    ];
  }

  readonly scanPerformance = {
    successful: 93.8,
    lowConfidence: 4.1,
    failed: 2.1,
    avgProcessingTime: '2.4s',
    avgConfidence: 91.2,
  };

  get activityGroups() {
    return this.recentActivity;
  }

  ngOnInit(): void {
    const sub = this.dashboardService.getDashboardStats().subscribe((data) => {
      this.kpis = data.kpis;
      this.systemHealth = data.health;
      this.recentActivity = this.dashboardService.recentActivity();
      this.recentErrors = this.dashboardService.recentErrors();
      this.avgResponseTime = this.dashboardService.avgResponseTime();
      this.loading = false;
    });
    this.subs.push(sub);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  setDateFilter(filter: 'today' | '7d' | '30d' | 'custom'): void {
    this.dateFilter = filter;
  }

  refresh(): void {
    this.loading = true;
    const sub = this.dashboardService.getDashboardStats().subscribe((data) => {
      this.kpis = data.kpis;
      this.systemHealth = data.health;
      this.loading = false;
    });
    this.subs.push(sub);
  }

  getTranslatedCard(card: KpiCard): KpiCard {
    const keyMap: Record<string, string> = {
      'total-users': 'admin.overview.kpi.totalUsers',
      'active-users': 'admin.overview.kpi.activeUsers',
      'new-users': 'admin.overview.kpi.newUsers',
      'ai-requests': 'admin.overview.kpi.aiRequests',
      'total-scans': 'admin.overview.kpi.totalScans',
      'scan-success': 'admin.overview.kpi.scanSuccessRate',
    };
    const key = keyMap[card.id];
    return {
      ...card,
      label: key ? this.language.t(key) : card.label,
    };
  }

  getHealthBadgeVariant(status: string): BadgeVariant {
    if (status === 'operational') return 'operational';
    if (status === 'degraded') return 'degraded';
    return 'outage';
  }

  getHealthBadgeLabel(status: string): string {
    if (status === 'operational') return this.language.t('admin.overview.systemHealth.operational');
    if (status === 'degraded') return this.language.t('admin.overview.systemHealth.degraded');
    return this.language.t('admin.overview.systemHealth.outage');
  }

  getSeverityVariant(severity: string): BadgeVariant {
    return severity as BadgeVariant;
  }

  getSeverityLabel(severity: string): string {
    if (severity === 'critical') return this.language.t('admin.overview.recentErrors.critical');
    if (severity === 'high') return this.language.t('admin.overview.recentErrors.high');
    if (severity === 'medium') return this.language.t('admin.overview.recentErrors.medium');
    if (severity === 'low') return this.language.t('admin.overview.recentErrors.low');
    return severity;
  }

  getActivityStatusVariant(status: string): BadgeVariant {
    if (status === 'success') return 'success';
    if (status === 'failed') return 'failed';
    return 'pending';
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(this.language.locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
