export interface UserProfileDto {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
  twoFactorEnabled?: boolean;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}

export interface ChangeSecurityDto {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  enableTwoFactor?: boolean;
  twoFactorCode?: string;
}
