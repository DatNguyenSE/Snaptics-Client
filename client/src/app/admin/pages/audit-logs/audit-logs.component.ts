import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLog, AdminRole, RiskLevel } from '../../models/admin.models';
import { StatusBadgeComponent, BadgeVariant } from '../../components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { AdminDrawerComponent } from '../../components/admin-drawer/admin-drawer.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { LanguageService } from '../../../core/services/language-service';

interface LogPage {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [FormsModule, JsonPipe, StatusBadgeComponent, EmptyStateComponent, LoadingSkeletonComponent, AdminDrawerComponent, PaginationComponent],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css',
})
export class AuditLogsComponent implements OnInit {
  private readonly auditService = inject(AuditLogService);
  protected readonly language = inject(LanguageService);

  loading = true;
  result: LogPage = { data: [], total: 0, page: 1, pageSize: 15, totalPages: 0 };
  selectedLog: AuditLog | null = null;
  drawerOpen = false;
  currentPage = 1;
  pageSize = 15;

  filter = {
    search: '',
    role: '' as AdminRole | '',
    action: '',
    status: '' as 'success' | 'failed' | '',
    riskLevel: '' as RiskLevel | '',
  };

  get roleOptions(): { value: AdminRole | ''; label: string }[] {
    return [
      { value: '', label: this.language.t('admin.auditLogs.allRoles') },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'USER', label: 'User' },
    ];
  }

  get riskOptions(): { value: RiskLevel | ''; label: string }[] {
    return [
      { value: '', label: this.language.t('admin.auditLogs.allRiskLevels') },
      { value: 'low', label: this.language.t('admin.overview.recentErrors.low') },
      { value: 'medium', label: this.language.t('admin.overview.recentErrors.medium') },
      { value: 'high', label: this.language.t('admin.overview.recentErrors.high') },
      { value: 'critical', label: this.language.t('admin.overview.recentErrors.critical') },
    ];
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadLogs();
      this.loading = false;
    }, 350);
  }

  loadLogs(): void {
    this.result = this.auditService.getLogs(this.filter, this.currentPage, this.pageSize);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLogs();
  }

  openDetail(log: AuditLog): void {
    this.selectedLog = log;
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.selectedLog = null;
  }

  getRiskVariant(risk: RiskLevel): BadgeVariant {
    return risk;
  }

  getStatusVariant(status: string): BadgeVariant {
    return status as BadgeVariant;
  }

  getRoleVariant(role: AdminRole): BadgeVariant {
    return role.toLowerCase() as BadgeVariant;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  trackById(_: number, item: AuditLog): string {
    return item.id;
  }
}
