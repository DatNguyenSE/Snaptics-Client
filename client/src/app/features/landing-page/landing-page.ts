import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingDashboardPreviewComponent } from './landing-dashboard-preview/landing-dashboard-preview';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LandingDashboardPreviewComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.host.css',
})
export class LandingPage {
  private readonly document = inject(DOCUMENT);

  protected isMenuOpen = false;
  protected isScrolled = false;

  protected readonly navItems = [
    { label: 'Tính năng', target: 'features' },
    { label: 'Cách hoạt động', target: 'howto' },
    { label: 'Giới thiệu', target: 'about' },
    { label: 'Liên hệ', target: 'footer' },
  ];

  protected readonly marqueeItems = [
    'Hoá đơn',
    'Giao dịch',
    'Ngân sách',
    'Nhắc nhở',
    'Phân tích',
    'Thống kê',
    'Danh mục',
    'Báo cáo',
  ];

  protected readonly marqueeTrack = [...this.marqueeItems, ...this.marqueeItems];


  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.isScrolled = window.scrollY > 12;
  }

  protected toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  protected closeMenu(): void {
    this.isMenuOpen = false;
  }

  protected scrollToSection(target: string): void {
    this.closeMenu();
    this.document.getElementById(target)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}