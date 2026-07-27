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
}
