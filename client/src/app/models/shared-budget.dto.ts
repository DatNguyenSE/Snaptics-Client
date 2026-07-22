// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserBudgetRole = 'OWNER' | 'MEMBER';

export type UserBudgetStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'LEFT';

export type BudgetWalletType = 'PERSONAL' | 'SHARED';

// ─── Member ───────────────────────────────────────────────────────────────────

export interface BudgetMemberDto {
  id: number;
  userId: string;
  budgetId: number;
  displayName: string;
  email: string;
  imageUrl?: string | null;
  role: UserBudgetRole;
  status: UserBudgetStatus;
  joinedAt: string;
}

// ─── Shared Budget ────────────────────────────────────────────────────────────

export interface SharedBudgetDto {
  id: number;
  name: string;
  amount: number;
  currentAmount?: number;
  startDate: string;
  endDate: string;
  categoryId?: number | null;
  note?: string | null;
  type: number;
  walletType: BudgetWalletType;
  isDefault?: boolean;
  isActive?: boolean;
  createdByUserId?: string;
  description?: string | null;
  currency?: string;
  icon?: string | null;
  // Membership info
  currentUserRole: UserBudgetRole;
  memberCount?: number;
  members: BudgetMemberDto[];
  isShared: boolean;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateSharedBudgetRequest {
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  description?: string | null;
  note?: string | null;
  currency?: string;
  icon?: string | null;
  categoryId?: number | null;
  isActive?: boolean;
  initialMemberEmails?: string[];
}

export interface AddMemberRequest {
  email: string;
}

export interface UpdateMemberRoleRequest {
  role: UserBudgetRole;
}

// ─── State helpers ────────────────────────────────────────────────────────────

export interface BudgetMemberAction {
  type: 'add' | 'remove' | 'transfer-owner' | 'leave';
  targetUserId?: string;
  targetEmail?: string;
}
