import { Injectable, signal, computed } from '@angular/core';

export type ChatRole = 'user' | 'assistant';

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
}

export interface AnalysisData {
  currentAmount?: number;
  previousAmount?: number;
  percentageChange?: number;
  topCategory?: string;
  categories?: Array<{
    name: string;
    amount: number;
  }>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status?: 'sending' | 'streaming' | 'completed' | 'error';
  attachment?: ChatAttachment;
  analysisData?: AnalysisData;
  feedback?: 'like' | 'dislike' | null;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'snaptics_ai_conversations';

@Injectable({
  providedIn: 'root',
})
export class ChatStorageService {
  // Store the list of all conversations
  private readonly _conversations = signal<Conversation[]>([]);
  readonly conversations = computed(() => this._conversations());

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load conversations from localStorage or initialize with mock data if empty
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        this._conversations.set(parsed);
      } else {
        const initialMock = this.createMockConversations();
        this._conversations.set(initialMock);
        this.saveToStorage(initialMock);
      }
    } catch (e) {
      console.error('Error loading conversations from localStorage:', e);
      const initialMock = this.createMockConversations();
      this._conversations.set(initialMock);
    }
  }

  /**
   * Sync memory state to localStorage
   */
  private saveToStorage(conversations: Conversation[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Error saving conversations to localStorage:', e);
    }
  }

  /**
   * Helper to update signals and trigger localStorage save
   */
  private updateConversations(updater: (prev: Conversation[]) => Conversation[]) {
    this._conversations.update((prev) => {
      const next = updater(prev);
      this.saveToStorage(next);
      return next;
    });
  }

  /**
   * Get a conversation by ID
   */
  getConversationById(id: string): Conversation | undefined {
    return this._conversations().find((c) => c.id === id);
  }

  /**
   * Create a new empty conversation and return it
   */
  createNewConversation(title: string = 'Đoạn chat mới'): Conversation {
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: 'chat_' + Math.random().toString(36).substring(2, 11),
      title,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      messages: [],
    };

    this.updateConversations((prev) => [newConv, ...prev]);
    return newConv;
  }

  /**
   * Add a message to a conversation
   */
  addMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>): ChatMessage {
    const now = new Date().toISOString();
    const newMessage: ChatMessage = {
      ...message,
      id: 'msg_' + Math.random().toString(36).substring(2, 11),
      conversationId,
      createdAt: now,
    };

    this.updateConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            updatedAt: now,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );

    return newMessage;
  }

  /**
   * Update message properties (like status, feedback)
   */
  updateMessage(
    conversationId: string,
    messageId: string,
    updates: Partial<Omit<ChatMessage, 'id' | 'conversationId'>>
  ) {
    this.updateConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                return { ...m, ...updates };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  }

  /**
   * Pin or unpin a conversation
   */
  togglePin(id: string) {
    this.updateConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, isPinned: !c.isPinned };
        }
        return c;
      })
    );
  }

  /**
   * Rename a conversation title
   */
  renameConversation(id: string, newTitle: string) {
    this.updateConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, title: newTitle.trim(), updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
  }

  /**
   * Delete a conversation
   */
  deleteConversation(id: string) {
    this.updateConversations((prev) => prev.filter((c) => c.id !== id));
  }

  /**
   * Clear all conversations (reset back to mock data or empty)
   */
  clearAll() {
    this._conversations.set([]);
    this.saveToStorage([]);
  }

  /**
   * Initialize with 7 standard mock conversations distributed across time groups:
   * Today, Yesterday, Last 7 Days, Older
   */
  private createMockConversations(): Conversation[] {
    const now = new Date();

    const getPastDateString = (offsetDays: number, hourOffset = 0): string => {
      const d = new Date(now);
      d.setDate(now.getDate() - offsetDays);
      d.setHours(d.getHours() - hourOffset);
      return d.toISOString();
    };

    const mockChats: Conversation[] = [
      {
        id: 'mock_chat_1',
        title: 'Phân tích chi tiêu tuần này',
        createdAt: getPastDateString(0, 2), // 2 hours ago
        updatedAt: getPastDateString(0, 2),
        isPinned: false,
        messages: [
          {
            id: 'mock_msg_1_u',
            conversationId: 'mock_chat_1',
            role: 'user',
            content: 'Phân tích giúp tôi chi tiêu tuần này so với tuần trước nhé.',
            createdAt: getPastDateString(0, 2.1),
          },
          {
            id: 'mock_msg_1_a',
            conversationId: 'mock_chat_1',
            role: 'assistant',
            content:
              'Chào bạn, dưới đây là phân tích chi tiêu tuần này của bạn. Tuần này bạn đã chi tiêu ít hơn 15% so với tuần trước. Chi phí ăn uống bên ngoài giảm đáng kể, trong khi chi phí di chuyển tăng nhẹ.',
            createdAt: getPastDateString(0, 2.05),
            status: 'completed',
            analysisData: {
              currentAmount: 1850000,
              previousAmount: 2176000,
              percentageChange: -15,
              topCategory: 'Ăn uống',
              categories: [
                { name: 'Ăn uống', amount: 720000 },
                { name: 'Di chuyển', amount: 380000 },
                { name: 'Mua sắm', amount: 450000 },
                { name: 'Hóa đơn', amount: 300000 },
              ],
            },
          },
        ],
      },
      {
        id: 'mock_chat_2',
        title: 'Tôi đang chi quá nhiều vào đâu?',
        createdAt: getPastDateString(0, 4), // 4 hours ago
        updatedAt: getPastDateString(0, 4),
        isPinned: true, // pin this item
        messages: [
          {
            id: 'mock_msg_2_u',
            conversationId: 'mock_chat_2',
            role: 'user',
            content: 'Tôi đang chi quá nhiều vào đâu?',
            createdAt: getPastDateString(0, 4.1),
          },
          {
            id: 'mock_msg_2_a',
            conversationId: 'mock_chat_2',
            role: 'assistant',
            content:
              'Phân tích dữ liệu giao dịch cho thấy danh mục **Ăn uống** (Food & Dining) đang chiếm tỷ trọng lớn nhất với **52% tổng chi tiêu** của bạn trong tháng này, đạt 5.280.000đ. Cụ thể là bữa liên hoan Cơm niêu Sài Gòn cách đây 2 ngày đã tiêu tốn một khoản khá lớn. Bạn nên cân nhắc đặt ngân sách giới hạn và tự nấu ăn nhiều hơn để tiết kiệm.',
            createdAt: getPastDateString(0, 4.0),
            status: 'completed',
          },
        ],
      },
      {
        id: 'mock_chat_3',
        title: 'Lập ngân sách tháng 7',
        createdAt: getPastDateString(1, 1), // Yesterday
        updatedAt: getPastDateString(1, 1),
        isPinned: false,
        messages: [
          {
            id: 'mock_msg_3_u',
            conversationId: 'mock_chat_3',
            role: 'user',
            content: 'Hãy giúp tôi lập ngân sách tháng 7.',
            createdAt: getPastDateString(1, 1.1),
          },
          {
            id: 'mock_msg_3_a',
            conversationId: 'mock_chat_3',
            role: 'assistant',
            content:
              'Dựa trên thu nhập trung bình hàng tháng của bạn là 28.500.000đ và lịch sử chi tiêu, mình đề xuất ngân sách tháng 7 theo quy tắc 50/30/20:\n\n1. **Chi phí thiết yếu (50%)**: 14.250.000đ (Tiền nhà, điện nước, ăn uống cơ bản, xăng xe).\n2. **Chi phí cá nhân & Giải trí (30%)**: 8.550.000đ (Cafe, mua sắm quần áo, xem phim).\n3. **Tiết kiệm & Đầu tư (20%)**: 5.700.000đ.\n\nBạn có muốn mình tạo trực tiếp các ngân sách này trên hệ thống Snaptics để tiện theo dõi không?',
            createdAt: getPastDateString(1, 1.05),
            status: 'completed',
          },
        ],
      },
      {
        id: 'mock_chat_4',
        title: 'So sánh chi tiêu ăn uống',
        createdAt: getPastDateString(4), // 4 days ago (Last 7 Days)
        updatedAt: getPastDateString(4),
        isPinned: false,
        messages: [
          {
            id: 'mock_msg_4_u',
            conversationId: 'mock_chat_4',
            role: 'user',
            content: 'So sánh chi tiêu ăn uống tháng này với tháng trước.',
            createdAt: getPastDateString(4, 0.1),
          },
          {
            id: 'mock_msg_4_a',
            conversationId: 'mock_chat_4',
            role: 'assistant',
            content:
              'Chi tiêu danh mục Ăn uống của bạn hiện tại là 5.525.000đ, tăng 11% so với cùng kỳ tháng trước (4.980.000đ). Nguyên nhân chủ yếu là bạn có nhiều giao dịch ăn ngoài hơn, chiếm tới 62% tổng chi phí ăn uống.',
            createdAt: getPastDateString(4, 0.05),
            status: 'completed',
          },
        ],
      },
      {
        id: 'mock_chat_5',
        title: 'Kiểm tra hóa đơn siêu thị',
        createdAt: getPastDateString(6), // 6 days ago (Last 7 Days)
        updatedAt: getPastDateString(6),
        isPinned: false,
        messages: [
          {
            id: 'mock_msg_5_u',
            conversationId: 'mock_chat_5',
            role: 'user',
            content: 'Kiểm tra giúp tôi các hóa đơn siêu thị gần đây.',
            createdAt: getPastDateString(6, 0.1),
          },
          {
            id: 'mock_msg_5_a',
            conversationId: 'mock_chat_5',
            role: 'assistant',
            content:
              'Bạn có 1 hóa đơn siêu thị được quét gần đây tại **WinMart** vào ngày 13/07/2026 với tổng trị giá **1.250.000đ**. Giao dịch này bao gồm thực phẩm tươi sống và một số vật dụng gia đình.',
            createdAt: getPastDateString(6, 0.05),
            status: 'completed',
          },
        ],
      },
      {
        id: 'mock_chat_6',
        title: 'Gợi ý tiết kiệm cho tháng sau',
        createdAt: getPastDateString(10), // 10 days ago (Older)
        updatedAt: getPastDateString(10),
        isPinned: false,
        messages: [
          {
            id: 'mock_msg_6_u',
            conversationId: 'mock_chat_6',
            role: 'user',
            content: 'Cho tôi một vài gợi ý tiết kiệm cho tháng sau.',
            createdAt: getPastDateString(10, 0.1),
          },
          {
            id: 'mock_msg_6_a',
            conversationId: 'mock_chat_6',
            role: 'assistant',
            content:
              'Chào bạn! Để tăng tỷ lệ tiết kiệm tháng tới, mình có 3 đề xuất:\n1. **Hạn chế gọi món ăn ngoài**: Đặt giới hạn ăn uống ngoài ở mức 600.000đ/tuần giúp tiết kiệm thêm ~1.000.000đ/tháng.\n2. **Hủy bớt gói dịch vụ định kỳ**: Nếu ít dùng Gym California (450.000đ/tháng) hoặc Spotify Premium (59.000đ/tháng), bạn có thể tạm dừng.\n3. **Đặt quy tắc trì hoãn 48 giờ**: Trước khi mua đồ công nghệ hoặc quần áo tại Shopee, hãy chờ 48 tiếng để xem nó có thực sự cần thiết không.',
            createdAt: getPastDateString(10, 0.05),
            status: 'completed',
          },
        ],
      },
      {
        id: 'mock_chat_7',
        title: 'Phân tích giao dịch bất thường',
        createdAt: getPastDateString(15), // 15 days ago (Older)
        updatedAt: getPastDateString(15),
        isPinned: false,
        messages: [
          {
            id: 'mock_msg_7_u',
            conversationId: 'mock_chat_7',
            role: 'user',
            content: 'Giao dịch nào bất thường trong thời gian qua?',
            createdAt: getPastDateString(15, 0.1),
          },
          {
            id: 'mock_msg_7_a',
            conversationId: 'mock_chat_7',
            role: 'assistant',
            content:
              'Phát hiện 1 giao dịch bất thường đáng lưu ý: Khoản chi **5.280.000đ** tại **Cơm niêu Sài Gòn** ngày 17/07/2026. Đây là giao dịch có giá trị vượt trội so với trung bình chi tiêu ăn uống của bạn (khoảng 150.000đ/lần). Bạn hãy kiểm tra xem đây là hóa đơn thanh toán hộ hay tiệc liên hoan nhé.',
            createdAt: getPastDateString(15, 0.05),
            status: 'completed',
          },
        ],
      },
    ];

    return mockChats;
  }
}
