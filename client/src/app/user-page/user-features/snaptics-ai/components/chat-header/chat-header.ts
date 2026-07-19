import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="chat-header">
      <!-- Left: Roni Info & Mobile Menu Toggle -->
      <div class="header-left">
        <!-- History panel toggle for tablet/mobile when closed -->
        <button 
          type="button" 
          class="history-toggle-btn" 
          (click)="toggleHistory.emit()"
          [title]="isHistoryClosed ? 'Mở lịch sử chat' : 'Đóng lịch sử chat'"
          aria-label="Toggle history panel"
        >
          <span class="material-symbols-outlined">
            {{ isHistoryClosed ? 'menu_open' : 'menu' }}
          </span>
        </button>

        <div class="avatar-wrap">
          <img src="/Roni_AI/roni_chat.png" alt="Roni" class="avatar-img">
        </div>
        
        <div class="header-copy">
          <div class="title-row">
            <h1 class="header-title">Snaptics AI</h1>
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-text">Sẵn sàng hỗ trợ</span>
            </div>
          </div>
          <p class="header-subtitle">Trợ lý phân tích tài chính cá nhân</p>
        </div>
      </div>

      <!-- Right: Action Buttons -->
      <div class="header-right">
        <button type="button" class="action-btn action-btn--primary" (click)="newChat.emit()">
          <span class="material-symbols-outlined">add_comment</span>
          <span>Chat mới</span>
        </button>

        <!-- Options menu -->
        <div class="options-menu">
          <button 
            type="button" 
            class="action-btn action-btn--icon" 
            (click)="toggleOptions()"
            aria-label="More options"
          >
            <span class="material-symbols-outlined">more_vert</span>
          </button>

          @if (isOptionsOpen) {
            <ul class="dropdown-list" role="menu">
              <li role="menuitem" class="danger" (click)="clearAll()">
                <span class="material-symbols-outlined dropdown-icon">delete_sweep</span>
                <span>Xóa hết lịch sử chat</span>
              </li>
            </ul>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .chat-header {
      background: var(--sw-card);
      border-bottom: 1px solid var(--sw-border);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 40;
      backdrop-filter: blur(10px);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .history-toggle-btn {
      display: none;
      background: transparent;
      border: none;
      color: var(--sw-muted-foreground);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    .history-toggle-btn:hover {
      background: var(--sw-muted);
      color: var(--sw-foreground);
    }
    .avatar-wrap {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--sw-primary-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(91, 123, 250, 0.1);
    }
    .avatar-img {
      width: 30px;
      height: 30px;
      object-fit: contain;
    }
    .header-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-title {
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--sw-foreground);
      margin: 0;
      line-height: 1.2;
    }
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 20px;
      padding: 2px 8px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sw-accent);
      animation: pulse 2s infinite;
    }
    .status-text {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--sw-accent);
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.6; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.6; }
    }
    .header-subtitle {
      font-size: 0.75rem;
      color: var(--sw-muted-foreground);
      margin: 0;
      font-weight: 500;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.8125rem;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 20px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      color: var(--sw-foreground);
      background: var(--sw-muted);
    }
    .action-btn:hover {
      background: rgba(91, 123, 250, 0.08);
    }
    .action-btn--primary {
      background: var(--sw-primary-soft);
      color: var(--sw-primary);
      border: 1px solid rgba(91, 123, 250, 0.15);
    }
    .action-btn--primary:hover {
      background: var(--sw-primary);
      color: #fff;
    }
    .action-btn--icon {
      width: 32px;
      height: 32px;
      padding: 0;
      border-radius: 50%;
    }
    .options-menu {
      position: relative;
    }
    .dropdown-list {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      border-radius: 12px;
      padding: 4px;
      min-width: 180px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 50;
      margin: 0;
      list-style: none;
    }
    .dropdown-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--sw-foreground);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .dropdown-list li:hover {
      background: var(--sw-muted);
    }
    .dropdown-list li.danger {
      color: #ef4444;
    }
    .dropdown-list li.danger:hover {
      background: rgba(239, 68, 68, 0.05);
    }
    .dropdown-icon {
      font-size: 1rem;
    }
    @media (max-width: 1023px) {
      .history-toggle-btn {
        display: flex;
      }
    }
  `]
})
export class ChatHeader {
  @Input() isHistoryClosed = false;
  @Output() toggleHistory = new EventEmitter<void>();
  @Output() newChat = new EventEmitter<void>();
  @Output() clearAllChats = new EventEmitter<void>();

  isOptionsOpen = false;

  toggleOptions() {
    this.isOptionsOpen = !this.isOptionsOpen;
  }

  clearAll() {
    this.isOptionsOpen = false;
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
      this.clearAllChats.emit();
    }
  }
}
