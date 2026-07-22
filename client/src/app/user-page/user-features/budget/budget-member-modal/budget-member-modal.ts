import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../../../core/services/budget.service';
import { ToastService } from '../../../../core/services/toast-service';
import { BudgetMemberDto, UserBudgetRole } from '../../../../models/shared-budget.dto';

@Component({
  selector: 'app-budget-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './budget-member-modal.html',
  styleUrl: './budget-member-modal.css',
})
export class BudgetMemberModal implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly toast = inject(ToastService);

  @Input({ required: true }) budgetId!: number;
  @Input({ required: true }) budgetName!: string;
  @Input({ required: true }) currentUserRole!: UserBudgetRole;
  @Input({ required: true }) currentUserId!: string;

  @Output() closed = new EventEmitter<void>();
  @Output() membersChanged = new EventEmitter<void>();

  members: BudgetMemberDto[] = [];
  isLoading = true;
  hasError = false;

  inviteEmail = '';
  isInviting = false;

  confirmAction: {
    type: 'remove' | 'leave' | 'transfer';
    targetUserId?: string;
    targetName?: string;
    message: string;
  } | null = null;

  isConfirming = false;

  ngOnInit(): void {
    this.loadMembers();
  }

  get isOwner(): boolean {
    return this.currentUserRole === 'OWNER';
  }

  loadMembers(): void {
    this.isLoading = true;
    this.hasError = false;
    this.budgetService.getBudgetMembers(this.budgetId).subscribe({
      next: (members) => {
        this.members = members.filter((m) => m.status === 'ACTIVE');
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  onInvite(): void {
    const email = this.inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.toast.error('Email không hợp lệ');
      return;
    }

    this.isInviting = true;
    this.budgetService.addMember(this.budgetId, { email }).subscribe({
      next: (member) => {
        this.toast.success(`Đã thêm ${member.displayName || email} vào ví`);
        this.inviteEmail = '';
        this.isInviting = false;
        this.loadMembers();
        this.membersChanged.emit();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Không thể thêm thành viên';
        this.toast.error(msg);
        this.isInviting = false;
      },
    });
  }

  onInviteKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onInvite();
    }
  }

  confirmRemove(member: BudgetMemberDto): void {
    this.confirmAction = {
      type: 'remove',
      targetUserId: member.userId,
      targetName: member.displayName,
      message: `Bạn có chắc muốn xóa ${member.displayName} khỏi ví "${this.budgetName}"?`,
    };
  }

  confirmTransferOwner(member: BudgetMemberDto): void {
    this.confirmAction = {
      type: 'transfer',
      targetUserId: member.userId,
      targetName: member.displayName,
      message: `Chuyển quyền chủ ví cho ${member.displayName}? Bạn sẽ trở thành thành viên thường.`,
    };
  }

  confirmLeave(): void {
    this.confirmAction = {
      type: 'leave',
      message: `Bạn có chắc muốn rời khỏi ví "${this.budgetName}"?`,
    };
  }

  executeConfirm(): void {
    if (!this.confirmAction) return;
    this.isConfirming = true;

    const action = this.confirmAction;

    if (action.type === 'remove' && action.targetUserId) {
      this.budgetService.removeMember(this.budgetId, action.targetUserId).subscribe({
        next: () => {
          this.toast.success(`Đã xóa ${action.targetName} khỏi ví`);
          this.confirmAction = null;
          this.isConfirming = false;
          this.loadMembers();
          this.membersChanged.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Không thể xóa thành viên');
          this.isConfirming = false;
        },
      });
    } else if (action.type === 'transfer' && action.targetUserId) {
      this.budgetService.updateMemberRole(this.budgetId, action.targetUserId, { role: 'OWNER' }).subscribe({
        next: () => {
          this.toast.success(`Đã chuyển quyền chủ ví cho ${action.targetName}`);
          this.confirmAction = null;
          this.isConfirming = false;
          this.loadMembers();
          this.membersChanged.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Không thể chuyển quyền');
          this.isConfirming = false;
        },
      });
    } else if (action.type === 'leave') {
      this.budgetService.leaveBudget(this.budgetId).subscribe({
        next: () => {
          this.toast.success('Bạn đã rời khỏi ví');
          this.confirmAction = null;
          this.isConfirming = false;
          this.membersChanged.emit();
          this.onClose();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Không thể rời ví');
          this.isConfirming = false;
        },
      });
    }
  }

  cancelConfirm(): void {
    this.confirmAction = null;
  }

  onClose(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmAction) {
      this.cancelConfirm();
    } else if (!this.isConfirming) {
      this.onClose();
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
