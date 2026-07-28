export type NotificationTone = 'violet' | 'emerald' | 'blue' | 'amber' | 'rose';

export type NotificationType =
  | 'wallet_invitation'
  | 'product_review'
  | 'wallet_activity'
  | 'system'
  | 'receipt'
  | 'transaction'
  | 'manual-entry'
  | 'insight'
  | 'budget'
  | 'category'
  | 'report';

export type SystemSeverity = 'info' | 'warning' | 'critical';

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface NotificationMetadata {
  walletName?: string;
  role?: string;
  productName?: string;
  productImage?: string;
  amount?: number;
  purchaseDate?: string;
  memberName?: string;
  action?: string;
  category?: string;
  severity?: SystemSeverity;
  rating?: number;
  userComment?: string;
  itemInventoryId?: number | null;
  transactionDetailId?: number | null;
  rawType?: any;
  [key: string]: any;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  isRead: boolean;
  createdAt?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'wallet' | 'transaction' | 'product' | 'system';
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  metadata?: NotificationMetadata;
  actionStatus?: 'pending' | 'accepted' | 'rejected' | 'reviewed';
}

export interface NotificationRecord {
  id: string;
  userId?: string;
  title: LocalizedText;
  description: LocalizedText;
  time: LocalizedText;
  type: NotificationType;
  isRead: boolean;
  createdAt?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'wallet' | 'transaction' | 'product' | 'system';
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  metadata?: NotificationMetadata;
  actionStatus?: 'pending' | 'accepted' | 'rejected' | 'reviewed';
}

