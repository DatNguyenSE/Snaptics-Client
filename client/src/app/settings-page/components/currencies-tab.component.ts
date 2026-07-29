import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast-service';

export interface CurrencySettings {
  defaultCurrency: string;
  currencySymbol: string;
  currencyName: string;
  decimalSeparator: string;
  thousandSeparator: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
}

@Component({
  selector: 'app-currencies-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './currencies-tab.component.html',
  styleUrl: '../settings-page.css',
})
export class CurrenciesTabComponent implements OnInit {
  private readonly toast = inject(ToastService);

  currency: CurrencySettings = {
    defaultCurrency: 'VND',
    currencySymbol: '₫',
    currencyName: 'Việt Nam Đồng',
    decimalSeparator: ',',
    thousandSeparator: '.',
    decimalPlaces: 0,
    symbolPosition: 'after',
  };

  isSaving = false;

  readonly presetCurrencies = [
    { code: 'VND', symbol: '₫', name: 'Việt Nam Đồng', decSep: ',', thouSep: '.', decimals: 0, pos: 'after' as const },
    { code: 'USD', symbol: '$', name: 'US Dollar', decSep: '.', thouSep: ',', decimals: 2, pos: 'before' as const },
    { code: 'EUR', symbol: '€', name: 'Euro', decSep: ',', thouSep: '.', decimals: 2, pos: 'after' as const },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decSep: '.', thouSep: ',', decimals: 0, pos: 'before' as const },
    { code: 'GBP', symbol: '£', name: 'British Pound', decSep: '.', thouSep: ',', decimals: 2, pos: 'before' as const },
  ];

  ngOnInit(): void {
    const saved = localStorage.getItem('SnapticsCurrencySettings');
    if (saved) {
      try {
        this.currency = { ...this.currency, ...JSON.parse(saved) };
      } catch {}
    }
  }

  applyPreset(preset: typeof this.presetCurrencies[0]): void {
    this.currency = {
      defaultCurrency: preset.code,
      currencySymbol: preset.symbol,
      currencyName: preset.name,
      decimalSeparator: preset.decSep,
      thousandSeparator: preset.thouSep,
      decimalPlaces: preset.decimals,
      symbolPosition: preset.pos,
    };
  }

  get livePreview(): string {
    const sampleAmount = 1000000.5;
    const { decimalPlaces, decimalSeparator, thousandSeparator, currencySymbol, symbolPosition } = this.currency;

    const parts = sampleAmount.toFixed(decimalPlaces).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Format thousand separator
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

    let formattedNumber = integerPart;
    if (decimalPlaces > 0 && decimalPart) {
      formattedNumber += decimalSeparator + decimalPart;
    }

    if (symbolPosition === 'before') {
      return `${currencySymbol}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${currencySymbol}`;
    }
  }

  saveCurrencySettings(): void {
    this.isSaving = true;
    setTimeout(() => {
      localStorage.setItem('SnapticsCurrencySettings', JSON.stringify(this.currency));
      this.isSaving = false;
      this.toast.success('Đã lưu cấu hình định dạng tiền tệ thành công!');
    }, 400);
  }
}
