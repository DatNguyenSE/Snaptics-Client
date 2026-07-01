import { Component, ElementRef, ViewChild, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../core/services/language-service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css',
})
export class AiAssistant implements AfterViewChecked {
  protected readonly language = inject(LanguageService);
  
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  newMessage = '';
  isWaitingForResponse = false;

  messages: ChatMessage[] = [];

  constructor() {
    this.initializeMessages();
  }

  private initializeMessages() {
    const isEn = this.language.currentLang() === 'en';
    this.messages = [
      {
        id: '1',
        sender: 'ai',
        text: isEn
          ? 'Hello! I am Snaptics AI. How can I help you today?'
          : 'Chào bạn! Mình là trợ lý AI của Snaptics. Mình có thể giúp gì cho bạn hôm nay?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      },
      {
        id: '2',
        sender: 'user',
        text: isEn
          ? "Help me analyze this week's spending compared to last week."
          : 'Phân tích giúp tôi chi tiêu tuần này so với tuần trước nhé.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      },
      {
        id: '3',
        sender: 'ai',
        text: isEn
          ? 'You spent 15% less this week compared to last week, mainly because you reduced dining out. Keep it up!'
          : 'Tuần này bạn đã chi tiêu ít hơn 15% so với tuần trước. Chủ yếu là do bạn đã giảm chi tiêu cho việc ăn uống ngoài hàng. Hãy tiếp tục phát huy nhé!',
        timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 mins ago
      }
    ];
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  closeChat() {
    this.isOpen = false;
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isWaitingForResponse) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: this.newMessage.trim(),
      timestamp: new Date(),
    };
    this.messages.push(userMsg);
    this.newMessage = '';
    this.isWaitingForResponse = true;
    this.scrollToBottom();

    // Simulate AI typing and response
    setTimeout(() => {
      const typingMsgId = 'typing-' + Date.now();
      this.messages.push({
        id: typingMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date(),
        isTyping: true
      });
      this.scrollToBottom();

      setTimeout(() => {
        // Remove typing indicator
        this.messages = this.messages.filter(m => m.id !== typingMsgId);
        
        // Add AI response
        const isEn = this.language.currentLang() === 'en';
        this.messages.push({
          id: Date.now().toString(),
          sender: 'ai',
          text: isEn
            ? 'This is a sample AI response. The actual feature will call the API to generate responses based on your real data.'
            : 'Đây là câu trả lời mẫu từ AI. Chức năng thực tế sẽ gọi API để nhận phản hồi dựa trên dữ liệu thật của bạn.',
          timestamp: new Date(),
        });
        this.isWaitingForResponse = false;
        this.scrollToBottom();
      }, 1500);
    }, 500);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}
