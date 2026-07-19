import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, ChatStorageService } from '../../../../../core/services/chat-storage.service';
import { AnalysisCard } from '../analysis-card/analysis-card';

@Component({
  selector: 'app-ai-message',
  standalone: true,
  imports: [CommonModule, AnalysisCard],
  template: `
    <div class="ai-message-wrapper" *ngIf="message">
      <!-- Roni Avatar -->
      <div class="message-avatar">
        <img src="/Roni_AI/roni_chat.png" alt="Roni" class="avatar-img">
      </div>

      <div class="message-container">
        <!-- Message Bubble -->
        <div class="message-bubble">
          <!-- Text content -->
          <div class="message-text" [innerHTML]="formattedContent"></div>

          <!-- Structured Analysis Card -->
          <app-analysis-card 
            *ngIf="message.analysisData" 
            [data]="message.analysisData"
          ></app-analysis-card>

          <!-- Status / Time -->
          <div class="message-meta">
            <span class="message-time">{{ formatTime(message.createdAt) }}</span>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="message-actions">
          <!-- Copy -->
          <button 
            type="button" 
            class="action-btn" 
            (click)="copyToClipboard()"
            aria-label="Copy response"
            title="Sao chép"
          >
            <span class="material-symbols-outlined font-size-16">content_copy</span>
            <span>{{ copySuccess ? 'Đã sao chép!' : 'Sao chép' }}</span>
          </button>

          <!-- Helpful / Like -->
          <button 
            type="button" 
            class="action-btn" 
            [class.action-btn--selected]="message.feedback === 'like'"
            (click)="provideFeedback('like')"
            aria-label="Mark helpful"
            title="Hữu ích"
          >
            <span class="material-symbols-outlined font-size-16" [class.filled]="message.feedback === 'like'">thumb_up</span>
            <span>Hữu ích</span>
          </button>

          <!-- Not Helpful / Dislike -->
          <button 
            type="button" 
            class="action-btn" 
            [class.action-btn--selected]="message.feedback === 'dislike'"
            (click)="provideFeedback('dislike')"
            aria-label="Mark unhelpful"
            title="Không hữu ích"
          >
            <span class="material-symbols-outlined font-size-16" [class.filled]="message.feedback === 'dislike'">thumb_down</span>
            <span>Không hữu ích</span>
          </button>

          <!-- Regenerate -->
          <button 
            type="button" 
            class="action-btn" 
            (click)="regenerate()"
            aria-label="Regenerate response"
            title="Tạo lại câu trả lời"
          >
            <span class="material-symbols-outlined font-size-16">refresh</span>
            <span>Tạo lại</span>
          </button>

          <!-- Save Report -->
          <button 
            type="button" 
            class="action-btn" 
            (click)="saveAsReport()"
            aria-label="Save as financial report"
            title="Lưu thành báo cáo"
          >
            <span class="material-symbols-outlined font-size-16">archive</span>
            <span>{{ reportSaved ? 'Đã lưu báo cáo!' : 'Lưu báo cáo' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-message-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      width: 100%;
      margin: 12px 0;
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
    .message-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      max-width: calc(100% - 50px);
    }
    .message-bubble {
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      color: var(--sw-foreground);
      padding: 14px 18px;
      border-radius: 4px 20px 20px 20px;
      box-shadow: 0 4px 18px rgba(91, 123, 250, 0.02);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .message-text {
      font-size: 0.9375rem;
      line-height: 1.6;
      word-break: break-word;
    }
    ::ng-deep .message-text p {
      margin: 0 0 10px 0;
    }
    ::ng-deep .message-text p:last-child {
      margin-bottom: 0;
    }
    ::ng-deep .message-text ul, ::ng-deep .message-text ol {
      margin: 4px 0 10px 20px;
      padding: 0;
    }
    ::ng-deep .message-text li {
      margin-bottom: 4px;
    }
    ::ng-deep .message-text strong {
      font-weight: 700;
      color: var(--sw-primary);
    }
    .message-meta {
      display: flex;
      justify-content: flex-end;
      font-size: 0.6875rem;
      color: var(--sw-muted-foreground);
      opacity: 0.8;
    }
    .message-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      padding-left: 4px;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--sw-muted-foreground);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      background: var(--sw-muted);
      color: var(--sw-foreground);
    }
    .action-btn--selected {
      background: var(--sw-primary-soft);
      color: var(--sw-primary);
      border-color: rgba(91, 123, 250, 0.2);
    }
    .font-size-16 {
      font-size: 1rem;
    }
    .filled {
      font-variation-settings: 'FILL' 1;
    }
  `]
})
export class AIMessage {
  private readonly storage = inject(ChatStorageService);

  @Input() message!: ChatMessage;
  @Output() regenerateRequested = new EventEmitter<string>();

  copySuccess = false;
  reportSaved = false;

  get formattedContent(): string {
    if (!this.message || !this.message.content) return '';
    
    // Parse simple markdown rules (bold, lists, paragraph breaks) to keep it clean
    let html = this.message.content;
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Lists
    const lines = html.split('\n');
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    
    const formattedLines = lines.map(line => {
      const bulletMatch = line.match(/^-\s+(.*)/);
      const numberMatch = line.match(/^\d+\.\s+(.*)/);
      
      if (bulletMatch) {
        let prefix = '';
        if (!inList) {
          inList = true;
          listType = 'ul';
          prefix = '<ul>';
        }
        return `${prefix}<li>${bulletMatch[1]}</li>`;
      } else if (numberMatch) {
        let prefix = '';
        if (!inList) {
          inList = true;
          listType = 'ol';
          prefix = '<ol>';
        }
        return `${prefix}<li>${numberMatch[1]}</li>`;
      } else {
        let suffix = '';
        if (inList) {
          inList = false;
          suffix = listType === 'ul' ? '</ul>' : '</ol>';
          listType = null;
        }
        
        // Wrap plain paragraphs
        if (line.trim()) {
          return `${suffix}<p>${line}</p>`;
        }
        return suffix;
      }
    });
    
    if (inList) {
      formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
    }
    
    return formattedLines.join('');
  }

  formatTime(dateString: string): string {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
    } catch {
      return '';
    }
  }

  copyToClipboard() {
    if (!this.message.content) return;
    navigator.clipboard.writeText(this.message.content).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    });
  }

  provideFeedback(type: 'like' | 'dislike') {
    const nextFeedback = this.message.feedback === type ? null : type;
    this.storage.updateMessage(this.message.conversationId, this.message.id, {
      feedback: nextFeedback
    });
  }

  regenerate() {
    this.regenerateRequested.emit(this.message.id);
  }

  saveAsReport() {
    this.reportSaved = true;
    setTimeout(() => this.reportSaved = false, 2000);
    
    // Simulate simple alert notification
    alert('Báo cáo chi tiêu cá nhân đã được trích xuất thành công và lưu vào hồ sơ báo cáo của bạn.');
  }
}
