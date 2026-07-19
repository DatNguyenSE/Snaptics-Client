import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../../../core/services/chat-storage.service';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-message-wrapper" *ngIf="message">
      <div class="message-bubble">
        <!-- Text Content -->
        <p class="message-text" *ngIf="message.content">{{ message.content }}</p>

        <!-- Attachment -->
        <div class="message-attachment" *ngIf="message.attachment">
          <div class="attachment-thumbnail">
            <span class="material-symbols-outlined attachment-icon">image</span>
            <span class="attachment-name">{{ message.attachment.name }}</span>
          </div>
        </div>

        <span class="message-time">{{ formatTime(message.createdAt) }}</span>
      </div>
    </div>
  `,
  styles: [`
    .user-message-wrapper {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      margin: 8px 0;
    }
    .message-bubble {
      max-width: 75%;
      background: linear-gradient(135deg, var(--sw-primary), #7c3aed);
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 20px 20px 4px 20px;
      box-shadow: 0 4px 15px rgba(91, 123, 250, 0.15);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .message-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .message-attachment {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      padding: 8px 12px;
      margin-top: 4px;
    }
    .attachment-thumbnail {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .attachment-icon {
      font-size: 1.25rem;
    }
    .attachment-name {
      font-size: 0.8125rem;
      font-weight: 600;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .message-time {
      align-self: flex-end;
      font-size: 0.6875rem;
      opacity: 0.7;
    }
    @media (max-width: 767px) {
      .message-bubble {
        max-width: 85%;
      }
    }
  `]
})
export class UserMessage {
  @Input() message!: ChatMessage;

  formatTime(dateString: string): string {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
    } catch {
      return '';
    }
  }
}
