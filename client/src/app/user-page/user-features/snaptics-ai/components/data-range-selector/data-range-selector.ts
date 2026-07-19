import { Component, Input, Output, EventEmitter, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DataRangeOption {
  key: string;
  label: string;
}

@Component({
  selector: 'app-data-range-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-range-selector">
      <button 
        type="button" 
        class="data-range-btn" 
        (click)="toggleDropdown($event)"
        [attr.aria-expanded]="isOpen"
        aria-haspopup="listbox"
      >
        <span class="material-symbols-outlined data-range-btn__icon">calendar_today</span>
        <span class="data-range-btn__label">{{ activeLabel }}</span>
        <span class="material-symbols-outlined data-range-btn__chevron" [class.data-range-btn__chevron--open]="isOpen">
          expand_more
        </span>
      </button>

      @if (isOpen) {
        <ul class="data-range-dropdown" role="listbox">
          @for (opt of options; track opt.key) {
            <li 
              class="data-range-item"
              [class.data-range-item--selected]="opt.key === selectedKey"
              role="option"
              [attr.aria-selected]="opt.key === selectedKey"
              (click)="selectOption(opt)"
            >
              {{ opt.label }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .data-range-selector {
      position: relative;
      display: inline-block;
    }
    .data-range-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--sw-muted);
      border: 1px solid var(--sw-border);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--sw-foreground);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .data-range-btn:hover {
      background: var(--sw-primary-soft);
      border-color: var(--sw-primary);
    }
    .data-range-btn__icon {
      font-size: 1rem;
      color: var(--sw-primary);
    }
    .data-range-btn__label {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .data-range-btn__chevron {
      font-size: 1rem;
      color: var(--sw-muted-foreground);
      transition: transform 0.2s ease;
    }
    .data-range-btn__chevron--open {
      transform: rotate(180deg);
    }
    .data-range-dropdown {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 0;
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      border-radius: 12px;
      padding: 6px;
      min-width: 160px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 100;
      margin: 0;
      list-style: none;
    }
    .data-range-item {
      padding: 8px 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--sw-foreground);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .data-range-item:hover {
      background: var(--sw-primary-soft);
      color: var(--sw-primary);
    }
    .data-range-item--selected {
      background: var(--sw-primary);
      color: #fff;
    }
    .data-range-item--selected:hover {
      background: var(--sw-primary);
      color: #fff;
    }
  `]
})
export class DataRangeSelector {
  private readonly elementRef = inject(ElementRef);

  @Input() selectedKey = 'month';
  @Output() selectedKeyChange = new EventEmitter<string>();

  isOpen = false;

  readonly options: DataRangeOption[] = [
    { key: 'week', label: 'Tuần này' },
    { key: 'month', label: 'Tháng này' },
    { key: '3months', label: '3 tháng gần nhất' },
    { key: 'all', label: 'Tất cả dữ liệu' },
  ];

  get activeLabel(): string {
    return this.options.find((o) => o.key === this.selectedKey)?.label || 'Tháng này';
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  selectOption(opt: DataRangeOption) {
    this.selectedKey = opt.key;
    this.selectedKeyChange.emit(opt.key);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }
}
