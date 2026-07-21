import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon">
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__desc">{{ description }}</p>
      <ng-content />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      gap: 8px;
    }
    .empty-state__icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: var(--ac-surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .empty-state__icon .material-symbols-outlined {
      font-size: 28px;
      color: var(--ac-foreground-muted);
    }
    .empty-state__title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--ac-foreground);
      margin: 0;
    }
    .empty-state__desc {
      font-size: 0.8125rem;
      color: var(--ac-foreground-muted);
      margin: 0;
      max-width: 300px;
    }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No data found';
  @Input() description = 'There is nothing to display here.';
}
