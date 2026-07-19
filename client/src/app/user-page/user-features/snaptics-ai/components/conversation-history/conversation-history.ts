import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Conversation } from '../../../../../core/services/chat-storage.service';
import { ConversationHistoryItem } from '../conversation-history-item/conversation-history-item';

interface GroupedConversations {
  pinned: Conversation[];
  today: Conversation[];
  yesterday: Conversation[];
  last7Days: Conversation[];
  older: Conversation[];
}

@Component({
  selector: 'app-conversation-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ConversationHistoryItem],
  template: `
    <div class="history-sidebar" [class.history-sidebar--collapsed]="isCollapsed">
      <!-- Collapse Button (When sidebar is open) -->
      <button 
        type="button" 
        class="collapse-toggle-btn" 
        (click)="toggleCollapse()"
        [title]="isCollapsed ? 'Mở rộng lịch sử' : 'Thu nhỏ lịch sử'"
        aria-label="Toggle sidebar collapse"
      >
        <span class="material-symbols-outlined">
          {{ isCollapsed ? 'menu_open' : 'menu' }}
        </span>
      </button>

      <!-- Sidebar Content (Visible only when NOT collapsed) -->
      <div class="sidebar-content" *ngIf="!isCollapsed">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <h3 class="sidebar-title">Đoạn chat</h3>
          <button type="button" class="new-chat-btn" (click)="newChat.emit()">
            <span class="material-symbols-outlined">add_comment</span>
            <span>Đoạn chat mới</span>
          </button>
        </div>

        <!-- Search Box -->
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Tìm trong lịch sử..." 
            [(ngModel)]="searchQuery"
            (input)="applyFilter()"
          >
          <button 
            type="button" 
            *ngIf="searchQuery" 
            class="search-clear" 
            (click)="clearSearch()"
            aria-label="Clear search"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Conversation Scrollable List -->
        <div class="list-container custom-scrollbar">
          @if (hasNoResults) {
            <div class="empty-state">
              <span class="material-symbols-outlined empty-state__icon">search_off</span>
              <p class="empty-state__text">Không tìm thấy đoạn chat nào</p>
            </div>
          } @else if (conversations.length === 0) {
            <div class="empty-state">
              <span class="material-symbols-outlined empty-state__icon">chat_bubble_outline</span>
              <p class="empty-state__text">Chưa có cuộc trò chuyện nào</p>
            </div>
          } @else {
            <!-- Pinned Group -->
            @if (groups.pinned.length > 0) {
              <div class="list-group">
                <span class="group-label">Đã ghim</span>
                @for (c of groups.pinned; track c.id) {
                  <app-conversation-history-item
                    [conversation]="c"
                    [isActive]="c.id === activeId"
                    (selected)="selected.emit($event)"
                    (rename)="rename.emit($event)"
                    (delete)="delete.emit($event)"
                    (togglePin)="togglePin.emit($event)"
                  ></app-conversation-history-item>
                }
              </div>
            }

            <!-- Today Group -->
            @if (groups.today.length > 0) {
              <div class="list-group">
                <span class="group-label">Hôm nay</span>
                @for (c of groups.today; track c.id) {
                  <app-conversation-history-item
                    [conversation]="c"
                    [isActive]="c.id === activeId"
                    (selected)="selected.emit($event)"
                    (rename)="rename.emit($event)"
                    (delete)="delete.emit($event)"
                    (togglePin)="togglePin.emit($event)"
                  ></app-conversation-history-item>
                }
              </div>
            }

            <!-- Yesterday Group -->
            @if (groups.yesterday.length > 0) {
              <div class="list-group">
                <span class="group-label">Hôm qua</span>
                @for (c of groups.yesterday; track c.id) {
                  <app-conversation-history-item
                    [conversation]="c"
                    [isActive]="c.id === activeId"
                    (selected)="selected.emit($event)"
                    (rename)="rename.emit($event)"
                    (delete)="delete.emit($event)"
                    (togglePin)="togglePin.emit($event)"
                  ></app-conversation-history-item>
                }
              </div>
            }

            <!-- Last 7 Days Group -->
            @if (groups.last7Days.length > 0) {
              <div class="list-group">
                <span class="group-label">7 ngày trước</span>
                @for (c of groups.last7Days; track c.id) {
                  <app-conversation-history-item
                    [conversation]="c"
                    [isActive]="c.id === activeId"
                    (selected)="selected.emit($event)"
                    (rename)="rename.emit($event)"
                    (delete)="delete.emit($event)"
                    (togglePin)="togglePin.emit($event)"
                  ></app-conversation-history-item>
                }
              </div>
            }

            <!-- Older Group -->
            @if (groups.older.length > 0) {
              <div class="list-group">
                <span class="group-label">Cũ hơn</span>
                @for (c of groups.older; track c.id) {
                  <app-conversation-history-item
                    [conversation]="c"
                    [isActive]="c.id === activeId"
                    (selected)="selected.emit($event)"
                    (rename)="rename.emit($event)"
                    (delete)="delete.emit($event)"
                    (togglePin)="togglePin.emit($event)"
                  ></app-conversation-history-item>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      flex-shrink: 0;
    }
    .history-sidebar {
      width: 270px;
      height: 100%;
      background: var(--sw-card);
      border-right: 1px solid var(--sw-border);
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
    }
    .history-sidebar--collapsed {
      width: 50px;
    }
    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px 12px;
      gap: 16px;
      overflow: hidden;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .collapse-toggle-btn {
      position: absolute;
      top: 16px;
      right: 12px;
      background: transparent;
      border: none;
      color: var(--sw-muted-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      z-index: 10;
      transition: all 0.2s ease;
    }
    .history-sidebar--collapsed .collapse-toggle-btn {
      right: 11px;
    }
    .collapse-toggle-btn:hover {
      background: var(--sw-muted);
      color: var(--sw-foreground);
    }
    .sidebar-header {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 4px;
    }
    .sidebar-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--sw-foreground);
      margin: 0;
    }
    .new-chat-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--sw-primary), #7c3aed);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      width: calc(100% - 24px); /* Make space for toggle button */
    }
    .new-chat-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(91, 123, 250, 0.2);
    }
    .new-chat-btn span.material-symbols-outlined {
      font-size: 1.125rem;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--sw-muted);
      border: 1px solid var(--sw-border);
      border-radius: 12px;
      padding: 0 10px;
      height: 38px;
    }
    .search-icon {
      font-size: 1.125rem;
      color: var(--sw-muted-foreground);
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      width: 100%;
      height: 100%;
      padding-left: 8px;
      font-size: 0.8125rem;
      color: var(--sw-foreground);
      font-weight: 500;
    }
    .search-input::placeholder {
      color: var(--sw-muted-foreground);
      opacity: 0.7;
    }
    .search-clear {
      background: transparent;
      border: none;
      color: var(--sw-muted-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .search-clear .material-symbols-outlined {
      font-size: 1rem;
    }
    .list-container {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-right: -4px;
      padding-right: 4px;
    }
    .list-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .group-label {
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--sw-muted-foreground);
      padding: 4px 10px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 10px;
      text-align: center;
      gap: 8px;
      opacity: 0.7;
    }
    .empty-state__icon {
      font-size: 2rem;
      color: var(--sw-muted-foreground);
    }
    .empty-state__text {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--sw-muted-foreground);
      margin: 0;
    }
  `]
})
export class ConversationHistory implements OnChanges {
  @Input() conversations: Conversation[] = [];
  @Input() activeId = '';
  @Input() isCollapsed = false;

  @Output() selected = new EventEmitter<string>();
  @Output() newChat = new EventEmitter<void>();
  @Output() rename = new EventEmitter<Conversation>();
  @Output() delete = new EventEmitter<Conversation>();
  @Output() togglePin = new EventEmitter<string>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  searchQuery = '';
  filteredConversations: Conversation[] = [];

  groups: GroupedConversations = {
    pinned: [],
    today: [],
    yesterday: [],
    last7Days: [],
    older: [],
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['conversations'] || changes['activeId']) {
      this.applyFilter();
    }
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilter();
  }

  applyFilter() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredConversations = [...this.conversations];
    } else {
      this.filteredConversations = this.conversations.filter(c =>
        c.title.toLowerCase().includes(query)
      );
    }
    this.groupConversations();
  }

  get hasNoResults(): boolean {
    return this.searchQuery.trim().length > 0 && this.filteredConversations.length === 0;
  }

  private groupConversations() {
    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOf7DaysAgo = new Date(startOfToday);
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);

    // Sort by updated time (newest first)
    const sorted = [...this.filteredConversations].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    sorted.forEach(c => {
      if (c.isPinned) {
        pinned.push(c);
        return;
      }

      const updated = new Date(c.updatedAt);
      if (updated >= startOfToday) {
        today.push(c);
      } else if (updated >= startOfYesterday) {
        yesterday.push(c);
      } else if (updated >= startOf7DaysAgo) {
        last7Days.push(c);
      } else {
        older.push(c);
      }
    });

    this.groups = { pinned, today, yesterday, last7Days, older };
  }
}
