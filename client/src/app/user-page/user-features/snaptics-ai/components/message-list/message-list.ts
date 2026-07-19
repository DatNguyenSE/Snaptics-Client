import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../../../core/services/chat-storage.service';
import { UserMessage } from '../user-message/user-message';
import { AIMessage } from '../ai-message/ai-message';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, UserMessage, AIMessage],
  template: `
    <div class="message-list custom-scrollbar" #scrollContainer>
      @for (msg of messages; track msg.id) {
        @if (msg.role === 'user') {
          <app-user-message [message]="msg"></app-user-message>
        } @else {
          <app-ai-message 
            [message]="msg"
            (regenerateRequested)="regenerateRequested.emit($event)"
          ></app-ai-message>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }
    .message-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      overflow-y: auto;
      height: 100%;
      box-sizing: border-box;
    }
  `]
})
export class MessageList implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

  @Input() messages: ChatMessage[] = [];
  @Output() regenerateRequested = new EventEmitter<string>();

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        const nativeEl = this.scrollContainer.nativeElement;
        nativeEl.scrollTop = nativeEl.scrollHeight;
      }
    } catch (err) {
      console.warn('Scroll to bottom failed:', err);
    }
  }
}
