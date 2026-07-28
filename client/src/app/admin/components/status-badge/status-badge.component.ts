import { Component, Input } from '@angular/core';
import { AdminUserStatus, VerificationStatus, AiRequestStatus, NotificationStatus, RiskLevel } from '../../models/admin.models';

export type BadgeVariant =
  | AdminUserStatus
  | VerificationStatus
  | AiRequestStatus
  | NotificationStatus
  | RiskLevel
  | 'operational'
  | 'degraded'
  | 'outage'
  | 'success'
  | 'failed'
  | 'pending'
  | 'processing'
  | 'awaiting_user'
  | 'resolved'
  | 'closed'
  | 'normal'
  | 'urgent'
  | 'admin'
  | 'user';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  template: `
    <span class="badge badge--{{ variant }}" [attr.aria-label]="label">
      <span class="badge__dot"></span>
      <span class="badge__text">{{ label }}</span>
    </span>
  `,
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  @Input({ required: true }) variant!: BadgeVariant;
  @Input({ required: true }) label!: string;
}
