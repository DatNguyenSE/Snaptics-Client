import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { RecentAdminActivity, RecentError, SystemHealthItem, KpiCard } from '../../models/admin.models';
import { MOCK_USER_GROWTH_DATA, MOCK_AI_USAGE_DATA } from '../../data/admin-mock-data';
import { BadgeVariant } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [StatCardComponent, StatusBadgeComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(AdminDashboardService);
  private subs: Subscription[] = [];

  loading = true;
  kpis: KpiCard[] = [];
  systemHealth: SystemHealthItem[] = [];
  recentActivity: RecentAdminActivity[] = [];
  recentErrors: RecentError[] = [];
  avgResponseTime = 0;

  dateFilter: 'today' | '7d' | '30d' | 'custom' = '30d';

  readonly filterOptions: Array<{ id: 'today' | '7d' | '30d' | 'custom'; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
  ];

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

  getHealthBadgeVariant(status: string): BadgeVariant {
    if (status === 'operational') return 'operational';
    if (status === 'degraded') return 'degraded';
    return 'outage';
  }

  getHealthBadgeLabel(status: string): string {
    if (status === 'operational') return 'Operational';
    if (status === 'degraded') return 'Degraded';
    return 'Outage';
  }

  getSeverityVariant(severity: string): BadgeVariant {
    return severity as BadgeVariant;
  }

  getSeverityLabel(severity: string): string {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  }

  getActivityStatusVariant(status: string): BadgeVariant {
    if (status === 'success') return 'success';
    if (status === 'failed') return 'failed';
    return 'pending';
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
