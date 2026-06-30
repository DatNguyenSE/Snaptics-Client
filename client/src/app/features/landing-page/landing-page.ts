import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.host.css',
})
export class LandingPage {
  private readonly document = inject(DOCUMENT);

  protected isMenuOpen = false;
  protected isScrolled = false;

  protected readonly navItems = [
    { label: 'Features', target: 'features' },
    { label: 'How It Works', target: 'howto' },
    { label: 'About Us', target: 'about' },
    { label: 'Contact', target: 'footer' },
  ];

  protected readonly marqueeItems = [
    'Receipts',
    'Transactions',
    'Budgets',
    'Reminders',
    'Analytics',
    'Insights',
    'Categories',
    'Reports',
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
