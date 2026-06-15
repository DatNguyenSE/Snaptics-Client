import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'vi' | 'en';

interface TranslationMap {
  [key: string]: string | TranslationMap;
}

type TranslationNode = string | TranslationMap;

const STORAGE_KEY = 'SnapticsLanguage';

const TRANSLATIONS: Record<AppLanguage, TranslationNode> = {
  vi: {
    common: {
      language: 'Ngôn ngữ',
      english: 'English',
      vietnamese: 'Tiếng Việt',
      cancel: 'Hủy',
      save: 'Lưu',
    },
    nav: {
      dashboard: 'Tổng quan',
      scan: 'Scan',
      transactions: 'Giao dịch',
      reminders: 'Nhắc nhở',
      account: 'Tài khoản',
      settings: 'Cài đặt',
      logout: 'Đăng xuất',
    },
    header: {
      greeting: 'Xin chào, {{name}}',
      subtitle: 'Hôm nay bạn đã chi bao nhiêu?',
    },
    dashboard: {
      totalPayment: 'Tổng chi',
      remainingBudget: 'Ngân sách còn lại',
      comparedToYesterday: '+12% so với hôm qua',
      used: 'Đã dùng',
      quickActions: 'Thao tác nhanh',
      aiInsights: 'Gợi ý AI',
      aiInsightPrefix: 'AI nhận thấy hôm nay bạn chi nhiều cho',
      aiInsightSuffix: 'hơn bình thường. Hãy cân nhắc giảm chi tiêu ở danh mục này.',
      usageTitle: 'Đánh giá món đồ đã mua',
      usageHint: '1 món cần được đánh giá theo mức độ sử dụng',
      recentTransactions: 'Giao dịch gần đây',
      viewAll: 'Xem tất cả',
      aiGen: 'AI GEN',
      quickAction: {
        scan: 'Quét hóa đơn',
        capture: 'Chụp món đồ',
        manual: 'Nhập thủ công',
      },
      category: {
        drinks: 'Đồ uống',
        food: 'Đồ ăn',
        travel: 'Di chuyển',
      },
    },
    transaction: {
      subtitle: 'Xem lại toàn bộ khoản chi đã quét và lưu ở một nơi.',
    },
    settings: {
      eyebrow: 'Tài khoản',
      title: 'Cài đặt',
      copy:
        'Đây là trang cài đặt tạm thời để dropdown tài khoản điều hướng đúng tới /settings.',
    },
    settingsPage: {
      title: 'Tùy chọn ứng dụng',
      subtitle: 'Quản lý tính năng AI, thông tin tài khoản và trải nghiệm chung của SpendWise.',
      aiTitle: 'Cài đặt AI',
      generalTitle: 'Chung',
      profile: {
        editAria: 'Sửa thông tin tài khoản',
        modalTitle: 'Sửa thông tin',
        modalSubtitle: 'Cập nhật tên hiển thị và email dùng trong ứng dụng.',
        fullName: 'Họ và tên',
        email: 'Email',
        success: 'Cập nhật thông tin thành công.',
      },
      ai: {
        caloriesTitle: 'Ước tính calo cho món ăn',
        caloriesDescription: 'Dùng AI để ước tính lượng calo sau khi chụp món ăn hoặc quét hóa đơn.',
        priceTitle: 'Xác nhận giá sau khi quét',
        priceDescription: 'Hiển thị bước kiểm tra giá thủ công trước khi lưu hóa đơn mới.',
        reminderTitle: 'Nhắc nhở hằng ngày',
        reminderDescription:
          'Nhắc bạn vào cuối ngày nếu vẫn còn món đã quét nhưng chưa nhập giá.',
        usageTitle: 'Theo dõi mức độ sử dụng',
        usageDescription: 'Hỏi lại xem món đồ đã mua còn được sử dụng sau 30 ngày hay không.',
      },
      general: {
        language: 'Ngôn ngữ',
        currency: 'Tiền tệ',
        budget: 'Ngân sách mỗi ngày',
        backup: 'Sao lưu đám mây',
        enabled: 'Đã bật',
      },
    },
  },
  en: {
    common: {
      language: 'Language',
      english: 'English',
      vietnamese: 'Vietnamese',
      cancel: 'Cancel',
      save: 'Save',
    },
    nav: {
      dashboard: 'Dashboard',
      scan: 'Scan',
      transactions: 'Transactions',
      reminders: 'Reminders',
      account: 'Account',
      settings: 'Settings',
      logout: 'Logout',
    },
    header: {
      greeting: 'Hello, {{name}}',
      subtitle: 'How much have you spent today?',
    },
    dashboard: {
      totalPayment: 'Total Payment',
      remainingBudget: 'Remaining Budget',
      comparedToYesterday: '+12% compared to yesterday',
      used: 'Used',
      quickActions: 'Quick Actions',
      aiInsights: 'AI Insights',
      aiInsightPrefix: 'AI noticed that today you spent more on',
      aiInsightSuffix:
        'than usual. Consider reducing your spending in this category.',
      usageTitle: 'Rate Purchased Items',
      usageHint: '1 item needs to be rated based on usage level',
      recentTransactions: 'Recent Transactions',
      viewAll: 'View All',
      aiGen: 'AI GEN',
      quickAction: {
        scan: 'Scan Receipt',
        capture: 'Snap Item',
        manual: 'Manual Entry',
      },
      category: {
        drinks: 'Drinks',
        food: 'Food',
        travel: 'Travel',
      },
    },
    transaction: {
      subtitle: 'Review every scanned and saved expense in one place.',
    },
    settings: {
      eyebrow: 'Account',
      title: 'Settings',
      copy:
        'This is a temporary settings page so the account dropdown can navigate correctly to /settings.',
    },
    settingsPage: {
      title: 'App Preferences',
      subtitle: 'Control AI features, account details, and the general SpendWise experience.',
      aiTitle: 'AI Settings',
      generalTitle: 'General',
      profile: {
        editAria: 'Edit account details',
        modalTitle: 'Edit Profile',
        modalSubtitle: 'Update the display name and email used inside the app.',
        fullName: 'Full Name',
        email: 'Email',
        success: 'Profile updated successfully.',
      },
      ai: {
        caloriesTitle: 'Calorie estimates for food',
        caloriesDescription: 'Use AI to estimate calories after a food photo or receipt scan.',
        priceTitle: 'Price confirmation after scans',
        priceDescription: 'Prompt for a manual price review before a new receipt is saved.',
        reminderTitle: 'Daily reminder',
        reminderDescription:
          'Send an end-of-day reminder when any scanned item is still missing a price.',
        usageTitle: 'Usage review follow-up',
        usageDescription:
          'Ask whether a purchased item is still being used after 30 days.',
      },
      general: {
        language: 'Language',
        currency: 'Currency',
        budget: 'Daily budget',
        backup: 'Cloud backup',
        enabled: 'Enabled',
      },
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly currentLang = signal<AppLanguage>(this.getInitialLanguage());

  constructor() {
    this.applyDocumentLanguage(this.currentLang());
  }

  setLanguage(lang: AppLanguage): void {
    if (this.currentLang() === lang) {
      return;
    }

    this.currentLang.set(lang);
    this.persistLanguage(lang);
    this.applyDocumentLanguage(lang);
  }

  locale(): string {
    return this.currentLang() === 'vi' ? 'vi-VN' : 'en-US';
  }

  t(key: string, params?: Record<string, string | number>): string {
    const template =
      this.resolveTranslation(this.currentLang(), key) ??
      this.resolveTranslation('en', key) ??
      key;

    return this.interpolate(template, params);
  }

  private getInitialLanguage(): AppLanguage {
    if (typeof window === 'undefined') {
      return 'en';
    }

    const savedLanguage = localStorage.getItem(STORAGE_KEY);

    if (savedLanguage === 'vi' || savedLanguage === 'en') {
      return savedLanguage;
    }

    return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  }

  private persistLanguage(lang: AppLanguage): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }

  private applyDocumentLanguage(lang: AppLanguage): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  private resolveTranslation(lang: AppLanguage, key: string): string | null {
    let current: TranslationNode | undefined = TRANSLATIONS[lang];

    for (const segment of key.split('.')) {
      if (typeof current !== 'object' || current === null || !(segment in current)) {
        return null;
      }

      current = current[segment];
    }

    return typeof current === 'string' ? current : null;
  }

  private interpolate(
    template: string,
    params?: Record<string, string | number>,
  ): string {
    if (!params) {
      return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = params[key];
      return value === undefined ? '' : String(value);
    });
  }
}
