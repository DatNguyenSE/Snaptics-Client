import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private router = inject(Router);

  constructor() {
    this.createToastContainer();
    this.injectToastStyles();
  }

  //  Container gốc
  private createToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = `
        fixed bottom-6 right-6 flex flex-col gap-3 z-[9999]
        font-sans text-sm text-gray-800
      `;
      document.body.appendChild(container);
    }
  }

  //  Inject CSS hiệu ứng toast
  private injectToastStyles() {
    if (document.getElementById('toast-style')) return;
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.innerHTML = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(50px); }
      }
      .toast-animate-in { animation: slideIn 0.3s ease forwards; }
      .toast-animate-out { animation: fadeOut 0.4s ease forwards; }

      .toast-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        background-color: white;
        font-weight: 500;
        letter-spacing: 0.2px;
        transition: transform 0.2s ease;
      }
      .toast-item:hover { transform: scale(1.02); }

      .toast-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
      }

      .toast-success { border-left: 5px solid #22c55e; }
      .toast-error { border-left: 5px solid #ef4444; }
      .toast-warning { border-left: 5px solid #facc15; }
      .toast-info { border-left: 5px solid #3b82f6; }
    `;
    document.head.appendChild(style);
  }

  // 🔥 Tạo toast
  private createToastElement(
    message: string,
    alertClass: string,
    duration = 4000,
    avatar?: string,
    route?: string
  ) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${alertClass} toast-animate-in cursor-pointer`;

    if (route) {
      toast.addEventListener('click', () => this.router.navigateByUrl(route));
    }

    toast.innerHTML = `
      ${avatar ? `<img src="${avatar}" class="toast-icon rounded-full" alt="icon"/>` : ''}
      <span>${message}</span>
      <button class="ml-auto text-gray-400 hover:text-gray-700 font-bold text-lg">&times;</button>
    `;

    // Đóng khi bấm "x"
    toast.querySelector('button')?.addEventListener('click', () => this.removeToast(toast));

    container.appendChild(toast);

    // Tự tắt
    setTimeout(() => this.removeToast(toast), duration);
  }

  private removeToast(toast: HTMLElement) {
    toast.classList.remove('toast-animate-in');
    toast.classList.add('toast-animate-out');
    setTimeout(() => toast.remove(), 400);
  }

  // 
  success(msg: string, dur?: number, avatar?: string, route?: string) {
    this.createToastElement(msg, 'toast-success', dur, avatar, route);
  }
  error(msg: string, dur?: number, avatar?: string, route?: string) {
    this.createToastElement(msg, 'toast-error', dur, avatar, route);
  }
  warning(msg: string, dur?: number, avatar?: string, route?: string) {
    this.createToastElement(msg, 'toast-warning', dur, avatar, route);
  }
  info(msg: string, dur?: number, avatar?: string, route?: string) {
    this.createToastElement(msg, 'toast-info', dur, avatar, route);
  }
}
