import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AdminAiService } from '../../services/admin-ai.service';
import { AiRequestLog, AiRequestFilter, PaginatedResult, AiRequestType, AiRequestStatus } from '../../models/admin.models';
import { StatusBadgeComponent, BadgeVariant } from '../../components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { AdminDrawerComponent } from '../../components/admin-drawer/admin-drawer.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-ai-operations',
  standalone: true,
  imports: [FormsModule, DecimalPipe, StatusBadgeComponent, EmptyStateComponent, LoadingSkeletonComponent, AdminDrawerComponent, PaginationComponent],
  templateUrl: './ai-operations.component.html',
  styleUrl: './ai-operations.component.css',
})
export class AiOperationsComponent implements OnInit {
  private readonly aiService = inject(AdminAiService);
  private readonly toast = inject(ToastService);

  loading = true;
  result: PaginatedResult<AiRequestLog> = { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  selectedRequest: AiRequestLog | null = null;
  drawerOpen = false;
  currentPage = 1;
  pageSize = 10;

  filter: Partial<AiRequestFilter> = { search: '', type: '', status: '' };

  readonly typeOptions: { value: AiRequestType | ''; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'ai_chat', label: 'AI Chat' },
    { value: 'receipt_scan', label: 'Receipt Scan' },
    { value: 'product_scan', label: 'Product Scan' },
  ];

  readonly statusOptions: { value: AiRequestStatus | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'low_confidence', label: 'Low Confidence' },
    { value: 'failed', label: 'Failed' },
    { value: 'retrying', label: 'Retrying' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  get totalRequests() { return this.aiService.totalRequests; }
  get receiptScans() { return this.aiService.receiptScans; }
  get productScans() { return this.aiService.productScans; }
  get successRate() { return this.aiService.successRate; }
  get avgLatencyMs() { return this.aiService.avgLatencyMs; }
  get estimatedCostUsd() { return this.aiService.estimatedCostUsd; }
  get failureReasons() { return this.aiService.failureReasons; }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadRequests();
      this.loading = false;
    }, 400);
  }

  loadRequests(): void {
    this.result = this.aiService.getRequests(this.filter, this.currentPage, this.pageSize);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadRequests();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRequests();
  }

  openDetail(req: AiRequestLog): void {
    this.selectedRequest = req;
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.selectedRequest = null;
  }

  retryRequest(req: AiRequestLog, event: Event): void {
    event.stopPropagation();
    this.aiService.retryRequest(req.id);
    this.loadRequests();
    this.toast.info(`Retrying request ${req.id}...`);
  }

  markResolved(req: AiRequestLog): void {
    this.aiService.markResolved(req.id);
    this.loadRequests();
    if (this.selectedRequest?.id === req.id) {
      this.selectedRequest = this.aiService.getRequestById(req.id) ?? null;
    }
    this.toast.success('Request marked as resolved.');
  }

  getStatusVariant(status: AiRequestStatus): BadgeVariant {
    return status;
  }

  getTypeLabel(type: AiRequestType): string {
    if (type === 'ai_chat') return 'AI Chat';
    if (type === 'receipt_scan') return 'Receipt Scan';
    return 'Product Scan';
  }

  getTypeIcon(type: AiRequestType): string {
    if (type === 'ai_chat') return 'smart_toy';
    if (type === 'receipt_scan') return 'receipt_long';
    return 'qr_code_scanner';
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatMs(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  }

  trackById(_: number, item: AiRequestLog): string {
    return item.id;
  }
}
