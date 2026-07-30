import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdminHangfireService } from '../../services/admin-hangfire.service';
import { HangfireJob, HangfireSummary, UpdateHangfireScheduleRequest } from '../../models/hangfire.models';
import { HangfireJobCardComponent } from '../../components/hangfire/hangfire-job-card/hangfire-job-card.component';
import { HangfireSummaryComponent } from '../../components/hangfire/hangfire-summary/hangfire-summary.component';
import { HangfireScheduleModalComponent } from '../../components/hangfire/hangfire-schedule-modal/hangfire-schedule-modal.component';
import { ConfirmationModalComponent, ConfirmModalConfig } from '../../components/confirmation-modal/confirmation-modal.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '../../../core/services/toast-service';

type PageState = 'loading' | 'loaded' | 'error' | 'empty';

interface TriggerConfirmState {
  job: HangfireJob;
  config: ConfirmModalConfig;
  loading: boolean;
}

interface ToggleConfirmState {
  job: HangfireJob;
  config: ConfirmModalConfig;
  loading: boolean;
}

@Component({
  selector: 'app-admin-hangfire-jobs',
  standalone: true,
  imports: [
    HangfireJobCardComponent,
    HangfireSummaryComponent,
    HangfireScheduleModalComponent,
    ConfirmationModalComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './admin-hangfire-jobs.component.html',
  styleUrl: './admin-hangfire-jobs.component.css',
})
export class AdminHangfireJobsComponent implements OnInit, OnDestroy {
  private readonly hangfireService = inject(AdminHangfireService);
  private readonly toast = inject(ToastService);
  private subs: Subscription[] = [];

  // ─── Page state ─────────────────────────────────────────────────────────────
  pageState: PageState = 'loading';
  jobs: HangfireJob[] = [];
  errorMessage = '';

  // ─── Per-job loading maps ────────────────────────────────────────────────────
  triggerLoadingMap: Record<string, boolean> = {};
  statusLoadingMap: Record<string, boolean> = {};

  // ─── Confirm modals ──────────────────────────────────────────────────────────
  triggerConfirm: TriggerConfirmState | null = null;
  toggleConfirm: ToggleConfirmState | null = null;

  // ─── Schedule modal ──────────────────────────────────────────────────────────
  scheduleJob: HangfireJob | null = null;
  scheduleSaving = false;

  // ─── Computed summary ────────────────────────────────────────────────────────
  get summary(): HangfireSummary {
    const active = this.jobs.filter((j) => j.isEnabled).length;
    const inactive = this.jobs.filter((j) => !j.isEnabled).length;
    const recentlyFailed = this.jobs.filter((j) => j.lastRunStatus === 'Failed').length;
    return {
      total: this.jobs.length,
      active,
      inactive,
      recentlyFailed,
    };
  }

  // ─── Skeleton rows ───────────────────────────────────────────────────────────
  readonly skeletonRows = [1, 2, 3];

  ngOnInit(): void {
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  // ─── Load jobs ───────────────────────────────────────────────────────────────
  loadJobs(): void {
    this.pageState = 'loading';
    this.errorMessage = '';
    const sub = this.hangfireService.getHangfireJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.pageState = jobs.length === 0 ? 'empty' : 'loaded';
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách Hangfire Jobs.';
        this.errorMessage = msg;
        this.pageState = 'error';
      },
    });
    this.subs.push(sub);
  }

  // ─── Trigger job ─────────────────────────────────────────────────────────────
  onTriggerJob(job: HangfireJob): void {
    this.triggerConfirm = {
      job,
      config: {
        title: 'Xác nhận chạy ngay',
        description: `Bạn có chắc chắn muốn kích hoạt job này ngay lập tức không?`,
        targetName: job.jobName,
        confirmLabel: 'Chạy ngay',
        cancelLabel: 'Hủy',
        isDangerous: false,
      },
      loading: false,
    };
  }

  onTriggerConfirmed(): void {
    if (!this.triggerConfirm) return;
    const { job } = this.triggerConfirm;
    this.triggerConfirm.loading = true;
    this.triggerLoadingMap = { ...this.triggerLoadingMap, [job.jobKey]: true };

    const sub = this.hangfireService.triggerHangfireJob(job.jobKey).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? `Job "${job.jobName}" đã được kích hoạt.`);
        this.triggerConfirm = null;
        this.triggerLoadingMap = { ...this.triggerLoadingMap, [job.jobKey]: false };
        this.loadJobs();
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : `Không thể kích hoạt job "${job.jobName}".`;
        this.toast.error(msg);
        this.triggerConfirm = null;
        this.triggerLoadingMap = { ...this.triggerLoadingMap, [job.jobKey]: false };
      },
    });
    this.subs.push(sub);
  }

  onTriggerCancelled(): void {
    this.triggerConfirm = null;
  }

  // ─── Toggle job status ───────────────────────────────────────────────────────
  onToggleStatus(job: HangfireJob): void {
    const nextEnabled = !job.isEnabled;
    this.toggleConfirm = {
      job,
      config: {
        title: nextEnabled ? 'Bật lịch chạy' : 'Tắt lịch chạy',
        description: nextEnabled
          ? `Job sẽ được kích hoạt và chạy tự động theo lịch đã cài.`
          : `Job sẽ bị dừng và không chạy tự động cho đến khi được bật lại.`,
        targetName: job.jobName,
        confirmLabel: nextEnabled ? 'Bật lịch' : 'Tắt lịch',
        cancelLabel: 'Hủy',
        isDangerous: !nextEnabled,
      },
      loading: false,
    };
  }

  onToggleConfirmed(): void {
    if (!this.toggleConfirm) return;
    const { job } = this.toggleConfirm;
    const nextEnabled = !job.isEnabled;
    this.toggleConfirm.loading = true;
    this.statusLoadingMap = { ...this.statusLoadingMap, [job.jobKey]: true };

    const sub = this.hangfireService.updateHangfireJobStatus(job.jobKey, nextEnabled).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? `Trạng thái job "${job.jobName}" đã được cập nhật.`);
        this.toggleConfirm = null;
        this.statusLoadingMap = { ...this.statusLoadingMap, [job.jobKey]: false };
        this.loadJobs();
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : `Không thể cập nhật trạng thái job "${job.jobName}".`;
        this.toast.error(msg);
        this.toggleConfirm = null;
        this.statusLoadingMap = { ...this.statusLoadingMap, [job.jobKey]: false };
      },
    });
    this.subs.push(sub);
  }

  onToggleCancelled(): void {
    this.toggleConfirm = null;
  }

  // ─── Schedule modal ──────────────────────────────────────────────────────────
  onOpenSchedule(job: HangfireJob): void {
    this.scheduleJob = job;
  }

  onSaveSchedule(payload: UpdateHangfireScheduleRequest): void {
    if (!this.scheduleJob) return;
    const { jobKey, jobName } = this.scheduleJob;
    this.scheduleSaving = true;

    const sub = this.hangfireService.updateHangfireSchedule(jobKey, payload).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? `Lịch chạy của "${jobName}" đã được cập nhật.`);
        this.scheduleJob = null;
        this.scheduleSaving = false;
        this.loadJobs();
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : `Không thể cập nhật lịch chạy cho "${jobName}".`;
        this.toast.error(msg);
        this.scheduleSaving = false;
      },
    });
    this.subs.push(sub);
  }

  onCancelSchedule(): void {
    this.scheduleJob = null;
  }

  // ─── Track by ────────────────────────────────────────────────────────────────
  trackByJobKey(_: number, job: HangfireJob): string {
    return job.jobKey;
  }

  // ─── Loading helpers ─────────────────────────────────────────────────────────
  isJobTriggerLoading(jobKey: string): boolean {
    return this.triggerLoadingMap[jobKey] === true;
  }

  isJobStatusLoading(jobKey: string): boolean {
    return this.statusLoadingMap[jobKey] === true;
  }
}
