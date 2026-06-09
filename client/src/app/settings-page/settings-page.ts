import { Component } from '@angular/core';
import { Nav } from '../user-page/user-layout/nav/nav';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [Nav],
  template: `
    <div class="settings-shell">
      <app-nav></app-nav>

      <main class="settings-page">
        <section class="settings-card">
          <p class="settings-card__eyebrow">Account</p>
          <h1 class="settings-card__title">Settings</h1>
          <p class="settings-card__copy">
            Đây là trang settings tạm thời để dropdown account điều hướng đúng tới
            <code>/settings</code>. Mình giữ giao diện đồng bộ với dashboard để bạn có thể thay
            bằng form cài đặt thật ở bước tiếp theo.
          </p>
        </section>
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: #f4f7ff;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .settings-page {
      min-height: 100vh;
      padding: 20px 16px calc(112px + env(safe-area-inset-bottom));
      color: #1b1d2e;
    }

    .settings-card {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid rgba(91, 123, 250, 0.12);
      border-radius: 28px;
      background: #ffffff;
      box-shadow: 0 18px 40px rgba(91, 123, 250, 0.08);
      padding: 28px;
    }

    .settings-card__eyebrow,
    .settings-card__title,
    .settings-card__copy {
      margin: 0;
    }

    .settings-card__eyebrow {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6870a5;
    }

    .settings-card__title {
      margin-top: 10px;
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      font-weight: 800;
      letter-spacing: -0.04em;
    }

    .settings-card__copy {
      margin-top: 12px;
      line-height: 1.7;
      color: #4a5578;
    }

    code {
      font-family: 'DM Mono', monospace;
      font-size: 0.9em;
      color: #5b7bfa;
    }

    @media (min-width: 1024px) {
      .settings-page {
        padding: 32px 32px 32px 272px;
      }
    }
  `,
})
export class SettingsPage {}
