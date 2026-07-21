import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [],
  template: `
    <div class="skeleton-wrap">
      @for (row of rows; track $index) {
        <div class="skeleton-row">
          @if (showAvatar) {
            <div class="skeleton skeleton--avatar"></div>
          }
          <div class="skeleton-lines">
            <div class="skeleton skeleton--line skeleton--line-main"></div>
            <div class="skeleton skeleton--line skeleton--line-sub"></div>
          </div>
          @if (showAction) {
            <div class="skeleton skeleton--action"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .skeleton-wrap { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
    .skeleton-row { display: flex; align-items: center; gap: 12px; }
    .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .skeleton {
      background: linear-gradient(90deg, var(--ac-surface-2) 25%, var(--ac-border) 50%, var(--ac-surface-2) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 6px;
    }
    .skeleton--avatar { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; }
    .skeleton--line-main { height: 13px; width: 60%; }
    .skeleton--line-sub { height: 11px; width: 40%; opacity: 0.6; }
    .skeleton--action { width: 80px; height: 30px; border-radius: 8px; flex-shrink: 0; }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
  `],
})
export class LoadingSkeletonComponent {
  @Input() count = 5;
  @Input() showAvatar = true;
  @Input() showAction = false;

  get rows(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
