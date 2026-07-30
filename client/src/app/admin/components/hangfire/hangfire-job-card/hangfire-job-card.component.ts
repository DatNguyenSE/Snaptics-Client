import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HangfireJob } from '../../../models/hangfire.models';
import { HangfireStatusBadgeComponent } from '../hangfire-status-badge/hangfire-status-badge.component';

@Component({
  selector: 'app-hangfire-job-card',
  standalone: true,
  imports: [HangfireStatusBadgeComponent],
  templateUrl: './hangfire-job-card.component.html',
  styleUrl: './hangfire-job-card.component.css',
})
export class HangfireJobCardComponent {
  @Input({ required: true }) job!: HangfireJob;
  @Input() triggerLoading = false;
  @Input() statusLoading = false;

  @Output() triggerJob = new EventEmitter<HangfireJob>();
  @Output() openSchedule = new EventEmitter<HangfireJob>();
  @Output() toggleStatus = new EventEmitter<HangfireJob>();

  /** Format ISO date string to Vietnamese locale */
  formatDate(isoStr: string | undefined): string {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  onTrigger(): void {
    if (!this.triggerLoading) {
      this.triggerJob.emit(this.job);
    }
  }

  onOpenSchedule(): void {
    this.openSchedule.emit(this.job);
  }

  onToggle(): void {
    if (!this.statusLoading) {
      this.toggleStatus.emit(this.job);
    }
  }
}
