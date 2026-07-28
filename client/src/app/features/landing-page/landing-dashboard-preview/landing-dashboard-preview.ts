import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-dashboard-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-dashboard-preview.html',
  styleUrl: './landing-dashboard-preview.css'
})
export class LandingDashboardPreviewComponent {
  protected readonly navItems = [
    { id: 'overview', label: 'Tổng quan', icon: 'space_dashboard', active: true },
    { id: 'wallet', label: 'Quản lý ví', icon: 'account_balance_wallet' },
    { id: 'transaction', label: 'Giao dịch', icon: 'receipt_long' },
    { id: 'analysis', label: 'Phân tích', icon: 'analytics' },
    { id: 'scan', label: 'Scan', icon: 'document_scanner', isScanItem: true },
    { id: 'notification', label: 'Thông báo', icon: 'notifications', badge: 4 },
    { id: 'frequency', label: 'Tần suất', icon: 'schedule' },
    { id: 'category', label: 'Loại danh mục', icon: 'category' },
    { id: 'support', label: 'Hỗ trợ', icon: 'support_agent' }
  ];

  protected readonly suggestions = [
    'Tháng này tôi chi bao nhiêu?',
    'Ăn uống tháng này hơn 500k',
    'Gợi ý tiết kiệm'
  ];

  protected readonly quickActions = [
    { label: 'Tài nguyên', icon: 'folder', color: '#8b5cf6' },
    { label: 'Phân tích', icon: 'analytics', color: '#a855f7' },
    { label: 'Đánh giá', icon: 'reviews', color: '#f59e0b' },
    { label: 'Quản lý', icon: 'account_balance_wallet', color: '#10b981' }
  ];

  protected readonly kpiCards = [
    {
      label: 'TỔNG CHI TIÊU',
      value: '0đ',
      subLabel: 'Tháng này',
      icon: 'pie_chart',
      colorClass: 'kpi-card--purple'
    },
    {
      label: 'GIAO DỊCH',
      value: '0',
      subLabel: 'Tháng này',
      icon: 'receipt_long',
      colorClass: 'kpi-card--blue'
    },
    {
      label: 'TOP DANH MỤC',
      value: '-',
      subLabel: 'Chi nhiều nhất',
      icon: 'category',
      colorClass: 'kpi-card--amber'
    },
    {
      label: 'NGÂN SÁCH',
      value: 'NaN%',
      subLabel: 'Đã sử dụng',
      icon: 'account_balance_wallet',
      colorClass: 'kpi-card--green'
    }
  ];
}
