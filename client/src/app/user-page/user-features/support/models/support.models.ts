export enum TicketCategoryEnum {
  General = 0,
  TransactionIssue = 1,
  BudgetIssue = 2,
  AiFeature = 3,
  AccountIssue = 4,
  BugReport = 5,
  FeatureRequest = 6,
  Other = 7,
}

export enum TicketStatusEnum {
  Pending = 0,
  InProgress = 1,
  WaitingForUser = 2,
  Resolved = 3,
  Closed = 4,
}

export enum TicketPriorityEnum {
  Low = 0,
  Normal = 1,
  High = 2,
  Urgent = 3,
}

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

// ─── SWAGGER DTOs & INTERFACES ───────────────────────────────────────────────

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: number;
}

export interface SendTicketMessageRequest {
  content: string;
}

export type SendMessageDto = SendTicketMessageRequest;

export interface AssignTicketRequest {
  assignedToId: string;
}

export interface UpdateTicketStatusRequest {
  status: number;
}

export interface UpdateTicketPriorityRequest {
  priority: number;
}

export interface TicketQueryParams {
  search?: string;
  status?: number;
  category?: number;
  page?: number;
  size?: number;
}

export interface AdminTicketQueryParams {
  search?: string;
  status?: number;
  priority?: number;
  category?: number;
  assignedToId?: string;
  page?: number;
  size?: number;
}

export interface SupportAttachmentDto {
  id?: number | string;
  ticketId?: number | string;
  messageId?: number | string;
  fileName?: string;
  name?: string;
  fileUrl?: string;
  url?: string;
  fileSize?: number;
  size?: number;
  contentType?: string;
  type?: string;
  createdAt?: string;
}

export interface SupportMessageDto {
  id: number | string;
  ticketId: number | string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  isFromAdmin?: boolean;
  content?: string;
  message?: string;
  attachmentUrl?: string;
  attachments?: SupportAttachmentDto[];
  createdAt: string;
}

export interface SupportTicketDto {
  id: number | string;
  ticketCode?: string;
  subject?: string;
  title?: string;
  description?: string;
  category: number;
  status: number;
  priority?: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface SupportTicketDetailDto extends SupportTicketDto {
  attachments?: SupportAttachmentDto[];
  messages?: SupportMessageDto[];
}

export interface PaginatedResultDto<T> {
  totalCount: number;
  page: number;
  size: number;
  items: T[];
}

export interface SupportStatsDto {
  totalCount?: number;
  total?: number;
  pendingCount?: number;
  inProgressCount?: number;
  processing?: number;
  waitingForUserCount?: number;
  awaitingUser?: number;
  resolvedCount?: number;
  closedCount?: number;
  completed?: number;
}

// Helper mapping functions
export function categoryStringToEnum(cat: SupportCategory | string): TicketCategoryEnum {
  switch (cat) {
    case 'account': return TicketCategoryEnum.AccountIssue;
    case 'wallet': return TicketCategoryEnum.TransactionIssue;
    case 'transaction': return TicketCategoryEnum.TransactionIssue;
    case 'budget': return TicketCategoryEnum.BudgetIssue;
    case 'ai': return TicketCategoryEnum.AiFeature;
    case 'payment': return TicketCategoryEnum.General;
    case 'bug': return TicketCategoryEnum.BugReport;
    case 'feedback': return TicketCategoryEnum.FeatureRequest;
    case 'other': default: return TicketCategoryEnum.Other;
  }
}

export function categoryEnumToString(cat: number): SupportCategory {
  switch (cat) {
    case TicketCategoryEnum.AccountIssue: return 'account';
    case TicketCategoryEnum.TransactionIssue: return 'transaction';
    case TicketCategoryEnum.BudgetIssue: return 'budget';
    case TicketCategoryEnum.AiFeature: return 'ai';
    case TicketCategoryEnum.BugReport: return 'bug';
    case TicketCategoryEnum.FeatureRequest: return 'feedback';
    case TicketCategoryEnum.General: return 'payment';
    case TicketCategoryEnum.Other: default: return 'other';
  }
}

export function statusStringToEnum(status: TicketStatus | string): TicketStatusEnum {
  switch (status) {
    case 'pending': return TicketStatusEnum.Pending;
    case 'processing': return TicketStatusEnum.InProgress;
    case 'awaiting_user': return TicketStatusEnum.WaitingForUser;
    case 'resolved': return TicketStatusEnum.Resolved;
    case 'closed': return TicketStatusEnum.Closed;
    default: return TicketStatusEnum.Pending;
  }
}

export function statusEnumToString(status: number): TicketStatus {
  switch (status) {
    case TicketStatusEnum.Pending: return 'pending';
    case TicketStatusEnum.InProgress: return 'processing';
    case TicketStatusEnum.WaitingForUser: return 'awaiting_user';
    case TicketStatusEnum.Resolved: return 'resolved';
    case TicketStatusEnum.Closed: return 'closed';
    default: return 'pending';
  }
}

export function priorityStringToEnum(prio: TicketPriority | string): TicketPriorityEnum {
  switch (prio) {
    case 'low': return TicketPriorityEnum.Low;
    case 'normal': return TicketPriorityEnum.Normal;
    case 'high': return TicketPriorityEnum.High;
    case 'urgent': return TicketPriorityEnum.Urgent;
    default: return TicketPriorityEnum.Normal;
  }
}

export function priorityEnumToString(prio: number): TicketPriority {
  switch (prio) {
    case TicketPriorityEnum.Low: return 'low';
    case TicketPriorityEnum.Normal: return 'normal';
    case TicketPriorityEnum.High: return 'high';
    case TicketPriorityEnum.Urgent: return 'urgent';
    default: return 'normal';
  }
}
