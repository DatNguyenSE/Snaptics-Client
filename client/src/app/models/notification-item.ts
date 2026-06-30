export type NotificationTone = 'violet' | 'emerald' | 'blue' | 'amber' | 'rose';
export type NotificationType =
  | 'receipt'
  | 'transaction'
  | 'manual-entry'
  | 'insight'
  | 'budget'
  | 'category'
  | 'report';

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  isRead: boolean;
}

export interface NotificationRecord {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  time: LocalizedText;
  type: NotificationType;
  isRead: boolean;
}
