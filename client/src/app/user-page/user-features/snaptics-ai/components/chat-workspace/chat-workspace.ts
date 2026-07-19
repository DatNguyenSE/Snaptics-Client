import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, ChatMessage } from '../../../../../core/services/chat-storage.service';
import { ChatHeader } from '../chat-header/chat-header';
import { EmptyChatState } from '../empty-chat-state/empty-chat-state';
import { MessageList } from '../message-list/message-list';
import { ChatComposer } from '../chat-composer/chat-composer';
import { TypingIndicator } from '../typing-indicator/typing-indicator';

@Component({
  selector: 'app-chat-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ChatHeader,
    EmptyChatState,
    MessageList,
    ChatComposer,
    TypingIndicator
  ],
  template: `
    <div class="chat-workspace">
      <!-- Sticky Header -->
      <app-chat-header
        [isHistoryClosed]="isHistoryClosed"
        (toggleHistory)="toggleHistory.emit()"
        (newChat)="newChat.emit()"
        (clearAllChats)="clearAllChats.emit()"
      ></app-chat-header>

      <!-- Scrollable Message Viewport -->
      <div class="workspace-viewport">
        @if (!conversation || conversation.messages.length === 0) {
          <app-empty-chat-state
            (suggestionClicked)="onSuggestionClicked($event)"
          ></app-empty-chat-state>
        } @else {
          <div class="message-scroller custom-scrollbar">
            <app-message-list 
              [messages]="conversation.messages"
              (regenerateRequested)="regenerateRequested.emit($event)"
            ></app-message-list>

            <!-- Typing indicator aligned with AI bubble styling -->
            <div class="typing-wrap" *ngIf="isAiResponding">
              <div class="message-avatar">
                <img src="/Roni_AI/roni_chat.png" alt="Roni" class="avatar-img">
              </div>
              <app-typing-indicator></app-typing-indicator>
            </div>
          </div>
        }
      </div>

      <!-- Composer Bar -->
      <div class="workspace-composer">
        <app-chat-composer
          [isAiResponding]="isAiResponding"
          (messageSent)="onMessageSent($event)"
          (stopRequested)="stopRequested.emit()"
        ></app-chat-composer>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .chat-workspace {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--sw-background);
      overflow: hidden;
    }
    .workspace-viewport {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .message-scroller {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .typing-wrap {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 0 24px 24px 24px;
      margin-top: -8px;
    }
    .message-avatar {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: var(--sw-primary-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(91, 123, 250, 0.1);
      flex-shrink: 0;
    }
    .avatar-img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
    .workspace-composer {
      padding: 16px 24px 24px 24px;
      background: linear-gradient(180deg, rgba(244, 247, 255, 0) 0%, var(--sw-background) 25%);
    }
    :host-context(html.dark-theme) .workspace-composer {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, var(--sw-background) 25%);
    }
    @media (max-width: 767px) {
      .workspace-composer {
        padding: 12px 16px 16px 16px;
      }
    }
  `]
})
export class ChatWorkspace {
  @Input() conversation: Conversation | undefined;
  @Input() isAiResponding = false;
  @Input() isHistoryClosed = false;

  @Output() toggleHistory = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<{ content: string; file: File | null; dataRange: string }>();
  @Output() stopRequested = new EventEmitter<void>();
  @Output() newChat = new EventEmitter<void>();
  @Output() clearAllChats = new EventEmitter<void>();
  @Output() regenerateRequested = new EventEmitter<string>();

  onSuggestionClicked(suggestionText: string) {
    this.messageSent.emit({
      content: suggestionText,
      file: null,
      dataRange: 'month'
    });
  }

  onMessageSent(payload: { content: string; file: File | null; dataRange: string }) {
    this.messageSent.emit(payload);
  }
}
