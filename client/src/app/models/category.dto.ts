export interface UserCategorySettingDto {
  id?: number;
  categoryId: number;
  userId?: string;
  isTrackableInventory: boolean;
  customColor?: string;
  customIcon?: string;
  inventoryThresholdDays?: number;
  isFavorite?: boolean;
}

export interface CategoryDto {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  status?: string;
  isTrackableInventory?: boolean;
  isDefault?: boolean;
  userId?: string;
  isDeleted?: boolean;
  userSetting?: UserCategorySettingDto;
}
