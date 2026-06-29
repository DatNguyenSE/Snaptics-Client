import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'system';
const THEME_STORAGE_KEY = 'SnapticsTheme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<AppTheme>(this.getInitialTheme());
  private mediaQueryList: MediaQueryList;

  constructor() {
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Listen for OS theme changes
    this.mediaQueryList.addEventListener('change', () => {
      if (this.currentTheme() === 'system') {
        this.applyDocumentTheme('system');
      }
    });

    this.applyDocumentTheme(this.currentTheme());
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    this.persistTheme(theme);
    this.applyDocumentTheme(theme);
  }

  toggleTheme(): void {
    // Legacy toggle support, not strictly needed with 3-way switch but good to keep
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private getInitialTheme(): AppTheme {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme;
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }
    // Default to system
    return 'system';
  }

  private persistTheme(theme: AppTheme): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  private applyDocumentTheme(theme: AppTheme): void {
    let isDark = false;
    
    if (theme === 'system') {
      isDark = this.mediaQueryList.matches;
    } else {
      isDark = theme === 'dark';
    }

    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }
}
