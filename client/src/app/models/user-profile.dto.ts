export interface UserProfileDto {
  id: string;
  email?: string;
  displayName?: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  postCode?: string;
  country?: string;
  trackCalories?: boolean;
  defaultReminderTime?: string; // TimeSpan from C# translates to string format "hh:mm:ss" in JSON
}

export interface UpdateProfileDto {
  displayName?: string;
  address?: string;
  city?: string;
  postCode?: string;
  country?: string;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}

export interface ChangeEmailDto {
  newEmail?: string;
}
