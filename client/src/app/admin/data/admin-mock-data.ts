import {
  AdminUser,
  AdminCategory,
  AiRequestLog,
  AuditLog,
  AdminNotification,
  SystemSettings,
  RecentAdminActivity,
  RecentError,
  KpiCard,
  SystemHealthItem,
  FailureReason,
} from '../models/admin.models';

// ─── KPI Cards ────────────────────────────────────────────────────────────────

export const MOCK_KPI_CARDS: KpiCard[] = [
  {
    id: 'total_users',
    label: 'Total Users',
    value: 12480,
    previousValue: 11890,
    changePercent: 4.96,
    changeDirection: 'up',
    icon: 'group',
    trendData: [9800, 10200, 10600, 10900, 11200, 11600, 11890, 12100, 12480],
  },
  {
    id: 'active_users',
    label: 'Active Users',
    value: 7842,
    previousValue: 7421,
    changePercent: 5.67,
    changeDirection: 'up',
    icon: 'person_check',
    trendData: [5900, 6200, 6500, 6800, 7100, 7300, 7421, 7650, 7842],
  },
  {
    id: 'new_users',
    label: 'New Users',
    value: 624,
    previousValue: 581,
    changePercent: 7.4,
    changeDirection: 'up',
    icon: 'person_add',
    trendData: [480, 510, 490, 530, 560, 540, 581, 600, 624],
  },
  {
    id: 'ai_requests',
    label: 'AI Requests',
    value: 38492,
    previousValue: 41200,
    changePercent: -6.57,
    changeDirection: 'down',
    icon: 'smart_toy',
    trendData: [42000, 41500, 40800, 41200, 39800, 38900, 41200, 39100, 38492],
  },
  {
    id: 'total_scans',
    label: 'Total Scans',
    value: 21306,
    previousValue: 19800,
    changePercent: 7.61,
    changeDirection: 'up',
    icon: 'document_scanner',
    trendData: [17000, 17800, 18400, 18900, 19300, 19800, 20100, 20700, 21306],
  },
  {
    id: 'scan_success_rate',
    label: 'Scan Success Rate',
    value: '93.8%',
    previousValue: '92.1%',
    changePercent: 1.84,
    changeDirection: 'up',
    icon: 'verified',
    trendData: [90.2, 91.0, 91.8, 92.1, 92.4, 92.8, 92.1, 93.2, 93.8],
    unit: '%',
  },
];

// ─── System Health ─────────────────────────────────────────────────────────────

export const MOCK_SYSTEM_HEALTH: SystemHealthItem[] = [
  { service: 'API Service', status: 'operational', responseTime: 92 },
  { service: 'AI Service', status: 'operational', responseTime: 184 },
  { service: 'OCR Service', status: 'degraded', responseTime: 1240 },
  { service: 'Database', status: 'operational', responseTime: 14 },
  { service: 'Storage', status: 'operational', responseTime: 56 },
];

// ─── Recent Admin Activity ────────────────────────────────────────────────────

export const MOCK_RECENT_ACTIVITY: RecentAdminActivity[] = [
  { id: 'act_001', admin: 'Minh Nguyen', action: 'Lock User', target: 'lan.pham@gmail.com', time: '2026-07-21T14:32:00Z', status: 'success' },
  { id: 'act_002', admin: 'Minh Nguyen', action: 'Change Role', target: 'hoang.tran@gmail.com', time: '2026-07-21T13:15:00Z', status: 'success' },
  { id: 'act_003', admin: 'Admin System', action: 'Update Category', target: 'Ăn uống', time: '2026-07-21T11:02:00Z', status: 'success' },
  { id: 'act_004', admin: 'Minh Nguyen', action: 'Access Sensitive Data', target: 'bao.le@gmail.com', time: '2026-07-21T09:48:00Z', status: 'success' },
  { id: 'act_005', admin: 'Admin System', action: 'Retry AI Request', target: 'req_48291', time: '2026-07-20T22:30:00Z', status: 'failed' },
];

// ─── Recent Errors ────────────────────────────────────────────────────────────

export const MOCK_RECENT_ERRORS: RecentError[] = [
  { id: 'err_001', message: 'AI timeout — response exceeded 30s limit', severity: 'high', count: 42, lastOccurred: '2026-07-21T15:12:00Z' },
  { id: 'err_002', message: 'Invalid receipt image — unsupported format PNG with alpha', severity: 'medium', count: 87, lastOccurred: '2026-07-21T14:55:00Z' },
  { id: 'err_003', message: 'Storage upload failed — bucket quota exceeded', severity: 'critical', count: 3, lastOccurred: '2026-07-21T13:08:00Z' },
  { id: 'err_004', message: 'Authentication failure — invalid refresh token', severity: 'high', count: 15, lastOccurred: '2026-07-21T12:41:00Z' },
  { id: 'err_005', message: 'API request failed — downstream OCR service unavailable', severity: 'medium', count: 128, lastOccurred: '2026-07-21T11:20:00Z' },
];

// ─── Mock Users ───────────────────────────────────────────────────────────────

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr_001', displayName: 'Minh Nguyen', email: 'minh.nguyen@gmail.com',
    role: 'ADMIN', status: 'active', verification: 'verified',
    totalTransactions: 284, totalBudgets: 8, totalScans: 47, aiRequests: 123,
    lastLogin: '2026-07-21T10:20:00Z', createdAt: '2025-03-15T08:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 2,
  },
  {
    id: 'usr_002', displayName: 'Lan Pham', email: 'lan.pham@gmail.com',
    role: 'USER', status: 'locked', verification: 'verified',
    totalTransactions: 142, totalBudgets: 3, totalScans: 18, aiRequests: 56,
    lastLogin: '2026-07-18T14:30:00Z', createdAt: '2025-05-22T09:15:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 5, activeSessions: 0,
  },
  {
    id: 'usr_003', displayName: 'Hoang Tran', email: 'hoang.tran@gmail.com',
    role: 'SUPPORT', status: 'active', verification: 'verified',
    totalTransactions: 391, totalBudgets: 12, totalScans: 82, aiRequests: 210,
    lastLogin: '2026-07-21T08:45:00Z', createdAt: '2025-01-10T07:30:00Z',
    currency: 'VND', language: 'en', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 1,
  },
  {
    id: 'usr_004', displayName: 'Thu Nguyen', email: 'thu.nguyen@outlook.com',
    role: 'USER', status: 'active', verification: 'unverified',
    totalTransactions: 23, totalBudgets: 1, totalScans: 5, aiRequests: 14,
    lastLogin: '2026-07-19T16:10:00Z', createdAt: '2026-06-01T11:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 1, activeSessions: 1,
  },
  {
    id: 'usr_005', displayName: 'Bao Le', email: 'bao.le@company.vn',
    role: 'USER', status: 'active', verification: 'verified',
    totalTransactions: 718, totalBudgets: 24, totalScans: 196, aiRequests: 452,
    lastLogin: '2026-07-21T09:30:00Z', createdAt: '2024-11-05T06:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 3,
  },
  {
    id: 'usr_006', displayName: 'Anh Vo', email: 'anh.vo@gmail.com',
    role: 'USER', status: 'active', verification: 'verified',
    totalTransactions: 156, totalBudgets: 6, totalScans: 38, aiRequests: 89,
    lastLogin: '2026-07-20T19:22:00Z', createdAt: '2025-08-14T10:30:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 1,
  },
  {
    id: 'usr_007', displayName: 'Huy Tran', email: 'huy.tran@yahoo.com',
    role: 'USER', status: 'deleted', verification: 'verified',
    totalTransactions: 67, totalBudgets: 2, totalScans: 12, aiRequests: 31,
    lastLogin: '2026-07-10T12:00:00Z', createdAt: '2025-09-20T08:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 0,
  },
  {
    id: 'usr_008', displayName: 'Linh Pham', email: 'linh.pham@gmail.com',
    role: 'USER', status: 'active', verification: 'pending',
    totalTransactions: 8, totalBudgets: 0, totalScans: 2, aiRequests: 6,
    lastLogin: '2026-07-21T07:10:00Z', createdAt: '2026-07-18T14:00:00Z',
    currency: 'VND', language: 'en', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 2, activeSessions: 1,
  },
  {
    id: 'usr_009', displayName: 'Khanh Nguyen', email: 'khanh.nguyen@gmail.com',
    role: 'USER', status: 'active', verification: 'verified',
    totalTransactions: 342, totalBudgets: 15, totalScans: 91, aiRequests: 178,
    lastLogin: '2026-07-21T11:55:00Z', createdAt: '2025-02-28T09:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 2,
  },
  {
    id: 'usr_010', displayName: 'Mai Le', email: 'mai.le@gmail.com',
    role: 'USER', status: 'active', verification: 'verified',
    totalTransactions: 93, totalBudgets: 4, totalScans: 22, aiRequests: 47,
    lastLogin: '2026-07-20T15:40:00Z', createdAt: '2025-11-11T11:11:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 1,
  },
  {
    id: 'usr_011', displayName: 'Duc Phan', email: 'duc.phan@company.vn',
    role: 'USER', status: 'active', verification: 'verified',
    totalTransactions: 521, totalBudgets: 18, totalScans: 143, aiRequests: 312,
    lastLogin: '2026-07-21T13:20:00Z', createdAt: '2024-08-01T07:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 1,
  },
  {
    id: 'usr_012', displayName: 'Trang Bui', email: 'trang.bui@gmail.com',
    role: 'USER', status: 'locked', verification: 'verified',
    totalTransactions: 204, totalBudgets: 7, totalScans: 53, aiRequests: 98,
    lastLogin: '2026-07-15T08:00:00Z', createdAt: '2025-04-03T13:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 10, activeSessions: 0,
  },
  {
    id: 'usr_013', displayName: 'Thanh Do', email: 'thanh.do@outlook.com',
    role: 'USER', status: 'active', verification: 'unverified',
    totalTransactions: 14, totalBudgets: 1, totalScans: 3, aiRequests: 9,
    lastLogin: '2026-07-17T20:30:00Z', createdAt: '2026-05-15T10:00:00Z',
    currency: 'VND', language: 'en', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 1,
  },
  {
    id: 'usr_014', displayName: 'Long Vu', email: 'long.vu@gmail.com',
    role: 'USER', status: 'active', verification: 'verified',
    totalTransactions: 466, totalBudgets: 16, totalScans: 119, aiRequests: 234,
    lastLogin: '2026-07-21T06:50:00Z', createdAt: '2024-12-20T08:30:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 2,
  },
  {
    id: 'usr_015', displayName: 'Ngan Ly', email: 'ngan.ly@gmail.com',
    role: 'SUPER_ADMIN', status: 'active', verification: 'verified',
    totalTransactions: 0, totalBudgets: 0, totalScans: 0, aiRequests: 0,
    lastLogin: '2026-07-21T15:00:00Z', createdAt: '2024-01-01T00:00:00Z',
    currency: 'VND', language: 'vi', timezone: 'Asia/Ho_Chi_Minh',
    failedLoginAttempts: 0, activeSessions: 1,
  },
];

// ─── Mock Categories ──────────────────────────────────────────────────────────

export const MOCK_CATEGORIES: AdminCategory[] = [
  { id: 'cat_001', nameVi: 'Ăn uống', nameEn: 'Food & Dining', type: 'expense', icon: 'restaurant', description: 'Bữa ăn, cà phê, nhà hàng', displayOrder: 1, isDefault: true, isActive: true, usageCount: 8421, updatedAt: '2026-07-10T08:00:00Z' },
  { id: 'cat_002', nameVi: 'Di chuyển', nameEn: 'Transportation', type: 'expense', icon: 'directions_car', description: 'Xe buýt, taxi, xăng', displayOrder: 2, isDefault: true, isActive: true, usageCount: 5283, updatedAt: '2026-07-08T09:00:00Z' },
  { id: 'cat_003', nameVi: 'Mua sắm', nameEn: 'Shopping', type: 'expense', icon: 'shopping_bag', description: 'Quần áo, đồ dùng', displayOrder: 3, isDefault: true, isActive: true, usageCount: 4102, updatedAt: '2026-07-05T10:00:00Z' },
  { id: 'cat_004', nameVi: 'Giải trí', nameEn: 'Entertainment', type: 'expense', icon: 'sports_esports', description: 'Xem phim, du lịch', displayOrder: 4, isDefault: true, isActive: true, usageCount: 2945, updatedAt: '2026-07-01T11:00:00Z' },
  { id: 'cat_005', nameVi: 'Hóa đơn', nameEn: 'Bills & Utilities', type: 'expense', icon: 'receipt', description: 'Điện, nước, internet', displayOrder: 5, isDefault: true, isActive: true, usageCount: 6714, updatedAt: '2026-07-12T07:00:00Z' },
  { id: 'cat_006', nameVi: 'Sức khỏe', nameEn: 'Healthcare', type: 'expense', icon: 'local_hospital', description: 'Thuốc, khám bệnh', displayOrder: 6, isDefault: true, isActive: true, usageCount: 1892, updatedAt: '2026-06-28T12:00:00Z' },
  { id: 'cat_007', nameVi: 'Giáo dục', nameEn: 'Education', type: 'expense', icon: 'school', description: 'Học phí, sách vở', displayOrder: 7, isDefault: false, isActive: true, usageCount: 934, updatedAt: '2026-06-20T14:00:00Z' },
  { id: 'cat_008', nameVi: 'Nhà ở', nameEn: 'Housing', type: 'expense', icon: 'home', description: 'Thuê nhà, sửa chữa', displayOrder: 8, isDefault: false, isActive: true, usageCount: 2187, updatedAt: '2026-06-15T08:00:00Z' },
  { id: 'cat_009', nameVi: 'Lương', nameEn: 'Salary', type: 'income', icon: 'account_balance_wallet', description: 'Lương tháng', displayOrder: 1, isDefault: true, isActive: true, usageCount: 9823, updatedAt: '2026-07-15T08:00:00Z' },
  { id: 'cat_010', nameVi: 'Thu nhập tự do', nameEn: 'Freelance Income', type: 'income', icon: 'work', description: 'Làm thêm, freelance', displayOrder: 2, isDefault: false, isActive: true, usageCount: 1543, updatedAt: '2026-07-03T10:00:00Z' },
  { id: 'cat_011', nameVi: 'Thu nhập khác', nameEn: 'Other Income', type: 'income', icon: 'savings', description: 'Quà, tiền thưởng', displayOrder: 3, isDefault: false, isActive: true, usageCount: 789, updatedAt: '2026-06-25T15:00:00Z' },
  { id: 'cat_012', nameVi: 'Đầu tư', nameEn: 'Investment', type: 'both', icon: 'trending_up', description: 'Cổ phiếu, tiết kiệm', displayOrder: 9, isDefault: false, isActive: false, usageCount: 312, updatedAt: '2026-05-10T09:00:00Z' },
  { id: 'cat_013', nameVi: 'Khác', nameEn: 'Other', type: 'both', icon: 'more_horiz', description: 'Các khoản khác', displayOrder: 99, isDefault: true, isActive: true, usageCount: 3241, updatedAt: '2026-07-19T11:00:00Z' },
];

// ─── Mock AI Requests ─────────────────────────────────────────────────────────

export const MOCK_AI_REQUESTS: AiRequestLog[] = [
  { id: 'req_48291', timestamp: '2026-07-21T15:10:22Z', maskedUser: 'm***@gmail.com', type: 'receipt_scan', status: 'success', processingTime: 1840, confidence: 96.2, modelVersion: 'ocr-v3.2', retryCount: 0, stages: [{ name: 'Upload', duration: 120, status: 'success' }, { name: 'OCR', duration: 1580, status: 'success' }, { name: 'Parse', duration: 140, status: 'success' }] },
  { id: 'req_48290', timestamp: '2026-07-21T15:09:18Z', maskedUser: 'l***@gmail.com', type: 'ai_chat', status: 'success', processingTime: 2340, confidence: undefined, modelVersion: 'gpt-4o-mini', tokenUsage: 1284, retryCount: 0 },
  { id: 'req_48289', timestamp: '2026-07-21T15:08:05Z', maskedUser: 'user_10284', type: 'receipt_scan', status: 'low_confidence', processingTime: 2100, confidence: 62.1, modelVersion: 'ocr-v3.2', errorCode: 'LOW_CONF_001', errorMessage: 'Image resolution too low for accurate parsing', retryCount: 1 },
  { id: 'req_48288', timestamp: '2026-07-21T15:06:44Z', maskedUser: 'h***@gmail.com', type: 'product_scan', status: 'success', processingTime: 980, confidence: 89.4, modelVersion: 'vision-v2.1', retryCount: 0 },
  { id: 'req_48287', timestamp: '2026-07-21T15:04:31Z', maskedUser: 'b***@company.vn', type: 'ai_chat', status: 'failed', processingTime: 30012, confidence: undefined, modelVersion: 'gpt-4o-mini', tokenUsage: 0, errorCode: 'AI_TIMEOUT', errorMessage: 'Request exceeded 30 second timeout limit', retryCount: 2 },
  { id: 'req_48286', timestamp: '2026-07-21T15:02:19Z', maskedUser: 'k***@gmail.com', type: 'receipt_scan', status: 'success', processingTime: 2250, confidence: 94.8, modelVersion: 'ocr-v3.2', retryCount: 0 },
  { id: 'req_48285', timestamp: '2026-07-21T15:00:07Z', maskedUser: 'a***@gmail.com', type: 'product_scan', status: 'failed', processingTime: 450, confidence: 0, modelVersion: 'vision-v2.1', errorCode: 'UNSUPPORTED_FORMAT', errorMessage: 'File format not supported: image/bmp', retryCount: 0 },
  { id: 'req_48284', timestamp: '2026-07-21T14:58:52Z', maskedUser: 'd***@company.vn', type: 'receipt_scan', status: 'retrying', processingTime: 8200, confidence: undefined, modelVersion: 'ocr-v3.2', retryCount: 1 },
  { id: 'req_48283', timestamp: '2026-07-21T14:55:41Z', maskedUser: 'n***@gmail.com', type: 'ai_chat', status: 'success', processingTime: 1820, confidence: undefined, modelVersion: 'gpt-4o-mini', tokenUsage: 892, retryCount: 0 },
  { id: 'req_48282', timestamp: '2026-07-21T14:52:28Z', maskedUser: 'l***@gmail.com', type: 'receipt_scan', status: 'success', processingTime: 2050, confidence: 91.7, modelVersion: 'ocr-v3.2', retryCount: 0 },
  { id: 'req_48281', timestamp: '2026-07-21T14:49:15Z', maskedUser: 't***@outlook.com', type: 'product_scan', status: 'cancelled', processingTime: 0, confidence: undefined, modelVersion: 'vision-v2.1', errorCode: 'USER_CANCELLED', errorMessage: 'User cancelled request before processing', retryCount: 0 },
  { id: 'req_48280', timestamp: '2026-07-21T14:46:02Z', maskedUser: 'user_10283', type: 'receipt_scan', status: 'success', processingTime: 1940, confidence: 98.1, modelVersion: 'ocr-v3.2', retryCount: 0 },
];

// ─── Failure Reasons ──────────────────────────────────────────────────────────

export const MOCK_FAILURE_REASONS: FailureReason[] = [
  { reason: 'Blurry image', count: 312, percentage: 31.2 },
  { reason: 'Unsupported format', count: 248, percentage: 24.8 },
  { reason: 'AI timeout', count: 187, percentage: 18.7 },
  { reason: 'Invalid receipt', count: 142, percentage: 14.2 },
  { reason: 'Network interruption', count: 68, percentage: 6.8 },
  { reason: 'Storage error', count: 43, percentage: 4.3 },
];

// ─── Mock Audit Logs ──────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log_001', timestamp: '2026-07-21T14:32:00Z', admin: 'Minh Nguyen', adminRole: 'ADMIN', action: 'Lock User', target: 'Lan Pham', targetId: 'usr_002', reason: 'Multiple failed login attempts — suspicious activity detected', ipAddress: '192.168.1.42', device: 'Chrome 126 / Windows 11', requestId: 'req_lock_001', status: 'success', riskLevel: 'high', beforeValue: { status: 'active' }, afterValue: { status: 'locked' } },
  { id: 'log_002', timestamp: '2026-07-21T13:15:00Z', admin: 'Minh Nguyen', adminRole: 'ADMIN', action: 'Change Role', target: 'Hoang Tran', targetId: 'usr_003', reason: 'Promoted to Support for Q3 expansion', ipAddress: '192.168.1.42', device: 'Chrome 126 / Windows 11', requestId: 'req_role_001', status: 'success', riskLevel: 'medium', beforeValue: { role: 'USER' }, afterValue: { role: 'SUPPORT' } },
  { id: 'log_003', timestamp: '2026-07-21T11:02:00Z', admin: 'Admin System', adminRole: 'SUPER_ADMIN', action: 'Update Category', target: 'Ăn uống (cat_001)', targetId: 'cat_001', reason: 'Added more descriptive content', ipAddress: '10.0.0.1', device: 'System Automation', requestId: 'req_cat_001', status: 'success', riskLevel: 'low', beforeValue: { description: 'Bữa ăn' }, afterValue: { description: 'Bữa ăn, cà phê, nhà hàng' } },
  { id: 'log_004', timestamp: '2026-07-21T09:48:00Z', admin: 'Minh Nguyen', adminRole: 'ADMIN', action: 'Access Sensitive Data', target: 'Bao Le', targetId: 'usr_005', reason: 'Support ticket #4821 — investigating budget sync issue', ipAddress: '192.168.1.42', device: 'Chrome 126 / Windows 11', requestId: 'req_access_001', status: 'success', riskLevel: 'critical' },
  { id: 'log_005', timestamp: '2026-07-20T22:30:00Z', admin: 'Admin System', adminRole: 'ADMIN', action: 'Retry AI Request', target: 'req_48287', targetId: 'req_48287', reason: 'Auto-retry after timeout', ipAddress: '10.0.0.1', device: 'System Automation', requestId: 'req_retry_001', status: 'failed', riskLevel: 'low' },
  { id: 'log_006', timestamp: '2026-07-20T18:20:00Z', admin: 'Ngan Ly', adminRole: 'SUPER_ADMIN', action: 'Change System Setting', target: 'AI Service — Confidence Threshold', targetId: 'settings_ai', reason: 'Increasing threshold after accuracy review', ipAddress: '10.0.0.2', device: 'Safari / macOS', requestId: 'req_settings_001', status: 'success', riskLevel: 'high', beforeValue: { confidenceThreshold: 70 }, afterValue: { confidenceThreshold: 75 } },
  { id: 'log_007', timestamp: '2026-07-20T15:10:00Z', admin: 'Minh Nguyen', adminRole: 'ADMIN', action: 'Send Verification Email', target: 'Thu Nguyen', targetId: 'usr_004', reason: 'User requested manual resend via support chat', ipAddress: '192.168.1.42', device: 'Chrome 126 / Windows 11', requestId: 'req_email_001', status: 'success', riskLevel: 'low' },
  { id: 'log_008', timestamp: '2026-07-20T12:05:00Z', admin: 'Hoang Tran', adminRole: 'SUPPORT', action: 'Unlock User', target: 'Trang Bui', targetId: 'usr_012', reason: 'User confirmed identity via phone call', ipAddress: '192.168.2.18', device: 'Firefox 128 / Ubuntu', requestId: 'req_unlock_001', status: 'success', riskLevel: 'medium', beforeValue: { status: 'locked' }, afterValue: { status: 'active' } },
];

// ─── Mock Notifications ───────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: AdminNotification[] = [
  { id: 'notif_001', title: 'Tính năng quét hóa đơn mới', message: 'Snaptics AI nâng cấp tính năng quét hóa đơn với độ chính xác cao hơn. Cập nhật ngay để trải nghiệm!', audience: 'all', channel: ['in_app', 'push'], status: 'sent', sentAt: '2026-07-15T09:00:00Z', readRate: 68.4, createdBy: 'Ngan Ly', createdAt: '2026-07-14T16:00:00Z' },
  { id: 'notif_002', title: 'Xác thực email của bạn', message: 'Tài khoản của bạn chưa được xác thực. Vui lòng xác thực email để tiếp tục sử dụng đầy đủ tính năng.', audience: 'unverified', channel: ['email', 'in_app'], status: 'sent', sentAt: '2026-07-18T14:00:00Z', readRate: 42.1, createdBy: 'Minh Nguyen', createdAt: '2026-07-18T10:00:00Z' },
  { id: 'notif_003', title: 'Bảo trì hệ thống dự kiến', message: 'Hệ thống sẽ bảo trì từ 02:00–04:00 ngày 25/07/2026. Một số tính năng có thể bị gián đoạn.', audience: 'active', channel: ['in_app', 'push', 'email'], status: 'scheduled', scheduledTime: '2026-07-24T19:00:00Z', createdBy: 'Ngan Ly', createdAt: '2026-07-21T15:00:00Z' },
  { id: 'notif_004', title: 'Mẹo tiết kiệm tháng 7', message: 'Bạn đã chi tiêu vượt ngân sách ăn uống trong 2 tuần qua. Hãy xem phân tích chi tiết của Snaptics AI!', audience: 'scan_users', channel: ['in_app'], status: 'draft', createdBy: 'Hoang Tran', createdAt: '2026-07-21T11:00:00Z' },
  { id: 'notif_005', title: 'Thông báo cập nhật điều khoản', message: 'Chúng tôi đã cập nhật điều khoản sử dụng và chính sách quyền riêng tư. Vui lòng đọc và xác nhận.', audience: 'all', channel: ['email', 'in_app'], status: 'failed', sentAt: '2026-07-20T08:00:00Z', createdBy: 'Ngan Ly', createdAt: '2026-07-19T14:00:00Z' },
];

// ─── System Settings ──────────────────────────────────────────────────────────

export const MOCK_SYSTEM_SETTINGS: SystemSettings = {
  ai: {
    enableSnapticsAi: true,
    enableReceiptScan: true,
    enableProductScan: true,
    aiModelVersion: 'gpt-4o-mini',
    dailyAiLimit: 50,
    dailyScanLimit: 20,
    confidenceThreshold: 75,
  },
  storage: {
    maxUploadSizeMb: 10,
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'],
    receiptRetentionDays: 365,
    storageWarningThresholdGb: 80,
  },
  security: {
    maxLoginAttempts: 5,
    sessionDurationMinutes: 10080,  // 7 days
    adminSessionDurationMinutes: 480, // 8 hours
    requireAdminTwoFactor: false,
    sensitiveAccessDurationMinutes: 30,
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
    scheduledMaintenance: undefined,
    featureFlags: {
      enableBudgetV2: true,
      enableAiInsights: true,
      enableReceiptHistory: false,
      enableMultiCurrency: false,
    },
  },
};

// ─── Chart data helpers ───────────────────────────────────────────────────────

export const MOCK_USER_GROWTH_DATA = {
  labels: Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-06-22');
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  }),
  newUsers: [18, 22, 19, 25, 28, 21, 24, 31, 27, 33, 29, 35, 38, 32, 40, 36, 42, 39, 44, 41, 48, 45, 52, 49, 55, 58, 51, 61, 57, 62],
  activeUsers: [7100, 7120, 7095, 7180, 7210, 7190, 7240, 7280, 7260, 7320, 7310, 7380, 7410, 7390, 7450, 7430, 7480, 7460, 7520, 7500, 7560, 7550, 7600, 7580, 7650, 7680, 7660, 7720, 7790, 7842],
};

export const MOCK_AI_USAGE_DATA = {
  labels: Array.from({ length: 14 }, (_, i) => {
    const d = new Date('2026-07-08');
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  }),
  aiChat: [2210, 2480, 2320, 2590, 2710, 2650, 2380, 2830, 2920, 2780, 3010, 2890, 3120, 3050],
  receiptScan: [890, 980, 940, 1020, 1100, 1050, 960, 1140, 1180, 1120, 1220, 1160, 1280, 1210],
  productScan: [420, 480, 450, 510, 550, 530, 470, 580, 610, 570, 640, 600, 670, 640],
};
