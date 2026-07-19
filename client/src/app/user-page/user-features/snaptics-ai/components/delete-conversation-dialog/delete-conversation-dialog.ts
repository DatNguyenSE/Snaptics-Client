import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-conversation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" *ngIf="isOpen">
      <div class="dialog-card">
        <div class="dialog-header">
          <h3 class="dialog-title dialog-title--danger">Xóa cuộc trò chuyện?</h3>
          <button type="button" class="dialog-close" (click)="cancel.emit()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="dialog-body">
          <p class="dialog-desc">
            Bạn có chắc chắn muốn xóa cuộc trò chuyện <strong>"{{ conversationTitle }}"</strong>?
          </p>
          <p class="dialog-warn">
            Hành động này không thể hoàn tác và toàn bộ lịch sử tin nhắn sẽ bị xóa vĩnh viễn.
          </p>
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn btn--secondary" (click)="cancel.emit()">Hủy</button>
          <button type="button" class="btn btn--danger" (click)="confirm.emit()">Xóa vĩnh viễn</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .dialog-card {
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      padding: 24px;
      box-shadow: var(--sw-shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: zoomIn 0.2s ease-out;
    }
    @keyframes zoomIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dialog-title {
      font-size: 1.125rem;
      font-weight: 800;
      margin: 0;
    }
    .dialog-title--danger {
      color: #ef4444;
    }
    .dialog-close {
      background: transparent;
      border: none;
      color: var(--sw-muted-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dialog-desc {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--sw-foreground);
      margin: 0 0 10px 0;
    }
    .dialog-warn {
      font-size: 0.8125rem;
      line-height: 1.5;
      color: var(--sw-muted-foreground);
      margin: 0;
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
    .btn {
      font-size: 0.875rem;
      font-weight: 700;
      padding: 10px 16px;
      border-radius: 20px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .btn--secondary {
      background: var(--sw-muted);
      color: var(--sw-muted-foreground);
    }
    .btn--secondary:hover {
      background: rgba(91, 123, 250, 0.08);
      color: var(--sw-foreground);
    }
    .btn--danger {
      background: #ef4444;
      color: #fff;
    }
    .btn--danger:hover {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }
  `]
})
export class DeleteConversationDialog {
  @Input() isOpen = false;
  @Input() conversationTitle = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
