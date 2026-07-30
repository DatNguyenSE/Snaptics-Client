import { Component, Input } from '@angular/core';
import { HangfireSummary } from '../../../models/hangfire.models';

@Component({
  selector: 'app-hangfire-summary',
  standalone: true,
  imports: [],
  templateUrl: './hangfire-summary.component.html',
  styleUrl: './hangfire-summary.component.css',
})
export class HangfireSummaryComponent {
  @Input({ required: true }) summary!: HangfireSummary;

  readonly stats: Array<{
    key: keyof HangfireSummary;
    label: string;
    icon: string;
    colorClass: string;
  }> = [
    { key: 'total', label: 'Tổng số job', icon: 'inventory_2', colorClass: 'primary' },
    { key: 'active', label: 'Đang bật', icon: 'play_circle', colorClass: 'success' },
    { key: 'inactive', label: 'Đang tắt', icon: 'pause_circle', colorClass: 'muted' },
    { key: 'recentlyFailed', label: 'Thất bại gần đây', icon: 'error', colorClass: 'danger' },
  ];
}
