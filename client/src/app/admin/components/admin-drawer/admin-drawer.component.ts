import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-admin-drawer',
  standalone: true,
  imports: [],
  template: `
    <div class="drawer-backdrop" [class.drawer-backdrop--visible]="open" (click)="onBackdropClick($event)" role="dialog" [attr.aria-modal]="open" [attr.aria-label]="title">
      <div class="drawer" [class.drawer--open]="open">
        <div class="drawer__header">
          <div>
            <h2 class="drawer__title">{{ title }}</h2>
            @if (subtitle) {
              <p class="drawer__subtitle">{{ subtitle }}</p>
            }
          </div>
          <button type="button" class="drawer__close" (click)="closed.emit()" aria-label="Close drawer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="drawer__body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      z-index: 400;
      pointer-events: none;
      background: transparent;
      transition: background 0.25s;
    }
    .drawer-backdrop--visible {
      pointer-events: all;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(3px);
    }
    .drawer {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(480px, 100vw);
      background: var(--ac-surface);
      border-left: 1px solid var(--ac-border);
      display: flex;
      flex-direction: column;
      box-shadow: var(--ac-shadow-lg);
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .drawer--open { transform: translateX(0); }
    .drawer__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 20px;
      border-bottom: 1px solid var(--ac-border);
      flex-shrink: 0;
    }
    .drawer__title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ac-foreground);
      margin: 0 0 2px;
    }
    .drawer__subtitle {
      font-size: 0.8125rem;
      color: var(--ac-foreground-muted);
      margin: 0;
    }
    .drawer__close {
      width: 32px;
      height: 32px;
      border: 1px solid var(--ac-border);
      border-radius: 8px;
      background: var(--ac-surface-2);
      color: var(--ac-foreground-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.18s;
    }
    .drawer__close:hover { background: var(--ac-danger-soft); color: var(--ac-danger); }
    .drawer__close .material-symbols-outlined { font-size: 18px; }
    .drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
  `],
})
export class AdminDrawerComponent {
  @Input() open = false;
  @Input() title = 'Details';
  @Input() subtitle?: string;
  @Output() closed = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('drawer-backdrop')) {
      this.closed.emit();
    }
  }
}
