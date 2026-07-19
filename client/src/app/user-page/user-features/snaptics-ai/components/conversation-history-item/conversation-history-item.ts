import { Component, Input, Output, EventEmitter, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../../../../core/services/chat-storage.service';

@Component({
  selector: 'app-conversation-history-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="history-item" 
      [class.history-item--active]="isActive"
      (click)="selected.emit(conversation.id)"
    >
      <!-- Chat Icon -->
      <span class="material-symbols-outlined history-item__chat-icon">chat_bubble</span>

      <!-- Title Copy -->
      <span class="history-item__title">{{ conversation.title || 'Đoạn chat mới' }}</span>

      <!-- Pin Indicator -->
      <span *ngIf="conversation.isPinned" class="material-symbols-outlined history-item__pin-icon">push_pin</span>

      <!-- Three-dot Actions Menu -->
      <div class="menu-container" (click)="$event.stopPropagation()">
        <button 
          type="button" 
          class="menu-trigger" 
          (click)="toggleMenu()"
          aria-label="Conversation options"
        >
          <span class="material-symbols-outlined">more_horiz</span>
        </button>

        @if (isMenuOpen) {
          <ul class="options-dropdown" role="menu">
            <li role="menuitem" (click)="onPinClick()">
              <span class="material-symbols-outlined dropdown-icon">push_pin</span>
              <span>{{ conversation.isPinned ? 'Bỏ ghim' : 'Ghim đoạn chat' }}</span>
            </li>
            <li role="menuitem" (click)="onRenameClick()">
              <span class="material-symbols-outlined dropdown-icon">edit</span>
              <span>Đổi tên</span>
            </li>
            <li role="menuitem" class="danger" (click)="onDeleteClick()">
              <span class="material-symbols-outlined dropdown-icon">delete</span>
              <span>Xóa đoạn chat</span>
            </li>
          </ul>
        }
      </div>
    </div>
  `,
  styles: [`
    .history-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      color: var(--sw-foreground);
    }
    .history-item:hover {
      background: var(--sw-muted);
    }
    .history-item--active {
      background: var(--sw-primary-soft) !important;
      color: var(--sw-primary) !important;
      font-weight: 700;
    }
    .history-item__chat-icon {
      font-size: 1.125rem;
      color: var(--sw-muted-foreground);
    }
    .history-item--active .history-item__chat-icon {
      color: var(--sw-primary);
    }
    .history-item__title {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }
    .history-item__pin-icon {
      font-size: 0.875rem;
      color: var(--sw-primary);
      transform: rotate(45deg);
    }
    .menu-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .menu-trigger {
      background: transparent;
      border: none;
      color: var(--sw-muted-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      opacity: 0;
      transition: all 0.2s ease;
    }
    .history-item:hover .menu-trigger,
    .menu-trigger:focus,
    .history-item--active .menu-trigger {
      opacity: 1;
    }
    .menu-trigger:hover {
      background: rgba(91, 123, 250, 0.1);
      color: var(--sw-foreground);
    }
    .options-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      border-radius: 10px;
      padding: 4px;
      min-width: 150px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      z-index: 50;
      margin: 0;
      list-style: none;
    }
    .options-dropdown li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--sw-foreground);
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .options-dropdown li:hover {
      background: var(--sw-muted);
    }
    .options-dropdown li.danger {
      color: #ef4444;
    }
    .options-dropdown li.danger:hover {
      background: rgba(239, 68, 68, 0.05);
    }
    .dropdown-icon {
      font-size: 1rem;
    }
  `]
})
export class ConversationHistoryItem {
  private readonly elementRef = inject(ElementRef);

  @Input() conversation!: Conversation;
  @Input() isActive = false;

  @Output() selected = new EventEmitter<string>();
  @Output() rename = new EventEmitter<Conversation>();
  @Output() delete = new EventEmitter<Conversation>();
  @Output() togglePin = new EventEmitter<string>();

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onPinClick() {
    this.togglePin.emit(this.conversation.id);
    this.isMenuOpen = false;
  }

  onRenameClick() {
    this.rename.emit(this.conversation);
    this.isMenuOpen = false;
  }

  onDeleteClick() {
    this.delete.emit(this.conversation);
    this.isMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isMenuOpen = false;
    }
  }
}
