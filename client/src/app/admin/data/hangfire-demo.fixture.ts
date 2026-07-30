import { HangfireJob } from '../models/hangfire.models';

/**
 * Demo fixture dữ liệu Hangfire Jobs.
 * Chỉ được dùng khi environment.useHangfireDemoData === true (môi trường development).
 * KHÔNG sử dụng trong production.
 */
export const HANGFIRE_DEMO_JOBS: HangfireJob[] = [
  {
    jobKey: 'daily-expense-summary',
    jobName: 'Daily Expense Summary',
    description: 'Tổng hợp dữ liệu chi tiêu hằng ngày của tất cả người dùng.',
    isEnabled: true,
    runTime: '23:30',
    cronExpression: '30 23 * * *',
    timeZone: 'Asia/Ho_Chi_Minh',
    lastRunAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    lastRunStatus: 'Success',
    nextRunAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    lastError: null,
  },
  {
    jobKey: 'periodic-rollover',
    jobName: 'Periodic Rollover',
    description: 'Chuyển dữ liệu giao dịch định kỳ sang kho lưu trữ dài hạn.',
    isEnabled: true,
    runTime: '02:00',
    cronExpression: '0 2 * * *',
    timeZone: 'Asia/Ho_Chi_Minh',
    lastRunAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    lastRunStatus: 'Success',
    nextRunAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    lastError: null,
  },
  {
    jobKey: 'item-review',
    jobName: 'Item Review',
    description: 'Kiểm tra và cập nhật trạng thái các mục cần xét duyệt.',
    isEnabled: false,
    runTime: '08:00',
    cronExpression: '0 8 * * *',
    timeZone: 'Asia/Ho_Chi_Minh',
    lastRunAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    lastRunStatus: 'Failed',
    nextRunAt: undefined,
    lastError: 'Timeout: Connection to review service exceeded 30s.',
  },
  {
    jobKey: 'cleanup-notifications',
    jobName: 'Cleanup Notifications',
    description: 'Xóa các thông báo cũ đã hết hạn khỏi hệ thống.',
    isEnabled: true,
    runTime: '03:30',
    cronExpression: '30 3 * * *',
    timeZone: 'Asia/Ho_Chi_Minh',
    lastRunAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    lastRunStatus: 'Running',
    nextRunAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
    lastError: null,
  },
  {
    jobKey: 'ai-usage-report',
    jobName: 'AI Usage Report',
    description: 'Tổng hợp báo cáo sử dụng tính năng AI trong ngày.',
    isEnabled: true,
    runTime: '00:00',
    cronExpression: '0 0 * * *',
    timeZone: 'Asia/Ho_Chi_Minh',
    lastRunAt: undefined,
    lastRunStatus: 'Pending',
    nextRunAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    lastError: null,
  },
];
