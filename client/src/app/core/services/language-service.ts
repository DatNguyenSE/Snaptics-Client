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
      language: 'Ng\u00f4n ng\u1eef',
      english: 'Ti\u1ebfng Anh',
      vietnamese: 'Ti\u1ebfng Vi\u1ec7t',
      back: 'Quay l\u1ea1i',
      cancel: 'H\u1ee7y',
      save: 'L\u01b0u',
      loading: '\u0110ang t\u1ea3i...',
      loadError: 'Kh\u00f4ng th\u1ec3 t\u1ea3i d\u1eef li\u1ec7u. Vui l\u00f2ng th\u1eed l\u1ea1i.',
      retry: 'Th\u1eed l\u1ea1i',
    },
    nav: {
      dashboard: 'T\u1ed5ng quan',
      scan: 'Scan',
      snapItem: 'Ch\u1ee5p m\u00f3n \u0111\u1ed3',
      manualEntry: 'Nh\u1eadp th\u1ee7 c\u00f4ng',
      transactions: 'Giao d\u1ecbch',
      reminders: 'Nh\u1eafc nh\u1edf',
      account: 'T\u00e0i kho\u1ea3n',
      settings: 'C\u00e0i \u0111\u1eb7t',
      logout: '\u0110\u0103ng xu\u1ea5t',
      analysis: 'Ph\u00e2n t\u00edch',
    },
    header: {
      greeting: 'Xin ch\u00e0o, {{name}}',
      subtitle: 'H\u00f4m nay b\u1ea1n \u0111\u00e3 chi bao nhi\u00eau?',
      notifications: 'Th\u00f4ng b\u00e1o',
    },
    notifications: {
      title: 'Ho\u1ea1t \u0111\u1ed9ng g\u1ea7n \u0111\u00e2y',
      subtitle: 'C\u1eadp nh\u1eadt t\u1eeb qu\u00e9t h\u00f3a \u0111\u01a1n, giao d\u1ecbch v\u00e0 ng\u00e2n s\u00e1ch',
      empty: 'Ch\u01b0a c\u00f3 ho\u1ea1t \u0111\u1ed9ng g\u1ea7n \u0111\u00e2y.',
      markAllRead: '\u0110\u00e1nh d\u1ea5u \u0111\u00e3 xem',
      types: {
        receipt: 'H\u00f3a \u0111\u01a1n',
        transaction: 'Giao d\u1ecbch',
        manualEntry: 'Nh\u1eadp tay',
        insight: 'Xu h\u01b0\u1edbng',
        budget: 'Ng\u00e2n s\u00e1ch',
        category: 'Danh m\u1ee5c',
        report: 'B\u00e1o c\u00e1o',
      },
      items: {
        receiptScanned: {
          title: 'Qu\u00e9t h\u00f3a \u0111\u01a1n th\u00e0nh c\u00f4ng',
          description:
            '\u0110\u00e3 th\u00eam 3 m\u00f3n t\u1eeb receipt Cafe Luna v\u00e0o d\u00f2ng th\u1eddi gian chi ti\u00eau.',
        },
        transactionAdded: {
          title: '\u0110\u00e3 th\u00eam giao d\u1ecbch m\u1edbi',
          description:
            'Kho\u1ea3n chi 245.000 VND t\u1ea1i Co-op Food \u0111\u00e3 xu\u1ea5t hi\u1ec7n trong l\u1ecbch s\u1eed giao d\u1ecbch.',
        },
        manualEntrySaved: {
          title: '\u0110\u00e3 l\u01b0u giao d\u1ecbch nh\u1eadp tay',
          description:
            'M\u1ee5c ph\u00ed g\u1eedi xe b\u1ea1n v\u1eeba nh\u1eadp \u0111\u00e3 \u0111\u01b0\u1ee3c l\u01b0u v\u00e0o Transactions.',
        },
        spendingIncreased: {
          title: 'Chi ti\u00eau Food & Drinks \u0111ang t\u0103ng',
          description:
            'Danh m\u1ee5c n\u00e0y t\u0103ng 18% so v\u1edbi h\u00f4m qua sau c\u00e1c giao d\u1ecbch bu\u1ed5i s\u00e1ng.',
        },
        budgetNearlyReached: {
          title: 'Ng\u00e2n s\u00e1ch th\u00e1ng s\u1eafp \u0111\u1ea1t gi\u1edbi h\u1ea1n',
          description:
            'B\u1ea1n \u0111\u00e3 d\u00f9ng 87% ng\u00e2n s\u00e1ch th\u00e1ng n\u00e0y. H\u00e3y theo d\u00f5i c\u00e1c kho\u1ea3n chi l\u1edbn.',
        },
        categoryUpdated: {
          title: '\u0110\u00e3 c\u1eadp nh\u1eadt danh m\u1ee5c giao d\u1ecbch',
          description:
            'Matcha latte \u0111\u00e3 \u0111\u01b0\u1ee3c chuy\u1ec3n sang danh m\u1ee5c Food & Drinks \u0111\u1ec3 b\u00e1o c\u00e1o ch\u00ednh x\u00e1c h\u01a1n.',
        },
        reportGenerated: {
          title: '\u0110\u00e3 t\u1ea1o b\u00e1o c\u00e1o chi ti\u00eau',
          description:
            'B\u1ea3n t\u1ed5ng k\u1ebft chi ti\u00eau h\u00e0ng tu\u1ea7n c\u1ee7a b\u1ea1n \u0111\u00e3 s\u1eb5n s\u00e0ng \u0111\u1ec3 xem.',
        },
      },
      times: {
        twoMinutesAgo: '2 ph\u00fat tr\u01b0\u1edbc',
        tenMinutesAgo: '10 ph\u00fat tr\u01b0\u1edbc',
        thirtyMinutesAgo: '30 ph\u00fat tr\u01b0\u1edbc',
        today: 'H\u00f4m nay',
        oneHourAgo: '1 gi\u1edd tr\u01b0\u1edbc',
        yesterday: 'H\u00f4m qua',
      },
    },
    dashboard: {
      totalPayment: 'T\u1ed5ng chi',
      remainingBudget: 'Ng\u00e2n s\u00e1ch c\u00f2n l\u1ea1i',
      defaultWallet: 'Ví mặc định',
      otherWallets: 'ví khác',
      selectWallet: 'Chọn ví hoạt động',
      remaining: 'còn lại',
      comparedToYesterday: '+12% so v\u1edbi h\u00f4m qua',
      used: '\u0110\u00e3 d\u00f9ng',
      quickActions: 'Thao t\u00e1c nhanh',
      aiInsights: 'G\u1ee3i \u00fd AI',
      aiInsightPrefix: 'AI nh\u1eadn th\u1ea5y h\u00f4m nay b\u1ea1n chi nhi\u1ec1u cho',
      aiInsightSuffix:
        'h\u01a1n b\u00ecnh th\u01b0\u1eddng. H\u00e3y c\u00e2n nh\u1eafc gi\u1ea3m chi ti\u00eau \u1edf danh m\u1ee5c n\u00e0y.',
      usageTitle: '\u0110\u00e1nh gi\u00e1 m\u00f3n \u0111\u1ed3 \u0111\u00e3 mua',
      usageHint: '1 m\u00f3n c\u1ea7n \u0111\u01b0\u1ee3c \u0111\u00e1nh gi\u00e1 theo m\u1ee9c \u0111\u1ed9 s\u1eed d\u1ee5ng',
      recentTransactions: 'Giao d\u1ecbch g\u1ea7n \u0111\u00e2y',
      viewAll: 'Xem t\u1ea5t c\u1ea3',
      aiGen: 'AI GEN',
      weeklySpending: 'Chi tiêu tuần này',
      byCategory: 'Theo danh mục',
      quickAction: {
        scan: 'Qu\u00e9t h\u00f3a \u0111\u01a1n',
        capture: 'Ch\u1ee5p m\u00f3n \u0111\u1ed3',
        manual: 'Nh\u1eadp th\u1ee7 c\u00f4ng',
        createBudget: 'Quản lý ví',
      },
      category: {
        drinks: '\u0110\u1ed3 u\u1ed1ng',
        drink: '\u0110\u1ed3 u\u1ed1ng',
        food: '\u0110\u1ed3 \u0103n',
        travel: 'Di chuy\u1ec3n',
        bill: 'H\u00f3a \u0111\u01a1n',
        animals: 'Th\u00fa c\u01b0ng',
        electronics: '\u0110i\u1ec7n t\u1eed',
        household: 'Gia d\u1ee5ng',
        other: 'Kh\u00e1c',
      },
      createBudgetModal: {
        title: 'T\u1ea1o budget m\u1edbi',
        name: 'T\u00ean budget',
        amount: 'S\u1ed1 ti\u1ec1n gi\u1edbi h\u1ea1n',
        period: 'Chu k\u1ef3',
        startDate: 'Ng\u00e0y b\u1eaft \u0111\u1ea7u',
        endDate: 'Ng\u00e0y k\u1ebft th\u00fac',
        category: 'Danh m\u1ee5c',
        note: 'Ghi ch\u00fa',
        weekly: 'H\u00e0ng tu\u1ea7n',
        monthly: 'H\u00e0ng th\u00e1ng',
        custom: 'T\u00f9y ch\u1ec9nh',
        submit: 'T\u1ea1o budget',
        cancel: 'H\u1ee7y',
        submitting: '\u0110ang t\u1ea1o...',
        success: 'T\u1ea1o budget th\u00e0nh c\u00f4ng',
        errorFallback: 'Kh\u00f4ng th\u1ec3 t\u1ea1o budget. Vui l\u00f2ng th\u1eed l\u1ea1i.',
        allCategories: 'T\u1ea5t c\u1ea3 danh m\u1ee5c',
        amountMinError: 'S\u1ed1 ti\u1ec1n ph\u1ea3i l\u1edbn h\u01a1n 0',
        nameRequired: 'T\u00ean budget l\u00e0 b\u1eaft bu\u1ed9c',
        amountRequired: 'S\u1ed1 ti\u1ec1n gi\u1edbi h\u1ea1n l\u00e0 b\u1eaft bu\u1ed9c',
        startDateRequired: 'Ng\u00e0y b\u1eaft \u0111\u1ea7u l\u00e0 b\u1eaft bu\u1ed9c',
        endDateRequired: 'Ng\u00e0y k\u1ebft th\u00fac l\u00e0 b\u1eaft bu\u1ed9c khi ch\u1ecdn chu k\u1ef3 t\u00f9y ch\u1ec9nh',
        endDateMinError: 'Ng\u00e0y k\u1ebft th\u00fac kh\u00f4ng \u0111\u01b0\u1ee3c nh\u1ecf h\u01a1n ng\u00e0y b\u1eaft \u0111\u1ea7u',
      },
    },
    scan: {
      eyebrow: 'Qu\u00e9t',
      title: 'Qu\u00e9t h\u00f3a \u0111\u01a1n',
      progressAria: 'Ti\u1ebfn tr\u00ecnh qu\u00e9t h\u00f3a \u0111\u01a1n',
      steps: {
        upload: 'T\u1ea3i l\u00ean',
        aiRead: 'AI \u0111\u1ecdc',
        confirm: 'X\u00e1c nh\u1eadn',
        save: 'L\u01b0u',
      },
      state: {
        analyzing: '\u0110ang ph\u00e2n t\u00edch',
        ready: 'S\u1eb5n s\u00e0ng',
        saving: '\u0110ang l\u01b0u',
        error: 'L\u1ed7i',
        waiting: '\u0110ang ch\u1edd',
      },
      uploadPreviewAria: 'Khu v\u1ef1c xem tr\u01b0\u1edbc khi t\u1ea3i l\u00ean',
      previewBadge: 'Xem tr\u01b0\u1edbc',
      uploadTitle: 'Th\u1ea3 h\u00f3a \u0111\u01a1n \u0111\u1ec3 b\u1eaft \u0111\u1ea7u',
      uploadDescription:
        'T\u1ea3i t\u1ec7p l\u00ean ho\u1eb7c d\u00f9ng camera \u0111\u1ec3 t\u1ea1o b\u1ea3n xem tr\u01b0\u1edbc h\u00f3a \u0111\u01a1n.',
      captureReceipt: 'Ch\u1ee5p h\u00f3a \u0111\u01a1n',
      uploadImage: 'T\u1ea3i \u1ea3nh l\u00ean',
      cameraPreviewAria: 'Khu v\u1ef1c xem tr\u01b0\u1edbc camera',
      takePhoto: 'Ch\u1ee5p \u1ea3nh',
      loadingPreviewAria: 'Khu v\u1ef1c \u0111ang x\u1eed l\u00fd',
      savingTitle: '\u0110ang l\u01b0u h\u00f3a \u0111\u01a1n',
      readingTitle: 'AI \u0111ang \u0111\u1ecdc h\u00f3a \u0111\u01a1n',
      savingDescription:
        'Vui l\u00f2ng ch\u1edd trong khi ch\u00fang t\u00f4i th\u00eam giao d\u1ecbch n\u00e0y v\u00e0o danh s\u00e1ch c\u1ee7a b\u1ea1n.',
      readingDescription:
        'Đợi tí nhé bạn yêu, AI đang "căng mắt" phân tích ảnh nè...',
      errorAria: 'Khu v\u1ef1c th\u00f4ng b\u00e1o l\u1ed7i',
      errorTitle: '\u00d4i kh\u00f4ng!',
      retake: 'Ch\u1ee5p l\u1ea1i',
      editHint:
        'B\u1ea1n c\u00f3 th\u1ec3 ch\u1ec9nh t\u1eebng d\u00f2ng tr\u01b0\u1edbc khi l\u01b0u h\u00f3a \u0111\u01a1n v\u00e0o danh s\u00e1ch giao d\u1ecbch.',
      storePlaceholder: 'T\u00ean c\u1eeda h\u00e0ng',
      total: 'T\u1ed5ng c\u1ed9ng',
      confirmSave: 'X\u00e1c nh\u1eadn v\u00e0 l\u01b0u',
      unknownStore: 'C\u1eeda h\u00e0ng kh\u00f4ng r\u00f5',
      error: {
        noData:
          'Kh\u00f4ng t\u00ecm th\u1ea5y d\u1eef li\u1ec7u h\u00f3a \u0111\u01a1n. Vui l\u00f2ng th\u1eed l\u1ea1i v\u1edbi \u1ea3nh r\u00f5 h\u01a1n.',
        readFailed: '\u0110\u1ecdc h\u00f3a \u0111\u01a1n th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.',
      },
      toast: {
        cameraLoading: 'Vui lòng chờ camera tải xong...',
        captureError: 'Không thể chụp ảnh, vui lòng thử lại.',
        cameraError:
          'Không thể truy cập camera. Vui lòng kiểm tra quyền.',
        selectCategory:
          'Vui lòng chọn danh mục cho tất cả món trước khi lưu.',
        saved: '\u0110\u00e3 l\u01b0u h\u00f3a \u0111\u01a1n v\u00e0o danh s\u00e1ch giao d\u1ecbch.',
        saveFailed: 'L\u01b0u h\u00f3a \u0111\u01a1n th\u1ea5t b\u1ea1i.',
      },
      category: {
        unassigned: 'Ch\u01b0a ph\u00e2n lo\u1ea1i',
      },
      modeNav: {
        label: 'Chế độ quét',
      },
      mode: {
        receipt: 'Quét hóa đơn',
        item: 'Quét món đồ',
      },
      instruction: {
        receipt: 'Căn chỉnh hóa đơn vào giữa khung hình để quét',
        item: 'Chụp ảnh sản phẩm để AI nhận diện và trích xuất',
      },
      gallery: 'Tải ảnh lên',
      camera: {
        initializing: 'Đang khởi tạo camera...',
        pleaseWait: 'Vui lòng đợi giây lát',
        deniedTitle: 'Quyền truy cập camera bị từ chối',
        deniedSub: 'Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt để sử dụng tính năng này.',
        retryPermission: 'Cấp lại quyền truy cập',
        unavailableTitle: 'Không tìm thấy camera',
        unavailableSub: 'Thiết bị của bạn không có camera khả dụng hoặc camera đang bị ứng dụng khác chiếm dụng.',
        unsupportedTitle: 'Trình duyệt không hỗ trợ camera',
        unsupportedSub: 'Vui lòng nâng cấp trình duyệt hoặc sử dụng trình duyệt khác được hỗ trợ.',
      },
    },
    snapItem: {
      eyebrow: 'Thao t\u00e1c nhanh',
      title: 'Ch\u1ee5p m\u00f3n \u0111\u1ed3',
      subtitle:
        'Ch\u1ee5p s\u1ea3n ph\u1ea9m ho\u1eb7c t\u1ea3i \u1ea3nh l\u00ean, sau \u0111\u00f3 x\u00e1c nh\u1eadn th\u00f4ng tin \u0111\u01b0\u1ee3c tr\u00edch xu\u1ea5t tr\u01b0\u1edbc khi l\u01b0u.',
      emptyTitle: 'Ch\u1ee5p ho\u1eb7c t\u1ea3i \u1ea3nh m\u00f3n \u0111\u1ed3',
      emptyDescription:
        'Ch\u00fang t\u00f4i s\u1ebd chu\u1ea9n b\u1ecb b\u1ea3n nh\u00e1p c\u00f3 th\u1ec3 ch\u1ec9nh s\u1eeda g\u1ed3m t\u00ean m\u00f3n, s\u1ed1 ti\u1ec1n, danh m\u1ee5c, ng\u00e0y v\u00e0 ghi ch\u00fa.',
      previewAlt: 'Xem tr\u01b0\u1edbc \u1ea3nh m\u00f3n \u0111\u1ed3 \u0111\u00e3 ch\u1ecdn',
      savingTitle: '\u0110ang l\u01b0u m\u00f3n \u0111\u1ed3',
      extractingTitle: '\u0110ang tr\u00edch xu\u1ea5t th\u00f4ng tin m\u00f3n \u0111\u1ed3',
      savingDescription:
        '\u0110ang th\u00eam m\u00f3n n\u00e0y v\u00e0o d\u00f2ng th\u1eddi gian giao d\u1ecbch c\u1ee7a b\u1ea1n.',
      extractingDescription:
        'H\u00e3y xem l\u1ea1i c\u00e1c gi\u00e1 tr\u1ecb \u0111\u1ec1 xu\u1ea5t sau khi s\u1eb5n s\u00e0ng.',
      aiReadyMessage:
        'AI \u0111\u00e3 \u0111i\u1ec1n b\u1ea3n nh\u00e1p cho b\u1ea1n. H\u00e3y ki\u1ec3m tra l\u1ea1i th\u00f4ng tin tr\u01b0\u1edbc khi l\u01b0u.',
      mockReadyMessage:
        '\u0110\u00e3 chu\u1ea9n b\u1ecb b\u1ea3n nh\u00e1p m\u1eabu v\u00ec ch\u01b0a c\u00f3 ph\u1ea3n h\u1ed3i AI \u0111\u1ea7y \u0111\u1ee7.',
      takePhoto: 'Ch\u1ee5p \u1ea3nh',
      uploadImage: 'T\u1ea3i \u1ea3nh l\u00ean',
      retake: 'Ch\u1ee5p l\u1ea1i',
      confirmationEyebrow: 'X\u00e1c nh\u1eadn',
      confirmationTitle: 'Xem l\u1ea1i th\u00f4ng tin \u0111\u00e3 tr\u00edch xu\u1ea5t',
      aiBadge: 'AI h\u1ed7 tr\u1ee3',
      mockBadge: 'B\u1ea3n nh\u00e1p m\u1eabu',
      saveLabel: 'L\u01b0u m\u00f3n',
      toast: {
        saved: '\u0110\u00e3 l\u01b0u m\u00f3n v\u00e0o danh s\u00e1ch giao d\u1ecbch.',
        saveFailed: 'Kh\u00f4ng th\u1ec3 l\u01b0u m\u00f3n l\u00fac n\u00e0y.',
      },
      error: {
        extractFailed:
          'Kh\u00f4ng th\u1ec3 tr\u00edch xu\u1ea5t th\u00f4ng tin m\u00f3n t\u1eeb \u1ea3nh n\u00e0y.',
      },
    },
    manualEntry: {
      eyebrow: 'Thao t\u00e1c nhanh',
      title: 'Nh\u1eadp th\u1ee7 c\u00f4ng',
      subtitle:
        'Th\u00eam kho\u1ea3n chi theo c\u00e1ch th\u1ee7 c\u00f4ng khi b\u1ea1n \u0111\u00e3 bi\u1ebft t\u00ean m\u00f3n, s\u1ed1 ti\u1ec1n, danh m\u1ee5c v\u00e0 th\u00f4ng tin thanh to\u00e1n.',
      badge: 'B\u1ea3n nh\u00e1p chi ti\u00eau nhanh',
      entryEyebrow: 'Chi ti\u1ebft giao d\u1ecbch',
      entryTitle: 'L\u01b0u giao d\u1ecbch trong m\u1ed9t b\u01b0\u1edbc',
      entryDescription:
        'C\u00e1c tr\u01b0\u1eddng b\u1eaft bu\u1ed9c l\u00e0 t\u00ean m\u00f3n, s\u1ed1 ti\u1ec1n v\u00e0 ng\u00e0y. C\u00e1c th\u00f4ng tin kh\u00e1c l\u00e0 t\u00f9y ch\u1ecdn nh\u01b0ng gi\u00fap d\u00f2ng th\u1eddi gian g\u1ecdn g\u00e0ng h\u01a1n.',
      saveLabel: 'L\u01b0u giao d\u1ecbch',
      toast: {
        saved: '\u0110\u00e3 l\u01b0u giao d\u1ecbch th\u1ee7 c\u00f4ng v\u00e0o danh s\u00e1ch.',
        saveFailed: 'Kh\u00f4ng th\u1ec3 l\u01b0u giao d\u1ecbch n\u00e0y l\u00fac n\u00e0y.',
      },
    },
    reminder: {
      eyebrow: 'Nh\u1eafc nh\u1edf',
      allResolvedTitle: '\u0110\u00e3 x\u1eed l\u00fd xong to\u00e0n b\u1ed9 nh\u1eafc nh\u1edf',
      pendingTitle: '{{count}} nh\u1eafc nh\u1edf gi\u00e1',
      allResolvedSubtitle:
        'T\u1ed5ng chi ti\u00eau c\u1ee7a b\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt \u0111\u1ea7y \u0111\u1ee7.',
      pendingSubtitle:
        'Th\u00eam c\u00e1c gi\u00e1 c\u00f2n thi\u1ebfu b\u00ean d\u01b0\u1edbi \u0111\u1ec3 gi\u1eef t\u1ed5ng chi trong ng\u00e0y ch\u00ednh x\u00e1c.',
      successTitle: 'M\u1ecdi th\u1ee9 \u0111\u1ec1u \u0111\u00e3 c\u1eadp nh\u1eadt',
      successDescription:
        'T\u1ea5t c\u1ea3 m\u1ee5c nh\u1eafc nh\u1edf \u0111\u00e3 c\u00f3 gi\u00e1 x\u00e1c nh\u1eadn v\u00e0 kh\u00f4ng c\u1ea7n thao t\u00e1c th\u00eam.',
      summary:
        'H\u00e3y ho\u00e0n t\u1ea5t c\u00e1c c\u1eadp nh\u1eadt n\u00e0y tr\u01b0\u1edbc cu\u1ed1i ng\u00e0y \u0111\u1ec3 g\u1ee3i \u00fd tr\u00ean dashboard lu\u00f4n ch\u00ednh x\u00e1c.',
      updatedBadge: '\u0110\u00e3 c\u1eadp nh\u1eadt',
      missingPriceBadge: 'Thi\u1ebfu gi\u00e1',
      enterPrice: 'Nh\u1eadp gi\u00e1',
      updatedCopy:
        '\u0110\u00e3 th\u00eam {{amount}} VND v\u00e0o t\u1ed5ng chi ti\u00eau trong ng\u00e0y.',
      updateButton: 'C\u1eadp nh\u1eadt t\u1ed5ng chi ti\u00eau',
      toast: {
        updated: '\u0110\u00e3 c\u1eadp nh\u1eadt gi\u00e1 cho c\u00e1c m\u1ee5c nh\u1eafc nh\u1edf.',
      },
    },
    entryForm: {
      title: 'T\u00ean m\u00f3n',
      titlePlaceholder: 'VD: Matcha latte',
      amount: 'S\u1ed1 ti\u1ec1n',
      amountPlaceholder: '0',
      category: 'Danh m\u1ee5c',
      categoryPlaceholder: 'Ch\u1ecdn danh m\u1ee5c',
      date: 'Ng\u00e0y',
      paymentMethodTitle: 'Ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n',
      note: 'Ghi ch\u00fa',
      notePlaceholder: 'Th\u00eam ghi ch\u00fa ho\u1eb7c ng\u1eef c\u1ea3nh cho kho\u1ea3n chi n\u00e0y',
      saving: '\u0110ang l\u01b0u...',
      error: {
        titleRequired: 'T\u00ean m\u00f3n l\u00e0 b\u1eaft bu\u1ed9c.',
        amountRequired: 'S\u1ed1 ti\u1ec1n l\u00e0 b\u1eaft bu\u1ed9c.',
        dateRequired: 'Ng\u00e0y l\u00e0 b\u1eaft bu\u1ed9c.',
        required: 'Tr\u01b0\u1eddng n\u00e0y l\u00e0 b\u1eaft bu\u1ed9c.',
        amountMin: 'S\u1ed1 ti\u1ec1n ph\u1ea3i l\u1edbn h\u01a1n 0.',
      },
      paymentMethod: {
        cash: 'Ti\u1ec1n m\u1eb7t',
        debitcard: 'Th\u1ebb ghi n\u1ee3',
        creditcard: 'Th\u1ebb t\u00edn d\u1ee5ng',
        banktransfer: 'Chuy\u1ec3n kho\u1ea3n',
        ewallet: 'V\u00ed \u0111i\u1ec7n t\u1eed',
      },
    },
    transaction: {
      subtitle: 'Xem l\u1ea1i to\u00e0n b\u1ed9 kho\u1ea3n chi \u0111\u00e3 qu\u00e9t v\u00e0 l\u01b0u \u1edf m\u1ed9t n\u01a1i.',
      closeAria: '\u0110\u00f3ng chi ti\u1ebft giao d\u1ecbch',
      viewImage: 'Xem \u1ea3nh giao d\u1ecbch',
      hideImage: '\u1ea8n \u1ea3nh giao d\u1ecbch',
      loadingImage: '\u0110ang t\u1ea3i \u1ea3nh...',
      imageAlt: '\u1ea2nh giao d\u1ecbch',
      edit: 'Ch\u1ec9nh s\u1eeda',
      delete: 'X\u00f3a',
      empty: 'Ch\u01b0a c\u00f3 giao d\u1ecbch n\u00e0o.',
      noResults: 'Kh\u00f4ng t\u00ecm th\u1ea5y giao d\u1ecbch ph\u00f9 h\u1ee3p.',
      searchPlaceholder: 'T\u00ecm giao d\u1ecbch...',
      filterAll: 'T\u1ea5t c\u1ea3',
      filterReceipt: 'H\u00f3a \u0111\u01a1n',
      filterManual: 'Nh\u1eadp tay',
      filterSnap: 'Ch\u1ee5p m\u00f3n',
      resetFilters: 'X\u00f3a b\u1ed9 l\u1ecdc',
      totalSpent: 'T\u1ed5ng chi',
      transactionCount: 'Giao d\u1ecbch',
      filterMonth: 'Th\u00e1ng',
      sourceLabel: 'Ngu\u1ed3n',
      statusCompleted: 'Ho\u00e0n th\u00e0nh',
      statusPending: '\u0110ang x\u1eed l\u00fd',
      statusFailed: 'Th\u1ea5t b\u1ea1i',
      statusCancelled: '\u0110\u00e3 h\u1ee7y',
      sourceReceipt: 'H\u00f3a \u0111\u01a1n',
      sourceManual: 'Nh\u1eadp tay',
      sourceSnap: 'Ch\u1ee5p m\u00f3n',
      aiEstimated: 'AI',
    },
    settings: {
      eyebrow: 'T\u00e0i kho\u1ea3n',
      title: 'C\u00e0i \u0111\u1eb7t',
      copy:
        '\u0110\u00e2y l\u00e0 trang c\u00e0i \u0111\u1eb7t \u0111\u1ec3 qu\u1ea3n l\u00fd t\u00e0i kho\u1ea3n, AI v\u00e0 tr\u1ea3i nghi\u1ec7m s\u1eed d\u1ee5ng.',
    },
    settingsPage: {
      title: 'T\u00f9y ch\u1ecdn \u1ee9ng d\u1ee5ng',
      subtitle:
        'Qu\u1ea3n l\u00fd t\u00ednh n\u0103ng AI, th\u00f4ng tin t\u00e0i kho\u1ea3n v\u00e0 tr\u1ea3i nghi\u1ec7m chung c\u1ee7a Snaptics.',
      aiTitle: 'C\u00e0i \u0111\u1eb7t AI',
      generalTitle: 'Chung',
      profile: {
        editAria: 'S\u1eeda th\u00f4ng tin t\u00e0i kho\u1ea3n',
        modalTitle: 'S\u1eeda th\u00f4ng tin',
        modalSubtitle:
          'C\u1eadp nh\u1eadt t\u00ean hi\u1ec3n th\u1ecb v\u00e0 email d\u00f9ng trong \u1ee9ng d\u1ee5ng.',
        fullName: 'H\u1ecd v\u00e0 t\u00ean',
        email: 'Email',
        success: 'C\u1eadp nh\u1eadt th\u00f4ng tin th\u00e0nh c\u00f4ng.',
      },
      ai: {
        caloriesTitle: '\u01af\u1edbc t\u00ednh calo cho m\u00f3n \u0103n',
        caloriesDescription:
          'D\u00f9ng AI \u0111\u1ec3 \u01b0\u1edbc t\u00ednh l\u01b0\u1ee3ng calo sau khi ch\u1ee5p m\u00f3n \u0103n ho\u1eb7c qu\u00e9t h\u00f3a \u0111\u01a1n.',
        priceTitle: 'X\u00e1c nh\u1eadn gi\u00e1 sau khi qu\u00e9t',
        priceDescription:
          'Hi\u1ec3n th\u1ecb b\u01b0\u1edbc ki\u1ec3m tra gi\u00e1 th\u1ee7 c\u00f4ng tr\u01b0\u1edbc khi l\u01b0u h\u00f3a \u0111\u01a1n m\u1edbi.',
        reminderTitle: 'Nh\u1eafc nh\u1edf h\u1eb1ng ng\u00e0y',
        reminderDescription:
          'Nh\u1eafc b\u1ea1n v\u00e0o cu\u1ed1i ng\u00e0y n\u1ebfu v\u1eabn c\u00f2n m\u00f3n \u0111\u00e3 qu\u00e9t nh\u01b0ng ch\u01b0a nh\u1eadp gi\u00e1.',
        budgetAlertTitle: 'C\u1ea3nh b\u00e1o v\u01b0\u1ee3t ng\u00e2n s\u00e1ch',
        budgetAlertDescription:
          'Th\u00f4ng b\u00e1o ngay khi chi ti\u00eau trong ng\u00e0y ti\u1ebfn g\u1ea7n ho\u1eb7c v\u01b0\u1ee3t qu\u00e1 ng\u00e2n s\u00e1ch \u0111\u00e3 \u0111\u1eb7t.',
        usageTitle: 'Theo d\u00f5i m\u1ee9c \u0111\u1ed9 s\u1eed d\u1ee5ng',
        usageDescription:
          'H\u1ecfi l\u1ea1i xem m\u00f3n \u0111\u1ed3 \u0111\u00e3 mua c\u00f2n \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng sau 30 ng\u00e0y hay kh\u00f4ng.',
      },
      general: {
        language: 'Ng\u00f4n ng\u1eef',
        currency: 'Ti\u1ec1n t\u1ec7',
        budget: 'Ng\u00e2n s\u00e1ch m\u1ed7i ng\u00e0y',
        backup: 'Sao l\u01b0u \u0111\u00e1m m\u00e2y',
        enabled: '\u0110\u00e3 b\u1eadt',
      },
    },
    ai: {
      ask: 'H\u1ecfi AI',
      ready: 'S\u1eb5n s\u00e0ng h\u1ed7 tr\u1ee3',
      today: 'H\u00f4m nay',
      placeholder: 'H\u1ecfi Snaptics AI...',
      hint: 'AI c\u00f3 th\u1ec3 m\u1eafc l\u1ed7i. H\u00e3y ki\u1ec3m tra l\u1ea1i th\u00f4ng tin quan tr\u1ecdng.',
    },
    analysis: {
      title: 'Ph\u00e2n t\u00edch chi ti\u00eau',
      subtitle: 'Hi\u1ec3u r\u00f5 d\u00f2ng ti\u1ec1n v\u00e0 th\u00f3i quen chi ti\u00eau c\u1ee7a b\u1ea1n',
      exportReport: 'Xu\u1ea5t b\u00e1o c\u00e1o',
      allAccounts: 'T\u1ea5t c\u1ea3 t\u00e0i kho\u1ea3n',
      compareLabel: 'So s\u00e1nh v\u1edbi k\u1ef3 tr\u01b0\u1edbc',
      categories: {
        food: '\u0102n u\u1ed1ng',
        housing: 'Nh\u00e0 \u1edf',
        travel: 'Di chuy\u1ec3n',
        shopping: 'Mua s\u1eafm',
        entertainment: 'Gi\u1ea3i tr\u00ed',
        bills: 'H\u00f3a \u0111\u01a1n & Ti\u1ec7n \u00edch',
        drinks: '\u0110\u1ed3 u\u1ed1ng',
        animals: 'Th\u00fa c\u01b0ng',
        electronics: '\u0110i\u1ec7n t\u1eed',
        household: 'Gia d\u1ee5ng',
        other: 'Kh\u00e1c'
      },
      kpi: {
        income: 'T\u1ed5ng thu nh\u1eadp',
        expense: 'T\u1ed5ng chi ti\u00eau',
        savings: 'Ti\u1ebft ki\u1ec7m r\u00f2ng',
        rate: 'T\u1ef7 l\u1ec7 ti\u1ebft ki\u1ec7m',
        incomeTooltip: 'T\u1ed5ng t\u1ea5t c\u1ea3 c\u00e1c giao d\u1ecbch thu nh\u1eadp trong k\u1ef3',
        expenseTooltip: 'T\u1ed5ng t\u1ea5t c\u1ea3 c\u00e1c giao d\u1ecbch chi ti\u00eau trong k\u1ef3',
        savingsTooltip: 'Hi\u1ec7u s\u1ed1 gi\u1eefa Thu nh\u1eadp v\u00e0 Chi ti\u00eau (Thu nh\u1eadp - Chi ti\u00eau)',
        rateTooltip: 'Ph\u1ea7n tr\u0103m thu nh\u1eadp \u0111\u01b0\u1ee3c gi\u1eef l\u1ea1i \u0111\u1ec3 ti\u1ebft ki\u1ec7m (Ti\u1ebft ki\u1ec7m r\u00f2ng / Thu nh\u1eadp)'
      },
      cashFlow: {
        title: 'D\u00f2ng ti\u1ec1n',
        income: 'Thu nh\u1eadp',
        expense: 'Chi ti\u00eau',
        net: 'S\u1ed1 d\u01b0 r\u00f2ng',
        daily: 'Theo ng\u00e0y',
        weekly: 'Theo tu\u1ea7n',
        monthly: 'Theo th\u00e1ng'
      },
      categorySpending: {
        title: 'Chi ti\u00eau theo danh m\u1ee5c',
        noData: 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u chi ti\u00eau danh m\u1ee5c'
      },
      budgetPerformance: {
        title: 'Hi\u1ec5u su\u1ea5t ng\u00e2n s\u00e1ch',
        safe: 'An to\u00e0n',
        warning: 'S\u1eafp \u0111\u1ea1t gi\u1edbi h\u1ea1n',
        danger: 'V\u01b0\u1ee3t ng\u00e2n s\u00e1ch',
        remaining: 'c\u00f2n l\u1ea1i',
        over: 'v\u01b0\u1ee3t',
        viewAll: 'Xem t\u1ea5t c\u1ea3 ng\u00e2n s\u00e1ch',
        noBudgets: 'Ch\u01b0a thi\u1ebft l\u1eadp ng\u00e2n s\u00e1ch n\u00e0o'
      },
      insights: {
        title: 'Ph\u00e2n t\u00edch th\u00f4ng minh',
        high: 'Cao',
        medium: 'Trung b\u00ecnh',
        low: 'Th\u1ea5p',
        actions: {
          viewTx: 'Xem giao d\u1ecbch',
          adjust: '\u0110i\u1ec1u ch\u1ec9nh v\u00ed',
          goal: 'T\u1ea1o m\u1ee5c ti\u00eau',
          detail: 'Xem chi ti\u1ebft'
        }
      },
      comparison: {
        title: 'So s\u00e1nh chi ti\u00eau',
        byCategory: 'Theo danh m\u1ee5c',
        byWeek: 'Theo tu\u1ea7n',
        byAccount: 'Theo t\u00e0i kho\u1ea3n'
      },
      recurring: {
        title: 'Chi ph\u00ed \u0111\u1ecbnh k\u1ef3',
        monthlyTotal: 'T\u1ed5ng chi \u0111\u1ecbnh k\u1ef3 / th\u00e1ng',
        nextPay: 'H\u1ea1n ti\u1ebfp theo'
      },
      merchants: {
        title: 'N\u01a1i b\u1ea1n chi ti\u00eau nhi\u1ec1u nh\u1ea5t',
        txsCount: '{{count}} giao d\u1ecbch'
      },
      transactions: {
        title: 'Giao d\u1ecbch \u0111\u00e1ng ch\u00fa \u00fd',
        tabAll: 'T\u1ea5t c\u1ea3',
        tabHigh: 'Gi\u00e1 tr\u1ecb cao',
        tabUnusual: 'B\u1ea5t th\u01b0\u1eddng',
        tabUnclassified: 'Ch\u01b0a ph\u00e2n lo\u1ea1i',
        tabBills: 'T\u1eeb h\u00f3a \u0111\u01a1n',
        colTx: 'Giao d\u1ecbch',
        colCategory: 'Danh m\u1ee5c',
        colAccount: 'T\u00e0i kho\u1ea3n',
        colDate: 'Ng\u00e0y',
        colSource: 'Ngu\u1ed3n',
        colAmount: 'S\u1ed1 ti\u1ec1n',
        colStatus: 'Tr\u1ea1ng th\u00e1i',
        sourceManual: 'Nh\u1eadp th\u1ee7 c\u00f4ng',
        sourceScan: 'Qu\u00e9t h\u00f3a \u0111\u01a1n',
        sourceSync: '\u0110\u1ed3ng b\u1ed9 ng\u00e2n h\u00e0ng'
      },
      states: {
        loading: '\u0110ang t\u1ea3i d\u1eef li\u1ec7u ph\u00e2n t\u00edch...',
        emptyTitle: 'Ch\u01b0a c\u00f3 \u0111\u1ee7 d\u1eef li\u1ec7u \u0111\u1ec3 ph\u00e2n t\u00edch',
        emptyDesc: 'H\u00e3y th\u00eam giao d\u1ecbch ho\u1eb7c qu\u00e9t h\u00f3a \u0111\u01a1n \u0111\u1ec3 b\u1ea3t \u0111\u1ea7u theo d\u00f5i t\u00e0i ch\u00ednh.',
        emptyBtnTx: 'Th\u00eam giao d\u1ecbch',
        emptyBtnScan: 'Qu\u00e9t h\u00f3a \u0111\u01a1n',
        emptyBtnBudget: 'T\u1ea1o ng\u00e2n s\u00e1ch',
        errorTitle: 'Kh\u00f4ng th\u1ec3 t\u1ea3i d\u1eef li\u1ec7u ph\u00e2n t\u00edch',
        errorDesc: '\u0110\u00e3 x\u1ea3y ra l\u1ed7i trong qu\u00e1 tr\u00ecnh x\u1eed l\u00fd s\u1ed1 li\u1ec7u.',
        errorBtn: 'Th\u1eed l\u1ea1i'
      }
    },
  },
  en: {
    common: {
      language: 'Language',
      english: 'English',
      vietnamese: 'Vietnamese',
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      loading: 'Loading...',
      loadError: 'Could not load data. Please try again.',
      retry: 'Retry',
    },
    nav: {
      dashboard: 'Dashboard',
      scan: 'Scan',
      snapItem: 'Snap Item',
      manualEntry: 'Manual Entry',
      transactions: 'Transactions',
      reminders: 'Reminders',
      account: 'Account',
      settings: 'Settings',
      logout: 'Logout',
      analysis: 'Analysis',
    },
    header: {
      greeting: 'Hello, {{name}}',
      subtitle: 'How much have you spent today?',
      notifications: 'Notifications',
    },
    notifications: {
      title: 'Recent Activity',
      subtitle: 'Updates from receipts, transactions, and budgets',
      empty: 'No recent activity yet.',
      markAllRead: 'Mark all as read',
      types: {
        receipt: 'Receipt',
        transaction: 'Transaction',
        manualEntry: 'Manual entry',
        insight: 'Insight',
        budget: 'Budget',
        category: 'Category',
        report: 'Report',
      },
      items: {
        receiptScanned: {
          title: 'Receipt scanned successfully',
          description:
            '3 line items from Cafe Luna were added to your spending timeline.',
        },
        transactionAdded: {
          title: 'New transaction added',
          description:
            'A 245,000 VND grocery purchase from Co-op Food is now in your history.',
        },
        manualEntrySaved: {
          title: 'Manual entry saved',
          description:
            'Your quick parking fee note was saved and synced to Transactions.',
        },
        spendingIncreased: {
          title: 'Food & Drinks spending increased',
          description:
            'This category is up 18% compared with yesterday after your morning orders.',
        },
        budgetNearlyReached: {
          title: 'Monthly budget is nearly reached',
          description:
            'You have used 87% of this month\'s budget. Consider reviewing larger purchases.',
        },
        categoryUpdated: {
          title: 'Transaction category updated',
          description:
            'Matcha latte was moved to Food & Drinks to keep your reports accurate.',
        },
        reportGenerated: {
          title: 'Spending report generated',
          description: 'Your weekly spending summary is ready to review.',
        },
      },
      times: {
        twoMinutesAgo: '2 minutes ago',
        tenMinutesAgo: '10 minutes ago',
        thirtyMinutesAgo: '30 minutes ago',
        today: 'Today',
        oneHourAgo: '1 hour ago',
        yesterday: 'Yesterday',
      },
    },
    dashboard: {
      totalPayment: 'Total Payment',
      remainingBudget: 'Remaining Budget',
      defaultWallet: 'Default Wallet',
      otherWallets: 'other wallets',
      selectWallet: 'Select Active Wallet',
      remaining: 'remaining',
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
      weeklySpending: 'Weekly Spending',
      byCategory: 'By Category',
      quickAction: {
        scan: 'Scan Receipt',
        capture: 'Snap Item',
        manual: 'Manual Entry',
        createBudget: 'Create Budget',
      },
      category: {
        drinks: 'Drinks',
        drink: 'Drink',
        food: 'Food',
        travel: 'Travel',
        bill: 'Bill',
        animals: 'Animals',
        electronics: 'Electronics',
        household: 'Household',
        other: 'Other',
      },
      createBudgetModal: {
        title: 'Create new budget',
        name: 'Budget name',
        amount: 'Spend limit',
        period: 'Period',
        startDate: 'Start date',
        endDate: 'End date',
        category: 'Category',
        note: 'Note',
        weekly: 'Weekly',
        monthly: 'Monthly',
        custom: 'Custom',
        submit: 'Create budget',
        cancel: 'Cancel',
        submitting: 'Creating...',
        success: 'Budget created successfully',
        errorFallback: 'Could not create budget. Please try again.',
        allCategories: 'All categories',
        amountMinError: 'Amount must be greater than 0',
        nameRequired: 'Budget name is required',
        amountRequired: 'Limit amount is required',
        startDateRequired: 'Start date is required',
        endDateRequired: 'End date is required for custom period',
        endDateMinError: 'End date cannot be earlier than start date',
      },
    },
    scan: {
      eyebrow: 'Scan',
      title: 'Receipt Scan',
      progressAria: 'Receipt scan progress',
      steps: {
        upload: 'Upload',
        aiRead: 'AI Read',
        confirm: 'Confirm',
        save: 'Save',
      },
      state: {
        analyzing: 'Analyzing',
        ready: 'Ready',
        saving: 'Saving',
        error: 'Error',
        waiting: 'Waiting',
      },
      uploadPreviewAria: 'Upload preview area',
      previewBadge: 'Preview Area',
      uploadTitle: 'Drop a receipt to begin',
      uploadDescription:
        'Upload a file or use the camera to generate a mock receipt preview.',
      captureReceipt: 'Capture Receipt',
      uploadImage: 'Upload Image',
      cameraPreviewAria: 'Camera preview area',
      takePhoto: 'Take Photo',
      loadingPreviewAria: 'Scanning preview',
      savingTitle: 'Saving your receipt',
      readingTitle: 'AI is reading your receipt',
      savingDescription: 'Please wait while we add it to your transactions.',
      readingDescription: 'Please wait while we build the preview.',
      errorAria: 'Error area',
      errorTitle: 'Oops!',
      retake: 'Retake',
      editHint:
        'You can adjust any line item before saving the receipt to your transaction list.',
      storePlaceholder: 'Store Name',
      total: 'Total',
      confirmSave: 'Confirm & Save',
      unknownStore: 'Unknown Store',
      error: {
        noData:
          'No receipt data found. Please try scanning again with a clearer image.',
        readFailed: 'Failed to read receipt. Please try again.',
      },
      toast: {
        cameraLoading: 'Please wait for camera to load...',
        captureError: 'Could not capture photo, please try again.',
        cameraError: 'Cannot access the camera. Please check permissions.',
        selectCategory: 'Please select a category for all items before saving.',
        saved: 'Receipt saved to your transactions.',
        saveFailed: 'Failed to save receipt.',
      },
      category: {
        unassigned: 'Unassigned',
      },
      modeNav: {
        label: 'Scan Mode',
      },
      mode: {
        receipt: 'Receipt Scan',
        item: 'Item Scan',
      },
      instruction: {
        receipt: 'Align receipt within the frame to scan',
        item: 'Take a photo of the product for AI detection',
      },
      gallery: 'Upload Image',
      camera: {
        initializing: 'Initializing camera...',
        pleaseWait: 'Please wait a moment',
        deniedTitle: 'Camera access denied',
        deniedSub: 'Please allow camera access in browser settings to use this feature.',
        retryPermission: 'Retry permission request',
        unavailableTitle: 'No camera found',
        unavailableSub: 'Your device does not have an active camera or it is occupied by another app.',
        unsupportedTitle: 'Camera unsupported',
        unsupportedSub: 'Please upgrade your browser or use another supported browser.',
      },
    },
    snapItem: {
      eyebrow: 'Quick Action',
      title: 'Snap Item',
      subtitle:
        'Capture a product or upload an image, then confirm the extracted details before saving.',
      emptyTitle: 'Capture or upload an item photo',
      emptyDescription:
        'We will prepare an editable draft with item name, amount, category, date, and note.',
      previewAlt: 'Selected item preview',
      savingTitle: 'Saving item',
      extractingTitle: 'Extracting item details',
      savingDescription: 'Adding this item to your transaction timeline.',
      extractingDescription: 'Review the suggested values once they are ready.',
      aiReadyMessage: 'AI filled the draft for you. Double-check the details before saving.',
      mockReadyMessage:
        'A mock draft was prepared because a complete AI response was not available yet.',
      takePhoto: 'Take Photo',
      uploadImage: 'Upload Image',
      retake: 'Retake',
      confirmationEyebrow: 'Confirmation',
      confirmationTitle: 'Review extracted details',
      aiBadge: 'AI Assist',
      mockBadge: 'Mock Assist',
      saveLabel: 'Save Item',
      toast: {
        saved: 'Snap item saved to your transactions.',
        saveFailed: 'Unable to save this item right now.',
      },
      error: {
        extractFailed: 'We could not extract item details from this image.',
      },
    },
    manualEntry: {
      eyebrow: 'Quick Action',
      title: 'Manual Entry',
      subtitle:
        'Add an expense manually when you already know the item, amount, category, and payment details.',
      badge: 'Quick expense draft',
      entryEyebrow: 'Entry Details',
      entryTitle: 'Save a transaction in one step',
      entryDescription:
        'Required fields are title, amount, and date. Everything else is optional but helps keep your timeline cleaner.',
      saveLabel: 'Save Entry',
      toast: {
        saved: 'Manual entry saved to your transactions.',
        saveFailed: 'Unable to save this entry right now.',
      },
    },
    reminder: {
      eyebrow: 'Reminders',
      allResolvedTitle: 'All reminders resolved',
      pendingTitle: '{{count}} price reminders',
      allResolvedSubtitle: 'Your spending total is fully up to date.',
      pendingSubtitle: 'Add the missing prices below to keep your daily total accurate.',
      successTitle: 'Everything is up to date',
      successDescription:
        'All reminder items now have a confirmed price and no follow-up is needed.',
      summary:
        'Finish these updates before the end of the day to keep the dashboard insights correct.',
      updatedBadge: 'Updated',
      missingPriceBadge: 'Missing Price',
      enterPrice: 'Enter price',
      updatedCopy: 'Added {{amount}} VND to the daily spending total.',
      updateButton: 'Update Spending Total',
      toast: {
        updated: 'Reminder prices updated successfully.',
      },
    },
    entryForm: {
      title: 'Item name',
      titlePlaceholder: 'Ex: Matcha latte',
      amount: 'Amount',
      amountPlaceholder: '0',
      category: 'Category',
      categoryPlaceholder: 'Select a category',
      date: 'Date',
      paymentMethodTitle: 'Payment method',
      note: 'Note',
      notePlaceholder: 'Add a note or context for this expense',
      saving: 'Saving...',
      error: {
        titleRequired: 'Item name is required.',
        amountRequired: 'Amount is required.',
        dateRequired: 'Date is required.',
        required: 'This field is required.',
        amountMin: 'Amount must be greater than 0.',
      },
      paymentMethod: {
        cash: 'Cash',
        debitcard: 'Debit Card',
        creditcard: 'Credit Card',
        banktransfer: 'Bank Transfer',
        ewallet: 'E-Wallet',
      },
    },
    transaction: {
      subtitle: 'Review every scanned and saved expense in one place.',
      closeAria: 'Close transaction details',
      viewImage: 'View Transaction Image',
      hideImage: 'Hide Transaction Image',
      loadingImage: 'Loading...',
      imageAlt: 'Transaction Image',
      edit: 'Edit',
      delete: 'Delete',
      empty: 'No transactions yet.',
      noResults: 'No transactions match your filters.',
      searchPlaceholder: 'Search transactions...',
      filterAll: 'All',
      filterReceipt: 'Receipt',
      filterManual: 'Manual',
      filterSnap: 'Snap',
      resetFilters: 'Reset filters',
      totalSpent: 'Total Spent',
      transactionCount: 'Transactions',
      filterMonth: 'Month',
      sourceLabel: 'Source',
      statusCompleted: 'Completed',
      statusPending: 'Pending',
      statusFailed: 'Failed',
      statusCancelled: 'Cancelled',
      sourceReceipt: 'Receipt',
      sourceManual: 'Manual',
      sourceSnap: 'Snap',
      aiEstimated: 'AI',
    },
    settings: {
      eyebrow: 'Account',
      title: 'Settings',
      copy: 'This is the settings page for account, AI, and app preferences.',
    },
    settingsPage: {
      title: 'App Preferences',
      subtitle:
        'Control AI features, account details, and the general Snaptics experience.',
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
        caloriesDescription:
          'Use AI to estimate calories after a food photo or receipt scan.',
        priceTitle: 'Price confirmation after scans',
        priceDescription:
          'Prompt for a manual price review before a new receipt is saved.',
        reminderTitle: 'Daily reminder',
        reminderDescription:
          'Send an end-of-day reminder when any scanned item is still missing a price.',
        budgetAlertTitle: 'Budget overrun alert',
        budgetAlertDescription:
          'Notify you when daily spending is close to or above the budget you set.',
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
    ai: {
      ask: 'Ask AI',
      ready: 'Ready to help',
      today: 'Today',
      placeholder: 'Ask Snaptics AI...',
      hint: 'AI may make mistakes. Please verify important information.',
    },
    analysis: {
      title: 'Spend Analysis',
      subtitle: 'Understand your cash flow and spending habits',
      exportReport: 'Export report',
      allAccounts: 'All accounts',
      compareLabel: 'Compare with previous period',
      categories: {
        food: 'Food & Dining',
        housing: 'Housing',
        travel: 'Travel',
        shopping: 'Shopping',
        entertainment: 'Entertainment',
        bills: 'Bills & Utilities',
        drinks: 'Drinks',
        animals: 'Pets',
        electronics: 'Electronics',
        household: 'Household',
        other: 'Other'
      },
      kpi: {
        income: 'Total Income',
        expense: 'Total Expense',
        savings: 'Net Savings',
        rate: 'Savings Rate',
        incomeTooltip: 'Sum of all positive cash flow in the period',
        expenseTooltip: 'Sum of all negative cash flow in the period',
        savingsTooltip: 'Net cash flow (Income - Expense)',
        rateTooltip: 'Percentage of income retained for savings (Net Savings / Income)'
      },
      cashFlow: {
        title: 'Cash Flow',
        income: 'Income',
        expense: 'Expense',
        net: 'Net Balance',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly'
      },
      categorySpending: {
        title: 'Spending by Category',
        noData: 'No category spending data yet'
      },
      budgetPerformance: {
        title: 'Budget Performance',
        safe: 'Safe',
        warning: 'Near limit',
        danger: 'Over budget',
        remaining: 'remaining',
        over: 'over',
        viewAll: 'View all budgets',
        noBudgets: 'No budgets set up yet'
      },
      insights: {
        title: 'Smart Insights',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        actions: {
          viewTx: 'View transactions',
          adjust: 'Adjust wallet',
          goal: 'Create goal',
          detail: 'View details'
        }
      },
      comparison: {
        title: 'Spending Comparison',
        byCategory: 'By category',
        byWeek: 'By week',
        byAccount: 'By account'
      },
      recurring: {
        title: 'Recurring Expenses',
        monthlyTotal: 'Total monthly recurring',
        nextPay: 'Next payment'
      },
      merchants: {
        title: 'Where you spend the most',
        txsCount: '{{count}} transactions'
      },
      transactions: {
        title: 'Notable Transactions',
        tabAll: 'All',
        tabHigh: 'High value',
        tabUnusual: 'Unusual',
        tabUnclassified: 'Unclassified',
        tabBills: 'From bills',
        colTx: 'Transaction',
        colCategory: 'Category',
        colAccount: 'Account',
        colDate: 'Date',
        colSource: 'Source',
        colAmount: 'Amount',
        colStatus: 'Status',
        sourceManual: 'Manual entry',
        sourceScan: 'Receipt scan',
        sourceSync: 'Bank sync'
      },
      states: {
        loading: 'Loading analytical data...',
        emptyTitle: 'Not enough data to analyze yet',
        emptyDesc: 'Add transactions or scan receipts to start tracking your finances.',
        emptyBtnTx: 'Add transaction',
        emptyBtnScan: 'Scan receipt',
        emptyBtnBudget: 'Create budget',
        errorTitle: 'Unable to load analysis',
        errorDesc: 'An error occurred during data processing.',
        errorBtn: 'Retry'
      }
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
