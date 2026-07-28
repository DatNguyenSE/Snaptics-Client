// Enums matching .NET 8 Backend DTOs
export enum SupportTicketStatus {
  Pending = 0,
  InProgress = 1,
  WaitingForUser = 2,
  Resolved = 3,
  Closed = 4,
}

export enum SupportTicketPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Urgent = 3,
}

export enum SupportTicketCategory {
  General = 0,
  TransactionIssue = 1,
  BudgetIssue = 2,
  AiFeature = 3,
  AccountIssue = 4,
  BugReport = 5,
  FeatureRequest = 6,
  Other = 7,
}

// Request & Response DTOs matching Backend API
export interface CreateSupportTicketDto {
  subject: string;
  description: string;
  category: number;
}

export interface SendMessageDto {
  content: string;
}

export interface SupportAttachmentDto {
  id: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface SupportMessageDto {
  id: number;
  ticketId: number;
  senderId: string;
  senderName: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
  attachments: SupportAttachmentDto[];
}

export interface SupportTicketDto {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: SupportTicketCategory;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  messageCount: number;
}

export interface SupportTicketDetailDto extends SupportTicketDto {
  messages: SupportMessageDto[];
  attachments: SupportAttachmentDto[];
}

export interface SupportTicketStatisticsDto {
  total: number;
  pending: number;
  inProgress: number;
  waitingForUser: number;
  resolved: number;
  closed: number;
}

export interface PaginatedResultDto<T> {
  totalCount: number;
  page: number;
  size: number;
  items: T[];
}

// Helper Labels and Badges Mapping
export const CATEGORY_LABELS: Record<number, { label: string; icon: string }> = {
  [SupportTicketCategory.General]: { label: 'Chung / Thanh toán', icon: 'payments' },
  [SupportTicketCategory.TransactionIssue]: { label: 'Sự cố Giao dịch', icon: 'receipt_long' },
  [SupportTicketCategory.BudgetIssue]: { label: 'Sự cố Ngân sách', icon: 'pie_chart' },
  [SupportTicketCategory.AiFeature]: { label: 'Tính năng AI', icon: 'psychology' },
  [SupportTicketCategory.AccountIssue]: { label: 'Vấn đề Tài khoản', icon: 'manage_accounts' },
  [SupportTicketCategory.BugReport]: { label: 'Báo lỗi hệ thống', icon: 'bug_report' },
  [SupportTicketCategory.FeatureRequest]: { label: 'Yêu cầu tính năng', icon: 'thumbs_up_down' },
  [SupportTicketCategory.Other]: { label: 'Khác', icon: 'help_outline' },
};

export const STATUS_BADGES: Record<
  number,
  { label: string; bgClass: string; textClass: string; icon: string }
> = {
  [SupportTicketStatus.Pending]: {
    label: 'Chờ tiếp nhận',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    icon: 'schedule',
  },
  [SupportTicketStatus.InProgress]: {
    label: 'Đang xử lý',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500',
    icon: 'sync',
  },
  [SupportTicketStatus.WaitingForUser]: {
    label: 'Chờ phản hồi',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-500',
    icon: 'mark_chat_unread',
  },
  [SupportTicketStatus.Resolved]: {
    label: 'Đã giải quyết',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-500',
    icon: 'check_circle',
  },
  [SupportTicketStatus.Closed]: {
    label: 'Đã đóng',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    icon: 'lock',
  },
};

export const PRIORITY_BADGES: Record<
  number,
  { label: string; bgClass: string; textClass: string }
> = {
  [SupportTicketPriority.Low]: { label: 'Thấp', bgClass: 'bg-slate-500/10', textClass: 'text-slate-400' },
  [SupportTicketPriority.Normal]: { label: 'Bình thường', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400' },
  [SupportTicketPriority.High]: { label: 'Cao', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500' },
  [SupportTicketPriority.Urgent]: { label: 'Khẩn cấp', bgClass: 'bg-red-500/10', textClass: 'text-red-500' },
};
