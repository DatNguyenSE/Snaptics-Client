import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-suggestion-card',
  standalone: true,
  template: `
    <button type="button" class="suggestion-card" (click)="selected.emit(title)">
      <div class="suggestion-card__content">
        <h4 class="suggestion-card__title">{{ title }}</h4>
        <p class="suggestion-card__desc">{{ description }}</p>
      </div>
      <span class="material-symbols-outlined suggestion-card__arrow">arrow_forward</span>
    </button>
  `,
  styles: [`
    .suggestion-card {
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      border-radius: 16px;
      padding: 18px;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.2s ease;
      width: 100%;
      box-shadow: 0 4px 12px rgba(91, 123, 250, 0.03);
    }
    .suggestion-card:hover {
      transform: translateY(-2px);
      border-color: var(--sw-primary);
      box-shadow: 0 8px 20px rgba(91, 123, 250, 0.08);
      background: var(--sw-primary-soft);
    }
    .suggestion-card:active {
      transform: scale(0.98);
    }
    .suggestion-card__content {
      flex: 1;
    }
    .suggestion-card__title {
      font-weight: 700;
      font-size: 0.9375rem;
      margin: 0 0 6px 0;
      color: var(--sw-foreground);
    }
    .suggestion-card__desc {
      font-size: 0.8125rem;
      margin: 0;
      color: var(--sw-muted-foreground);
      line-height: 1.4;
    }
    .suggestion-card__arrow {
      color: var(--sw-primary);
      font-size: 1.25rem;
      opacity: 0;
      transition: all 0.2s ease;
      transform: translateX(-5px);
    }
    .suggestion-card:hover .suggestion-card__arrow {
      opacity: 1;
      transform: translateX(0);
    }
  `]
})
export class SuggestionCard {
  @Input() title = '';
  @Input() description = '';
  @Output() selected = new EventEmitter<string>();
}
