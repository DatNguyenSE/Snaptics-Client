export interface SupportContactConfig {
  email: string;
  workingHours: string;
  responseWindow: string;
  liveChatAvailable: boolean;
  userGuideUrl: string;
}

export const SUPPORT_CONFIG: SupportContactConfig = {
  email: 'support@snaptics.ai',
  workingHours: '8:00 - 18:00 (Thứ 2 - Thứ 6)',
  responseWindow: 'Trong vòng 24 giờ làm việc',
  liveChatAvailable: true,
  userGuideUrl: '/docs/user-guide',
};
