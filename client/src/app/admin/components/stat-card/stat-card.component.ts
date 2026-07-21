import { Component, Input } from '@angular/core';
import { KpiCard } from '../../models/admin.models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [],
  template: `
    <div class="stat-card">
      <div class="stat-card__header">
        <div class="stat-card__icon">
          <span class="material-symbols-outlined">{{ card.icon }}</span>
        </div>
        <span class="stat-card__change" [class.stat-card__change--up]="card.changeDirection === 'up'" [class.stat-card__change--down]="card.changeDirection === 'down'">
          <span class="material-symbols-outlined">
            {{ card.changeDirection === 'up' ? 'trending_up' : card.changeDirection === 'down' ? 'trending_down' : 'trending_flat' }}
          </span>
          {{ card.changePercent > 0 ? '+' : '' }}{{ card.changePercent.toFixed(1) }}%
        </span>
      </div>
      <div class="stat-card__value">{{ card.value }}</div>
      <div class="stat-card__label">{{ card.label }}</div>
      <div class="stat-card__sparkline" aria-hidden="true">
        <svg [attr.viewBox]="sparklineViewBox" preserveAspectRatio="none">
          <polyline [attr.points]="sparklinePoints" />
        </svg>
      </div>
    </div>
  `,
  styleUrl: './stat-card.component.css',
})
export class StatCardComponent {
  @Input({ required: true }) card!: KpiCard;

  get sparklinePoints(): string {
    const data = this.card.trendData;
    if (!data?.length) return '';
    const w = 100;
    const h = 32;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(' ');
  }

  get sparklineViewBox(): string {
    return '0 0 100 32';
  }
}
