export type SupportCategory =
  | 'account'
  | 'wallet'
  | 'transaction'
  | 'budget'
  | 'ai'
  | 'payment'
  | 'bug'
  | 'feedback'
  | 'other';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketStatus =
  | 'pending'       // Chờ tiếp nhận
  | 'processing'    // Đang xử lý
  | 'awaiting_user' // Chờ phản hồi từ bạn
  | 'resolved'      // Đã giải quyết
  | 'closed';       // Đã đóng

export interface SupportAttachment {
  name: string;
  url: string;
  size?: number; // in bytes
  type?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderType: 'user' | 'support';
  message: string;
  attachments?: SupportAttachment[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string; // e.g. #SP-1024
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  category: SupportCategory;
  priority: TicketPriority;
  status: TicketStatus;
  attachments?: SupportAttachment[];
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportStats {
  total: number;
  processing: number;
  awaitingUser: number;
  completed: number;
}

export interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
  category: SupportCategory;
  isExpanded?: boolean;
}

export interface CreateTicketDTO {
  title: string;
  category: SupportCategory;
  priority: TicketPriority;
  description: string;
  contactEmail: string;
  attachments?: SupportAttachment[];
}
