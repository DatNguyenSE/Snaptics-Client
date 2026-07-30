import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HangfireJob, UpdateHangfireScheduleRequest } from '../../../models/hangfire.models';
import { convertTimeToCron } from '../../../utils/cron.util';

@Component({
  selector: 'app-hangfire-schedule-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './hangfire-schedule-modal.component.html',
  styleUrl: './hangfire-schedule-modal.component.css',
})
export class HangfireScheduleModalComponent implements OnChanges {
  @Input({ required: true }) job!: HangfireJob;
  @Input() saving = false;
  @Output() save = new EventEmitter<UpdateHangfireScheduleRequest>();
  @Output() cancel = new EventEmitter<void>();

  readonly defaultTimeZone = 'Asia/Ho_Chi_Minh';

  // Form state
  isEnabled = true;
  runTime = '08:00';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && this.job) {
      this.isEnabled = this.job.isEnabled;
      this.runTime = this.job.runTime ?? '08:00';
    }
  }

  get cronExpression(): string {
    return convertTimeToCron(this.runTime);
  }

  get previewText(): string {
    if (!this.isEnabled) {
      return 'Job sẽ không chạy tự động (đã tắt lịch).';
    }
    const [hourStr, minStr] = this.runTime.split(':');
    const hour = parseInt(hourStr, 10);
    const min = parseInt(minStr, 10);
    if (isNaN(hour) || isNaN(min)) return 'Vui lòng chọn thời gian hợp lệ.';
    const padded = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    return `Job sẽ chạy mỗi ngày lúc ${padded} (${this.defaultTimeZone}).`;
  }

  get isFormValid(): boolean {
    if (!this.runTime) return false;
    const [h, m] = this.runTime.split(':').map(Number);
    return !isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }

  onSave(): void {
    if (!this.isFormValid || this.saving) return;
    this.save.emit({
      isEnabled: this.isEnabled,
      runTime: this.runTime,
      cronExpression: this.cronExpression,
      timeZone: this.defaultTimeZone,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('hf-modal-backdrop')) {
      this.onCancel();
    }
  }
}
