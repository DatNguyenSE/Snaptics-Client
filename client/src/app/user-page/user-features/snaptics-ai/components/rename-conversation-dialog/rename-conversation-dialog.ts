import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rename-conversation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-overlay" *ngIf="isOpen">
      <div class="dialog-card">
        <div class="dialog-header">
          <h3 class="dialog-title">Đổi tên đoạn chat</h3>
          <button type="button" class="dialog-close" (click)="cancel.emit()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="dialog-body">
          <label class="dialog-label" for="chat-title-input">Tên cuộc trò chuyện</label>
          <input
            #titleInput
            id="chat-title-input"
            type="text"
            class="dialog-input"
            [(ngModel)]="tempTitle"
            (keydown.enter)="onSave()"
            (keydown.escape)="cancel.emit()"
            placeholder="Nhập tên đoạn chat..."
          >
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn btn--secondary" (click)="cancel.emit()">Hủy</button>
          <button type="button" class="btn btn--primary" [disabled]="!tempTitle.trim()" (click)="onSave()">Lưu</button>
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
      max-width: 420px;
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
      color: var(--sw-foreground);
      margin: 0;
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
    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dialog-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--sw-muted-foreground);
    }
    .dialog-input {
      background: var(--sw-muted);
      border: 1px solid var(--sw-border);
      color: var(--sw-foreground);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s ease;
      font-weight: 500;
    }
    .dialog-input:focus {
      border-color: var(--sw-primary);
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
    .btn--primary {
      background: linear-gradient(135deg, var(--sw-primary), #7c3aed);
      color: #fff;
    }
    .btn--primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(91, 123, 250, 0.25);
    }
    .btn--primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class RenameConversationDialog implements OnChanges {
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  @Input() isOpen = false;
  @Input() conversationTitle = '';
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  tempTitle = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['conversationTitle']) {
      this.tempTitle = this.conversationTitle;
    }
    if (this.isOpen) {
      setTimeout(() => {
        this.titleInput?.nativeElement?.focus();
        this.titleInput?.nativeElement?.select();
      }, 50);
    }
  }

  onSave() {
    if (this.tempTitle.trim()) {
      this.save.emit(this.tempTitle.trim());
    }
  }
}
