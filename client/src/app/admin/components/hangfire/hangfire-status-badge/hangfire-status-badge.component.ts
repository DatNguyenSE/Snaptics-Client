import { Component, Input } from '@angular/core';
import { HangfireJobStatus } from '../../../models/hangfire.models';

interface StatusConfig {
  label: string;
  icon: string;
  cssClass: string;
}

@Component({
  selector: 'app-hangfire-status-badge',
  standalone: true,
  imports: [],
  template: `
    <span class="hf-badge hf-badge--{{ cssClass }}" [attr.aria-label]="config.label">
      <span class="material-symbols-outlined hf-badge__icon">{{ config.icon }}</span>
      <span class="hf-badge__text">{{ config.label }}</span>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }

    .hf-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .hf-badge__icon {
      font-size: 14px;
      line-height: 1;
    }

    /* Success */
    .hf-badge--success {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }
    :host-context(html.dark-theme) .hf-badge--success {
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
    }

    /* Failed */
    .hf-badge--failed {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }
    :host-context(html.dark-theme) .hf-badge--failed {
      background: rgba(248, 113, 113, 0.15);
      color: #f87171;
    }

    /* Running */
    .hf-badge--running {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }
    :host-context(html.dark-theme) .hf-badge--running {
      background: rgba(129, 140, 248, 0.15);
      color: #818cf8;
    }

    /* Pending */
    .hf-badge--pending {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }
    :host-context(html.dark-theme) .hf-badge--pending {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
    }
  `],
})
export class HangfireStatusBadgeComponent {
  @Input({ required: true }) status!: HangfireJobStatus;

  private readonly statusMap: Record<HangfireJobStatus, StatusConfig> = {
    Success: { label: 'Thành công', icon: 'check_circle', cssClass: 'success' },
    Failed: { label: 'Thất bại', icon: 'error', cssClass: 'failed' },
    Running: { label: 'Đang chạy', icon: 'refresh', cssClass: 'running' },
    Pending: { label: 'Chờ chạy', icon: 'schedule', cssClass: 'pending' },
  };

  get config(): StatusConfig {
    return this.statusMap[this.status] ?? { label: this.status, icon: 'help', cssClass: 'pending' };
  }

  get cssClass(): string {
    return this.config.cssClass;
  }
}
