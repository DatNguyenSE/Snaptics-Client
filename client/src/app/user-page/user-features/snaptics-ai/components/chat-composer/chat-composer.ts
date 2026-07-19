import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataRangeSelector } from '../data-range-selector/data-range-selector';

@Component({
  selector: 'app-chat-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, DataRangeSelector],
  template: `
    <div class="chat-composer">
      <!-- Attachment Preview -->
      @if (selectedImageFile) {
        <div class="composer-preview">
          <div class="preview-thumbnail">
            <img [src]="imagePreviewUrl" alt="Preview" class="preview-img">
            <button type="button" class="preview-remove" (click)="removeImage()" aria-label="Remove image">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <span class="preview-filename">{{ selectedImageFile.name }}</span>
        </div>
      }

      <div class="composer-box">
        <!-- Input Actions Left (Attachment Button) -->
        <div class="composer-actions-left">
          <button 
            type="button" 
            class="composer-btn composer-btn--attach" 
            (click)="triggerFileInput()"
            [disabled]="isAiResponding"
            aria-label="Attach photo or receipt"
            title="Đính kèm ảnh hoặc hóa đơn"
          >
            <span class="material-symbols-outlined">image</span>
          </button>
          <input 
            #fileInput 
            type="file" 
            class="hidden-file-input" 
            accept="image/*" 
            (change)="onFileSelected($event)"
            style="display: none;"
          >
        </div>

        <!-- Textarea Input Area -->
        <div class="composer-input-wrapper">
          <textarea
            #composerTextarea
            class="composer-textarea custom-scrollbar"
            rows="1"
            placeholder="Hỏi Snaptics AI về chi tiêu của bạn..."
            [(ngModel)]="messageText"
            (keydown)="onKeyDown($event)"
            (input)="adjustHeight()"
            [disabled]="isAiResponding"
          ></textarea>
        </div>

        <!-- Input Actions Right -->
        <div class="composer-actions-right">
          <!-- Data Range Selector -->
          <app-data-range-selector 
            [(selectedKey)]="selectedDataRange"
          ></app-data-range-selector>

          <!-- Send / Stop Button -->
          @if (isAiResponding) {
            <button 
              type="button" 
              class="composer-btn composer-btn--stop" 
              (click)="stopRequested.emit()"
              aria-label="Stop generating"
              title="Dừng trả lời"
            >
              <span class="material-symbols-outlined">stop_circle</span>
            </button>
          } @else {
            <button 
              type="button" 
              class="composer-btn composer-btn--send"
              [class.composer-btn--active]="canSend"
              [disabled]="!canSend"
              (click)="send()"
              aria-label="Send message"
              title="Gửi tin nhắn"
            >
              <span class="material-symbols-outlined">send</span>
            </button>
          }
        </div>
      </div>

      <!-- Hint Line -->
      <div class="composer-hints">
        <span><strong>Enter</strong> để gửi</span>
        <span>•</span>
        <span><strong>Shift + Enter</strong> để xuống dòng</span>
      </div>
    </div>
  `,
  styles: [`
    .chat-composer {
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      border-radius: 20px;
      padding: 12px 16px;
      box-shadow: 0 10px 30px rgba(91, 123, 250, 0.05);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .composer-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--sw-muted);
      border-radius: 12px;
      padding: 8px 12px;
      width: fit-content;
      max-width: 100%;
    }
    .preview-thumbnail {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--sw-border);
      background: #fff;
    }
    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .preview-remove {
      position: absolute;
      top: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      border: none;
      border-radius: 0 0 0 8px;
      padding: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preview-remove .material-symbols-outlined {
      font-size: 0.875rem;
    }
    .preview-filename {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--sw-muted-foreground);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .composer-box {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      min-height: 40px;
    }
    .composer-actions-left {
      display: flex;
      align-items: center;
      padding-bottom: 2px;
    }
    .composer-input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
    }
    .composer-textarea {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: var(--sw-foreground);
      font-family: inherit;
      font-size: 0.9375rem;
      line-height: 1.5;
      resize: none;
      max-height: 140px;
      padding: 8px 0;
      box-sizing: border-box;
    }
    .composer-textarea::placeholder {
      color: var(--sw-muted-foreground);
      opacity: 0.7;
    }
    .composer-actions-right {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 2px;
    }
    .composer-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--sw-muted-foreground);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .composer-btn:hover:not(:disabled) {
      background: var(--sw-muted);
      color: var(--sw-foreground);
    }
    .composer-btn--send {
      background: var(--sw-muted);
    }
    .composer-btn--send.composer-btn--active {
      background: linear-gradient(135deg, var(--sw-primary), #7c3aed);
      color: #fff;
    }
    .composer-btn--send.composer-btn--active:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(91, 123, 250, 0.2);
    }
    .composer-btn--stop {
      color: #ef4444;
    }
    .composer-btn--stop:hover {
      background: rgba(239, 68, 68, 0.08);
      color: #dc2626;
    }
    .composer-hints {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      color: var(--sw-muted-foreground);
      opacity: 0.6;
      padding-left: 48px;
    }
  `]
})
export class ChatComposer implements AfterViewInit {
  @ViewChild('composerTextarea') textareaRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  @Input() isAiResponding = false;
  @Output() messageSent = new EventEmitter<{ content: string; file: File | null; dataRange: string }>();
  @Output() stopRequested = new EventEmitter<void>();

  messageText = '';
  selectedImageFile: File | null = null;
  imagePreviewUrl = '';
  selectedDataRange = 'month';

  ngAfterViewInit() {
    this.adjustHeight();
  }

  get canSend(): boolean {
    return (this.messageText.trim().length > 0 || this.selectedImageFile !== null) && !this.isAiResponding;
  }

  triggerFileInput() {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Chỉ cho phép đính kèm file ảnh!');
        input.value = '';
        return;
      }
      this.selectedImageFile = file;
      this.imagePreviewUrl = URL.createObjectURL(file);
    }
  }

  removeImage() {
    this.selectedImageFile = null;
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = '';
    }
    this.fileInputRef.nativeElement.value = '';
  }

  adjustHeight() {
    if (!this.textareaRef) return;
    const el = this.textareaRef.nativeElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send() {
    if (!this.canSend) return;

    this.messageSent.emit({
      content: this.messageText.trim(),
      file: this.selectedImageFile,
      dataRange: this.selectedDataRange
    });

    // Reset inputs
    this.messageText = '';
    this.removeImage();
    
    // Reset height after sending
    setTimeout(() => this.adjustHeight(), 50);
  }
}
