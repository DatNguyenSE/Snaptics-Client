import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  template: `
    <div class="pagination" role="navigation" aria-label="Table pagination">
      <span class="pagination__info">
        Showing {{ start }}–{{ end }} of {{ total }}
      </span>
      <div class="pagination__controls">
        <button
          type="button"
          class="pagination__btn"
          [disabled]="page <= 1"
          (click)="prev()"
          aria-label="Previous page"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        @for (p of visiblePages; track p) {
          @if (p === -1) {
            <span class="pagination__ellipsis">…</span>
          } @else {
            <button
              type="button"
              class="pagination__btn"
              [class.pagination__btn--active]="p === page"
              (click)="pageChange.emit(p)"
              [attr.aria-label]="'Page ' + p"
              [attr.aria-current]="p === page ? 'page' : null"
            >{{ p }}</button>
          }
        }
        <button
          type="button"
          class="pagination__btn"
          [disabled]="page >= totalPages"
          (click)="next()"
          aria-label="Next page"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pagination__info {
      font-size: 0.8125rem;
      color: var(--ac-foreground-muted);
    }
    .pagination__controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .pagination__btn {
      min-width: 34px;
      height: 34px;
      padding: 0 8px;
      border: 1px solid var(--ac-border);
      border-radius: 8px;
      background: var(--ac-surface);
      color: var(--ac-foreground-muted);
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.16s;
    }
    .pagination__btn:hover:not(:disabled) {
      background: var(--ac-primary-soft);
      color: var(--ac-primary);
      border-color: var(--ac-primary);
    }
    .pagination__btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .pagination__btn--active {
      background: var(--ac-primary);
      color: #fff;
      border-color: var(--ac-primary);
    }
    .pagination__btn .material-symbols-outlined { font-size: 18px; }
    .pagination__ellipsis {
      font-size: 0.8125rem;
      color: var(--ac-foreground-muted);
      padding: 0 4px;
    }
  `],
})
export class PaginationComponent {
  @Input({ required: true }) page!: number;
  @Input({ required: true }) total!: number;
  @Input({ required: true }) pageSize!: number;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get start(): number {
    return Math.min((this.page - 1) * this.pageSize + 1, this.total);
  }

  get end(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page;
    const pages: number[] = [];

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    pages.push(1);
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);

    return pages;
  }

  prev(): void {
    if (this.page > 1) this.pageChange.emit(this.page - 1);
  }

  next(): void {
    if (this.page < this.totalPages) this.pageChange.emit(this.page + 1);
  }
}
