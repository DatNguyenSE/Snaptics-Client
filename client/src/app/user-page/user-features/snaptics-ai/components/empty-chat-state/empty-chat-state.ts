import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuggestionCard } from '../suggestion-card/suggestion-card';
import { AccountService } from '../../../../../core/services/account-service';

@Component({
  selector: 'app-empty-chat-state',
  standalone: true,
  imports: [CommonModule, SuggestionCard],
  template: `
    <div class="empty-state">
      <div class="empty-state__header">
        <div class="empty-state__logo">
          <img src="/Roni_AI/roni_chat.png" alt="Roni AI" class="empty-state__logo-img">
        </div>
        <h2 class="empty-state__title">{{ greeting }}, {{ userName }}! 👋</h2>
        <p class="empty-state__subtitle">
          Mình có thể giúp bạn phân tích chi tiêu, kiểm tra ngân sách và đưa ra những gợi ý tài chính phù hợp.
        </p>
      </div>

      <div class="empty-state__suggestions">
        @for (card of suggestionCards; track card.title) {
          <app-suggestion-card
            [title]="card.title"
            [description]="card.description"
            (selected)="onSuggestionSelected($event)"
          ></app-suggestion-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      max-width: 720px;
      margin: auto;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 70vh;
    }
    .empty-state__logo {
      width: 80px;
      height: 80px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sw-primary-soft);
      border-radius: 24px;
      box-shadow: 0 12px 24px rgba(91, 123, 250, 0.15);
      border: 2px solid var(--sw-card);
    }
    .empty-state__logo-img {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }
    .empty-state__title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--sw-foreground);
      margin: 0 0 12px 0;
      letter-spacing: -0.02em;
    }
    .empty-state__subtitle {
      font-size: 1rem;
      color: var(--sw-muted-foreground);
      max-width: 520px;
      margin: 0 auto 40px auto;
      line-height: 1.6;
    }
    .empty-state__suggestions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      width: 100%;
    }
    @media (max-width: 767px) {
      .empty-state__suggestions {
        grid-template-columns: 1fr;
      }
      .empty-state__title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class EmptyChatState {
  private readonly accountService = inject(AccountService);
  @Output() suggestionClicked = new EventEmitter<string>();

  get userName(): string {
    const user = this.accountService.currentUser();
    return user?.displayName?.trim() || 'Admin';
  }

  get greeting(): string {
    const hours = new Date().getHours();
    if (hours < 12) return 'Chào buổi sáng';
    if (hours < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  readonly suggestionCards = [
    {
      title: 'Phân tích chi tiêu tháng này',
      description: 'Xem tổng quan và những danh mục chi nhiều nhất.',
    },
    {
      title: 'Ăn uống thịnh soạn 500k',
      description: 'Tìm hiểu khoản chi nào đang tăng hoặc giảm.',
    },
    {
      title: 'Gợi ý kế hoạch tiết kiệm',
      description: 'Tạo mục tiêu dựa trên thu nhập và thói quen chi tiêu.',
    },
    {
      title: 'Kiểm tra giao dịch bất thường',
      description: 'Phát hiện những khoản chi khác với thói quen.',
    },
  ];

  onSuggestionSelected(title: string) {
    this.suggestionClicked.emit(title);
  }
}
