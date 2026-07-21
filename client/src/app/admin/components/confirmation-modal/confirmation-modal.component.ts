import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ConfirmModalConfig {
  title: string;
  description: string;
  targetName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  requireReason?: boolean;
  requireCheckbox?: boolean;
  checkboxLabel?: string;
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css',
})
export class ConfirmationModalComponent {
  @Input({ required: true }) config!: ConfirmModalConfig;
  @Input() loading = false;
  @Output() confirmed = new EventEmitter<{ reason: string }>();
  @Output() cancelled = new EventEmitter<void>();

  reason = '';
  checkboxChecked = false;

  get canConfirm(): boolean {
    if (this.loading) return false;
    if (this.config.requireReason && !this.reason.trim()) return false;
    if (this.config.requireCheckbox && !this.checkboxChecked) return false;
    return true;
  }

  onConfirm(): void {
    if (!this.canConfirm) return;
    this.confirmed.emit({ reason: this.reason.trim() });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }
}
