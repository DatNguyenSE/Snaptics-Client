// ─── Admin Roles & Status ──────────────────────────────────────────────────────

export type AdminRole = 'USER' | 'ADMIN';

export type AdminUserStatus = 'active' | 'locked' | 'deleted';

export type VerificationStatus = 'verified' | 'unverified' | 'pending';

// ─── Admin User ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  verification: VerificationStatus;
  imageUrl?: string;
  totalTransactions: number;
  totalBudgets: number;
  totalScans: number;
  aiRequests: number;
  lastLogin: string;         // ISO date string
  createdAt: string;         // ISO date string
  currency: string;
  language: string;
  timezone: string;
  failedLoginAttempts: number;
  activeSessions: number;
}

export interface AdminUserDto {
  id: string;
  email: string;
  fullName?: string;
  userName?: string;
  phoneNumber?: string;
  roles: string[];
  isLocked?: boolean;
  lockoutEnd?: string;
  createdAt?: string;
}

export interface AdminUserQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isLocked?: boolean;
  role?: string;
}

// ─── Admin Dashboard Stats ────────────────────────────────────────────────────

export interface KpiCard {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'neutral';
  icon: string;
  trendData: number[];        // last N data points for sparkline
  unit?: string;              // e.g. '%', 'ms'
}

export interface SystemHealthItem {
  service: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime?: number;      // ms
}

export interface AdminDashboardStats {
  kpis: KpiCard[];
  systemHealth: SystemHealthItem[];
  avgResponseTime: number;
}

export interface RecentAdminActivity {
  id: string;
  admin: string;
  action: string;
  target: string;
  time: string;
  status: 'success' | 'failed' | 'pending';
}

export interface RecentError {
  id: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  lastOccurred: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export type CategoryType = 'expense' | 'income' | 'both';

export interface AdminCategory {
  id: string;
  nameVi: string;
  nameEn: string;
  type: CategoryType;
  icon: string;
  description?: string;
  displayOrder: number;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  updatedAt: string;
}

// ─── AI Requests ──────────────────────────────────────────────────────────────

export type AiRequestType = 'ai_chat' | 'receipt_scan' | 'product_scan';

export type AiRequestStatus = 'success' | 'low_confidence' | 'failed' | 'retrying' | 'cancelled';

export interface AiRequestLog {
  id: string;
  timestamp: string;
  maskedUser: string;
  type: AiRequestType;
  status: AiRequestStatus;
  processingTime: number;     // ms
  confidence?: number;        // 0–100
  modelVersion: string;
  errorCode?: string;
  errorMessage?: string;
  tokenUsage?: number;
  retryCount: number;
  stages?: ProcessingStage[];
}

export interface ProcessingStage {
  name: string;
  duration: number;           // ms
  status: 'success' | 'failed' | 'skipped';
}

export interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  admin: string;
  adminRole: AdminRole;
  action: string;
  target: string;
  targetId?: string;
  reason: string;
  ipAddress: string;
  device: string;
  requestId: string;
  status: 'success' | 'failed';
  riskLevel: RiskLevel;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationAudience = 'all' | 'active' | 'unverified' | 'scan_users' | 'specific';

export type NotificationChannel = 'in_app' | 'email' | 'push';

export type NotificationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  channel: NotificationChannel[];
  status: NotificationStatus;
  scheduledTime?: string;
  sentAt?: string;
  readRate?: number;          // percentage
  createdBy: string;
  createdAt: string;
}

// ─── System Settings ──────────────────────────────────────────────────────────

export interface AiServiceSettings {
  enableSnapticsAi: boolean;
  enableReceiptScan: boolean;
  enableProductScan: boolean;
  aiModelVersion: string;
  dailyAiLimit: number;
  dailyScanLimit: number;
  confidenceThreshold: number; // 0–100
}

export interface StorageSettings {
  maxUploadSizeMb: number;
  supportedFormats: string[];
  receiptRetentionDays: number;
  storageWarningThresholdGb: number;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  sessionDurationMinutes: number;
  adminSessionDurationMinutes: number;
  requireAdminTwoFactor: boolean;
  sensitiveAccessDurationMinutes: number;
}

export interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceTitle?: string;
  maintenanceMessage: string;
  estimatedCompletionTime?: string | null;
  showSupportButton?: boolean;
  scheduledMaintenance?: string;
  featureFlags: Record<string, boolean>;
}

export interface SystemSettings {
  ai: AiServiceSettings;
  storage: StorageSettings;
  security: SecuritySettings;
  maintenance: MaintenanceSettings;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Filter Options ───────────────────────────────────────────────────────────

export interface UserFilter {
  search: string;
  status: AdminUserStatus | '';
  verification: VerificationStatus | '';
  role: AdminRole | '';
  dateFrom: string;
  dateTo: string;
}

export interface AiRequestFilter {
  search: string;
  type: AiRequestType | '';
  status: AiRequestStatus | '';
  dateFrom: string;
  dateTo: string;
}

export interface AuditLogFilter {
  search: string;
  role: AdminRole | '';
  action: string;
  status: 'success' | 'failed' | '';
  riskLevel: RiskLevel | '';
  dateFrom: string;
  dateTo: string;
}
