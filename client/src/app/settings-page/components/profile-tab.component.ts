import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileDto } from '../../models/user-profile.dto';
import { UserProfileService } from '../../core/services/user-profile.service';
import { ToastService } from '../../core/services/toast-service';
import { S3Service } from '../../core/services/s3.service';


@Component({
  selector: 'app-profile-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-tab.component.html',
  styleUrl: '../settings-page.css',
})
export class ProfileTabComponent implements OnInit {
  @Input() profile: UserProfileDto | null = null;
  @Output() profileUpdated = new EventEmitter<UserProfileDto>();

  private readonly userProfileService = inject(UserProfileService);
  private readonly toast = inject(ToastService);
  private readonly s3Service = inject(S3Service);

  // Avatar Uploader State
  previewAvatarUrl: string | null = null;
  selectedAvatarFile: File | null = null;
  isUploadingAvatar = false;
  avatarError = '';

  // Personal Info Form State
  personalForm = {
    displayName: '',
  };
  isSavingPersonal = false;

  // Address Info Form State
  addressForm = {
    address: '',
    city: '',
    postCode: '',
    country: 'Vietnam',
  };
  isSavingAddress = false;

  // Change Email Form State
  emailForm = {
    currentEmail: '',
    newEmail: '',
    confirmNewEmail: '',
  };
  isSavingEmail = false;

  // Change Password Form State
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isSavingPassword = false;

  ngOnInit(): void {
    if (this.profile) {
      this.populateForms(this.profile);
    }
  }

  private populateForms(profile: UserProfileDto): void {
    if (profile.imageUrl && !profile.imageUrl.startsWith('http') && !profile.imageUrl.startsWith('data:')) {
      this.previewAvatarUrl = this.s3Service.getDirectImageUrl(profile.imageUrl);
    } else {
      this.previewAvatarUrl = profile.imageUrl || null;
    }

    this.personalForm = {
      displayName: profile.displayName || '',
    };

    this.addressForm = {
      address: profile.address || '',
      city: profile.city || '',
      postCode: profile.postCode || '',
      country: profile.country || 'Vietnam',
    };

    this.emailForm.currentEmail = profile.email || '';
  }

  // ─── Avatar Upload Handler ──────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.avatarError = '';

    // Validate size <= 20MB
    if (file.size > 20 * 1024 * 1024) {
      this.avatarError = 'Dung lượng file vượt quá 20MB. Vui lòng chọn ảnh nhỏ hơn.';
      this.toast.error(this.avatarError);
      return;
    }

    // Validate image format
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      this.avatarError = 'Định dạng file không hỗ trợ. Vui lòng chọn file JPG, JPEG, PNG hoặc WEBP.';
      this.toast.error(this.avatarError);
      return;
    }

    this.selectedAvatarFile = file;

    // Create live preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewAvatarUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveAvatar(): void {
    if (!this.selectedAvatarFile) {
      this.toast.info('Chưa có ảnh mới nào được chọn.');
      return;
    }

    this.isUploadingAvatar = true;
    this.userProfileService.uploadAvatar(this.selectedAvatarFile).subscribe({
      next: (res) => {
        const imageUrl = res.imageUrl;
        this.isUploadingAvatar = false;
        this.selectedAvatarFile = null;
        this.profileUpdated.emit({ ...this.profile!, imageUrl });
        this.toast.success('Đã cập nhật ảnh đại diện thành công!');
      },
      error: (err: any) => {
        this.isUploadingAvatar = false;
        this.toast.error(err.message || 'Tải ảnh lên máy chủ thất bại.');
      },
    });
  }

  removeAvatar(): void {
    this.previewAvatarUrl = null;
    this.selectedAvatarFile = null;
    this.avatarError = '';

    // If the API doesn't have a remove avatar endpoint, we could update profile with an empty imageUrl?
    // Wait, the API doesn't support updating ImageUrl through updateProfile (only Avatar upload).
    // For now we'll just ignore this or do nothing.
    this.toast.info('Tính năng xóa ảnh đại diện đang được phát triển.');
  }

  // ─── Save Personal Info ─────────────────────────────────────────────────────

  savePersonal(): void {
    this.isSavingPersonal = true;
    this.userProfileService
      .updateProfile({
        displayName: this.personalForm.displayName.trim(),
        address: this.addressForm.address,
        city: this.addressForm.city,
        postCode: this.addressForm.postCode,
        country: this.addressForm.country,
      })
      .subscribe({
        next: () => {
          this.isSavingPersonal = false;
          this.profileUpdated.emit({ ...this.profile!, displayName: this.personalForm.displayName.trim() });
          this.toast.success('Đã cập nhật thông tin cá nhân thành công!');
        },
        error: (err: any) => {
          this.isSavingPersonal = false;
          this.toast.error(err.message || 'Cập nhật thất bại.');
        },
      });
  }

  // ─── Save Address Info ──────────────────────────────────────────────────────

  saveAddress(): void {
    this.isSavingAddress = true;
    this.userProfileService
      .updateProfile({
        displayName: this.personalForm.displayName,
        address: this.addressForm.address,
        city: this.addressForm.city,
        postCode: this.addressForm.postCode,
        country: this.addressForm.country,
      })
      .subscribe({
        next: () => {
          this.isSavingAddress = false;
          this.profileUpdated.emit({ 
            ...this.profile!, 
            address: this.addressForm.address, 
            city: this.addressForm.city,
            postCode: this.addressForm.postCode,
            country: this.addressForm.country
          });
          this.toast.success('Đã cập nhật địa chỉ liên hệ thành công!');
        },
        error: (err: any) => {
          this.isSavingAddress = false;
          this.toast.error(err.message || 'Cập nhật địa chỉ thất bại.');
        },
      });
  }

  // ─── Change Email Handler ───────────────────────────────────────────────────

  get isEmailFormValid(): boolean {
    const newEmail = this.emailForm.newEmail.trim();
    const confirm = this.emailForm.confirmNewEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (
      emailRegex.test(newEmail) &&
      newEmail === confirm &&
      newEmail !== this.emailForm.currentEmail
    );
  }

  saveEmail(): void {
    if (!this.isEmailFormValid) {
      if (this.emailForm.newEmail !== this.emailForm.confirmNewEmail) {
        this.toast.error('Email xác nhận không trùng khớp.');
      } else {
        this.toast.error('Vui lòng nhập địa chỉ email mới hợp lệ.');
      }
      return;
    }

    this.isSavingEmail = true;
    this.userProfileService.changeEmail({ newEmail: this.emailForm.newEmail.trim() }).subscribe({
      next: () => {
        this.isSavingEmail = false;
        this.toast.success('Đã gửi yêu cầu đổi email. Vui lòng kiểm tra hộp thư mới để xác thực!');
        this.emailForm.newEmail = '';
        this.emailForm.confirmNewEmail = '';
      },
      error: (err: any) => {
        this.isSavingEmail = false;
        this.toast.error(err.message || 'Thay đổi email thất bại.');
      }
    });
  }

  // ─── Change Password Handler ────────────────────────────────────────────────

  get passwordCriteria() {
    const pwd = this.passwordForm.newPassword;
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^A-Za-z0-9]/.test(pwd),
    };
  }

  get isPasswordFormValid(): boolean {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm;
    const c = this.passwordCriteria;
    const isCriteriaMet = c.minLength && c.hasUpper && c.hasLower && c.hasNumber;
    return Boolean(currentPassword && newPassword && confirmPassword === newPassword && isCriteriaMet);
  }

  savePassword(): void {
    if (!this.isPasswordFormValid) {
      this.toast.error('Vui lòng điền đầy đủ và đáp ứng các yêu cầu bảo mật mật khẩu.');
      return;
    }

    this.isSavingPassword = true;
    this.userProfileService
      .changePassword({
        currentPassword: this.passwordForm.currentPassword,
        newPassword: this.passwordForm.newPassword,
      })
      .subscribe({
        next: () => {
          this.isSavingPassword = false;
          this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          this.toast.success('Đã đổi mật khẩu thành công!');
        },
        error: (err: any) => {
          this.isSavingPassword = false;
          this.toast.error(err.message || 'Mật khẩu hiện tại không chính xác hoặc có lỗi xảy ra.');
        },
      });
  }
}
